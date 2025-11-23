/**
 * 資料儲存管理模組
 * 使用 Chrome Storage API 進行資料持久化
 */

const StorageManager = {
  /**
   * 獲取所有提示詞
   * @returns {Promise<Array>} 提示詞陣列
   */
  async getAllPrompts() {
    try {
      const result = await chrome.storage.local.get('prompts');
      return result.prompts || [];
    } catch (error) {
      console.error('獲取提示詞失敗:', error);
      return [];
    }
  },

  /**
   * 儲存提示詞
   * @param {Object} prompt - 提示詞物件
   * @returns {Promise<Object>} 儲存後的提示詞物件
   */
  async savePrompt(prompt) {
    try {
      const prompts = await this.getAllPrompts();

      // 如果有 ID，則更新現有提示詞
      if (prompt.id) {
        const index = prompts.findIndex(p => p.id === prompt.id);
        if (index !== -1) {
          prompts[index] = {
            ...prompt,
            updatedAt: new Date().toISOString()
          };
        }
      } else {
        // 新增提示詞
        const newPrompt = {
          ...prompt,
          id: this.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        };
        prompts.push(newPrompt);
      }

      await chrome.storage.local.set({ prompts });
      return prompt;
    } catch (error) {
      console.error('儲存提示詞失敗:', error);
      throw error;
    }
  },

  /**
   * 刪除提示詞
   * @param {string} id - 提示詞 ID
   * @returns {Promise<boolean>} 刪除是否成功
   */
  async deletePrompt(id) {
    try {
      const prompts = await this.getAllPrompts();
      const filteredPrompts = prompts.filter(p => p.id !== id);
      await chrome.storage.local.set({ prompts: filteredPrompts });
      return true;
    } catch (error) {
      console.error('刪除提示詞失敗:', error);
      return false;
    }
  },

  /**
   * 根據 ID 獲取提示詞
   * @param {string} id - 提示詞 ID
   * @returns {Promise<Object|null>} 提示詞物件或 null
   */
  async getPromptById(id) {
    try {
      const prompts = await this.getAllPrompts();
      return prompts.find(p => p.id === id) || null;
    } catch (error) {
      console.error('獲取提示詞失敗:', error);
      return null;
    }
  },

  /**
   * 增加提示詞使用次數
   * @param {string} id - 提示詞 ID
   */
  async incrementUsageCount(id) {
    try {
      const prompts = await this.getAllPrompts();
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        prompt.usageCount = (prompt.usageCount || 0) + 1;
        prompt.lastUsedAt = new Date().toISOString();
        await chrome.storage.local.set({ prompts });
      }
    } catch (error) {
      console.error('更新使用次數失敗:', error);
    }
  },

  /**
   * 搜尋提示詞
   * @param {string} query - 搜尋關鍵字
   * @returns {Promise<Array>} 符合的提示詞陣列
   */
  async searchPrompts(query) {
    try {
      const prompts = await this.getAllPrompts();
      if (!query || query.trim() === '') {
        return prompts;
      }

      const lowerQuery = query.toLowerCase();
      return prompts.filter(prompt =>
        prompt.name.toLowerCase().includes(lowerQuery) ||
        prompt.content.toLowerCase().includes(lowerQuery) ||
        (prompt.category && prompt.category.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('搜尋提示詞失敗:', error);
      return [];
    }
  },

  /**
   * 匯出所有提示詞為 JSON
   * @returns {Promise<string>} JSON 字串
   */
  async exportPrompts() {
    try {
      const prompts = await this.getAllPrompts();
      return JSON.stringify({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        prompts: prompts
      }, null, 2);
    } catch (error) {
      console.error('匯出提示詞失敗:', error);
      throw error;
    }
  },

  /**
   * 匯入提示詞
   * @param {string} jsonData - JSON 字串
   * @param {boolean} merge - 是否合併現有提示詞（true）或覆蓋（false）
   * @returns {Promise<Object>} 匯入結果
   */
  async importPrompts(jsonData, merge = true) {
    try {
      const data = JSON.parse(jsonData);

      if (!data.prompts || !Array.isArray(data.prompts)) {
        throw new Error('無效的資料格式');
      }

      let prompts = [];
      if (merge) {
        prompts = await this.getAllPrompts();
      }

      // 匯入的提示詞生成新 ID 以避免衝突
      const importedPrompts = data.prompts.map(p => ({
        ...p,
        id: this.generateId(),
        importedAt: new Date().toISOString()
      }));

      prompts = [...prompts, ...importedPrompts];
      await chrome.storage.local.set({ prompts });

      return {
        success: true,
        count: importedPrompts.length
      };
    } catch (error) {
      console.error('匯入提示詞失敗:', error);
      throw error;
    }
  },

  /**
   * 生成唯一 ID
   * @returns {string} 唯一 ID
   */
  generateId() {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * 從提示詞內容中提取變數
   * @param {string} content - 提示詞內容
   * @returns {Array<string>} 變數名稱陣列
   */
  extractVariables(content) {
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
  },

  /**
   * 替換提示詞中的變數
   * @param {string} content - 提示詞內容
   * @param {Object} values - 變數值對應物件 {變數名: 值}
   * @returns {string} 替換後的內容
   */
  replaceVariables(content, values) {
    let result = content;

    for (const [variable, value] of Object.entries(values)) {
      const regex = new RegExp(`\\[${variable}\\]`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }
};

// 如果在 popup 或 content script 中使用，則匯出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
