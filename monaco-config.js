// Monaco Editor 配置 - 必须在 loader.js 之后加载
(function() {
  var baseUrl = chrome.runtime.getURL('');
  require.config({
    paths: {
      'vs': baseUrl + 'monaco/vs'
    }
  });
  console.log('[API Inspector] Monaco config loaded, base URL:', baseUrl);
})();