/**
 * Popup 介面邏輯
 * 處理使用者介面互動和提示詞管理
 */

// DOM 元素
const searchInput = document.getElementById('searchInput');
const promptList = document.getElementById('promptList');
const emptyState = document.getElementById('emptyState');
const addPromptBtn = document.getElementById('addPromptBtn');
const editModal = document.getElementById('editModal');
const variableModal = document.getElementById('variableModal');
const closeModal = document.getElementById('closeModal');
const closeVariableModal = document.getElementById('closeVariableModal');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const langBtn = document.getElementById('langBtn');
const loadDefaultBtn = document.getElementById('loadDefaultBtn');

// 當前編輯的提示詞 ID
let currentEditingId = null;
let currentInsertingPrompt = null;

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化語言設定
  await I18n.init();
  I18n.updatePageTranslations();

  // 檢查是否是第一次使用，如果是則載入預設提示詞
  await initializeDefaultPrompts();

  await loadPrompts();
  setupEventListeners();
});

/**
 * 初始化預設提示詞（僅在第一次使用時）
 */
async function initializeDefaultPrompts() {
  try {
    const result = await chrome.storage.local.get(['prompts', 'defaultPromptsLoaded']);

    // 如果已經載入過預設提示詞，或者已經有提示詞了，就不再載入
    if (result.defaultPromptsLoaded || (result.prompts && result.prompts.length > 0)) {
      return;
    }

    // 根據當前語言獲取對應的預設提示詞
    const defaultPrompts = DefaultPrompts.getDefaultPrompts(I18n.currentLang);

    // 儲存預設提示詞
    await chrome.storage.local.set({
      prompts: defaultPrompts,
      defaultPromptsLoaded: true
    });

    console.log(`已載入 ${defaultPrompts.length} 個預設提示詞 (${I18n.currentLang})`);
  } catch (error) {
    console.error('載入預設提示詞失敗:', error);
  }
}

/**
 * 插入變數到文字區域
 */
function insertVariableToTextarea(varKey) {
  const varName = I18n.t(varKey);
  const textarea = document.getElementById('promptContent');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  textarea.value = text.substring(0, start) + `[${varName}]` + text.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + varName.length + 2;
}

/**
 * 設置事件監聽器
 */
function setupEventListeners() {
  // 語言切換
  langBtn.addEventListener('click', handleLanguageSwitch);

  // 載入預設提示詞
  loadDefaultBtn.addEventListener('click', handleLoadDefaultPrompts);

  // 搜尋
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // 新增提示詞
  addPromptBtn.addEventListener('click', () => openEditModal());

  // 模態框關閉
  closeModal.addEventListener('click', closeEditModal);
  closeVariableModal.addEventListener('click', closeVariableModalFunc);
  cancelBtn.addEventListener('click', closeEditModal);
  document.getElementById('cancelVariableBtn').addEventListener('click', closeVariableModalFunc);

  // 儲存提示詞
  saveBtn.addEventListener('click', handleSavePrompt);

  // 快速插入變數按鈕
  document.querySelectorAll('.var-btn').forEach(btn => {
    btn.addEventListener('click', () => insertVariableToTextarea(btn.dataset.varKey));
  });

  // 匯出/匯入
  exportBtn.addEventListener('click', handleExport);
  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleImport);

  // 插入提示詞
  document.getElementById('insertPromptBtn').addEventListener('click', handleInsertPrompt);

  // 點擊模態框背景關閉
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });
  variableModal.addEventListener('click', (e) => {
    if (e.target === variableModal) closeVariableModalFunc();
  });
}

/**
 * 處理語言切換
 */
async function handleLanguageSwitch() {
  const newLang = I18n.currentLang === 'zh-TW' ? 'en' : 'zh-TW';
  await I18n.setLanguage(newLang);
  I18n.updatePageTranslations();

  // 重新載入提示詞列表（如果需要更新動態內容）
  await loadPrompts(searchInput.value);
}

/**
 * 獲取多語言訊息
 */
function getLocalizedMessage(zhMessage, enMessage) {
  return I18n.currentLang === 'zh-TW' ? zhMessage : enMessage;
}

/**
 * 處理載入預設提示詞
 */
