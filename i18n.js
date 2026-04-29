// 多语言配置
var i18n = {
  zh: {
    title: 'API Inspector',
    mode: {
      selectTitle: 'API Inspector',
      selectDesc: '选择您需要的功能模式',
      sourceLabel: '来源',
      monitorName: '监听模式',
      monitorDesc: '捕获网页中的 API 请求',
      testName: 'API 测试',
      testDesc: '手动测试 API 接口',
      testTitle: 'API 测试模式'
    },
    toolbar: {
      monitoring: '监控中...',
      capturing: '捕获中',
      paused: '已暂停',
      clear: '清空',
      searchPlaceholder: '搜索 URL...',
      typeLabel: '类型:',
      typeAll: '全部',
      typeFetch: 'Fetch',
      typeXHR: 'XHR',
      typeTest: '测试',
      typeStatic: '静态'
    },
    panel: {
      requestList: '请求列表',
      noRequests: '暂无请求',
      waiting: '等待监控...',
      clickToStart: '请在目标网页点击扩展图标',
      openPageClick: '打开任意网页，点击扩展图标开始监控',
      chromeInternal: 'Chrome 内部页面无法监控',
      clickOnNormal: '请在普通网页上点击扩展图标',
      monitorFailed: '监控启动失败'
    },
    editor: {
      urlPlaceholder: '输入请求 URL...',
      send: '发送',
      headers: 'Headers',
      body: 'Body',
      params: 'Params',
      addHeader: '+ 添加 Header',
      addParam: '+ 添加 Param',
      json: 'JSON',
      text: 'Text',
      format: '格式化'
    },
    response: {
      waiting: '等待请求',
      sending: '发送中...',
      waitingResponse: '等待响应...',
      noBody: '无响应体',
      noHeaders: '无响应头',
      viewResponse: '发送请求查看响应',
      headersTab: 'Headers',
      fullscreen: '全屏显示',
      closeFullscreen: '关闭全屏'
    },
    status: {
      success: '成功',
      error: '错误',
      pending: '等待中',
      tabClosed: '目标页面已关闭',
      tabInvalid: '目标页面无法访问'
    }
  },
  en: {
    title: 'API Inspector',
    mode: {
      selectTitle: 'API Inspector',
      selectDesc: 'Select your working mode',
      sourceLabel: 'Source',
      monitorName: 'Monitor Mode',
      monitorDesc: 'Capture API requests from web pages',
      testName: 'API Testing',
      testDesc: 'Manually test API endpoints',
      testTitle: 'API Testing Mode'
    },
    toolbar: {
      monitoring: 'Monitoring...',
      capturing: 'Capturing',
      paused: 'Paused',
      clear: 'Clear',
      searchPlaceholder: 'Search URL...',
      typeLabel: 'Type:',
      typeAll: 'All',
      typeFetch: 'Fetch',
      typeXHR: 'XHR',
      typeTest: 'Test',
      typeStatic: 'Static'
    },
    panel: {
      requestList: 'Request List',
      noRequests: 'No requests',
      waiting: 'Waiting...',
      clickToStart: 'Click extension icon on target page',
      openPageClick: 'Open any page and click extension icon',
      chromeInternal: 'Chrome internal pages cannot be monitored',
      clickOnNormal: 'Please click extension icon on a normal webpage',
      monitorFailed: 'Monitor failed to start'
    },
    editor: {
      urlPlaceholder: 'Enter request URL...',
      send: 'Send',
      headers: 'Headers',
      body: 'Body',
      params: 'Params',
      addHeader: '+ Add Header',
      addParam: '+ Add Param',
      json: 'JSON',
      text: 'Text',
      format: 'Format'
    },
    response: {
      waiting: 'Waiting for request',
      sending: 'Sending...',
      waitingResponse: 'Waiting for response...',
      noBody: 'No response body',
      noHeaders: 'No response headers',
      viewResponse: 'Send request to view response',
      headersTab: 'Headers',
      fullscreen: 'Fullscreen',
      closeFullscreen: 'Close'
    },
    status: {
      success: 'Success',
      error: 'Error',
      pending: 'Pending',
      tabClosed: 'Target page closed',
      tabInvalid: 'Target page inaccessible'
    }
  },
  ko: {
    title: 'API Inspector',
    mode: {
      selectTitle: 'API Inspector',
      selectDesc: '작업 모드를 선택하세요',
      sourceLabel: '소스',
      monitorName: '모니터 모드',
      monitorDesc: '웹페이지에서 API 요청 캡처',
      testName: 'API 테스트',
      testDesc: 'API 엔드포인트 수동 테스트',
      testTitle: 'API 테스트 모드'
    },
    toolbar: {
      monitoring: '모니터링...',
      capturing: '캡처 중',
      paused: '일시 중지',
      clear: '지우기',
      searchPlaceholder: 'URL 검색...',
      typeLabel: '유형:',
      typeAll: '전체',
      typeFetch: 'Fetch',
      typeXHR: 'XHR',
      typeTest: '테스트',
      typeStatic: '정적'
    },
    panel: {
      requestList: '요청 목록',
      noRequests: '요청 없음',
      waiting: '대기 중...',
      clickToStart: '대상 페이지에서 확장 아이콘 클릭',
      openPageClick: '페이지를 열고 확장 아이콘 클릭',
      chromeInternal: 'Chrome 내부 페이지는 모니터링할 수 없습니다',
      clickOnNormal: '일반 웹페이지에서 확장 아이콘을 클릭하세요',
      monitorFailed: '모니터 시작 실패'
    },
    editor: {
      urlPlaceholder: '요청 URL 입력...',
      send: '보내기',
      headers: 'Headers',
      body: 'Body',
      params: 'Params',
      addHeader: '+ Header 추가',
      addParam: '+ Param 추가',
      json: 'JSON',
      text: 'Text',
      format: '포맷'
    },
    response: {
      waiting: '요청 대기',
      sending: '전송 중...',
      waitingResponse: '응답 대기...',
      noBody: '응답 본문 없음',
      noHeaders: '응답 헤더 없음',
      viewResponse: '요청을 보내 응답 확인',
      headersTab: 'Headers',
      fullscreen: '전체 화면',
      closeFullscreen: '닫기'
    },
    status: {
      success: '성공',
      error: '오류',
      pending: '대기',
      tabClosed: '대상 페이지가 닫혔습니다',
      tabInvalid: '대상 페이지에 접근할 수 없습니다'
    }
  }
};

