/**
 * Content Script - 注入到 ChatGPT 頁面
 * 負責在頁面中插入提示詞和顯示快速訪問按鈕
 */

// 全局變數
let promptsData = [];
let currentPrompt = null;
let promptPanel = null;
let promptBackdrop = null;
let currentLang = 'zh-TW';
let currentPlatform = null; // 'chatgpt' 或 'gemini'

// 平台配置
const PLATFORMS = {
  CHATGPT: 'chatgpt',
  GEMINI: 'gemini',
  CLAUDE: 'claude',
  GROK: 'grok'
};

// 平台特定的選擇器配置
const PLATFORM_SELECTORS = {
  [PLATFORMS.CHATGPT]: {
    textarea: [
      // 新版 ChatGPT：ProseMirror contenteditable div
      'div#prompt-textarea.ProseMirror[contenteditable="true"]',
      '#prompt-textarea[contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"]',
      // 舊版 ChatGPT：textarea
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    sendButton: [
      'button[data-testid="send-button"]',
      'button[data-testid="fruitjuice-send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="送出"]',
      'form[data-type="unified-composer"] button[type="button"]:last-of-type',
      'form button[type="submit"]'
    ],
    inputContainer: [
      // 新版 ChatGPT：輸入框外層容器
      'div.composer-parent',
      'form.w-full[type="button"]',
      '#composer-background',
      'div[id="composer-background"]'
    ]
  },
  [PLATFORMS.GEMINI]: {
    textarea: [
      'div.ql-editor[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][role="textbox"]',
      'div.ql-editor.textarea[contenteditable="true"]',
      'rich-textarea div[contenteditable="true"]'
    ],
    sendButton: [
      'button.send-button',
      'button[aria-label*="傳送"]',
      'button[aria-label*="Send"]',
      'button.submit'
    ]
  },
  [PLATFORMS.CLAUDE]: {
    textarea: [
      '.tiptap.ProseMirror[data-testid="chat-input"]',
      'div[contenteditable="true"][data-testid="chat-input"]',
      '[data-testid="chat-input"]',
      'div.ProseMirror[contenteditable="true"]'
    ],
    sendButton: [
      'button[aria-label="Send message"]',
      'button.Button_claude__c_hZy[aria-label="Send message"]',
      'button[data-testid="send-button"]',
      '.Button_claude__c_hZy'
    ],
    inputContainer: [
      // 新版 Claude：輸入框容器（不依賴 mx-2，因為桌面端是 mx-0）
      'div.flex.flex-col.bg-bg-000',
      '.top-5.z-10.mx-auto.w-full.max-w-2xl',
      '.chat-input-grid-container'
    ]
  },
  [PLATFORMS.GROK]: {
    textarea: [
      // Grok 使用 contenteditable div，不是 textarea
      'div[contenteditable="true"].tiptap.ProseMirror',
      '.tiptap.ProseMirror[contenteditable="true"]',
      'div.tiptap.ProseMirror',
      'div[contenteditable="true"].w-full.px-2'
    ],
    sendButton: [
      'button[type="submit"][aria-label="提交"]',
      'button[type="submit"][aria-label="Submit"]',
      'button[type="submit"]',
      'button[aria-label*="Submit"]'
    ],
    inputContainer: [
      'form.w-full.text-base',
      'div.w-full.mb-3',
      '.query-bar',
      '.flex.flex-col.gap-0.justify-center'
    ]
  }
};

/**
 * 檢測當前平台
 */
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
    return PLATFORMS.CHATGPT;
  } else if (hostname.includes('gemini.google.com')) {
    return PLATFORMS.GEMINI;
  } else if (hostname.includes('claude.ai')) {
    return PLATFORMS.CLAUDE;
  } else if (hostname.includes('grok.com')) {
    return PLATFORMS.GROK;
  }
  return null;
}