async function handleLoadDefaultPrompts() {
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  const isChineseBrowser = browserLang.startsWith('zh');
  let loadLang = I18n.currentLang;

  // 如果界面語言和瀏覽器語言不一致，詢問用戶
  const needAsk = (I18n.currentLang === 'zh-TW' && !isChineseBrowser) ||
                  (I18n.currentLang === 'en' && isChineseBrowser);

  if (needAsk) {
    const askMessage = getLocalizedMessage(
      '您的瀏覽器是英文，要載入英文版預設提示詞嗎？\n\n點擊「確定」載入英文版\n點擊「取消」載入中文版',
      'Your browser is Chinese, load Chinese prompts?\n\nOK = Chinese version\nCancel = English version'
    );
    const useEnglish = confirm(askMessage);
    loadLang = useEnglish ? 'en' : 'zh-TW';
  }

  const langLabel = loadLang === 'zh-TW' ? getLocalizedMessage('中文版', 'Chinese') : getLocalizedMessage('英文版', 'English');
  const message = getLocalizedMessage(
    `要載入 10 個預設提示詞嗎？(${langLabel})\n\n這不會刪除你現有的提示詞，會合併在一起。`,
    `Load 10 default prompts? (${langLabel} version)\n\nThis will not delete your existing prompts, they will be merged.`
  );

  if (!confirm(message)) {
    return;
  }

  try {
    const result = await chrome.storage.local.get('prompts');
    const existingPrompts = result.prompts || [];
    const defaultPrompts = DefaultPrompts.getDefaultPrompts(loadLang);

    const existingIds = new Set(existingPrompts.map(p => p.id));
    const newPrompts = defaultPrompts.filter(p => !existingIds.has(p.id));

    if (newPrompts.length === 0) {
      alert(getLocalizedMessage('所有預設提示詞都已經存在了！', 'All default prompts already exist!'));
      return;
    }

    await chrome.storage.local.set({
      prompts: [...existingPrompts, ...newPrompts],
      defaultPromptsLoaded: true
    });

    await loadPrompts(searchInput.value);
    alert(getLocalizedMessage(
      `成功載入 ${newPrompts.length} 個預設提示詞！`,
      `Successfully loaded ${newPrompts.length} default prompts!`
    ));
  } catch (error) {
    console.error('載入預設提示詞失敗:', error);
    alert(getLocalizedMessage('載入失敗，請重試', 'Load failed, please try again'));
  }
}

/**
 * 載入並顯示提示詞
 */
async function loadPrompts(query = '') {
  try {
    const prompts = query
      ? await StorageManager.searchPrompts(query)
      : await StorageManager.getAllPrompts();

    renderPrompts(prompts);
  } catch (error) {
    console.error('載入提示詞失敗:', error);
  }
}

/**
 * 渲染提示詞列表
 */
function renderPrompts(prompts) {
  promptList.innerHTML = '';

  if (prompts.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  prompts.forEach(prompt => {
    const card = createPromptCard(prompt);
    promptList.appendChild(card);
  });
}

/**
 * 建立提示詞卡片
 */
function createPromptCard(prompt) {
  const card = document.createElement('div');
  card.className = 'prompt-card';
  card.dataset.id = prompt.id;

  const variables = StorageManager.extractVariables(prompt.content);

  card.innerHTML = `
    <div class="prompt-card-header">
      <div>
        <div class="prompt-card-title">${escapeHtml(prompt.name)}</div>
        ${prompt.category ? `<span class="prompt-card-category">${escapeHtml(prompt.category)}</span>` : ''}
      </div>
      <div class="prompt-card-actions">
        <button class="edit-btn" title="編輯">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="delete-btn" title="刪除">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="prompt-card-content">${escapeHtml(prompt.content)}</div>
    ${variables.length > 0 ? `
      <div class="prompt-card-footer">
        ${variables.map(v => `<span class="variable-tag">[${escapeHtml(v)}]</span>`).join('')}
      </div>
    ` : ''}
  `;

  // 點擊卡片使用提示詞
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.prompt-card-actions')) {
      usePrompt(prompt);
    }
  });

  // 編輯按鈕
  card.querySelector('.edit-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(prompt);
  });

  // 刪除按鈕
  card.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deletePrompt(prompt.id);
  });

  return card;
}

/**
 * 開啟編輯模態框
 */
function openEditModal(prompt = null) {
  currentEditingId = prompt ? prompt.id : null;

  document.getElementById('modalTitle').textContent = prompt ? I18n.t('editPromptTitle') : I18n.t('addPromptTitle');
  document.getElementById('promptName').value = prompt ? prompt.name : '';
  document.getElementById('promptCategory').value = prompt ? (prompt.category || '') : '';
  document.getElementById('promptContent').value = prompt ? prompt.content : '';

  editModal.style.display = 'flex';
  document.getElementById('promptName').focus();
}

/**
 * 關閉編輯模態框
 */
function closeEditModal() {
  editModal.style.display = 'none';
  currentEditingId = null;
}

/**
 * 關閉變數輸入模態框
 */
function closeVariableModalFunc() {
  variableModal.style.display = 'none';
  currentInsertingPrompt = null;
}

