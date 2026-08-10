/**
 * Content Script - 注入到 ChatGPT 頁面
 * 負責在頁面中插入提示詞和顯示快速訪問按鈕
 */

// 全局變數
let promptsData = [];
let currentPrompt = null;
let promptPanel = null;
let promptPanelHost = null;
let promptPanelRoot = null;
let buttonInjectionReady = false;
let panelOpenPromise = null;
let savedComposerSelection = null;
let activePromptAction = false;
let visiblePromptCount = 100;
let currentViewPrompts = [];
let searchDebounceTimer = null;
let promptsLoadPromise = null;
const panelCleanupTasks = new Set();
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
      'div#prompt-textarea.ProseMirror[contenteditable="true"]',
      '#prompt-textarea[contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"]',
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    inputContainer: [
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
    ]
  },
  [PLATFORMS.CLAUDE]: {
    textarea: [
      '.tiptap.ProseMirror[data-testid="chat-input"]',
      'div[contenteditable="true"][data-testid="chat-input"]',
      '[data-testid="chat-input"]',
      'div.ProseMirror[contenteditable="true"]'
    ],
    inputContainer: [
      'div.flex.flex-col.bg-bg-000',
      '.top-5.z-10.mx-auto.w-full.max-w-2xl',
      '.chat-input-grid-container'
    ]
  },
  [PLATFORMS.GROK]: {
    textarea: [
      'div[role="textbox"][aria-label="Ask Grok anything"][contenteditable="true"]',
      'div[contenteditable="true"].tiptap.ProseMirror',
      '.tiptap.ProseMirror[contenteditable="true"]',
      'div.tiptap.ProseMirror',
      'div[contenteditable="true"].w-full.px-2'
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
    promptInserted: '提示詞已插入，可繼續調整',
    showMore: '顯示更多',
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
    promptContentPlaceholder: '輸入提示詞內容...',
    variableTips: '選取內容後按「設為變數」；既有的 [變數名稱] 也會自動辨識。',
    markAsVariable: '＋ 設為變數',
    insertVariable: '加入變數',
    variableNamePlaceholder: '變數名稱，例如：主題',
    variableDefaultPlaceholder: '預設內容（選填）',
    variableNameLabel: '變數名稱',
    variableDefaultLabel: '預設內容（選填）',
    save: '保存',
    cancel: '取消',
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
    promptInserted: 'Prompt inserted. You can review and adjust it.',
    showMore: 'Show more',
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
    promptContentPlaceholder: 'Enter your prompt...',
    variableTips: 'Select text, then click “Make variable”. Existing [variables] are recognized automatically.',
    markAsVariable: '+ Make variable',
    insertVariable: 'Add variable',
    variableNamePlaceholder: 'Variable name, e.g. topic',
    variableDefaultPlaceholder: 'Default content (optional)',
    variableNameLabel: 'Variable name',
    variableDefaultLabel: 'Default content (optional)',
    save: 'Save',
    cancel: 'Cancel',
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
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action !== 'insertPrompt') return undefined;
  performPromptAction(request.content)
    .then(result => sendResponse({ success: result.inserted, result }))
    .catch(error => sendResponse({ success: false, error: String(error?.message || error) }));
  return true;
});

/**
 * 插入提示詞到輸入框（支援多平台）
 */
function findComposer() {
  const platform = currentPlatform || detectPlatform();
  const selectors = platform ? (PLATFORM_SELECTORS[platform]?.textarea || []) : [];
  for (const selector of selectors) {
    const candidates = document.querySelectorAll(selector);
    for (const element of candidates) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return element;
    }
  }
  return null;
}

function captureComposerSelection() {
  const composer = findComposer();
  if (!composer) return;
  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    savedComposerSelection = {
      composer,
      start: composer.selectionStart,
      end: composer.selectionEnd
    };
    return;
  }

  const selection = window.getSelection();
  if (selection?.rangeCount && composer.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    savedComposerSelection = { composer, range: selection.getRangeAt(0).cloneRange() };
  }
}

function dispatchComposerInput(composer, content) {
  composer.dispatchEvent(new InputEvent('input', {
    inputType: 'insertText',
    data: content,
    bubbles: true
  }));
}