// 翻譯文本
const i18nMessages = {
  'zh-TW': {
    promptNotInserted: '找不到輸入框，請確認您在 AI 對話頁面',
    promptInserted: '提示詞已插入並送出',
    prompts: '提示詞',
    openPromptManager: '開啟提示詞管理器',
    promptManager: '提示詞管理器',
    add: '新增',
    close: '關閉',
    searchPrompts: '搜尋提示詞 (可使用 / 開頭)...',
    noPrompts: '沒有提示詞，點擊「新增」按鈕建立第一個提示詞',
    edit: '編輯',
    back: '← 返回',
    insertPrompt: '插入提示詞',
    enterValue: '請輸入 {variable}',
    fillAllVariables: '請填寫所有變數',
    completeCurrentOperation: '請先完成當前的操作',
    completeOrCancelEdit: '請先完成或取消當前的編輯',
    addPrompt: '新增提示詞',
    editPrompt: '編輯提示詞',
    promptName: '提示詞名稱',
    promptNamePlaceholder: '輸入提示詞名稱',
    category: '分類',
    categoryPlaceholder: '輸入分類（選填）',
    promptContent: '提示詞內容',
    promptContentPlaceholder: '輸入提示詞內容，使用 [變數名] 來標記變數',
    variableTips: '<strong>提示：</strong>使用 [變數名] 來標記變數，例如：[主題]、[關鍵字] 等',
    save: '保存',
    delete: '刪除',
    fillRequired: '請填寫提示詞名稱和內容',
    promptUpdated: '提示詞已更新',
    promptAdded: '提示詞已新增',
    saveFailed: '保存失敗',
    confirmDelete: '確定要刪除這個提示詞嗎？',
    promptDeleted: '提示詞已刪除',
    deleteFailed: '刪除失敗',
    pin: '置頂',
    unpin: '取消置頂',
    pinned: '已置頂',
    unpinned: '已取消置頂',
    pinFailed: '置頂失敗',
    required: '*',
    extensionReloaded: 'Extension reloaded, please refresh the page (F5) to use the latest version',
    platformNotSupported: 'Unsupported AI platform',
    promoTitle: '🎁 免費領取 100+ AI 提示詞模板',
    promoDesc: '加入 AI投資學院+ 社群，獲取專業提示詞庫',
    promoButton: '立即領取',
    promoDismiss: '不再提醒',
    promoLater: '下次再說'
  },
  'en': {
    promptNotInserted: 'Input box not found, please ensure you are on an AI conversation page',
    promptInserted: 'Prompt inserted and sent',
    prompts: 'Prompts',
    openPromptManager: 'Open Prompt Manager',
    promptManager: 'Prompt Manager',
    add: 'Add',
    close: 'Close',
    searchPrompts: 'Search prompts (use / prefix)...',
    noPrompts: 'No prompts yet, click "Add" to create your first prompt',
    edit: 'Edit',
    back: '← Back',
    insertPrompt: 'Insert Prompt',
    enterValue: 'Enter {variable}',
    fillAllVariables: 'Please fill all variables',
    completeCurrentOperation: 'Please complete current operation',
    completeOrCancelEdit: 'Please complete or cancel current edit',
    addPrompt: 'Add Prompt',
    editPrompt: 'Edit Prompt',
    promptName: 'Prompt Name',
    promptNamePlaceholder: 'Enter prompt name',
    category: 'Category',
    categoryPlaceholder: 'Enter category (optional)',
    promptContent: 'Prompt Content',
    promptContentPlaceholder: 'Enter prompt content, use [variable_name] to mark variables',
    variableTips: '<strong>Tip:</strong> Use [variable_name] to mark variables, e.g., [topic], [keyword]',
    save: 'Save',
    delete: 'Delete',
    fillRequired: 'Please fill prompt name and content',
    promptUpdated: 'Prompt updated',
    promptAdded: 'Prompt added',
    saveFailed: 'Save failed',
    confirmDelete: 'Are you sure you want to delete this prompt?',
    promptDeleted: 'Prompt deleted',
    deleteFailed: 'Delete failed',
    pin: 'Pin',
    unpin: 'Unpin',
    pinned: 'Pinned',
    unpinned: 'Unpinned',
    pinFailed: 'Pin failed',
    required: '*',
    extensionReloaded: 'Extension reloaded, please refresh the page (F5) to use the latest version',
    promoTitle: '🎁 Get 100+ Free AI Prompt Templates',
    promoDesc: 'Join AI Investment Academy+ for professional prompts',
    promoButton: 'Get Now',
    promoDismiss: "Don't show again",
    promoLater: 'Maybe later'
  }
};

// 獲取翻譯文本
function t(key, params = {}) {
  let text = i18nMessages[currentLang]?.[key] || i18nMessages['zh-TW'][key] || key;
  for (const [param, value] of Object.entries(params)) {
    text = text.replace(`{${param}}`, value);
  }
  return text;
}

/**
 * 檢查擴充功能 context 是否有效
 */
function isExtensionContextValid() {
  try {
    // 嘗試訪問 chrome.runtime.id，如果 context 失效會拋出錯誤
    return chrome.runtime?.id !== undefined;
  } catch (error) {
    return false;
  }
}

// 初始化語言設定
async function initLanguage() {
  try {
    const result = await chrome.storage.local.get('language');
    if (result.language) {
      currentLang = result.language;
    }
  } catch (error) {
  }
}

/**
 * 監聽來自 popup 的訊息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'insertPrompt') {
    insertPromptToTextarea(request.content);
    sendResponse({ success: true });
  }
  return true;
});

/**
 * 插入提示詞到輸入框（支援多平台）
 */
function insertPromptToTextarea(content) {
  // 獲取當前平台的選擇器
  const platform = currentPlatform || detectPlatform();
  const selectors = platform ? PLATFORM_SELECTORS[platform].textarea : [];

  let textarea = null;

  // 嘗試找到輸入框
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      if (isVisible || element.offsetParent !== null || element === document.activeElement) {
        textarea = element;
        break;
      }
    }
  }

  if (!textarea) {
    showNotification(t('promptNotInserted'), 'error');
    return;
  }

  // 如果是 contenteditable div
  if (textarea.getAttribute('contenteditable') === 'true') {
    textarea.focus();

    // 先清空現有內容，再插入新內容
    // 對 ProseMirror 編輯器，使用 execCommand 或 InputEvent 確保框架偵測到變化
    const selection = window.getSelection();

    // 嘗試方法1：使用 execCommand insertText（最佳相容性）
    let inserted = false;
    try {
      // 先選取所有內容（如需清空）
      const range = document.createRange();
      range.selectNodeContents(textarea);
      selection.removeAllRanges();
      selection.addRange(range);

      // 用 insertText 替換選取內容
      inserted = document.execCommand('insertText', false, content);
    } catch (e) {
    }

    // 方法2：使用 InputEvent（適用於新版瀏覽器）
    if (!inserted) {
      try {
        // 選取所有內容
        const range = document.createRange();
        range.selectNodeContents(textarea);
        selection.removeAllRanges();
        selection.addRange(range);

        const inputEvent = new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: content,
          bubbles: true,
          cancelable: true
        });
        textarea.dispatchEvent(inputEvent);

        // 如果 beforeinput 沒被阻止，手動設定內容
        if (!inputEvent.defaultPrevented) {
          textarea.textContent = content;
        }

        textarea.dispatchEvent(new InputEvent('input', {
          inputType: 'insertText',
          data: content,
          bubbles: true
        }));
        inserted = true;
      } catch (e) {
      }
    }

    // 方法3：直接設定內容（最後備用）
    if (!inserted) {
      // 清空後插入段落（ProseMirror 格式）
      const p = document.createElement('p');
      p.textContent = content;
      textarea.innerHTML = '';
      textarea.appendChild(p);

      textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }

    // 確保游標在末尾
    const newRange = document.createRange();
    newRange.selectNodeContents(textarea);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
  } else {
    // 如果是 textarea
    // 獲取當前值和光標位置
    const currentValue = textarea.value;
    const start = textarea.selectionStart || 0;

    // 插入內容
    const newValue = currentValue.substring(0, start) + content + currentValue.substring(start);

    // 設置值
    setNativeValue(textarea, newValue);

    // 觸發輸入事件以確保 React 偵測到變化
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    // 設置光標位置到插入內容的末尾
    const newPosition = start + content.length;
    textarea.setSelectionRange(newPosition, newPosition);

    // 聚焦到輸入框
    textarea.focus();
  }

  // 等待一下確保內容已經插入，然後點擊送出按鈕
  setTimeout(() => {
    clickSendButton();
  }, 100);

  // 顯示成功通知
  showNotification(t('promptInserted'), 'success');
}

