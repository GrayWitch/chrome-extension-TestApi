// API Inspector - Background Service Worker

const inspectorMap = new Map();
const requestsStore = new Map();
let requestIdCounter = 0;
let captureEnabled = true;

chrome.action.onClicked.addListener(async (tab) => {
  const sourceTabId = tab.id;
  const sourceTabUrl = tab.url || '';

  if (sourceTabUrl.startsWith('chrome://') || sourceTabUrl.startsWith('chrome-extension://') || sourceTabUrl.startsWith('about:')) {
    chrome.tabs.create({ url: 'app.html?mode=test' });
    return;
  }

  chrome.tabs.create({
    url: 'app.html?mode=select&tabId=' + sourceTabId + '&tabUrl=' + encodeURIComponent(sourceTabUrl) + '&tabTitle=' + encodeURIComponent(tab.title || '')
  });
});

// 启动监听模式
async function startMonitorMode(sourceTabId) {
  try {
    // 先注入 content script 到 ISOLATED world（用于转发消息）
    await chrome.scripting.executeScript({
      target: { tabId: sourceTabId },
      world: 'ISOLATED',
      files: ['content.js']
    });
    console.log('[API Inspector] Content script 注入成功');

    // 再注入拦截脚本到 MAIN world（拦截 fetch/XHR）
    const injectResult = await chrome.scripting.executeScript({
      target: { tabId: sourceTabId },
      world: 'MAIN',
      func: () => {
        if (window.__apiInspectorInjected) {
          console.log('[API Inspector] 已注入，跳过重复注入');
          return 'already-injected';
        }
        window.__apiInspectorInjected = true;
        console.log('[API Inspector] 拦截脚本开始工作');

        let reqCounter = 0;

        function post(type, data) {
          console.log('[API Inspector] 发送消息:', type, data.url);
          window.postMessage({ __apiInspector: true, type: type, data: data }, '*');
        }

        // === 拦截 fetch ===
        const originalFetch = window.fetch;
        window.fetch = function(input, init = {}) {
          const id = ++reqCounter;
          const url = typeof input === 'string' ? input : (input.url || '');
          const method = init.method || 'GET';
          let headers = {};
          if (init.headers) {
            if (init.headers instanceof Headers) {
              init.headers.forEach((v, k) => headers[k] = v);
            } else {
              headers = init.headers;
            }
          }
          const body = init.body;

          post('REQUEST', {
            id: id,
            url: url,
            method: method,
            headers: headers,
            body: typeof body === 'string' ? body : null,
            time: Date.now(),
            requestType: 'fetch'
          });

          return originalFetch.apply(this, arguments).then(response => {
            const clone = response.clone();
            clone.text().then(text => {
              const respHeaders = {};
              response.headers.forEach((v, k) => respHeaders[k] = v);
              post('RESPONSE', {
                id: id,
                url: url,
                method: method,
                status: response.status,
                statusText: response.statusText,
                headers: respHeaders,
                body: text
              });
            }).catch(() => {});
            return response;
          }).catch(err => {
            post('ERROR', { id: id, url: url, error: err.message || 'Fetch失败' });
            throw err;
          });
        };

        // === 拦截 XMLHttpRequest ===
        const OriginalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
          const xhr = new OriginalXHR();
          let id, xhrUrl, xhrMethod, xhrHeaders = {};

          xhr.open = function(method, url) {
            id = ++reqCounter;
            xhrMethod = method;
            xhrUrl = url;
            return OriginalXHR.prototype.open.apply(xhr, arguments);
          };

          xhr.setRequestHeader = function(name, value) {
            xhrHeaders[name] = value;
            return OriginalXHR.prototype.setRequestHeader.apply(xhr, arguments);
          };

          xhr.send = function(body) {
            post('REQUEST', {
              id: id,
              url: xhrUrl,
              method: xhrMethod,
              headers: xhrHeaders,
              body: typeof body === 'string' ? body : null,
              time: Date.now(),
              requestType: 'xhr'
            });

            xhr.addEventListener('load', function() {
              const respHeaders = {};
              const allHeaders = xhr.getAllResponseHeaders();
              if (allHeaders) {
                allHeaders.split('\r\n').forEach(line => {
                  const idx = line.indexOf(': ');
                  if (idx > 0) respHeaders[line.substring(0, idx)] = line.substring(idx + 2);
                });
              }
              post('RESPONSE', {
                id: id,
                url: xhrUrl,
                method: xhrMethod,
                status: xhr.status,
                statusText: xhr.statusText,
                headers: respHeaders,
                body: xhr.responseText || ''
              });
            });

            xhr.addEventListener('error', function() {
              post('ERROR', { id: id, url: xhrUrl, error: 'XHR网络错误' });
            });

            return OriginalXHR.prototype.send.apply(xhr, arguments);
          };

          return xhr;
        };

        // 复制静态属性和原型
        window.XMLHttpRequest.prototype = OriginalXHR.prototype;
        for (const key in OriginalXHR) {
          if (!(key in window.XMLHttpRequest)) {
            window.XMLHttpRequest[key] = OriginalXHR[key];
          }
        }

        console.log('[API Inspector] fetch 和 XHR 已拦截');
        return 'injected-success';
      }
    });
    console.log('[API Inspector] 注入结果:', injectResult);
    console.log('[API Inspector] 注入成功，tabId:', sourceTabId);
    return true;
  } catch (e) {
    console.error('[API Inspector] 注入失败:', e);
    return false;
  }
}