function insertPromptToTextarea(content) {
  const composer = findComposer();
  if (!composer) {
    showNotification(t('promptNotInserted'), 'error');
    return false;
  }

  if (composer.getAttribute('contenteditable') === 'true') {
    composer.focus();
    const selection = window.getSelection();
    let range = null;
    if (selection?.rangeCount && composer.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      range = selection.getRangeAt(0).cloneRange();
    } else if (savedComposerSelection?.composer === composer && savedComposerSelection.range) {
      range = savedComposerSelection.range.cloneRange();
    }
    if (!range || !range.startContainer?.isConnected) {
      range = document.createRange();
      range.selectNodeContents(composer);
      range.collapse(false);
    }

    selection.removeAllRanges();
    selection.addRange(range);
    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, content);
    } catch (_error) {
      inserted = false;
    }
    if (!inserted) {
      range.deleteContents();
      const textNode = document.createTextNode(content);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    dispatchComposerInput(composer, content);
    savedComposerSelection = { composer, range: selection.getRangeAt(0).cloneRange() };
    return true;
  }

  const currentValue = composer.value || '';
  const selectionState = savedComposerSelection?.composer === composer ? savedComposerSelection : null;
  const start = Number.isInteger(selectionState?.start)
    ? selectionState.start
    : (Number.isInteger(composer.selectionStart) ? composer.selectionStart : currentValue.length);
  const end = Number.isInteger(selectionState?.end)
    ? selectionState.end
    : (Number.isInteger(composer.selectionEnd) ? composer.selectionEnd : start);
  const newValue = currentValue.slice(0, start) + content + currentValue.slice(end);
  setNativeValue(composer, newValue);
  dispatchComposerInput(composer, content);
  composer.dispatchEvent(new Event('change', { bubbles: true }));
  const newPosition = start + content.length;
  composer.setSelectionRange(newPosition, newPosition);
  composer.focus();
  savedComposerSelection = { composer, start: newPosition, end: newPosition };
  return true;
}

async function performPromptAction(content) {
  const result = await PanelUtils.runPromptAction({
    content,
    insert: insertPromptToTextarea
  });

  if (result.inserted) showNotification(t('promptInserted'), 'success');
  return result;
}
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
    const banner = getPanelElement('#promo-banner');
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
  const banner = getPanelElement('#promo-banner');
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
          <a href="https://link.brain168.com/ai-invest" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" class="promo-btn promo-btn-primary">${t('promoButton')}</a>
          <button type="button" class="promo-btn promo-btn-secondary promo-later-btn">${t('promoLater')}</button>
          <button type="button" class="promo-btn promo-btn-dismiss promo-dismiss-btn">${t('promoDismiss')}</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 綁定推廣橫幅事件
 */