/**
 * 點擊送出按鈕（支援多平台）
 */
function clickSendButton() {
  // 獲取當前平台的選擇器
  const platform = currentPlatform || detectPlatform();
  const buttonSelectors = platform ? PLATFORM_SELECTORS[platform].sendButton : [];

  for (const selector of buttonSelectors) {
    const button = document.querySelector(selector);
    if (button && !button.disabled && button.getAttribute('aria-disabled') !== 'true') {
      // 確保按鈕可見且可點擊
      const rect = button.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        button.click();
        return true;
      }
    }
  }

  // 如果找不到按鈕，嘗試使用 Enter 鍵
  // 支援所有平台的輸入框選擇器
  const inputElement = document.querySelector('textarea[data-id="root"]') ||
                       document.querySelector('.tiptap.ProseMirror[contenteditable="true"]') ||  // Grok & Claude
                       document.querySelector('div[contenteditable="true"].tiptap') ||
                       document.querySelector('div.ql-editor[contenteditable="true"]') ||  // Gemini
                       document.querySelector('textarea');
  if (inputElement) {
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    inputElement.dispatchEvent(enterEvent);
    return true;
  }

  return false;
}

/**
 * 設置原生值（用於 React 控制的輸入框）
 */
function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set ||
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;

  if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
}

/**
 * 顯示通知
 */
function showNotification(message, type = 'success') {
  // 移除現有通知
  const existing = document.getElementById('prompt-manager-notification');
  if (existing) existing.remove();

  // 建立通知元素
  const notification = document.createElement('div');
  notification.id = 'prompt-manager-notification';
  notification.className = `prompt-notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // 3 秒後自動移除
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * 檢查是否應該顯示推廣橫幅
 * 規則：首次安裝顯示，之後每週顯示一次，除非用戶選擇「不再提醒」
 */
async function shouldShowPromoBanner() {
  try {
    const result = await chrome.storage.local.get(['promoDismissed', 'promoLastShown', 'promoFirstInstall']);

    // 如果用戶已選擇「不再提醒」，則不顯示
    if (result.promoDismissed) {
      return false;
    }

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 天

    // 首次安裝（沒有 promoFirstInstall 記錄）
    if (!result.promoFirstInstall) {
      await chrome.storage.local.set({ promoFirstInstall: now, promoLastShown: now });
      return true;
    }

    // 檢查是否超過一週
    const lastShown = result.promoLastShown || 0;
    if (now - lastShown >= oneWeek) {
      await chrome.storage.local.set({ promoLastShown: now });
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 處理「不再提醒」按鈕點擊
 */
async function dismissPromoBanner() {
  try {
    await chrome.storage.local.set({ promoDismissed: true });
    const banner = document.getElementById('promo-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  } catch (error) {
  }
}

/**
 * 處理「下次再說」按鈕點擊
 */
function hidePromoBanner() {
  const banner = document.getElementById('promo-banner');
  if (banner) {
    banner.style.display = 'none';
  }
}

/**
 * 渲染推廣橫幅 HTML
 */
function renderPromoBanner() {
  return `
    <div id="promo-banner" class="promo-banner">
      <div class="promo-content">
        <div class="promo-text">
          <div class="promo-title">${t('promoTitle')}</div>
          <div class="promo-desc">${t('promoDesc')}</div>
        </div>
        <div class="promo-actions">
          <a href="https://link.brain168.com/ai-invest" target="_blank" class="promo-btn promo-btn-primary">${t('promoButton')}</a>
          <button class="promo-btn promo-btn-secondary promo-later-btn">${t('promoLater')}</button>
          <button class="promo-btn promo-btn-dismiss promo-dismiss-btn">${t('promoDismiss')}</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 綁定推廣橫幅事件
 */
function bindPromoBannerEvents() {
  const dismissBtn = document.querySelector('.promo-dismiss-btn');
  const laterBtn = document.querySelector('.promo-later-btn');

  if (dismissBtn) {
    dismissBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissPromoBanner();
    });
  }

  if (laterBtn) {
    laterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hidePromoBanner();
    });
  }
}

/**
 * 從提示詞內容中提取變數
 */
function extractVariables(content) {
  const regex = /\[([^\]]+)\]/g;
  const variables = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
}

/**
 * 替換提示詞中的變數
 */
