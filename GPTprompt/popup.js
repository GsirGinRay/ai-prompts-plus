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

// 當前編輯的提示詞 ID
let currentEditingId = null;
let currentInsertingPrompt = null;

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadPrompts();
  setupEventListeners();
});

/**
 * 設置事件監聽器
 */
function setupEventListeners() {
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
    btn.addEventListener('click', () => {
      const varName = btn.dataset.var;
      const textarea = document.getElementById('promptContent');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      textarea.value = before + `[${varName}]` + after;
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + varName.length + 2;
    });
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

  document.getElementById('modalTitle').textContent = prompt ? '編輯提示詞' : '新增提示詞';
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
    alert('請填寫提示詞名稱和內容');
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
    alert('儲存失敗，請重試');
  }
}

/**
 * 刪除提示詞
 */
async function deletePrompt(id) {
  if (!confirm('確定要刪除這個提示詞嗎？')) {
    return;
  }

  try {
    await StorageManager.deletePrompt(id);
    await loadPrompts(searchInput.value);
  } catch (error) {
    console.error('刪除失敗:', error);
    alert('刪除失敗，請重試');
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
      <input type="text" id="var-${variable}" data-variable="${variable}" placeholder="請輸入 ${escapeHtml(variable)}" />
    `;
    container.appendChild(div);
  });

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
      alert(`請填寫 ${variable}`);
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
 * 插入內容到 ChatGPT 頁面
 */
async function insertToPage(content) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.url && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'insertPrompt',
        content: content
      });
      window.close(); // 關閉 popup
    } else {
      alert('請在 ChatGPT 頁面使用此功能');
    }
  } catch (error) {
    console.error('插入失敗:', error);
    alert('插入失敗，請確保您在 ChatGPT 頁面');
  }
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
    alert('匯出失敗，請重試');
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
      alert(`成功匯入 ${result.count} 個提示詞`);
      await loadPrompts();
      fileInput.value = ''; // 清空文件輸入
    } catch (error) {
      console.error('匯入失敗:', error);
      alert('匯入失敗，請確認檔案格式正確');
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
