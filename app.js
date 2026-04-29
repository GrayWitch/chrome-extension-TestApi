// API Inspector - 新标签页逻辑

(function() {
  'use strict';

  // Monaco Editors
  var bodyEditor = null;
  var responseEditor = null;
  var monacoReady = false;

  // State
  var requests = [];
  var selectedRequest = null;
  var captureEnabled = true;
  var currentEditorTab = 'headers';
  var currentResponseTab = 'respBody';
  var selectedTypes = ['all'];

  // 当前模式
  var currentMode = null; // 'monitor' 或 'test'

  // 监控的标签页信息
  var monitoredTabId = null;
  var monitoredTabUrl = null;
  var monitoredTabTitle = null;

  // DOM Elements
  var appContainer = document.getElementById('appContainer');
  var modeSelectOverlay = document.getElementById('modeSelectOverlay');
  var monitorModeBtn = document.getElementById('monitorModeBtn');
  var testModeBtn = document.getElementById('testModeBtn');
  var modeSourceInfo = document.getElementById('modeSourceInfo');
  var modeSelectDesc = document.getElementById('modeSelectDesc');
  var monitorModeName = document.getElementById('monitorModeName');
  var monitorModeDesc = document.getElementById('monitorModeDesc');
  var testModeName = document.getElementById('testModeName');
  var testModeDesc = document.getElementById('testModeDesc');

  var toggleCaptureBtn = document.getElementById('toggleCapture');
  var clearListBtn = document.getElementById('clearList');
  var searchInput = document.getElementById('searchInput');
  var requestListEl = document.getElementById('requestList');
  var requestCountEl = document.getElementById('requestCount');
  var monitoredTabEl = document.getElementById('monitoredTab');
  var requestsPanel = document.querySelector('.requests-panel');
  var editorPanel = document.querySelector('.editor-panel');

  // Editor Elements
  var methodSelect = document.getElementById('methodSelect');
  var urlInput = document.getElementById('urlInput');
  var sendBtn = document.getElementById('sendBtn');
  var headersList = document.getElementById('headersList');
  var addHeaderBtn = document.getElementById('addHeader');
  var bodyTypeSelect = document.getElementById('bodyType');
  var paramsList = document.getElementById('paramsList');
  var addParamBtn = document.getElementById('addParam');
  var formatBodyBtn = document.getElementById('formatBodyBtn');
  var formatResponseBtn = document.getElementById('formatResponseBtn');

  // Tabs
  var editorTabs = document.querySelectorAll('.tab-btn');
  var headersTab = document.getElementById('headersTab');
  var bodyTab = document.getElementById('bodyTab');
  var paramsTab = document.getElementById('paramsTab');

  // Response Elements
  var responseStatus = document.getElementById('responseStatus');
  var responseTime = document.getElementById('responseTime');
  var responseHeadersEl = document.getElementById('responseHeaders');
  var respTabs = document.querySelectorAll('.resp-tab-btn');
  var respBodyTab = document.getElementById('respBodyTab');
  var respHeadersTab = document.getElementById('respHeadersTab');
  var fullscreenBtn = document.getElementById('fullscreenBtn');

  // Fullscreen Editor
  var fullscreenEditor = null;
  var fullscreenOverlay = null;

  // Initialize
  initMonaco();
  init();

  function initMonaco() {
    require(['vs/editor/editor.main'], function(monaco) {
      console.log('[API Inspector] Monaco loaded');

      // 定义深色主题
      monaco.editor.defineTheme('apiInspectorTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'key.json', foreground: '9cdcfe' },
          { token: 'string.key.json', foreground: '9cdcfe' },
          { token: 'string.value.json', foreground: 'ce9178' },
          { token: 'number', foreground: 'b5cea8' },
          { token: 'keyword', foreground: '569cd6' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
          'editorLineNumber.foreground': '#858585',
          'editorCursor.foreground': '#aeafad',
        }
      });

      // Body 编辑器
      var bodyContainer = document.getElementById('bodyEditorContainer');
      bodyEditor = monaco.editor.create(bodyContainer, {
        value: '',
        language: 'json',
        theme: 'apiInspectorTheme',
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        folding: true,
        tabSize: 2,
        formatOnPaste: true,
      });

      // Response 编辑器
      var responseContainer = document.getElementById('responseEditorContainer');
      responseEditor = monaco.editor.create(responseContainer, {
        value: '',
        language: 'json',
        theme: 'apiInspectorTheme',
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        folding: true,
        readOnly: true,
        tabSize: 2,
      });

      monacoReady = true;
      console.log('[API Inspector] Monaco editors initialized');

      // 设置初始高度
      updateEditorHeights();
    });
  }

  function updateEditorHeights() {
    // Body 编辑器：固定 150px
    var bodyContainer = document.getElementById('bodyEditorContainer');
    if (bodyContainer) {
      bodyContainer.style.height = '150px';
    }

    // Response 编辑器：清除 inline height，让 CSS flexbox + height:100% 自动计算
    var responseContainer = document.getElementById('responseEditorContainer');
    if (responseContainer) {
      responseContainer.style.height = '';
    }

    // 触发 Monaco 重新布局
    if (bodyEditor) bodyEditor.layout();
    if (responseEditor) responseEditor.layout();
  }

  // 监听窗口大小变化
  window.addEventListener('resize', function() {
    updateEditorHeights();
  });

  function init() {
    initLanguage();
    detectMode();
    setupEventListeners();
    setupMessageListener();
    addHeaderRow('', '');
    addParamRow('', '');
  }

  function detectMode() {
    var urlParams = new URLSearchParams(window.location.search);
    var mode = urlParams.get('mode');

    // 获取源标签页信息
    var sourceTabId = parseInt(urlParams.get('tabId'));
    var sourceTabUrl = decodeURIComponent(urlParams.get('tabUrl') || '');
    var sourceTabTitle = decodeURIComponent(urlParams.get('tabTitle') || '');

    if (mode === 'select') {
      // 显示模式选择界面
      showModeSelect(sourceTabId, sourceTabUrl, sourceTabTitle);
    } else if (mode === 'test') {
      // 直接进入测试模式
      startTestMode();
    } else if (mode === 'monitor') {
      // 直接进入监听模式
      startMonitorMode(sourceTabId, sourceTabUrl, sourceTabTitle);
    } else {
      // 默认进入测试模式（无参数时）
      startTestMode();
    }
  }

  function showModeSelect(sourceTabId, sourceTabUrl, sourceTabTitle) {
    // 更新模式选择界面文本
    updateModeSelectText();

    // 显示源标签页信息
    if (sourceTabUrl) {
      try {
        var u = new URL(sourceTabUrl);
        modeSourceInfo.textContent = t('mode.sourceLabel') + ': ' + u.hostname;
      } catch (e) {
        modeSourceInfo.textContent = t('mode.sourceLabel') + ': ' + (sourceTabTitle || sourceTabUrl);
      }
    } else {
      modeSourceInfo.textContent = '';
    }

    // 保存源标签页信息供后续使用
    monitoredTabId = sourceTabId;
    monitoredTabUrl = sourceTabUrl;
    monitoredTabTitle = sourceTabTitle;

    // 显示模式选择界面
    modeSelectOverlay.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }

  function updateModeSelectText() {
    modeSelectDesc.textContent = t('mode.selectDesc') || '选择您需要的功能模式';
    monitorModeName.textContent = t('mode.monitorName') || '监听模式';
    monitorModeDesc.textContent = t('mode.monitorDesc') || '捕获网页中的 API 请求';
    testModeName.textContent = t('mode.testName') || 'API 测试';
    testModeDesc.textContent = t('mode.testDesc') || '手动测试 API 接口';
  }

  function startMonitorMode(sourceTabId, sourceTabUrl, sourceTabTitle) {
    currentMode = 'monitor';
    monitoredTabId = sourceTabId;
    monitoredTabUrl = sourceTabUrl;
    monitoredTabTitle = sourceTabTitle;

    // 隐藏模式选择，显示主界面
    modeSelectOverlay.classList.add('hidden');
    appContainer.classList.remove('hidden');

    // 显示请求列表
    requestsPanel.classList.remove('hidden-test');
    editorPanel.classList.remove('test-mode');

    // 更新监控标签页显示
    updateMonitoredTabDisplay();

    // 启动监控
    if (monitoredTabId && !isNaN(monitoredTabId)) {
      chrome.runtime.sendMessage({ type: 'startMonitor', tabId: monitoredTabId }, function(res) {
        if (res && res.ok) {
          console.log('[API Inspector] 监听模式启动成功');
          chrome.runtime.sendMessage({ type: 'register', targetId: monitoredTabId });
          loadState();
        } else {
          monitoredTabEl.textContent = t('panel.monitorFailed') || '监控启动失败';
          monitoredTabEl.className = 'monitored-tab error';
        }
      });
    } else {
      monitoredTabEl.textContent = t('panel.clickToStart');
      requestListEl.innerHTML = '<div class="empty-hint">' + t('panel.openPageClick') + '</div>';
    }

    updateEditorHeights();
  }

  function startTestMode() {
    currentMode = 'test';

    // 隐藏模式选择，显示主界面
    modeSelectOverlay.classList.add('hidden');
    appContainer.classList.remove('hidden');

    // 隐藏请求列表，扩展编辑面板
    requestsPanel.classList.add('hidden-test');
    editorPanel.classList.add('test-mode');

    // 更新监控标签页显示为测试模式
    monitoredTabEl.textContent = t('mode.testTitle') || 'API 测试模式';

    // 清空编辑器
    clearEditor();

    updateEditorHeights();
  }

  function updateMonitoredTabDisplay() {
    if (monitoredTabUrl) {
      try {
        var u = new URL(monitoredTabUrl);
        monitoredTabEl.textContent = t('toolbar.monitoring') + ' ' + u.hostname;
        monitoredTabEl.title = monitoredTabUrl;
      } catch (e) {
        monitoredTabEl.textContent = t('toolbar.monitoring') + ' ' + (monitoredTabTitle || monitoredTabUrl);
        monitoredTabEl.title = monitoredTabUrl;
      }
    }
  }

  function loadState() {
    if (!monitoredTabId) return;

    chrome.runtime.sendMessage({ type: 'status', tabId: monitoredTabId }, function(res) {
      if (res) {
        captureEnabled = res.enabled;
        updateCaptureButton();
        requestCountEl.textContent = res.count || 0;
      }
    });

    chrome.runtime.sendMessage({ type: 'getRequests', tabId: monitoredTabId }, function(res) {
      if (res && res.requests) {
        requests = res.requests;
        renderRequestList();
      }
    });
  }

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      switch (message.action) {
        case 'newRequest':
          if (message.data && message.data.sourceTabId === monitoredTabId) {
            requests.unshift(message.data);
            requestCountEl.textContent = requests.length;
            renderRequestList();
          }
          break;

        case 'updateRequest':
          if (message.data && message.data.sourceTabId === monitoredTabId) {
            var idx = requests.findIndex(function(r) { return r.id === message.data.id; });
            if (idx !== -1) {
              requests[idx] = message.data;
              renderRequestList();
              if (selectedRequest && selectedRequest.id === message.data.id) {
                showRequestDetail(message.data);
              }
            }
          }
          break;
      }
      sendResponse({});
      return true;
    });
  }

  function setupEventListeners() {
    // 模式选择按钮
    if (monitorModeBtn) {
      monitorModeBtn.addEventListener('click', function() {
        startMonitorMode(monitoredTabId, monitoredTabUrl, monitoredTabTitle);
      });
    }

    if (testModeBtn) {
      testModeBtn.addEventListener('click', function() {
        startTestMode();
      });
    }

    toggleCaptureBtn.addEventListener('click', function() {
      if (currentMode !== 'monitor') return;
      captureEnabled = !captureEnabled;
      chrome.runtime.sendMessage({ type: 'toggle', enabled: captureEnabled }, function(res) {
        if (res) captureEnabled = res.enabled;
        updateCaptureButton();
      });
    });

    clearListBtn.addEventListener('click', function() {
      if (currentMode !== 'monitor') return;
      chrome.runtime.sendMessage({ type: 'clear', tabId: monitoredTabId }, function() {
        requests = [];
        selectedRequest = null;
        renderRequestList();
        clearEditor();
      });
    });

    searchInput.addEventListener('input', renderRequestList);

    // 请求类型过滤复选框
    var typeCheckboxes = document.querySelectorAll('.type-checkbox');
    typeCheckboxes.forEach(function(cb) {
      cb.addEventListener('change', function() {
        var allCb = document.querySelector('.type-checkbox[value="all"]');
        if (cb.value !== 'all' && cb.checked && allCb && allCb.checked) {
          allCb.checked = false;
        }
        updateTypeFilters();
        renderRequestList();
      });
    });

    editorTabs.forEach(function(btn) {
      btn.addEventListener('click', function() {
        switchEditorTab(btn.dataset.tab);
      });
    });

    respTabs.forEach(function(btn) {
      btn.addEventListener('click', function() {
        switchResponseTab(btn.dataset.tab);
      });
    });

    addHeaderBtn.addEventListener('click', function() {
      addHeaderRow('', '');
    });

    addParamBtn.addEventListener('click', function() {
      addParamRow('', '');
    });

    sendBtn.addEventListener('click', sendRequest);

    // 语言切换按钮
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        updateLanguage(btn.dataset.lang);
      });
    });

    // 全屏按钮
    fullscreenBtn.addEventListener('click', openFullscreen);

    // 格式化按钮
    if (formatBodyBtn) {
      formatBodyBtn.addEventListener('click', function() {
        formatEditor(bodyEditor);
      });
    }
    if (formatResponseBtn) {
      formatResponseBtn.addEventListener('click', function() {
        formatEditor(responseEditor);
      });
    }

    // ESC 键关闭全屏
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && fullscreenOverlay) {
        closeFullscreen();
      }
    });
  }

  function formatEditor(editor) {
    if (!editor || !monacoReady) return;

    var content = editor.getValue();
    if (!content.trim()) return;

    // 尝试 JSON 格式化
    try {
      var json = JSON.parse(content);
      var formatted = JSON.stringify(json, null, 2);
      editor.setValue(formatted);

      // 设置语言为 JSON
      require(['vs/editor/editor.main'], function(monaco) {
        monaco.editor.setModelLanguage(editor.getModel(), 'json');
      });
    } catch (e) {
      // JSON 解析失败，尝试使用 Monaco 的格式化 action
      editor.getAction('editor.action.formatDocument').run();
    }
  }

  function openFullscreen() {
    if (fullscreenOverlay) return;

    // 创建全屏 overlay
    fullscreenOverlay = document.createElement('div');
    fullscreenOverlay.className = 'fullscreen-overlay';

    // Header
    var header = document.createElement('div');
    header.className = 'fullscreen-header';

    var statusDiv = document.createElement('div');
    statusDiv.className = 'fullscreen-status';
    statusDiv.innerHTML =
      '<span class="response-status ' + responseStatus.className + '">' + responseStatus.textContent + '</span>' +
      '<span class="response-time">' + responseTime.textContent + '</span>';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'fullscreen-close';
    closeBtn.textContent = t('response.closeFullscreen');
    closeBtn.addEventListener('click', closeFullscreen);

    header.appendChild(statusDiv);
    header.appendChild(closeBtn);
    fullscreenOverlay.appendChild(header);

    // Editor container
    var editorContainer = document.createElement('div');
    editorContainer.className = 'fullscreen-editor';
    editorContainer.id = 'fullscreenEditorContainer';
    fullscreenOverlay.appendChild(editorContainer);

    document.body.appendChild(fullscreenOverlay);

    // 创建全屏编辑器
    require(['vs/editor/editor.main'], function(monaco) {
      fullscreenEditor = monaco.editor.create(editorContainer, {
        value: responseEditor ? responseEditor.getValue() : '',
        language: 'json',
        theme: 'apiInspectorTheme',
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        folding: true,
        readOnly: true,
        tabSize: 2,
      });
    });
  }

  function closeFullscreen() {
    if (fullscreenEditor) {
      fullscreenEditor.dispose();
      fullscreenEditor = null;
    }
    if (fullscreenOverlay) {
      fullscreenOverlay.remove();
      fullscreenOverlay = null;
    }
  }

  function updateCaptureButton() {
    toggleCaptureBtn.className = captureEnabled ? 'capture-btn active' : 'capture-btn inactive';
    toggleCaptureBtn.innerHTML = captureEnabled
      ? '<span class="capture-icon">●</span> <span class="capture-text">' + t('toolbar.capturing') + '</span>'
      : '<span class="capture-icon">○</span> <span class="capture-text">' + t('toolbar.paused') + '</span>';
  }

  function updateTypeFilters() {
    var checkboxes = document.querySelectorAll('.type-checkbox');
    var allCb = document.querySelector('.type-checkbox[value="all"]');
    
    var checkedValues = [];
    checkboxes.forEach(function(cb) {
      if (cb.checked && cb.value !== 'all') {
        checkedValues.push(cb.value);
      }
    });
    
    if (allCb && allCb.checked) {
      selectedTypes = ['all'];
      checkboxes.forEach(function(cb) {
        if (cb.value !== 'all') {
          cb.checked = false;
          cb.parentElement.classList.remove('active-filter');
        }
      });
      if (allCb.parentElement) allCb.parentElement.classList.add('active-filter');
    } else {
      selectedTypes = checkedValues;
      checkboxes.forEach(function(cb) {
        if (cb.parentElement) {
          if (cb.checked) {
            cb.parentElement.classList.add('active-filter');
          } else {
            cb.parentElement.classList.remove('active-filter');
          }
        }
      });
      if (selectedTypes.length === 0 || selectedTypes.length === 4) {
        if (allCb) {
          allCb.checked = true;
          selectedTypes = ['all'];
          if (allCb.parentElement) allCb.parentElement.classList.add('active-filter');
        }
      }
    }
  }

  function renderRequestList() {
    var search = searchInput.value.toLowerCase();
    var filtered = requests.filter(function(r) {
      var urlMatch = !search || (r.url && r.url.toLowerCase().includes(search));

      var typeMatch = true;
      if (!selectedTypes.includes('all')) {
        var reqType = r.requestType || 'fetch';
        typeMatch = selectedTypes.includes(reqType);
      }

      return urlMatch && typeMatch;
    });
    requestCountEl.textContent = filtered.length;

    if (filtered.length === 0) {
      requestListEl.innerHTML = '<div class="empty-hint">' + t('panel.noRequests') + '</div>';
      return;
    }

    requestListEl.innerHTML = filtered.map(function(r) {
      var methodClass = (r.method || 'GET').toLowerCase();
      var shortUrl = shortenUrl(r.url);
      // 状态显示：成功显示状态码，错误显示 Error，pending 显示 ...
      var status;
      if (r.status === 'error') {
        status = 'Error';
      } else if (r.statusCode) {
        status = String(r.statusCode);
      } else if (r.status === 'pending') {
        status = '...';
      } else {
        status = r.status || '...';
      }
      var statusClass = r.status === 'completed' && r.statusCode >= 200 && r.statusCode < 300 ? 'success' :
                        r.status === 'error' || (r.statusCode && r.statusCode >= 400) ? 'error' : 'pending';
      var selectedClass = selectedRequest && selectedRequest.id === r.id ? 'selected' : '';
      var reqType = r.requestType || 'fetch';
      var typeIcon = reqType === 'xhr' ? 'XHR' : reqType === 'static' ? 'SRC' : reqType === 'test' ? 'T' : 'F';
      var typeClass = reqType === 'xhr' ? 'type-xhr' : reqType === 'static' ? 'type-static' : reqType === 'test' ? 'type-test' : 'type-fetch';

      return '<div class="request-item ' + selectedClass + '" data-id="' + r.id + '">' +
        '<span class="req-type ' + typeClass + '">' + typeIcon + '</span>' +
        '<span class="method ' + methodClass + '">' + (r.method || 'GET') + '</span>' +
        '<span class="url">' + shortUrl + '</span>' +
        '<span class="status ' + statusClass + '">' + status + '</span>' +
      '</div>';
    }).join('');

    requestListEl.querySelectorAll('.request-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var id = parseInt(item.dataset.id);
        var req = requests.find(function(r) { return r.id === id; });
        if (req) selectRequest(req);
      });
    });
  }

  function shortenUrl(url) {
    try {
      var u = new URL(url);
      return u.pathname + u.search;
    } catch (e) {
      return url ? url.substring(0, 40) : '';
    }
  }

  function selectRequest(req) {
    selectedRequest = req;
    renderRequestList();
    showRequestDetail(req);
  }

  function showRequestDetail(req) {
    methodSelect.value = req.method || 'GET';
    
    var url = req.url || '';
    var baseUrl = url;
    
    try {
      var pu = new URL(url);
      baseUrl = pu.origin + pu.pathname;
      
      paramsList.innerHTML = '';
      pu.searchParams.forEach(function(v, k) {
        addParamRow(k, v);
      });
      if (paramsList.children.length === 0) addParamRow('', '');
    } catch (e) {
      paramsList.innerHTML = '';
      addParamRow('', '');
    }
    
    urlInput.value = baseUrl;

    headersList.innerHTML = '';
    (req.requestHeaders || []).forEach(function(h) {
      if (!['Host', 'Connection', 'Content-Length'].includes(h.name)) {
        addHeaderRow(h.name, h.value);
      }
    });
    if (headersList.children.length === 0) addHeaderRow('', '');

    if (bodyEditor && req.requestBody && req.requestBody.data) {
      var bodyText = req.requestBody.data;
      try {
        var json = JSON.parse(bodyText);
        bodyText = JSON.stringify(json, null, 2);
      } catch (e) {}
      bodyEditor.setValue(bodyText);
    } else if (bodyEditor) {
      bodyEditor.setValue('');
    }

    // 响应信息
    if (req.statusCode) {
      var statusClass = req.statusCode >= 200 && req.statusCode < 300 ? 'success' : 'error';
      responseStatus.textContent = req.statusCode + ' ' + (req.statusText || '');
      responseStatus.className = 'response-status ' + statusClass;
    } else if (req.status === 'error') {
      responseStatus.textContent = t('status.error') + ': ' + (req.error || t('status.error'));
      responseStatus.className = 'response-status error';
    } else {
      responseStatus.textContent = t('response.waitingResponse');
      responseStatus.className = 'response-status pending';
    }

    // 响应体
    if (responseEditor && req.responseBody) {
      var respText = req.responseBody;
      try {
        var respJson = JSON.parse(respText);
        respText = JSON.stringify(respJson, null, 2);
        require(['vs/editor/editor.main'], function(monaco) {
          monaco.editor.setModelLanguage(responseEditor.getModel(), 'json');
        });
      } catch (e) {
        require(['vs/editor/editor.main'], function(monaco) {
          monaco.editor.setModelLanguage(responseEditor.getModel(), 'plaintext');
        });
      }
      responseEditor.setValue(respText);
    } else if (responseEditor) {
      responseEditor.setValue(req.status === 'pending' ? t('response.waitingResponse') : t('response.noBody'));
    }

    responseHeadersEl.innerHTML = (req.responseHeaders || [])
      .filter(function(h) { return h.name && h.value; })
      .map(function(h) {
        return '<tr><td>' + escapeHtml(h.name) + '</td><td>' + escapeHtml(h.value) + '</td></tr>';
      })
      .join('');
  }

  function clearEditor() {
    methodSelect.value = 'GET';
    urlInput.value = '';
    headersList.innerHTML = '';
    addHeaderRow('', '');
    if (bodyEditor) bodyEditor.setValue('');
    paramsList.innerHTML = '';
    addParamRow('', '');
    responseStatus.textContent = t('response.waiting');
    responseStatus.className = 'response-status pending';
    responseTime.textContent = '';
    if (responseEditor) responseEditor.setValue(t('response.viewResponse'));
    responseHeadersEl.innerHTML = '';
  }

  function switchEditorTab(tab) {
    currentEditorTab = tab;
    editorTabs.forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    headersTab.classList.toggle('hidden', tab !== 'headers');
    bodyTab.classList.toggle('hidden', tab !== 'body');
    paramsTab.classList.toggle('hidden', tab !== 'params');
    updateEditorHeights();
  }

  function switchResponseTab(tab) {
    currentResponseTab = tab;
    respTabs.forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    respBodyTab.classList.toggle('hidden', tab !== 'respBody');
    respHeadersTab.classList.toggle('hidden', tab !== 'respHeaders');
    if (tab === 'respBody') updateEditorHeights();
  }

  function addHeaderRow(key, value) {
    var row = document.createElement('div');
    row.className = 'header-row';
    row.innerHTML =
      '<input type="text" class="header-key" value="' + escapeHtml(key) + '" placeholder="Key">' +
      '<input type="text" class="header-value" value="' + escapeHtml(value) + '" placeholder="Value">' +
      '<button class="btn-remove">×</button>';
    row.querySelector('.btn-remove').addEventListener('click', function() {
      row.remove();
    });
    headersList.appendChild(row);
  }

  function addParamRow(key, value) {
    var row = document.createElement('div');
    row.className = 'param-row';
    row.innerHTML =
      '<input type="text" class="param-key" value="' + escapeHtml(key) + '" placeholder="Key">' +
      '<input type="text" class="param-value" value="' + escapeHtml(value) + '" placeholder="Value">' +
      '<button class="btn-remove">×</button>';
    row.querySelector('.btn-remove').addEventListener('click', function() {
      row.remove();
    });
    paramsList.appendChild(row);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getHeaders() {
    var headers = {};
    headersList.querySelectorAll('.header-row').forEach(function(row) {
      var key = row.querySelector('.header-key').value.trim();
      var value = row.querySelector('.header-value').value.trim();
      if (key) headers[key] = value;
    });
    return headers;
  }

  function getUrlWithParams() {
    var url = urlInput.value.trim();
    var params = new URLSearchParams();

    paramsList.querySelectorAll('.param-row').forEach(function(row) {
      var key = row.querySelector('.param-key').value.trim();
      var value = row.querySelector('.param-value').value.trim();
      if (key) params.append(key, value);
    });

    if (params.toString()) {
      try {
        var u = new URL(url);
        params.forEach(function(v, k) {
          u.searchParams.append(k, v);
        });
        url = u.toString();
      } catch (e) {
        url += '?' + params.toString();
      }
    }

    return url;
  }

  function getBody() {
    if (!bodyEditor) return null;
    var body = bodyEditor.getValue().trim();
    if (!body) return null;
    return body;
  }

  function sendRequest() {
    var config = {
      url: getUrlWithParams(),
      method: methodSelect.value,
      headers: getHeaders(),
      body: methodSelect.value !== 'GET' ? getBody() : null
    };

    responseStatus.textContent = t('response.sending');
    responseStatus.className = 'response-status pending';
    responseTime.textContent = '';
    if (responseEditor) responseEditor.setValue('');
    switchResponseTab('respBody');

    var startTime = Date.now();

    // 根据模式选择不同的消息类型
    var msgType = currentMode === 'test' ? 'sendDirectRequest' : 'replay';
    var msgData = {
      type: msgType,
      config: config
    };

    // 监听模式需要 tabId
    if (currentMode === 'monitor' && monitoredTabId) {
      msgData.tabId = monitoredTabId;
    }

    chrome.runtime.sendMessage(msgData, function(res) {
      var elapsed = Date.now() - startTime;
      responseTime.textContent = elapsed + 'ms';

      if (res && res.ok && res.result) {
        var result = res.result;

        if (result.error) {
          responseStatus.textContent = t('status.error') + ': ' + result.error;
          responseStatus.className = 'response-status error';
          if (responseEditor) responseEditor.setValue(result.error);
        } else {
          var statusClass = result.status >= 200 && result.status < 300 ? 'success' : 'error';
          responseStatus.textContent = result.status + ' ' + (result.statusText || '');
          responseStatus.className = 'response-status ' + statusClass;

          var bodyText = result.body || '';
          try {
            var bodyJson = JSON.parse(bodyText);
            bodyText = JSON.stringify(bodyJson, null, 2);
            require(['vs/editor/editor.main'], function(monaco) {
              monaco.editor.setModelLanguage(responseEditor.getModel(), 'json');
            });
          } catch (e) {
            require(['vs/editor/editor.main'], function(monaco) {
              monaco.editor.setModelLanguage(responseEditor.getModel(), 'plaintext');
            });
          }
          if (responseEditor) responseEditor.setValue(bodyText);

          responseHeadersEl.innerHTML = Object.entries(result.headers || {})
            .map(function(kv) {
              return '<tr><td>' + escapeHtml(kv[0]) + '</td><td>' + escapeHtml(kv[1]) + '</td></tr>';
            })
            .join('');
        }
      } else {
        responseStatus.textContent = t('status.error');
        responseStatus.className = 'response-status error';
        if (responseEditor) responseEditor.setValue(res && res.error ? res.error : t('status.error'));
      }
    });
    return true;
  }
})();