function replaceVariables(content, values) {
  let result = content;

  for (const [variable, value] of Object.entries(values)) {
    const regex = new RegExp(`\\[${variable}\\]`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * 為按鈕設定固定定位樣式（備用方案）
 */
function applyFixedPositionStyle(button) {
  button.classList.add('fixed-position');
  button.style.position = 'fixed';
  button.style.bottom = '90px';
  button.style.right = '30px';
  button.style.top = 'auto';
  button.style.zIndex = '9999';
}

/**
 * 為按鈕設定居中樣式
 */
function applyCenteredButtonStyle(button, options = {}) {
  const { marginBottom = '12px', width = '100%', maxWidth = 'none' } = options;
  button.style.marginBottom = marginBottom;
  button.style.marginTop = '0';
  button.style.marginLeft = 'auto';
  button.style.marginRight = 'auto';
  button.style.display = 'inline-flex';
  button.style.position = 'relative';
  button.style.width = width;
  button.style.maxWidth = maxWidth;
  button.style.justifyContent = 'center';
  button.style.boxSizing = 'border-box';
}

/**
 * 嘗試在 Claude 平台插入按鈕
 */
function insertButtonForClaude(button) {
  // 方法1：通過 data-testid="chat-input" 找到輸入框，然後向上找到主容器
  const chatInput = document.querySelector('[data-testid="chat-input"]');
  if (chatInput) {
    const container = chatInput.closest('div.flex.flex-col.bg-bg-000');
    if (container && container.parentElement) {
      const computedStyle = window.getComputedStyle(container);
      applyCenteredButtonStyle(button);
      button.style.width = computedStyle.width;
      button.style.marginLeft = computedStyle.marginLeft;
      button.style.marginRight = computedStyle.marginRight;
      container.parentElement.insertBefore(button, container);
      return true;
    }
  }

  // 方法2：直接找輸入框容器
  const inputArea = document.querySelector('div.flex.flex-col.bg-bg-000');
  if (inputArea && inputArea.parentElement) {
    const computedStyle = window.getComputedStyle(inputArea);
    applyCenteredButtonStyle(button);
    button.style.width = computedStyle.width;
    button.style.marginLeft = computedStyle.marginLeft;
    button.style.marginRight = computedStyle.marginRight;
    inputArea.parentElement.insertBefore(button, inputArea);
    return true;
  }

  // 方法3：舊版選擇器（向後兼容）
  const claudeTopContainer = document.querySelector('.top-5.z-10.mx-auto.w-full.max-w-2xl');
  if (claudeTopContainer && claudeTopContainer.firstElementChild) {
    applyCenteredButtonStyle(button);
    claudeTopContainer.insertBefore(button, claudeTopContainer.firstElementChild);
    return true;
  }

  return false;
}

/**
 * 嘗試在 ChatGPT 平台插入按鈕
 */
function insertButtonForChatGPT(button) {
  // 方法1：找到 unified-composer form，在 form 內部頂端插入
  const composerForm = document.querySelector('form[data-type="unified-composer"]');
  if (composerForm) {
    applyCenteredButtonStyle(button, { marginBottom: '4px' });
    composerForm.insertBefore(button, composerForm.firstElementChild);
    return true;
  }

  // 方法2：通過 #prompt-textarea 向上找到 form
  const promptTextarea = document.querySelector('#prompt-textarea');
  if (promptTextarea) {
    const form = promptTextarea.closest('form');
    if (form) {
      applyCenteredButtonStyle(button, { marginBottom: '4px' });
      form.insertBefore(button, form.firstElementChild);
      return true;
    }
    // 向上找到合適的容器
    const parent = promptTextarea.parentElement;
    if (parent && parent.parentElement) {
      applyCenteredButtonStyle(button, { marginBottom: '4px' });
      parent.parentElement.insertBefore(button, parent);
      return true;
    }
  }

  return false;
}

/**
 * 嘗試在 Grok 平台插入按鈕
 */
function insertButtonForGrok(button) {
  // 方法1：找到 query-bar 容器
  const queryBar = document.querySelector('.query-bar');
  if (queryBar && queryBar.firstElementChild) {
    applyCenteredButtonStyle(button, { marginBottom: '4px', maxWidth: 'breakout' });
    queryBar.insertBefore(button, queryBar.firstElementChild);
    return true;
  }

  // 方法2：找到外層容器
  const grokInputContainer = document.querySelector('.flex.flex-col.gap-0.justify-center.w-full.relative.items-center');
  if (grokInputContainer) {
    const innerQueryBar = grokInputContainer.querySelector('.query-bar');
    if (innerQueryBar) {
      applyCenteredButtonStyle(button, { marginBottom: '4px', maxWidth: 'breakout' });
      grokInputContainer.insertBefore(button, innerQueryBar);
      return true;
    }
  }

  return false;
}

/**
 * 建立快速訪問按鈕
 */
function createQuickAccessButton() {
  if (document.getElementById('prompt-manager-quick-btn')) return;

  const button = document.createElement('button');
  button.id = 'prompt-manager-quick-btn';
  button.className = 'prompt-quick-btn';
  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span>${t('prompts')}</span>
  `;
  button.title = t('openPromptManager');
  button.addEventListener('click', togglePromptPanel);

  const platform = currentPlatform || detectPlatform();
  const inputContainer = findInputContainer();

  // ChatGPT 平台特殊處理
  if (platform === PLATFORMS.CHATGPT) {
    if (insertButtonForChatGPT(button)) return;
    applyFixedPositionStyle(button);
    document.body.appendChild(button);
    return;
  }

  // Claude 平台特殊處理
  if (platform === PLATFORMS.CLAUDE) {
    if (insertButtonForClaude(button)) return;
    applyFixedPositionStyle(button);
    document.body.appendChild(button);
    return;
  }

  // Grok 平台特殊處理
  if (platform === PLATFORMS.GROK) {
    if (insertButtonForGrok(button)) return;
    applyFixedPositionStyle(button);
    document.body.appendChild(button);
    return;
  }

  // Gemini 和 ChatGPT 通用處理
  if (inputContainer && inputContainer.parentElement) {

    let targetParent = inputContainer.parentElement;
    let referenceNode = inputContainer;

    // Gemini 平台：向上找一層
    if (platform === PLATFORMS.GEMINI && targetParent.parentElement) {
      referenceNode = targetParent;
      targetParent = targetParent.parentElement;
    }

    targetParent.insertBefore(button, referenceNode);
  } else {
    button.classList.add('fixed-position');
    document.body.appendChild(button);
  }
}

/**
 * 切換提示詞面板顯示
 */
async function togglePromptPanel() {
  if (promptPanel && promptPanel.parentElement) {
    promptPanel.remove();
    promptPanel = null;
  } else {
    await createPromptPanel();
  }
}

/**
 * 創建提示詞面板
 */
async function createPromptPanel() {
  // 從 storage 載入提示詞
  try {
    const result = await chrome.storage.local.get('prompts');
    promptsData = result.prompts || [];
  } catch (error) {
    // Extension context invalidated - 擴充功能已重新載入
    if (error.message.includes('Extension context invalidated')) {
      showNotification(t('extensionReloaded'), 'warning');
      return;
    }
    promptsData = [];
  }

  // 建立面板容器
  promptPanel = document.createElement('div');
  promptPanel.id = 'prompt-manager-panel';
  promptPanel.className = 'prompt-panel';

  // 檢查是否需要顯示推廣橫幅
  const showPromo = await shouldShowPromoBanner();

  promptPanel.innerHTML = `
    <div class="prompt-panel-header">
      <h3>${t('promptManager')}</h3>
      <div class="prompt-panel-header-actions">
        <button class="prompt-panel-add" title="${t('addPrompt')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ${t('add')}
        </button>
        <button class="prompt-panel-close" title="${t('close')}">✕</button>
      </div>
    </div>
    ${showPromo ? renderPromoBanner() : ''}
    <div class="prompt-panel-search">
      <input type="text" id="prompt-search" placeholder="${t('searchPrompts')}" />
    </div>
    <div class="prompt-panel-list" id="prompt-panel-list">
      ${renderPromptList(promptsData)}
    </div>
  `;

  // 找到按鈕，插入到按鈕下方（輸入框上方）
  const button = document.getElementById('prompt-manager-quick-btn');
  if (button && button.parentElement) {
    // 插入到按鈕的下一個兄弟節點之前
    button.parentElement.insertBefore(promptPanel, button.nextSibling);
  } else {
    // 備用方案：插入到 body
    document.body.appendChild(promptPanel);
  }

  // 綁定事件
  promptPanel.querySelector('.prompt-panel-close').addEventListener('click', () => {
    togglePromptPanel();
  });

  promptPanel.querySelector('.prompt-panel-add').addEventListener('click', () => {
    showAddPromptPanel();
  });

  const searchInput = promptPanel.querySelector('#prompt-search');

  searchInput.addEventListener('input', (e) => {
    let query = e.target.value;

    // 如果以 / 開頭，移除 / 並進行搜尋
    if (query.startsWith('/')) {
      query = query.substring(1);
    }

    const queryLower = query.toLowerCase();
    const filtered = promptsData.filter(p =>
      p.name.toLowerCase().includes(queryLower) ||
      p.content.toLowerCase().includes(queryLower) ||
      (p.category && p.category.toLowerCase().includes(queryLower))
    );
    document.getElementById('prompt-panel-list').innerHTML = renderPromptList(filtered);
    bindPromptItemEvents();
  });

  // 按下 Enter 鍵時，如果只有一個結果，直接使用該提示詞
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      let query = searchInput.value;

      if (query.startsWith('/')) {
        query = query.substring(1);
      }

      const queryLower = query.toLowerCase();
      const filtered = promptsData.filter(p =>
        p.name.toLowerCase().includes(queryLower) ||
        p.content.toLowerCase().includes(queryLower) ||
        (p.category && p.category.toLowerCase().includes(queryLower))
      );

      if (filtered.length === 1) {
        usePrompt(filtered[0]);
      }
    }
  });

  bindPromptItemEvents();

  // 綁定推廣橫幅事件
  if (showPromo) {
    bindPromoBannerEvents();
  }
}

/**
 * 嘗試從選擇器列表中找到第一個匹配的元素
 */
function findFirstMatch(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

/**
 * 找到輸入框容器（支援多平台）
 */
function findInputContainer() {
  const platform = currentPlatform || detectPlatform();

  // Claude 特殊處理
  if (platform === PLATFORMS.CLAUDE) {
    const containerSelectors = PLATFORM_SELECTORS[platform].inputContainer || [];
    const container = findFirstMatch(containerSelectors);
    if (container) return container;

    const claudeTopContainer = document.querySelector('.top-5.z-10.mx-auto.w-full.max-w-2xl');
    if (claudeTopContainer) {
      return claudeTopContainer;
    }

    const proseMirror = document.querySelector('.tiptap.ProseMirror[data-testid="chat-input"]');
    if (proseMirror) {
      let parent = proseMirror.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        parent = parent.parentElement;
      }
      if (parent) {
        return parent;
      }
    }
  }

  // Grok 特殊處理
  if (platform === PLATFORMS.GROK) {
    const containerSelectors = PLATFORM_SELECTORS[platform].inputContainer || [];
    const container = findFirstMatch(containerSelectors);
    if (container) return container;

    const grokForm = document.querySelector('form.w-full.text-base.flex.flex-col.gap-2.items-center.justify-center.relative.z-10.mt-2');
    if (grokForm) {
      return grokForm;
    }

    const grokEditor = document.querySelector('div[contenteditable="true"].tiptap.ProseMirror');
    if (grokEditor && grokEditor.parentElement) {
      return grokEditor.parentElement.parentElement;
    }
  }

  // Gemini 特殊處理
  if (platform === PLATFORMS.GEMINI) {
    const geminiSelectors = [
      'div[data-node-type="input-area"]',
      'div.input-area',
      'div.text-input-field'
    ];
    const container = findFirstMatch(geminiSelectors);
    if (container) return container;
  }

  // ChatGPT 特殊處理
  if (platform === PLATFORMS.CHATGPT) {
    const containerSelectors = PLATFORM_SELECTORS[platform].inputContainer || [];
    const container = findFirstMatch(containerSelectors);
    if (container) return container;

    // 通過 ProseMirror 編輯器向上找容器
    const promptTextarea = document.querySelector('#prompt-textarea') ||
      document.querySelector('div.ProseMirror[contenteditable="true"]');
    if (promptTextarea) {
      const form = promptTextarea.closest('form');
      if (form) {
        return form;
      }
      // 向上找幾層到合適的容器
      let parent = promptTextarea.parentElement;
      for (let i = 0; i < 4 && parent; i++) {
        if (parent.id || parent.classList.length > 1) {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
  }

  // 通用方法：找 textarea 然後找容器
  const selectors = platform ? PLATFORM_SELECTORS[platform].textarea : [];
  for (const selector of selectors) {
    const textarea = document.querySelector(selector);
    if (textarea) {
      const container = textarea.closest('form') || textarea.parentElement;
      return container;
    }
  }

  return null;
}

/**
 * 渲染提示詞列表
 */
function renderPromptList(prompts) {
  if (prompts.length === 0) {
    return `<div class="prompt-panel-empty">${t('noPrompts')}</div>`;
  }

  // 排序：置頂的在前，然後按使用次數排序
  const sortedPrompts = [...prompts].sort((a, b) => {
    // 先按置頂狀態排序
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // 如果都置頂或都不置頂，按使用次數排序
    return (b.usageCount || 0) - (a.usageCount || 0);
  });

  return sortedPrompts.map(prompt => {
    const variables = extractVariables(prompt.content);
    const isPinned = prompt.pinned || false;
    return `
      <div class="prompt-item ${isPinned ? 'pinned' : ''}" data-id="${prompt.id}">
        <div class="prompt-item-header">
          <div class="prompt-item-title">
            ${isPinned ? '<span class="pin-indicator">📌</span>' : ''}
            ${escapeHtml(prompt.name)}
          </div>
          <div class="prompt-item-actions">
            ${prompt.category ? `<span class="prompt-item-category">${escapeHtml(prompt.category)}</span>` : ''}
            <button class="prompt-item-pin" data-id="${prompt.id}" title="${isPinned ? t('unpin') : t('pin')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
            <button class="prompt-item-edit" data-id="${prompt.id}" title="${t('edit')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="prompt-item-delete" data-id="${prompt.id}" title="${t('delete')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="prompt-item-content">${escapeHtml(prompt.content.substring(0, 100))}${prompt.content.length > 100 ? '...' : ''}</div>
        ${variables.length > 0 ? `
          <div class="prompt-item-variables">
            ${variables.map(v => `<span class="variable-tag">[${escapeHtml(v)}]</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * 綁定提示詞項目事件
 */
function bindPromptItemEvents() {
  const items = document.querySelectorAll('.prompt-item');
  items.forEach(item => {
    // 點擊項目使用提示詞
    item.addEventListener('click', (e) => {
      // 如果點擊的是按鈕，不執行使用提示詞
      if (e.target.closest('.prompt-item-edit') ||
          e.target.closest('.prompt-item-delete') ||
          e.target.closest('.prompt-item-pin')) {
        return;
      }
      const id = item.dataset.id;
      const prompt = promptsData.find(p => p.id === id);
      if (prompt) {
        usePrompt(prompt);
      }
    });

    // 置頂按鈕事件
    const pinBtn = item.querySelector('.prompt-item-pin');
    if (pinBtn) {
      pinBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = pinBtn.dataset.id;
        await togglePinPrompt(id);
      });
    }

    // 編輯按鈕事件
    const editBtn = item.querySelector('.prompt-item-edit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = editBtn.dataset.id;
        const prompt = promptsData.find(p => p.id === id);
        if (prompt) {
          showAddPromptPanel(prompt);
        }
      });
    }

    // 刪除按鈕事件
    const deleteBtn = item.querySelector('.prompt-item-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = deleteBtn.dataset.id;
        await deletePrompt(id);
      });
    }
  });
}

