/**
 * Content Script - 注入到 ChatGPT 頁面
 * 負責在頁面中插入提示詞和顯示快速訪問按鈕
 */

// 全局變數
let promptsData = [];
let currentPrompt = null;
let promptPanel = null;
let currentLang = 'zh-TW';

// 翻譯文本
const i18nMessages = {
  'zh-TW': {
    promptNotInserted: '找不到輸入框，請確認您在 ChatGPT 對話頁面',
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
    required: '*',
    extensionReloaded: '擴充功能已重新載入，請刷新頁面 (F5) 以使用最新版本'
  },
  'en': {
    promptNotInserted: 'Input box not found, please ensure you are on ChatGPT conversation page',
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
    required: '*',
    extensionReloaded: 'Extension reloaded, please refresh the page (F5) to use the latest version'
  }
};

// 獲取翻譯文本
function t(key, params = {}) {
  let text = i18nMessages[currentLang]?.[key] || i18nMessages['zh-TW'][key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
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
    console.error('Failed to load language:', error);
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
 * 插入提示詞到 ChatGPT 輸入框
 */
function insertPromptToTextarea(content) {
  // ChatGPT 的輸入框選擇器（可能需要根據頁面更新調整）
  const selectors = [
    'textarea[data-id="root"]', // 新版 ChatGPT
    '#prompt-textarea',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="傳送訊息"]',
    'div[contenteditable="true"]', // 可編輯 div
    'textarea',
  ];

  let textarea = null;

  // 嘗試找到輸入框
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && (element.offsetParent !== null || element === document.activeElement)) {
      textarea = element;
      break;
    }
  }

  if (!textarea) {
    console.error('找不到 ChatGPT 輸入框');
    showNotification(t('promptNotInserted'), 'error');
    return;
  }

  // 如果是 contenteditable div
  if (textarea.getAttribute('contenteditable') === 'true') {
    textarea.innerText = content;
    textarea.focus();

    // 觸發 input 事件
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    textarea.dispatchEvent(inputEvent);
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
 * 點擊送出按鈕
 */
function clickSendButton() {
  // ChatGPT 送出按鈕的選擇器
  const buttonSelectors = [
    'button[data-testid="send-button"]',
    'button[data-testid="fruitjuice-send-button"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="送出"]',
    'form button[type="submit"]',
    'button svg[data-icon="paper-plane"]',
  ];

  for (const selector of buttonSelectors) {
    const button = document.querySelector(selector);
    if (button && !button.disabled) {
      // 確保按鈕可見且可點擊
      const rect = button.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        button.click();
        console.log('送出按鈕已點擊');
        return true;
      }
    }
  }

  // 如果找不到按鈕，嘗試使用 Enter 鍵
  const textarea = document.querySelector('textarea[data-id="root"]') ||
                   document.querySelector('textarea');
  if (textarea) {
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(enterEvent);
    console.log('使用 Enter 鍵送出');
    return true;
  }

  console.warn('找不到送出按鈕');
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
 * 建立快速訪問按鈕
 */
function createQuickAccessButton() {
  // 檢查是否已存在按鈕
  if (document.getElementById('prompt-manager-quick-btn')) return;

  // 找到輸入框容器
  const inputContainer = findInputContainer();

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

  button.addEventListener('click', () => {
    togglePromptPanel();
  });

  // 插入到輸入框的上方
  if (inputContainer) {
    inputContainer.parentElement.insertBefore(button, inputContainer);
  } else {
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
    console.error('載入提示詞失敗:', error);
    promptsData = [];
  }

  // 找到輸入框容器
  const inputContainer = findInputContainer();

  // 建立面板容器
  promptPanel = document.createElement('div');
  promptPanel.id = 'prompt-manager-panel';
  promptPanel.className = 'prompt-panel';

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
    <div class="prompt-panel-search">
      <input type="text" id="prompt-search" placeholder="${t('searchPrompts')}" />
    </div>
    <div class="prompt-panel-list" id="prompt-panel-list">
      ${renderPromptList(promptsData)}
    </div>
  `;

  // 插入到輸入框上方
  if (inputContainer) {
    inputContainer.parentElement.insertBefore(promptPanel, inputContainer);
  } else {
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
}

/**
 * 找到輸入框容器
 */
function findInputContainer() {
  const selectors = [
    'textarea[data-id="root"]',
    '#prompt-textarea',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Send a message"]',
    'textarea'
  ];

  for (const selector of selectors) {
    const textarea = document.querySelector(selector);
    if (textarea) {
      // 找到最接近的表單容器
      return textarea.closest('form') || textarea.parentElement;
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

  return prompts.map(prompt => {
    const variables = extractVariables(prompt.content);
    return `
      <div class="prompt-item" data-id="${prompt.id}">
        <div class="prompt-item-header">
          <div class="prompt-item-title">${escapeHtml(prompt.name)}</div>
          <div class="prompt-item-actions">
            ${prompt.category ? `<span class="prompt-item-category">${escapeHtml(prompt.category)}</span>` : ''}
            <button class="prompt-item-edit" data-id="${prompt.id}" title="${t('edit')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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
      // 如果點擊的是編輯按鈕，不執行使用提示詞
      if (e.target.closest('.prompt-item-edit')) {
        return;
      }
      const id = item.dataset.id;
      const prompt = promptsData.find(p => p.id === id);
      if (prompt) {
        usePrompt(prompt);
      }
    });

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
  });
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

    const finalContent = replaceVariables(prompt.content, values);
    insertPromptToTextarea(finalContent);
    incrementUsageCount(prompt.id);
    togglePromptPanel();
  });

  // 聚焦第一個輸入框
  const firstInput = variablePanel.querySelector('.prompt-variable-input');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
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
      console.error('更新使用次數失敗:', error);
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
      console.error('保存失敗:', error);
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
        console.error('刪除失敗:', error);
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
 * 初始化
 */
async function init() {
  // 初始化語言設定
  await initLanguage();

  // 等待頁面載入完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createQuickAccessButton);
  } else {
    createQuickAccessButton();
  }
}

// 執行初始化
init();

// 監聽頁面變化（SPA 導航）
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    createQuickAccessButton();
  }
}).observe(document.body, { subtree: true, childList: true });