function bindPromoBannerEvents() {
  const dismissBtn = getPanelElement('.promo-dismiss-btn');
  const laterBtn = getPanelElement('.promo-later-btn');

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


function loadPromoBannerWhenReady(panel) {
  shouldShowPromoBanner().then(showPromo => {
    if (!showPromo || promptPanel !== panel || !panel.isConnected || panel.querySelector('#promo-banner')) return;
    const template = document.createElement('template');
    template.innerHTML = renderPromoBanner().trim();
    const banner = template.content.firstElementChild;
    const search = panel.querySelector('.prompt-panel-search');
    if (!banner || !search) return;
    search.before(banner);
    bindPromoBannerEvents();
  });
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
  const chatInput = findComposer();
  const container = chatInput?.closest('div.flex.flex-col.bg-bg-000') || findInputContainer();
  if (!container) return false;

  if (container.matches('.top-5.z-10.mx-auto.w-full.max-w-2xl')) {
    applyCenteredButtonStyle(button, { marginBottom: '4px' });
    button.style.marginLeft = '0';
    button.style.marginRight = '0';
    container.insertBefore(button, container.firstElementChild);
    return true;
  }

  if (!container.parentElement) return false;
  const computedStyle = window.getComputedStyle(container);
  applyCenteredButtonStyle(button, { marginBottom: '4px' });
  button.style.width = computedStyle.width;
  button.style.marginLeft = computedStyle.marginLeft;
  button.style.marginRight = computedStyle.marginRight;
  container.parentElement.insertBefore(button, container);
  return true;
}

function insertButtonForChatGPT(button) {
  const composer = findComposer();
  const composerForm = document.querySelector('form[data-type="unified-composer"]') || composer?.closest('form');
  if (composerForm) {
    applyCenteredButtonStyle(button, { marginBottom: '4px' });
    composerForm.insertBefore(button, composerForm.firstElementChild);
    return true;
  }

  if (composer?.parentElement?.parentElement) {
    applyCenteredButtonStyle(button, { marginBottom: '4px' });
    composer.parentElement.parentElement.insertBefore(button, composer.parentElement);
    return true;
  }
  return false;
}

function insertButtonForGemini(button) {
  const composer = findComposer();
  const inputArea = composer?.closest('input-area-v2') || document.querySelector('input-area-v2');
  if (inputArea?.parentElement) {
    applyCenteredButtonStyle(button, { marginBottom: '4px' });
    const width = inputArea.getBoundingClientRect().width;
    if (width > 0) button.style.width = `${width}px`;
    inputArea.parentElement.insertBefore(button, inputArea);
    return true;
  }

  const container = findInputContainer();
  if (!container?.parentElement) return false;
  applyCenteredButtonStyle(button, { marginBottom: '4px' });
  const width = container.getBoundingClientRect().width;
  if (width > 0) button.style.width = `${width}px`;
  container.parentElement.insertBefore(button, container);
  return true;
}

function insertButtonForGrok(button) {
  const queryBar = document.querySelector('.query-bar');
  if (queryBar) {
    applyCenteredButtonStyle(button, { marginBottom: '4px' });
    queryBar.insertBefore(button, queryBar.firstElementChild);
    return true;
  }

  const container = findInputContainer();
  if (!container?.parentElement) return false;
  applyCenteredButtonStyle(button, { marginBottom: '4px' });
  const width = container.getBoundingClientRect().width;
  if (width > 0) button.style.width = `${width}px`;
  container.parentElement.insertBefore(button, container);
  return true;
}

/**
 * 建立快速訪問按鈕
 */
function createQuickAccessButton() {
  if (document.getElementById('prompt-manager-quick-btn')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'prompt-manager-quick-btn';
  button.className = 'prompt-quick-btn';
  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span>${t('prompts')}</span>
  `;
  button.title = t('openPromptManager');
  button.addEventListener('pointerdown', event => {
    captureComposerSelection();
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true });
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    togglePromptPanel();
  });

  const platform = currentPlatform || detectPlatform();

  const inserters = {
    [PLATFORMS.CHATGPT]: insertButtonForChatGPT,
    [PLATFORMS.CLAUDE]: insertButtonForClaude,
    [PLATFORMS.GEMINI]: insertButtonForGemini,
    [PLATFORMS.GROK]: insertButtonForGrok
  };
  const insertButton = inserters[platform];
  if (insertButton) {
    insertButton(button);
    return;
  }

  applyFixedPositionStyle(button);
  document.body.appendChild(button);
}

/**
 * 切換提示詞面板顯示
 */
function ensurePromptPanelHost() {
  if (promptPanelHost?.isConnected && promptPanelRoot) return;

  promptPanelHost = document.createElement('div');
  promptPanelHost.id = 'ai-prompts-plus-panel-host';
  promptPanelHost.style.all = 'initial';
  promptPanelHost.style.position = 'fixed';
  promptPanelHost.style.top = '16px';
  promptPanelHost.style.right = '16px';
  promptPanelHost.style.display = 'block';
  promptPanelHost.style.visibility = 'hidden';
  promptPanelHost.style.pointerEvents = 'none';
  promptPanelHost.style.width = '0';
  promptPanelHost.style.maxHeight = '0';
  promptPanelHost.style.overflow = 'hidden';
  promptPanelHost.style.zIndex = '2147483647';
  promptPanelRoot = promptPanelHost.attachShadow({ mode: 'closed' });
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = chrome.runtime.getURL('content.css');
  promptPanelRoot.appendChild(stylesheet);
  document.body.appendChild(promptPanelHost);
}
function hidePromptPanelHost() {
  if (!promptPanelHost) return;
  promptPanelHost.style.visibility = 'hidden';
  promptPanelHost.style.pointerEvents = 'none';
  promptPanelHost.style.width = '0';
  promptPanelHost.style.maxHeight = '0';
  promptPanelHost.style.overflow = 'hidden';
}

function showPromptPanelHost() {
  if (!promptPanelHost) return;
  promptPanelHost.style.visibility = 'visible';
  promptPanelHost.style.pointerEvents = 'auto';
  promptPanelHost.style.width = 'min(480px, calc(100vw - 32px))';
  promptPanelHost.style.maxHeight = 'calc(100vh - 32px)';
  promptPanelHost.style.overflow = 'visible';
}

function positionPromptPanel() {
  if (!promptPanel?.isConnected) return;
  promptPanel.style.top = 'auto';
  promptPanel.style.right = 'auto';
  promptPanel.style.left = 'auto';
}

function getPanelElement(selector) {
  return promptPanel?.querySelector(selector) || null;
}

function refreshPromptList(prompts = promptsData) {
  currentViewPrompts = prompts;
  const list = getPanelElement('#prompt-panel-list');
  if (!list) return;
  list.innerHTML = renderPromptList(prompts);
  bindPromptItemEvents();
}

function refreshPromptListForCurrentSearch() {
  const searchInput = getPanelElement('#prompt-search');
  const queryValue = String(searchInput?.value || '');
  const query = queryValue.startsWith('/') ? queryValue.slice(1).trim() : queryValue.trim();
  refreshPromptList(PanelUtils.filterPrompts(promptsData, query));
}
async function togglePromptPanel() {
  if (promptPanel?.isConnected) {
    panelCleanupTasks.forEach(cleanup => cleanup());
    panelCleanupTasks.clear();
    window.clearTimeout(searchDebounceTimer);
    promptPanel?.remove();
    promptPanel = null;
    hidePromptPanelHost();
    return;
  }
  if (panelOpenPromise) return panelOpenPromise;
  panelOpenPromise = createPromptPanel().finally(() => {
    panelOpenPromise = null;
  });
  return panelOpenPromise;
}
/**
 * 創建提示詞面板
 */
function loadPromptsData(force = false) {
  if (force) promptsLoadPromise = null;
  if (promptsLoadPromise) return promptsLoadPromise;
  promptsLoadPromise = StorageManager.getAllPrompts()
    .then(prompts => {
      promptsData = Array.isArray(prompts) ? prompts : [];
      return promptsData;
    })
    .catch(error => {
      promptsLoadPromise = null;
      throw error;
    });
  return promptsLoadPromise;
}

async function createPromptPanel() {
  // 從 storage 載入提示詞
  try {
    await loadPromptsData();
  } catch (error) {
    // Extension context invalidated - 擴充功能已重新載入
    if (error.message.includes('Extension context invalidated')) {
      showNotification(t('extensionReloaded'), 'warning');
      return;
    }
    promptsData = [];
  }

  // 建立面板容器
  // Closed Shadow DOM keeps local prompt data isolated from the host page.
  ensurePromptPanelHost();
  showPromptPanelHost();

  promptPanel = document.createElement('div');
  promptPanel.id = 'prompt-manager-panel';
  promptPanel.className = 'prompt-panel';
  PanelUtils.isolateHostEvents(promptPanel);

  promptPanel.innerHTML = `
    <div class="prompt-panel-header">
      <h3>${t('promptManager')}</h3>
      <div class="prompt-panel-header-actions">
        <button type="button" class="prompt-panel-add" title="${t('addPrompt')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ${t('add')}
        </button>
        <button type="button" class="prompt-panel-close" title="${t('close')}">✕</button>
      </div>
    </div>
    <div class="prompt-panel-search">
      <input type="text" id="prompt-search" placeholder="${t('searchPrompts')}" />
    </div>
    <div class="prompt-panel-list" id="prompt-panel-list">
      ${renderPromptList(promptsData)}
    </div>
  `;

  PanelUtils.mountPanel(promptPanel, promptPanelRoot);
  positionPromptPanel();

  // 綁定事件
  promptPanel.querySelector('.prompt-panel-close').addEventListener('click', () => {
    togglePromptPanel();
  });

  promptPanel.querySelector('.prompt-panel-add').addEventListener('click', () => {
    showAddPromptPanel();
  });

  const searchInput = promptPanel.querySelector('#prompt-search');

  searchInput.addEventListener('input', () => {
    const queryValue = String(searchInput.value || '');
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => {
      const query = queryValue.startsWith('/') ? queryValue.slice(1) : queryValue;
      const queryLower = query.toLocaleLowerCase();
      const filtered = PanelUtils.filterPrompts(promptsData, queryLower);
      visiblePromptCount = 100;
      refreshPromptList(filtered);
    }, 80);
  });
  // 按下 Enter 鍵時，如果只有一個結果，直接使用該提示詞
  searchInput.addEventListener('keydown', (e) => {
    if (PanelUtils.isConfirmKey(e)) {
      let query = searchInput.value;

      if (query.startsWith('/')) {
        query = query.substring(1);
      }

      const queryLower = query.toLowerCase();
      const filtered = PanelUtils.filterPrompts(promptsData, queryLower);

      if (filtered.length === 1) {
        usePrompt(filtered[0]);
      }
    }
  });

  bindPromptItemEvents();
  loadPromoBannerWhenReady(promptPanel);
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
    const containerSelectors = PLATFORM_SELECTORS[platform]?.inputContainer || [];
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
    const containerSelectors = PLATFORM_SELECTORS[platform]?.inputContainer || [];
    const container = findFirstMatch(containerSelectors);
    if (container) return container;

    const grokForm = document.querySelector('form.w-full.text-base.flex.flex-col.gap-2.items-center.justify-center.relative.z-10.mt-2');
    if (grokForm) {
      return grokForm;
    }

    const grokEditor = document.querySelector('div[role="textbox"][aria-label="Ask Grok anything"][contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"].tiptap.ProseMirror');
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
    const containerSelectors = PLATFORM_SELECTORS[platform]?.inputContainer || [];
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
  const selectors = platform ? (PLATFORM_SELECTORS[platform]?.textarea || []) : [];
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
function renderHighlightedPromptContent(content) {
  const parts = VariableUtils.createHighlightedContentParts(content);
  const markup = parts.map(part => {
    if (part.type === 'text') return escapeHtml(part.text);
    return `<span class="variable-token-${part.type}">${escapeHtml(part.text)}</span>`;
  }).join('');

  return markup + (content.endsWith('\n') ? ' ' : '');
}

function renderVariableTag(variable) {
  const parts = VariableUtils.createVariableDisplayParts(variable);
  const label = parts.map(part => part.text).join('');

  if (!parts.length) return '';

  return `
    <span class="variable-tag" aria-label="${escapeHtml(label)}">
      ${parts.map(part => `<span class="variable-token-${part.type}">${escapeHtml(part.text)}</span>`).join('')}
    </span>
  `;
}

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

  const visiblePrompts = sortedPrompts.slice(0, visiblePromptCount);
  const markup = visiblePrompts.map(prompt => {
    const variables = VariableUtils.parseVariables(prompt.content);
    const isPinned = prompt.pinned || false;
    return `
      <div class="prompt-item ${isPinned ? 'pinned' : ''}" data-id="${encodeURIComponent(prompt.id)}">
        <div class="prompt-item-header">
          <div class="prompt-item-title">
            ${isPinned ? '<span class="pin-indicator">📌</span>' : ''}
            ${escapeHtml(prompt.name)}
          </div>
          <div class="prompt-item-actions">
            ${prompt.category ? `<span class="prompt-item-category">${escapeHtml(prompt.category)}</span>` : ''}
            <button type="button" class="prompt-item-pin" data-id="${encodeURIComponent(prompt.id)}" title="${isPinned ? t('unpin') : t('pin')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
            <button type="button" class="prompt-item-edit" data-id="${encodeURIComponent(prompt.id)}" title="${t('edit')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button type="button" class="prompt-item-delete" data-id="${encodeURIComponent(prompt.id)}" title="${t('delete')}">
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
            ${variables.map(renderVariableTag).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  const remaining = sortedPrompts.length - visiblePrompts.length;
  return markup + (remaining > 0
    ? `<button type="button" class="prompt-load-more">${t('showMore')} (${remaining})</button>`
    : '');
}

/**
 * 綁定提示詞項目事件
 */
function bindPromptItemEvents() {
  const list = getPanelElement('#prompt-panel-list');
  if (!list || list.dataset.eventsBound === 'true') return;
  list.dataset.eventsBound = 'true';
  list.addEventListener('click', async event => {
    if (event.target.closest('.prompt-load-more')) {
      visiblePromptCount += 100;
      refreshPromptList(currentViewPrompts);
      return;
    }
    const item = event.target.closest('.prompt-item');
    if (!item) return;
    const id = decodeURIComponent(item.dataset.id);
    const prompt = promptsData.find(candidate => candidate.id === id);
    if (!prompt) return;
    if (event.target.closest('.prompt-item-pin')) await togglePinPrompt(id);
    else if (event.target.closest('.prompt-item-edit')) showAddPromptPanel(prompt);
    else if (event.target.closest('.prompt-item-delete')) await deletePrompt(id);
    else usePrompt(prompt);
  });
}
/**
 * 切換提示詞置頂狀態
 */
async function togglePinPrompt(id) {
  try {
    const prompt = await StorageManager.togglePinPrompt(id);
    await loadPromptsData(true);
    refreshPromptListForCurrentSearch();
    showNotification(prompt.pinned ? t('pinned') : t('unpinned'), 'success');
  } catch (error) {
    showNotification(t('pinFailed'), 'error');
  }
}

/**
 * 刪除提示詞
 */
async function deletePrompt(id) {
  if (!confirm(t('confirmDelete'))) return;
  try {
    await StorageManager.deletePrompt(id);
    await loadPromptsData(true);
    refreshPromptListForCurrentSearch();
    showNotification(t('promptDeleted'), 'success');
  } catch (error) {
    showNotification(t('deleteFailed'), 'error');
  }
}

/**
 * 使用提示詞
 */
function usePrompt(prompt) {
  const variables = VariableUtils.parseVariables(prompt.content);

  if (variables.length === 0) {
    showPromptActionPanel(prompt);
  } else {
    // 有變數，顯示輸入界面
    currentPrompt = prompt;
    showVariableInputPanel(prompt, variables);
  }
}

function showPromptActionPanel(prompt) {
  const existingPanel = promptPanel.querySelector('.prompt-variable-panel, .prompt-add-panel');
  if (existingPanel) {
    showNotification(t('completeCurrentOperation'), 'error');
    return;
  }

  const list = getPanelElement('#prompt-panel-list');
  const searchBox = promptPanel.querySelector('.prompt-panel-search');
  const actionPanel = document.createElement('div');
  actionPanel.className = 'prompt-variable-panel prompt-action-panel';
  actionPanel.innerHTML = `
    <div class="prompt-variable-header">
      <button type="button" class="prompt-back-btn">${t('back')}</button>
      <h4>${escapeHtml(prompt.name)}</h4>
    </div>
    <div class="prompt-action-preview">${escapeHtml(prompt.content)}</div>
    <div class="prompt-variable-actions">
      <button type="button" class="prompt-insert-btn">${t('insertPrompt')}</button>

    </div>
  `;

  list.style.display = 'none';
  searchBox.style.display = 'none';
  promptPanel.appendChild(actionPanel);

  actionPanel.querySelector('.prompt-back-btn').addEventListener('click', () => {
    actionPanel.remove();
    list.style.display = 'block';
    searchBox.style.display = 'block';
  });

  async function completeAction() {
    if (activePromptAction) return;
    activePromptAction = true;
    actionPanel.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try {
      const result = await performPromptAction(prompt.content);
      if (!result.inserted) return;
      await incrementUsageCount(prompt.id);
      await togglePromptPanel();
    } finally {
      activePromptAction = false;
      if (actionPanel.isConnected) {
        actionPanel.querySelectorAll('button').forEach(button => { button.disabled = false; });
      }
    }
  }
  actionPanel.querySelector('.prompt-insert-btn').addEventListener('click', completeAction);
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
  const list = getPanelElement('#prompt-panel-list');

  const variablePanel = document.createElement('div');
  variablePanel.className = 'prompt-variable-panel';
  variablePanel.innerHTML = `
    <div class="prompt-variable-header">
      <button type="button" class="prompt-back-btn">${t('back')}</button>
      <h4>${escapeHtml(prompt.name)}</h4>
    </div>
    <div class="prompt-variable-inputs"></div>

    <div class="prompt-variable-actions">
      <button type="button" class="prompt-insert-btn">${t('insertPrompt')}</button>

    </div>
  `;
  const inputsContainer = variablePanel.querySelector('.prompt-variable-inputs');
  variables.forEach(variable => {
    const group = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');

    group.className = 'prompt-variable-group';
    label.textContent = variable.name;
    input.type = 'text';
    input.className = 'prompt-variable-input';
    input.dataset.variable = variable.name;
    input.dataset.defaultValue = variable.defaultValue || '';
    input.placeholder = t('enterValue', { variable: variable.name });
    input.value = variable.defaultValue || '';

    group.append(label, input);
    inputsContainer.appendChild(group);
  });

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
  variablePanel.querySelector('.prompt-insert-btn').addEventListener('click', insertVariablePrompt);

  // 為所有變數輸入框添加 Enter 鍵監聽
  const inputs = variablePanel.querySelectorAll('.prompt-variable-input');
  inputs.forEach(input => {
    // Enter 鍵送出
    input.addEventListener('keydown', (e) => {
      if (PanelUtils.isConfirmKey(e)) {
        e.preventDefault();
        insertVariablePrompt();
      }
    });
  });

  // 聚焦第一個輸入框
  const firstInput = variablePanel.querySelector('.prompt-variable-input');
  if (firstInput) {
    setTimeout(() => { if (firstInput.isConnected) firstInput.focus(); }, 100);
  }
}

/**
 * 插入變數提示詞（供 Enter 鍵和按鈕使用）
 */
async function insertVariablePrompt() {
  const variablePanel = promptPanel?.querySelector('.prompt-variable-panel');
  if (!variablePanel || activePromptAction) return;

  const values = new Map();
  let hasError = false;
  variablePanel.querySelectorAll('.prompt-variable-input').forEach(input => {
    const variable = input.dataset.variable;
    const value = input.value.trim();
    const defaultValue = input.dataset.defaultValue;
    if (!value && !defaultValue) {
      input.style.borderColor = '#ef4444';
      hasError = true;
    } else {
      input.style.borderColor = '';
      values.set(variable, value || defaultValue);
    }
  });
  if (hasError) {
    showNotification(t('fillAllVariables'), 'error');
    return;
  }

  activePromptAction = true;
  variablePanel.querySelectorAll('button, input').forEach(element => { element.disabled = true; });
  try {
    const finalContent = VariableUtils.replaceVariables(currentPrompt.content, values);
    const result = await performPromptAction(finalContent);
    if (!result.inserted) return;
    await incrementUsageCount(currentPrompt.id);
    await togglePromptPanel();
  } finally {
    activePromptAction = false;
    if (variablePanel.isConnected) {
      variablePanel.querySelectorAll('button, input').forEach(element => { element.disabled = false; });
    }
  }
}
/**
 * 增加使用次數
 */
async function incrementUsageCount(id) {
  try {
    await StorageManager.incrementUsageCount(id);
  } catch (error) {
    if (!String(error?.message).includes('Extension context invalidated')) {
      showNotification(t('saveFailed'), 'error');
    }
  }
}

/**
 * 顯示新增提示詞面板
 */
function showAddPromptPanel(editPrompt = null) {
  // 檢查是否已經有新增面板存在
  const existingOperationPanel = promptPanel.querySelector('.prompt-add-panel, .prompt-variable-panel');
  if (existingOperationPanel) {
    showNotification(t('completeOrCancelEdit'), 'error');
    return;
  }

  const list = getPanelElement('#prompt-panel-list');
  const searchBox = promptPanel.querySelector('.prompt-panel-search');

  const addPanel = document.createElement('div');
  addPanel.className = 'prompt-add-panel';
  addPanel.innerHTML = `
    <div class="prompt-add-header">
      <button type="button" class="prompt-back-btn">${t('back')}</button>
      <h4>${editPrompt ? t('editPrompt') : t('addPrompt')}</h4>
    </div>
    <div class="prompt-add-form">
      <div class="prompt-form-group">
        <label>${t('promptName')} ${t('required')}</label>
        <input type="text" id="add-prompt-name" class="prompt-form-input" placeholder="${t('promptNamePlaceholder')}"  />
      </div>
      <div class="prompt-form-group">
        <label>${t('category')}</label>
        <input type="text" id="add-prompt-category" class="prompt-form-input" placeholder="${t('categoryPlaceholder')}"  />
      </div>
      <div class="prompt-form-group">
        <label>${t('promptContent')} ${t('required')}</label>
        <div class="variable-highlight-editor">
          <pre class="variable-highlight-layer" aria-hidden="true"></pre>
          <textarea id="add-prompt-content" class="prompt-form-textarea" placeholder="${t('promptContentPlaceholder')}"></textarea>
        </div>
      </div>
      <div class="prompt-variable-toolbar">
        <button type="button" class="prompt-variable-create-btn">${t('markAsVariable')}</button>
      </div>
      <div class="prompt-variable-creator" hidden>
        <label for="panel-variable-name">${t('variableNameLabel')}</label>
        <input type="text" id="panel-variable-name" class="prompt-form-input prompt-variable-name" placeholder="${t('variableNamePlaceholder')}" />
        <label for="panel-variable-default">${t('variableDefaultLabel')}</label>
        <input type="text" id="panel-variable-default" class="prompt-form-input prompt-variable-default" placeholder="${t('variableDefaultPlaceholder')}" />
        <div class="prompt-variable-preview variable-preview" hidden aria-live="polite"></div>
        <div class="prompt-variable-creator-actions">
          <button type="button" class="prompt-variable-cancel-btn">${t('cancel')}</button>
          <button type="button" class="prompt-variable-confirm-btn">${t('insertVariable')}</button>
        </div>
      </div>
      <div class="prompt-form-tips">
        ${t('variableTips')}
      </div>
      <div class="prompt-form-actions">
        <button type="button" class="prompt-save-btn">${editPrompt ? t('save') : t('add')}</button>
        ${editPrompt ? `<button type="button" class="prompt-delete-btn">${t('delete')}</button>` : ''}
      </div>
    </div>
  `;

  list.style.display = 'none';
  searchBox.style.display = 'none';
  promptPanel.appendChild(addPanel);
  const nameInput = addPanel.querySelector('#add-prompt-name');
  const categoryInput = addPanel.querySelector('#add-prompt-category');
  const contentTextarea = addPanel.querySelector('#add-prompt-content');
  if (editPrompt) {
    nameInput.value = editPrompt.name;
    categoryInput.value = editPrompt.category || '';
    contentTextarea.value = VariableUtils.normalizeVariableTokens(editPrompt.content);
  }
  const contentHighlight = addPanel.querySelector('.variable-highlight-layer');
  const variableCreator = addPanel.querySelector('.prompt-variable-creator');
  const variableNameInput = addPanel.querySelector('.prompt-variable-name');
  const variableDefaultInput = addPanel.querySelector('.prompt-variable-default');
  const variablePreview = addPanel.querySelector('.prompt-variable-preview');
  let pendingSelection = null;

  let highlightFrame = null;
  let isComposing = false;
  function updateContentHighlight() {
    if (highlightFrame !== null || isComposing) return;
    highlightFrame = window.requestAnimationFrame(() => {
      highlightFrame = null;
      if (!contentHighlight.isConnected) return;
      contentHighlight.innerHTML = renderHighlightedPromptContent(contentTextarea.value);
      syncContentHighlightScroll();
    });
  }

  function syncContentHighlightScroll() {
    contentHighlight.style.width = `${contentTextarea.clientWidth + 2}px`;
    contentHighlight.style.height = `${contentTextarea.clientHeight + 2}px`;
    contentHighlight.scrollTop = contentTextarea.scrollTop;
    contentHighlight.scrollLeft = contentTextarea.scrollLeft;
  }

  function updateCreatorPreview() {
    const markup = renderVariableTag({
      name: variableNameInput.value,
      defaultValue: variableDefaultInput.value
    });

    variablePreview.hidden = !markup;
    variablePreview.innerHTML = markup;
  }

  function closeCreator() {
    variableCreator.hidden = true;
    variableNameInput.value = '';
    variableDefaultInput.value = '';
    updateCreatorPreview();
    pendingSelection = null;
  }

  function insertVariable(name = '', defaultValue = '') {
    const selectionStart = pendingSelection?.start ?? contentTextarea.selectionStart;
    const selectionEnd = pendingSelection?.end ?? contentTextarea.selectionEnd;
    const result = VariableUtils.insertVariable(
      contentTextarea.value,
      selectionStart,
      selectionEnd,
      name,
      defaultValue
    );

    if (!result) return false;

    contentTextarea.value = result.content;
    updateContentHighlight();
    contentTextarea.focus();
    contentTextarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    closeCreator();
    return true;
  }

  addPanel.querySelector('.prompt-variable-create-btn').addEventListener('click', () => {
    const draft = VariableUtils.createVariableDraft(
      contentTextarea.value,
      contentTextarea.selectionStart,
      contentTextarea.selectionEnd
    );

    pendingSelection = { start: draft.selectionStart, end: draft.selectionEnd };
    variableNameInput.value = draft.name;
    variableDefaultInput.value = draft.defaultValue;
    variableCreator.hidden = false;
    updateCreatorPreview();
    (draft.name ? variableDefaultInput : variableNameInput).focus();
  });

  function confirmVariable() {
    if (!insertVariable(variableNameInput.value, variableDefaultInput.value)) {
      variableNameInput.focus();
    }
  }

  addPanel.querySelector('.prompt-variable-confirm-btn').addEventListener('click', confirmVariable);
  addPanel.querySelector('.prompt-variable-cancel-btn').addEventListener('click', closeCreator);
  contentTextarea.addEventListener('input', updateContentHighlight);
  contentTextarea.addEventListener('compositionstart', () => { isComposing = true; });
  contentTextarea.addEventListener('compositionend', () => {
    isComposing = false;
    updateContentHighlight();
  });
  contentTextarea.addEventListener('scroll', syncContentHighlightScroll);
  const contentResizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(syncContentHighlightScroll)
    : null;
  contentResizeObserver?.observe(contentTextarea);
  const cleanupAddPanel = () => {
    contentResizeObserver?.disconnect();
    if (highlightFrame !== null) window.cancelAnimationFrame(highlightFrame);
    panelCleanupTasks.delete(cleanupAddPanel);
  };
  panelCleanupTasks.add(cleanupAddPanel);
  updateContentHighlight();
  [variableNameInput, variableDefaultInput].forEach(input => {
    input.addEventListener('input', updateCreatorPreview);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') confirmVariable();
      if (event.key === 'Escape') closeCreator();
    });
  });


  // 綁定返回按鈕
  addPanel.querySelector('.prompt-back-btn').addEventListener('click', () => {
    cleanupAddPanel();
    addPanel.remove();
    list.style.display = 'block';
    searchBox.style.display = 'block';
  });

  // 綁定保存按鈕
  addPanel.querySelector('.prompt-save-btn').addEventListener('click', async () => {
    const name = getPanelElement('#add-prompt-name').value.trim();
    const category = getPanelElement('#add-prompt-category').value.trim();
    const content = VariableUtils.normalizeVariableTokens(
      getPanelElement('#add-prompt-content').value.trim()
    );

    if (!name || !content) {
      showNotification(t('fillRequired'), 'error');
      return;
    }

    const prompt = {
      ...(editPrompt ? { id: editPrompt.id } : {}),
      name,
      category,
      content
    };

    try {
      await StorageManager.savePrompt(prompt);
      await loadPromptsData(true);

      showNotification(editPrompt ? t('promptUpdated') : t('promptAdded'), 'success');

      // 返回列表
      cleanupAddPanel();
      addPanel.remove();
      list.style.display = 'block';
      searchBox.style.display = 'block';
      refreshPromptListForCurrentSearch();
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
        await StorageManager.deletePrompt(editPrompt.id);
        await loadPromptsData(true);

        showNotification(t('promptDeleted'), 'success');

        // 返回列表
        cleanupAddPanel();
      addPanel.remove();
        list.style.display = 'block';
        searchBox.style.display = 'block';
        refreshPromptListForCurrentSearch();
      } catch (error) {
        showNotification(t('deleteFailed'), 'error');
      }
    });
  }

  // 聚焦名稱輸入框
  window.setTimeout(() => {
    if (addPanel.isConnected) nameInput.focus();
  }, 100);
}

