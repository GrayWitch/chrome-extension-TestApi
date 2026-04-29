// content.js - 监听页面消息，转发到 background

(function() {
  'use strict';

  console.log('[API Inspector] Content script loaded');

  function safeSendMessage(msg) {
    try {
      chrome.runtime.sendMessage(msg, function(response) {
        // 检查是否有错误
        if (chrome.runtime.lastError) {
          console.log('[API Inspector] 发送消息时遇到错误:', chrome.runtime.lastError.message);
          return;
        }
        console.log('[API Inspector] Background 响应:', response);
      });
    } catch (e) {
      console.log('[API Inspector] Extension context invalidated, 无法发送消息');
    }
  }

  window.addEventListener('message', function(event) {
    // 只接收来自同一窗口的消息
    if (event.source !== window) return;

    var msg = event.data;
    if (!msg || !msg.__apiInspector) return;

    console.log('[API Inspector] 收到页面消息:', msg.type, msg.data && msg.data.url);

    // 转发到 background
    safeSendMessage({
      type: msg.type,
      data: msg.data,
      tabUrl: window.location.href,
      tabTitle: document.title
    });
  });

  console.log('[API Inspector] Message listener ready');
})();