// 当前语言
var currentLang = 'zh';

// 获取翻译文本
function t(key) {
  var keys = key.split('.');
  var value = i18n[currentLang];
  for (var i = 0; i < keys.length; i++) {
    if (value && value[keys[i]]) {
      value = value[keys[i]];
    } else {
      return key;
    }
  }
  return value;
}

// 更新页面语言
function updateLanguage(lang) {
  currentLang = lang;

  // 更新语言选择按钮状态
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // 更新模式选择界面文本
  var modeSelectTitle = document.getElementById('modeSelectTitle');
  var modeSelectDesc = document.getElementById('modeSelectDesc');
  var monitorModeName = document.getElementById('monitorModeName');
  var monitorModeDesc = document.getElementById('monitorModeDesc');
  var testModeName = document.getElementById('testModeName');
  var testModeDesc = document.getElementById('testModeDesc');
  if (modeSelectTitle) modeSelectTitle.textContent = t('mode.selectTitle');
  if (modeSelectDesc) modeSelectDesc.textContent = t('mode.selectDesc');
  if (monitorModeName) monitorModeName.textContent = t('mode.monitorName');
  if (monitorModeDesc) monitorModeDesc.textContent = t('mode.monitorDesc');
  if (testModeName) testModeName.textContent = t('mode.testName');
  if (testModeDesc) testModeDesc.textContent = t('mode.testDesc');

  // 更新页面文本
  document.getElementById('searchInput').placeholder = t('toolbar.searchPlaceholder');
  document.getElementById('clearList').textContent = t('toolbar.clear');
  document.querySelector('.panel-header h3').textContent = t('panel.requestList');

  // 更新 Tab 按钮
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    if (btn.dataset.tab === 'headers') btn.textContent = t('editor.headers');
    if (btn.dataset.tab === 'body') btn.textContent = t('editor.body');
    if (btn.dataset.tab === 'params') btn.textContent = t('editor.params');
  });

  // 更新响应 Tab 按钮
  document.querySelectorAll('.resp-tab-btn').forEach(function(btn) {
    if (btn.dataset.tab === 'respBody') btn.textContent = t('editor.body');
    if (btn.dataset.tab === 'respHeaders') btn.textContent = t('response.headersTab');
  });

  // 更新按钮文本
  document.getElementById('addHeader').textContent = t('editor.addHeader');
  document.getElementById('addParam').textContent = t('editor.addParam');
  document.getElementById('sendBtn').textContent = t('editor.send');
  document.getElementById('urlInput').placeholder = t('editor.urlPlaceholder');

  // 更新格式化按钮
  var formatBodyBtn = document.getElementById('formatBodyBtn');
  var formatResponseBtn = document.getElementById('formatResponseBtn');
  if (formatBodyBtn) formatBodyBtn.textContent = t('editor.format');
  if (formatResponseBtn) formatResponseBtn.textContent = t('editor.format');

  // 更新 Body 类型选择
  var bodyTypeSelect = document.getElementById('bodyType');
  bodyTypeSelect.options[0].textContent = t('editor.json');
  bodyTypeSelect.options[1].textContent = t('editor.text');

  // 更新请求类型过滤复选框
  var checkboxes = document.querySelectorAll('.type-checkbox');
  var labels = {
    'all': 'toolbar.typeAll',
    'fetch': 'toolbar.typeFetch',
    'xhr': 'toolbar.typeXHR',
    'test': 'toolbar.typeTest',
    'static': 'toolbar.typeStatic'
  };
  checkboxes.forEach(function(cb) {
    var parentLabel = cb.parentElement;
    if (parentLabel && labels[cb.value]) {
      var textNode = parentLabel.querySelector('.checkbox-text');
      if (textNode) {
        textNode.textContent = t(labels[cb.value]);
      }
    }
  });
  
  var filterLabelEl = document.querySelector('.filter-label');
  if (filterLabelEl) {
    filterLabelEl.textContent = t('toolbar.typeLabel');
  }

  // 更新响应状态
  var statusEl = document.getElementById('responseStatus');
  if (statusEl.textContent === '等待请求' || statusEl.textContent === 'Waiting for request' || statusEl.textContent === '요청 대기') {
    statusEl.textContent = t('response.waiting');
  }

  // 保存语言设置
  chrome.storage && chrome.storage.local.set({ language: lang });

  // 重新渲染请求列表
  if (typeof renderRequestList === 'function') {
    renderRequestList();
  }
}

// 初始化语言
function initLanguage() {
  // 从存储中读取语言设置
  if (chrome.storage) {
    chrome.storage.local.get(['language'], function(result) {
      if (result.language) {
        currentLang = result.language;
      }
      updateLanguage(currentLang);
    });
  } else {
    updateLanguage(currentLang);
  }
}