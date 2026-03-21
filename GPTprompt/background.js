/**
 * Background Service Worker
 * 處理背景任務和訊息轉發
 */

// 監聽擴充功能安裝
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await initializeStorage();
  }
});

/**
 * 初始化儲存空間
 */
async function initializeStorage() {
  try {
    const result = await chrome.storage.local.get('prompts');
    if (!result.prompts) {
      await chrome.storage.local.set({ prompts: [] });
    }
  } catch (error) {
    // 初始化失敗，靜默處理
  }
}