// 标签页关闭清理
chrome.tabs.onRemoved.addListener((tabId) => {
  inspectorMap.delete(tabId);
});

// 消息处理
chrome.runtime.onMessage.addListener((msg, sender, sendRes) => {
  const tabId = sender.tab?.id;
  console.log('[API Inspector] 收到消息:', msg.type || msg.action, '来自 tab:', tabId);

  // 兼容 action 和 type 字段
  const msgType = msg.type || msg.action;

  switch (msgType) {
    case 'REQUEST':
      console.log('[API Inspector] 处理 REQUEST:', msg.data?.url);
      if (!captureEnabled) { sendRes({}); return; }
      const rid = ++requestIdCounter;

      // 确定请求类型
      let requestType = msg.data.requestType || 'fetch';
      const url = msg.data.url || '';

      // 检查是否为静态资源（根据文件扩展名或 Accept header）
      const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.ogg', '.pdf', '.map', '.webp', '.avif'];
      const isStatic = staticExtensions.some(ext => {
        const lowerUrl = url.toLowerCase();
        const pathEnd = lowerUrl.split('?')[0];
        return pathEnd.endsWith(ext);
      });

      if (isStatic) {
        requestType = 'static';
      }

      const req = {
        id: rid,
        injectId: msg.data.id,
        url: msg.data.url,
        method: msg.data.method,
        requestHeaders: Object.entries(msg.data.headers || {}).map(([n, v]) => ({ name: n, value: v })),
        requestBody: msg.data.body ? { data: msg.data.body } : null,
        timeStamp: msg.data.time,
        sourceTabId: tabId,
        status: 'pending',
        statusCode: null,
        responseBody: null,
        requestType: requestType
      };
      requestsStore.set(rid, req);
      console.log('[API Inspector] 请求已存储:', rid, '类型:', requestType, '总数:', requestsStore.size);
      notifyApp(tabId, 'newRequest', req);
      sendRes({});
      return;

    case 'RESPONSE':
      for (const [k, r] of requestsStore.entries()) {
        if (r.injectId === msg.data.id && r.status === 'pending') {
          r.status = 'completed';
          r.statusCode = msg.data.status;
          r.statusText = msg.data.statusText;
          r.responseHeaders = Object.entries(msg.data.headers || {}).map(([n, v]) => ({ name: n, value: v }));
          r.responseBody = msg.data.body;
          notifyApp(r.sourceTabId, 'updateRequest', r);
          break;
        }
      }
      sendRes({});
      return;

    case 'ERROR':
      for (const [k, r] of requestsStore.entries()) {
        if (r.injectId === msg.data.id && r.status === 'pending') {
          r.status = 'error';
          r.error = msg.data.error;
          notifyApp(r.sourceTabId, 'updateRequest', r);
          break;
        }
      }
      sendRes({});
      return;

    case 'register':
    case 'registerInspector':
      const regTargetId = msg.targetId || msg.targetTabId;
      if (sender.tab?.id && regTargetId) {
        inspectorMap.set(sender.tab.id, regTargetId);
      }
      sendRes({ ok: true });
      return;

    case 'startMonitor':
      // 启动监听模式
      const monitorTabId = msg.tabId;
      startMonitorMode(monitorTabId).then(success => {
        sendRes({ ok: success });
      });
      return true;

    case 'getRequests':
      const reqTabId = msg.tabId || msg.sourceTabId;
      const list = Array.from(requestsStore.values())
        .filter(r => r.sourceTabId === reqTabId)
        .sort((a, b) => b.timeStamp - a.timeStamp);
      sendRes({ requests: list });
      return;

    case 'clear':
    case 'clearRequests':
      const clearTabId = msg.tabId || msg.sourceTabId;
      for (const [k, r] of requestsStore.entries()) {
        if (r.sourceTabId === clearTabId) requestsStore.delete(k);
      }
      sendRes({ ok: true });
      return;

    case 'toggle':
    case 'toggleCapture':
      captureEnabled = msg.enabled;
      sendRes({ enabled: captureEnabled });
      return;

    case 'status':
    case 'getCaptureStatus':
      const statusTabId = msg.tabId || msg.sourceTabId;
      const cnt = statusTabId
        ? Array.from(requestsStore.values()).filter(r => r.sourceTabId === statusTabId).length
        : requestsStore.size;
      sendRes({ enabled: captureEnabled, count: cnt });
      return;

    case 'replay':
    case 'replayRequest':
      const replayTabId = msg.tabId || msg.sourceTabId;
      const replayConfig = msg.config || msg.request;
      
      sendRequestDirectly(replayConfig).then(result => {
        sendRes({ ok: true, result: result });
        
        if (replayTabId && result.status) {
          const testReqId = ++requestIdCounter;
          const testReq = {
            id: testReqId,
            url: replayConfig.url,
            method: replayConfig.method,
            requestHeaders: Object.entries(replayConfig.headers || {}).map(([n, v]) => ({ name: n, value: v })),
            requestBody: replayConfig.body ? { data: replayConfig.body } : null,
            timeStamp: Date.now(),
            sourceTabId: replayTabId,
            status: 'completed',
            statusCode: result.status,
            statusText: result.statusText,
            responseHeaders: Object.entries(result.headers || {}).map(([n, v]) => ({ name: n, value: v })),
            responseBody: result.body,
            requestType: 'test'
          };
          requestsStore.set(testReqId, testReq);
          notifyApp(replayTabId, 'newRequest', testReq);
        }
      }).catch(e => {
        sendRes({ error: e.message || '请求发送失败' });
      });
      return true;

    case 'sendDirectRequest':
      // 测试模式直接发送请求
      sendRequestDirectly(msg.config).then(result => {
        sendRes({ ok: true, result: result });
      });
      return true;
  }
});

// 通知 App
function notifyApp(sourceTabId, action, data) {
  for (const [appId, targetId] of inspectorMap.entries()) {
    if (targetId === sourceTabId) {
      chrome.tabs.sendMessage(appId, { action, data }).catch(() => {
        inspectorMap.delete(appId);
      });
    }
  }
}

// 直接发送请求（测试模式）
async function sendRequestDirectly(config) {
  try {
    const filteredHeaders = {};
    const blockedHeaders = ['host', 'origin', 'referer', 'content-length', 'cookie', 'user-agent'];
    for (const [k, v] of Object.entries(config.headers || {})) {
      if (!blockedHeaders.includes(k.toLowerCase())) {
        filteredHeaders[k] = v;
      }
    }

    const response = await fetch(config.url, {
      method: config.method,
      headers: filteredHeaders,
      body: config.body || undefined
    });

    const headers = {};
    response.headers.forEach((v, k) => headers[k] = v);

    const body = await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
      body: body
    };
  } catch (e) {
    return { error: e.message };
  }
}