/**
 * 切換提示詞置頂狀態
 */
async function togglePinPrompt(id) {
  try {
    const result = await chrome.storage.local.get('prompts');
    const prompts = result.prompts || [];
    const prompt = prompts.find(p => p.id === id);

    if (prompt) {
      prompt.pinned = !prompt.pinned;
      await chrome.storage.local.set({ prompts });
      promptsData = prompts;

      // 重新渲染列表
      document.getElementById('prompt-panel-list').innerHTML = renderPromptList(promptsData);
      bindPromptItemEvents();

      showNotification(prompt.pinned ? t('pinned') : t('unpinned'), 'success');
    }
  } catch (error) {
    showNotification(t('pinFailed'), 'error');
  }
}

/**
 * 刪除提示詞
 */
async function deletePrompt(id) {
  if (!confirm(t('confirmDelete'))) {
    return;
  }

  try {
    const result = await chrome.storage.local.get('prompts');
    const prompts = result.prompts || [];
    const filtered = prompts.filter(p => p.id !== id);
    await chrome.storage.local.set({ prompts: filtered });
    promptsData = filtered;

    // 重新渲染列表
    document.getElementById('prompt-panel-list').innerHTML = renderPromptList(promptsData);
    bindPromptItemEvents();

    showNotification(t('promptDeleted'), 'success');
  } catch (error) {
    showNotification(t('deleteFailed'), 'error');
  }
}