/**
 * HTML 轉義
 */
function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
/**
 * 初始化（帶重試機制）
 */
function scheduleInitialButtonCreation() {
  window.setTimeout(() => {
    buttonInjectionReady = true;
    ensurePromptPanelHost();
    retryCreateButton();
  }, 750);
}

async function init() {
  void loadPromptsData().catch(() => {});

  // 檢測當前平台
  currentPlatform = detectPlatform();

  // 初始化語言設定
  await initLanguage();

  // Wait until the host app has completed its initial hydration.
  if (document.readyState === 'complete') {
    scheduleInitialButtonCreation();
  } else {
    window.addEventListener('load', scheduleInitialButtonCreation, { once: true });
  }
}

/**
 * 重試建立按鈕（最多嘗試 10 次）
 */
function retryCreateButton() {
  const existing = document.getElementById('prompt-manager-quick-btn');
  if (existing) return existing;
  createQuickAccessButton();
  return document.getElementById('prompt-manager-quick-btn');
}
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes.prompts || !promptPanel?.isConnected) return;
  promptsData = Array.isArray(changes.prompts.newValue) ? changes.prompts.newValue : [];
  promptsLoadPromise = Promise.resolve(promptsData);
  visiblePromptCount = 100;
  refreshPromptListForCurrentSearch();
});
init();