/**
 * 儲存提示詞
 */
async function handleSavePrompt() {
  const name = document.getElementById('promptName').value.trim();
  const category = document.getElementById('promptCategory').value.trim();
  const content = document.getElementById('promptContent').value.trim();

  if (!name || !content) {
    alert(I18n.t('fillRequired'));
    return;
  }

  const prompt = {
    name,
    category,
    content
  };

  if (currentEditingId) {
    prompt.id = currentEditingId;
  }

  try {
    await StorageManager.savePrompt(prompt);
    closeEditModal();
    await loadPrompts(searchInput.value);
  } catch (error) {
    console.error('儲存失敗:', error);
    alert(I18n.t('saveFailed'));
  }
}

/**
 * 刪除提示詞
 */
async function deletePrompt(id) {
  if (!confirm(I18n.t('confirmDelete'))) {
    return;
  }

  try {
    await StorageManager.deletePrompt(id);
    await loadPrompts(searchInput.value);
  } catch (error) {
    console.error('刪除失敗:', error);
    alert(I18n.t('deleteFailed'));
  }
}

/**
 * 使用提示詞
 */
async function usePrompt(prompt) {
  const variables = StorageManager.extractVariables(prompt.content);

  if (variables.length === 0) {
    // 沒有變數，直接插入
    await insertToPage(prompt.content);
    await StorageManager.incrementUsageCount(prompt.id);
  } else {
    // 有變數，顯示輸入框
    currentInsertingPrompt = prompt;
    showVariableModal(variables);
  }
}

/**
 * 顯示變數輸入模態框
 */
function showVariableModal(variables) {
  const container = document.getElementById('variableInputs');
  container.innerHTML = '';

  variables.forEach(variable => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
      <label for="var-${variable}">${escapeHtml(variable)}</label>
      <input type="text" id="var-${variable}" data-variable="${variable}" placeholder="${I18n.t('enterVariable', { variable: escapeHtml(variable) })}" />
    `;
    container.appendChild(div);
  });

  // 功能1：使用事件委託，在 container 上監聽 Enter 鍵
  container.onkeydown = function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInsertPrompt();
    }
  };

  variableModal.style.display = 'flex';
  const firstInput = container.querySelector('input');
  if (firstInput) firstInput.focus();
}

/**
 * 處理插入提示詞
 */
async function handleInsertPrompt() {
  if (!currentInsertingPrompt) return;

  const inputs = document.querySelectorAll('#variableInputs input');
  const values = {};

  for (const input of inputs) {
    const variable = input.dataset.variable;
    const value = input.value.trim();
    if (!value) {
      alert(I18n.t('fillVariable', { variable }));
      input.focus();
      return;
    }
    values[variable] = value;
  }

  const finalContent = StorageManager.replaceVariables(currentInsertingPrompt.content, values);
  await insertToPage(finalContent);
  await StorageManager.incrementUsageCount(currentInsertingPrompt.id);

  closeVariableModalFunc();
}

/**
 * 使用備用方式複製到剪貼簿
 */
function copyWithFallback(content) {
  const textarea = document.createElement('textarea');
  textarea.value = content;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

/**
 * 複製內容到剪貼簿
 */
async function insertToPage(content) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content);
    } else {
      copyWithFallback(content);
    }

    showCopySuccess(getLocalizedMessage('已複製到剪貼簿！', 'Copied to clipboard!'));
  } catch (error) {
    console.error('複製失敗:', error);
    alert(getLocalizedMessage('複製失敗，請重試', 'Copy failed, please try again'));
  }
}

/**
 * 顯示複製成功提示
 */
function showCopySuccess(message) {
  // 建立提示元素
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // 動畫顯示
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 1秒後關閉 popup
  setTimeout(() => {
    window.close();
  }, 1000);
}

/**
 * 搜尋處理
 */
async function handleSearch(e) {
  await loadPrompts(e.target.value);
}

/**
 * 匯出提示詞
 */
async function handleExport() {
  try {
    const jsonData = await StorageManager.exportPrompts();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatgpt-prompts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('匯出失敗:', error);
    alert(I18n.t('exportFailed'));
  }
}

/**
 * 匯入提示詞
 */
async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const result = await StorageManager.importPrompts(event.target.result, true);
      alert(I18n.t('importSuccess', { count: result.count }));
      await loadPrompts();
      fileInput.value = ''; // 清空文件輸入
    } catch (error) {
      console.error('匯入失敗:', error);
      alert(I18n.t('importFailed'));
    }
  };
  reader.readAsText(file);
}

/**
 * 防抖函數
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * HTML 轉義
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
