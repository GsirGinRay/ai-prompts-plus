# ChatGPT Prompt Manager

[English](#english) | [繁體中文](#繁體中文)

---

## English

A powerful Chrome extension for managing and quickly using ChatGPT prompt templates with variable replacement and fast insertion features.

### Features

- **Prompt Management**: Add, edit, delete prompt templates with categorization and tagging
- **Variable Replacement**: Use `[variable_name]` format for dynamic content
- **Multi-language Support**: Switch between Traditional Chinese and English
- **Import/Export**: Backup and share your prompts as JSON files
- **Quick Access**: Floating button on ChatGPT pages for instant access
- **Usage Statistics**: Track how often you use each prompt

### Installation

#### From Chrome Web Store
Coming soon...

#### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/GsirGinRay/chatgpt-prompt-manager.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the `GPTprompt` folder

5. Visit [ChatGPT](https://chat.openai.com) and start using the extension!

### Usage

1. **Add a Prompt**: Click the extension icon and add your prompt template
2. **Use Variables**: Insert `[topic]`, `[audience]`, etc. in your prompts
3. **Quick Insert**: Click on any prompt to auto-fill the ChatGPT input
4. **Language Switch**: Toggle between English and Traditional Chinese in settings

### Example Prompts

```
Write an article about [topic] for [audience]
with approximately [word_count] words.
```

### Technical Stack

- Manifest V3
- Chrome Storage API
- Pure vanilla JavaScript
- No external dependencies

### License

MIT License - see [LICENSE](LICENSE) file for details

### Contributing

Issues and Pull Requests are welcome!

---

## 繁體中文

一個功能強大的 Chrome 擴充功能，幫助您管理和快速使用 ChatGPT 提示詞模板，支援自訂變數和快速插入功能。

### 主要功能

- **提示詞管理**：新增、編輯、刪除提示詞模板，支援分類和標籤
- **變數替換**：使用 `[變數名稱]` 格式標記可替換內容
- **多語言支援**：繁體中文與英文介面自由切換
- **匯入/匯出**：備份和分享您的提示詞為 JSON 檔案
- **快速訪問**：ChatGPT 頁面浮動按鈕，一鍵開啟
- **使用統計**：追蹤每個提示詞的使用次數

### 安裝方式

#### 從 Chrome 線上應用程式商店
即將推出...

#### 從原始碼安裝

1. 複製此專案：
   ```bash
   git clone https://github.com/GsirGinRay/chatgpt-prompt-manager.git
   ```

2. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`

3. 開啟右上角的「開發人員模式」

4. 點擊「載入未封裝項目」，選擇 `GPTprompt` 資料夾

5. 前往 [ChatGPT](https://chat.openai.com) 開始使用！

### 使用說明

1. **新增提示詞**：點擊擴充功能圖示，新增您的提示詞模板
2. **使用變數**：在提示詞中插入 `[主題]`、`[受眾]` 等變數
3. **快速插入**：點擊任何提示詞即可自動填入 ChatGPT 輸入框
4. **語言切換**：在設定中切換繁體中文與英文介面

### 提示詞範例

```
請幫我撰寫一篇關於 [主題] 的文章，
目標受眾是 [受眾]，
文章長度約 [字數] 字。
```

### 技術架構

- Manifest V3
- Chrome Storage API
- 純原生 JavaScript
- 無第三方依賴

### 授權條款

MIT License - 詳見 [LICENSE](LICENSE) 檔案

### 貢獻

歡迎提交 Issue 和 Pull Request！

---

**Made with ❤️ for better ChatGPT experience**