let buttonRecoveryTimer = null;
let lastUrl = location.href;
function scheduleButtonRecovery(delay = 250) {
  if (buttonRecoveryTimer !== null) return;
  buttonRecoveryTimer = window.setTimeout(() => {
    buttonRecoveryTimer = null;
    if (!buttonInjectionReady) return;
    if (location.href !== lastUrl) lastUrl = location.href;
    ensurePromptPanelHost();
    retryCreateButton();
  }, delay);
}

const buttonRecoveryObserver = new MutationObserver(() => {
  if (location.href !== lastUrl ||
      !document.getElementById('prompt-manager-quick-btn') ||
      !document.getElementById('ai-prompts-plus-panel-host')) {
    scheduleButtonRecovery();
  }
});
buttonRecoveryObserver.observe(document.body, { subtree: true, childList: true });
const buttonRecoveryInterval = window.setInterval(scheduleButtonRecovery, 750);
window.addEventListener('pagehide', () => {
  buttonRecoveryObserver.disconnect();
  window.clearInterval(buttonRecoveryInterval);
  if (buttonRecoveryTimer !== null) window.clearTimeout(buttonRecoveryTimer);
  panelCleanupTasks.forEach(cleanup => cleanup());
  panelCleanupTasks.clear();
}, { once: true });