/**
 * 使用提示詞
 */
function usePrompt(prompt) {
  const variables = extractVariables(prompt.content);

  if (variables.length === 0) {
    // 沒有變數，直接插入
    insertPromptToTextarea(prompt.content);
    incrementUsageCount(prompt.id);
    togglePromptPanel();
  } else {
    // 有變數，顯示輸入界面
    currentPrompt = prompt;
    showVariableInputPanel(prompt, variables);
  }
}

/**
 * 顯示變數輸入面板
 */
function showVariableInputPanel(prompt, variables) {
  // 檢查是否已經有變數面板或新增面板存在
  const existingVariablePanel = promptPanel.querySelector('.prompt-variable-panel');
  const existingAddPanel = promptPanel.querySelector('.prompt-add-panel');
  if (existingVariablePanel || existingAddPanel) {
    showNotification(t('completeCurrentOperation'), 'error');
    return;
  }

  // 隱藏提示詞列表
  const list = document.getElementById('prompt-panel-list');

  const variablePanel = document.createElement('div');
  variablePanel.className = 'prompt-variable-panel';
  variablePanel.innerHTML = `
    <div class="prompt-variable-header">
      <button class="prompt-back-btn">${t('back')}</button>
      <h4>${escapeHtml(prompt.name)}</h4>
    </div>
    <div class="prompt-variable-inputs">
      ${variables.map(v => `
        <div class="prompt-variable-group">
          <label>${escapeHtml(v)}</label>
          <input type="text" class="prompt-variable-input" data-variable="${escapeHtml(v)}" placeholder="${t('enterValue', { variable: escapeHtml(v) })}" />
        </div>
      `).join('')}
    </div>
    <div class="prompt-variable-actions">
      <button class="prompt-insert-btn">${t('insertPrompt')}</button>
    </div>
  `;

  list.style.display = 'none';
  promptPanel.querySelector('.prompt-panel-search').style.display = 'none';
  promptPanel.appendChild(variablePanel);

  // 綁定返回按鈕
  variablePanel.querySelector('.prompt-back-btn').addEventListener('click', () => {
    variablePanel.remove();
    list.style.display = 'block';
    promptPanel.querySelector('.prompt-panel-search').style.display = 'block';
  });

  // 綁定插入按鈕
  variablePanel.querySelector('.prompt-insert-btn').addEventListener('click', () => {
    insertVariablePrompt();
  });

  // 功能1：為所有變數輸入框添加事件監聽
  const inputs = variablePanel.querySelectorAll('.prompt-variable-input');
  inputs.forEach(input => {
    // Enter 鍵送出
    input.addEventListener('keydown', (e) => {
      // 阻止事件冒泡，防止 Grok 等平台捕獲鍵盤事件
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        insertVariablePrompt();
      }
    });

    // 阻止 input 事件冒泡，防止 Grok 等平台搶奪焦點
    input.addEventListener('input', (e) => {
      e.stopPropagation();
    });

    // 阻止 focus/blur 事件冒泡
    input.addEventListener('focus', (e) => {
      e.stopPropagation();
    });

    input.addEventListener('blur', (e) => {
      e.stopPropagation();
    });

    // 阻止其他可能被捕獲的事件
    input.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    input.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });
  });

  // 聚焦第一個輸入框
  const firstInput = variablePanel.querySelector('.prompt-variable-input');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
}

