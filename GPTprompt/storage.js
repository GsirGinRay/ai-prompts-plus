/** Chrome Storage facade. Prompt collection writes are serialized by background.js. */
const PROMPT_REQUEST_TIMEOUT_MS = 5000;

const StorageManager = {
  async request(action, payload = {}) {
    let timeoutId;
    try {
      const response = await Promise.race([
        chrome.runtime.sendMessage({ action, payload }),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Prompt background service did not respond.'));
          }, PROMPT_REQUEST_TIMEOUT_MS);
        })
      ]);
      if (!response?.success) throw new Error(response?.error || 'Prompt operation failed.');
      return response.data;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async getAllPrompts() {
    return this.request('prompt.list');
  },

  async savePrompt(prompt) {
    return this.request('prompt.save', { prompt });
  },

  async deletePrompt(id) {
    return this.request('prompt.delete', { id });
  },

  async incrementUsageCount(id) {
    return this.request('prompt.incrementUsage', { id });
  },

  async togglePinPrompt(id) {
    return this.request('prompt.togglePin', { id });
  },

  async searchPrompts(query) {
    const prompts = await this.getAllPrompts();
    const normalizedQuery = typeof query === 'string' ? query.trim().toLocaleLowerCase() : '';
    if (!normalizedQuery) return prompts;
    return prompts.filter(prompt =>
      prompt.name.toLocaleLowerCase().includes(normalizedQuery) ||
      prompt.content.toLocaleLowerCase().includes(normalizedQuery) ||
      (prompt.category || '').toLocaleLowerCase().includes(normalizedQuery)
    );
  },

  async exportPrompts() {
    const prompts = await this.getAllPrompts();
    return JSON.stringify({
      version: '2.0.10',
      exportedAt: new Date().toISOString(),
      prompts
    }, null, 2);
  },

  async importPrompts(jsonData, merge = true) {
    return this.request('prompt.import', { jsonData, merge });
  },

  extractVariables(content) {
    return VariableUtils.parseVariables(content).map(variable => variable.name);
  },

  replaceVariables(content, values) {
    return VariableUtils.replaceVariables(content, values);
  }
};
