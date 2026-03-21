/**
 * 國際化 (i18n) 管理模組
 * 處理多語言切換和翻譯
 */

const I18n = {
  // 當前語言
  currentLang: 'zh-TW',

  // 語言包
  messages: {
    'zh-TW': {
      // 標題
      appTitle: '💬 提示詞管理',

      // 按鈕
      addPrompt: '+ 新增提示詞',
      export: '匯出提示詞',
      import: '匯入提示詞',
      save: '儲存',
      cancel: '取消',
      edit: '編輯',
      delete: '刪除',
      insert: '複製提示詞',

      // 搜尋
      searchPlaceholder: '搜尋提示詞...',

      // 表單
      promptName: '提示詞名稱',
      promptNamePlaceholder: '例如：SEO 文章撰寫',
      promptCategory: '分類/標籤',
      promptCategoryPlaceholder: '例如：寫作、行銷、程式設計',
      promptContent: '提示詞內容',
      promptContentPlaceholder: '輸入提示詞內容，使用 [變數名稱] 格式標記變數\n例如：請幫我撰寫關於 [主題] 的文章...',
      required: '*',

      // 模態框標題
      addPromptTitle: '新增提示詞',
      editPromptTitle: '編輯提示詞',
      fillVariablesTitle: '填寫變數',

      // 提示訊息
      variableHint: '💡 使用 [變數名稱] 來標記可替換的內容',
      quickInsertVars: '快速插入變數：',
      emptyStateTitle: '尚無提示詞模板',
      emptyStateHint: '點擊上方「新增提示詞」開始使用',

      // 變數按鈕
      varTopic: '主題',
      varKeyword: '關鍵字',
      varAudience: '受眾',
      varWordCount: '字數',
      varTone: '語氣風格',

      // 提示訊息
      fillRequired: '請填寫提示詞名稱和內容',
      confirmDelete: '確定要刪除這個提示詞嗎？',
      saveFailed: '儲存失敗，請重試',
      deleteFailed: '刪除失敗，請重試',
      exportFailed: '匯出失敗，請重試',
      importSuccess: '成功匯入 {count} 個提示詞',
      importFailed: '匯入失敗，請確認檔案格式正確',
      insertFailed: '插入失敗，請確保您在 AI 對話頁面',
      notChatGPTPage: '請在 AI 對話頁面使用此功能',
      fillVariable: '請填寫 {variable}',
      enterVariable: '請輸入 {variable}',

      // 語言設定
      language: '語言',
      languageZhTW: '繁體中文',
      languageEn: 'English',

      // 載入預設提示詞
      loadDefaultPrompts: '載入預設提示詞'
    },

    'en': {
      // Titles
      appTitle: '💬 Prompt Manager',

      // Buttons
      addPrompt: '+ Add Prompt',
      export: 'Export Prompts',
      import: 'Import Prompts',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      insert: 'Copy Prompt',

      // Search
      searchPlaceholder: 'Search prompts...',

      // Form
      promptName: 'Prompt Name',
      promptNamePlaceholder: 'e.g., SEO Article Writing',
      promptCategory: 'Category/Tags',
      promptCategoryPlaceholder: 'e.g., Writing, Marketing, Programming',
      promptContent: 'Prompt Content',
      promptContentPlaceholder: 'Enter prompt content, use [variable_name] format for variables\ne.g., Write an article about [topic]...',
      required: '*',

      // Modal Titles
      addPromptTitle: 'Add Prompt',
      editPromptTitle: 'Edit Prompt',
      fillVariablesTitle: 'Fill Variables',

      // Hints
      variableHint: '💡 Use [variable_name] to mark replaceable content',
      quickInsertVars: 'Quick Insert Variables:',
      emptyStateTitle: 'No prompt templates yet',
      emptyStateHint: 'Click "Add Prompt" above to get started',

      // Variable Buttons
      varTopic: 'topic',
      varKeyword: 'keyword',
      varAudience: 'audience',
      varWordCount: 'word_count',
      varTone: 'tone',

      // Messages
      fillRequired: 'Please fill in prompt name and content',
      confirmDelete: 'Are you sure you want to delete this prompt?',
      saveFailed: 'Save failed, please try again',
      deleteFailed: 'Delete failed, please try again',
      exportFailed: 'Export failed, please try again',
      importSuccess: 'Successfully imported {count} prompt(s)',
      importFailed: 'Import failed, please check file format',
      insertFailed: 'Insert failed, please ensure you are on an AI conversation page',
      notChatGPTPage: 'Please use this feature on an AI conversation page',
      fillVariable: 'Please fill in {variable}',
      enterVariable: 'Enter {variable}',

      // Language Settings
      language: 'Language',
      languageZhTW: '繁體中文',
      languageEn: 'English',

      // Load Default Prompts
      loadDefaultPrompts: 'Load Default Prompts'
    }
  },

  /**
   * 初始化語言設定
   */
  async init() {
    // 從 storage 讀取保存的語言設定
    const result = await chrome.storage.local.get('language');
    if (result.language) {
      this.currentLang = result.language;
    } else {
      // 檢測瀏覽器語言
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang.startsWith('zh')) {
        this.currentLang = 'zh-TW';
      } else {
        this.currentLang = 'en';
      }
      await this.setLanguage(this.currentLang);
    }
    return this.currentLang;
  },

  /**
   * 設定語言
   */
  async setLanguage(lang) {
    this.currentLang = lang;
    await chrome.storage.local.set({ language: lang });
  },

  /**
   * 獲取翻譯文字
   */
  t(key, params = {}) {
    let text = this.messages[this.currentLang]?.[key] || this.messages['zh-TW'][key] || key;

    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{${param}}`, value);
    }

    return text;
  },

  /**
   * 更新頁面所有翻譯
   */
  updatePageTranslations() {
    // 更新所有帶有 data-i18n 屬性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      element.textContent = this.t(key);
    });

    // 更新所有帶有 data-i18n-placeholder 屬性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.dataset.i18nPlaceholder;
      element.placeholder = this.t(key);
    });

    // 更新所有帶有 data-i18n-title 屬性的元素
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.dataset.i18nTitle;
      element.title = this.t(key);
    });

    // 更新 HTML lang 屬性
    document.documentElement.lang = this.currentLang;
  },

};

