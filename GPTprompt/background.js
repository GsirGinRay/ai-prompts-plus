/**
 * Background Service Worker
 * 處理背景任務和訊息轉發
 */

console.log('ChatGPT 提示詞管理工具 Service Worker 已啟動');

// 監聽擴充功能安裝
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('安裝事件觸發:', details.reason);

  if (details.reason === 'install') {
    console.log('ChatGPT 提示詞管理工具已安裝');
    // 初始化空的提示詞列表
    await initializeStorage();
  } else if (details.reason === 'update') {
    console.log('ChatGPT 提示詞管理工具已更新');
  }
});

/**
 * 初始化儲存空間
 */
async function initializeStorage() {
  try {
    // 檢查是否已有提示詞
    const result = await chrome.storage.local.get('prompts');
    if (!result.prompts) {
      // 初始化為空陣列
      await chrome.storage.local.set({ prompts: [] });
      console.log('提示詞儲存空間已初始化');
    }
  } catch (error) {
    console.error('初始化儲存空間失敗:', error);
  }
}

// Service Worker 保持活躍（可選）
// 這會讓 Service Worker 保持運行狀態
self.addEventListener('activate', (event) => {
  console.log('Service Worker 已激活');
});