/**
 * 插入變數提示詞（供 Enter 鍵和按鈕使用）
 */
function insertVariablePrompt() {
  const variablePanel = document.querySelector('.prompt-variable-panel');
  if (!variablePanel) return;

  const inputs = variablePanel.querySelectorAll('.prompt-variable-input');
  const values = {};
  let hasError = false;

  inputs.forEach(input => {
    const variable = input.dataset.variable;
    const value = input.value.trim();
    if (!value) {
      input.style.borderColor = '#ef4444';
      hasError = true;
    } else {
      input.style.borderColor = '';
      values[variable] = value;
    }
  });

  if (hasError) {
    showNotification(t('fillAllVariables'), 'error');
    return;
  }

  const finalContent = replaceVariables(currentPrompt.content, values);
  insertPromptToTextarea(finalContent);
  incrementUsageCount(currentPrompt.id);
  togglePromptPanel();
}

/**
 * 增加使用次數
 */
async function incrementUsageCount(id) {
  try {
    const result = await chrome.storage.local.get('prompts');
    const prompts = result.prompts || [];
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      prompt.usageCount = (prompt.usageCount || 0) + 1;
      prompt.lastUsedAt = new Date().toISOString();
      await chrome.storage.local.set({ prompts });
    }
  } catch (error) {
    // 靜默處理 extension context invalidated 錯誤
    if (!error.message.includes('Extension context invalidated')) {
    }
  }
}

/**
 * 顯示新增提示詞面板
 */
function showAddPromptPanel(editPrompt = null) {
  // 檢查是否已經有新增面板存在
  const existingAddPanel = promptPanel.querySelector('.prompt-add-panel');
  if (existingAddPanel) {
    showNotification(t('completeOrCancelEdit'), 'error');
    return;
  }

  const list = document.getElementById('prompt-panel-list');
  const searchBox = promptPanel.querySelector('.prompt-panel-search');

  const addPanel = document.createElement('div');
  addPanel.className = 'prompt-add-panel';
  addPanel.innerHTML = `
    <div class="prompt-add-header">
      <button class="prompt-back-btn">${t('back')}</button>
      <h4>${editPrompt ? t('editPrompt') : t('addPrompt')}</h4>
    </div>
    <div class="prompt-add-form">
      <div class="prompt-form-group">
        <label>${t('promptName')} ${t('required')}</label>
        <input type="text" id="add-prompt-name" class="prompt-form-input" placeholder="${t('promptNamePlaceholder')}" value="${editPrompt ? escapeHtml(editPrompt.name) : ''}" />
      </div>
      <div class="prompt-form-group">
        <label>${t('category')}</label>
        <input type="text" id="add-prompt-category" class="prompt-form-input" placeholder="${t('categoryPlaceholder')}" value="${editPrompt ? (editPrompt.category || '') : ''}" />
      </div>
      <div class="prompt-form-group">
        <label>${t('promptContent')} ${t('required')}</label>
        <textarea id="add-prompt-content" class="prompt-form-textarea" placeholder="${t('promptContentPlaceholder')}">${editPrompt ? escapeHtml(editPrompt.content) : ''}</textarea>
      </div>
      <div class="prompt-form-tips">
        ${t('variableTips')}
      </div>
      <div class="prompt-form-actions">
        <button class="prompt-save-btn">${editPrompt ? t('save') : t('add')}</button>
        ${editPrompt ? `<button class="prompt-delete-btn">${t('delete')}</button>` : ''}
      </div>
    </div>
  `;

  list.style.display = 'none';
  searchBox.style.display = 'none';
  promptPanel.appendChild(addPanel);

  // 綁定返回按鈕
  addPanel.querySelector('.prompt-back-btn').addEventListener('click', () => {
    addPanel.remove();
    list.style.display = 'block';
    searchBox.style.display = 'block';
  });

  // 綁定保存按鈕
  addPanel.querySelector('.prompt-save-btn').addEventListener('click', async () => {
    const name = document.getElementById('add-prompt-name').value.trim();
    const category = document.getElementById('add-prompt-category').value.trim();
    const content = document.getElementById('add-prompt-content').value.trim();

    if (!name || !content) {
      showNotification(t('fillRequired'), 'error');
      return;
    }

    const prompt = {
      id: editPrompt ? editPrompt.id : generateId(),
      name,
      category,
      content,
      createdAt: editPrompt ? editPrompt.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: editPrompt ? editPrompt.usageCount : 0
    };

    try {
      const result = await chrome.storage.local.get('prompts');
      let prompts = result.prompts || [];

      if (editPrompt) {
        // 更新現有提示詞
        const index = prompts.findIndex(p => p.id === editPrompt.id);
        if (index !== -1) {
          prompts[index] = prompt;
        }
      } else {
        // 新增提示詞
        prompts.push(prompt);
      }

      await chrome.storage.local.set({ prompts });
      promptsData = prompts;

      showNotification(editPrompt ? t('promptUpdated') : t('promptAdded'), 'success');

      // 返回列表
      addPanel.remove();
      list.style.display = 'block';
      searchBox.style.display = 'block';
      document.getElementById('prompt-panel-list').innerHTML = renderPromptList(promptsData);
      bindPromptItemEvents();
    } catch (error) {
      showNotification(t('saveFailed'), 'error');
    }
  });

  // 綁定刪除按鈕
  if (editPrompt) {
    addPanel.querySelector('.prompt-delete-btn').addEventListener('click', async () => {
      if (!confirm(t('confirmDelete'))) {
        return;
      }

      try {
        const result = await chrome.storage.local.get('prompts');
        const prompts = result.prompts || [];
        const filtered = prompts.filter(p => p.id !== editPrompt.id);
        await chrome.storage.local.set({ prompts: filtered });
        promptsData = filtered;

        showNotification(t('promptDeleted'), 'success');

        // 返回列表
        addPanel.remove();
        list.style.display = 'block';
        searchBox.style.display = 'block';
        document.getElementById('prompt-panel-list').innerHTML = renderPromptList(promptsData);
        bindPromptItemEvents();
      } catch (error) {
        showNotification(t('deleteFailed'), 'error');
      }
    });
  }

  // 聚焦名稱輸入框
  setTimeout(() => {
    document.getElementById('add-prompt-name').focus();
  }, 100);
}

/**
 * 生成唯一 ID
 */
function generateId() {
  return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * HTML 轉義
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 初始化（帶重試機制）
 */
async function init() {
  // 檢測當前平台
  currentPlatform = detectPlatform();

  // 初始化語言設定
  await initLanguage();

  // 等待頁面載入完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      retryCreateButton();
    });
  } else {
    retryCreateButton();
  }
}

/**
 * 重試建立按鈕（最多嘗試 10 次）
 */
function retryCreateButton(attempts = 0) {
  const maxAttempts = 10;
  const delay = 1000; // 每次延遲 1000ms（1秒）
  const platform = currentPlatform || detectPlatform();

  // 先移除舊按鈕（如果存在）
  const oldButton = document.getElementById('prompt-manager-quick-btn');
  if (oldButton) {
    // 檢查按鈕是否在正確位置（不使用固定定位）
    const isUsingFallback = oldButton.classList.contains('fixed-position');

    if ((platform === PLATFORMS.CLAUDE || platform === PLATFORMS.CHATGPT) && !isUsingFallback) {
      // 按鈕已經在正確位置（非固定定位），不需要移除和重新創建
      return;
    }
    oldButton.remove();
  }

  createQuickAccessButton();

  // 檢查按鈕是否成功插入到輸入框上方（而不是使用備用方案）
  const button = document.getElementById('prompt-manager-quick-btn');
  const isUsingFallback = button && button.classList.contains('fixed-position');

  if (isUsingFallback && attempts < maxAttempts) {
    // 如果使用了備用方案（固定定位），繼續重試
    // 只在第一次和最後一次顯示日誌
    if (attempts === 0) {
    }
    setTimeout(() => {
      retryCreateButton(attempts + 1);
    }, delay);
  } else if (button && !isUsingFallback) {
  } else if (button && isUsingFallback && attempts >= maxAttempts) {
  } else {
  }
}

// 執行初始化
init();

// 監聽頁面變化（SPA 導航）
let lastUrl = location.href;
new MutationObserver((mutations) => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // 使用 retryCreateButton 而非 createQuickAccessButton，確保有重試機制
    // 這樣在 Claude 等 SPA 平台上，即使輸入框還沒加載也能重試
    retryCreateButton();
    return;
  }

  // SPA 平台處理：檢查按鈕是否被移除
  const button = document.getElementById('prompt-manager-quick-btn');
  if (!button) {
    const platform = detectPlatform();
    if (platform === PLATFORMS.CLAUDE || platform === PLATFORMS.CHATGPT) {
      setTimeout(() => {
        const newButton = document.getElementById('prompt-manager-quick-btn');
        if (!newButton) {
          retryCreateButton();
        }
      }, 500);
    }
  }
}).observe(document.body, { subtree: true, childList: true });

// 平台專用：定期檢查按鈕是否還在，否則重新創建
// React/SPA 框架可能會重新渲染 DOM，按鈕可能被移除
const detectedPlatform = detectPlatform();
if (detectedPlatform === PLATFORMS.CLAUDE || detectedPlatform === PLATFORMS.GROK || detectedPlatform === PLATFORMS.CHATGPT) {
  let isRecreating = false;

  const platformConfig = {
    [PLATFORMS.CHATGPT]: {
      name: 'ChatGPT',
      containerSelectors: ['#prompt-textarea', 'form[data-type="unified-composer"]']
    },
    [PLATFORMS.CLAUDE]: {
      name: 'Claude',
      containerSelectors: ['[data-testid="chat-input"]', 'div.flex.flex-col.bg-bg-000']
    },
    [PLATFORMS.GROK]: {
      name: 'Grok',
      containerSelectors: ['div[contenteditable="true"].tiptap.ProseMirror', '.query-bar']
    }
  };

  const config = platformConfig[detectedPlatform];

  setInterval(() => {
    if (isRecreating) return;

    const button = document.getElementById('prompt-manager-quick-btn');
    if (!button) {
      isRecreating = true;

      setTimeout(() => {
        const containerExists = config.containerSelectors.some(selector =>
          document.querySelector(selector)
        );

        if (containerExists) {
          retryCreateButton();
        }
        isRecreating = false;
      }, 2000);
    }
  }, 3000);
}
