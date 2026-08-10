# Chrome Web Store 商店資料 — v2.0.7

## 繁體中文

### 簡短說明（132 字元內）
支援 ChatGPT、Claude、Gemini、Grok 的本機提示詞管理工具，提供變數預設值、搜尋與安全的提示詞插入。

### 詳細說明
AI 提示詞+ 幫助你在 ChatGPT、Claude、Google Gemini 與 Grok 建立、整理及使用提示詞模板。所有提示詞與設定都保存在本機，沒有分析、遙測或後端帳號。

主要功能：
- 建立、編輯、刪除、分類、搜尋及置頂提示詞
- 匯入／匯出 JSON 備份
- 自動辨識既有 `[變數名稱]`
- 支援 `[變數名稱|預設內容]`，使用時可沿用或修改預設值
- 編輯框以顏色區分變數名稱與預設內容
- 「插入提示詞」：保留草稿與附件，先檢查、補充或修改後再由使用者手動送出
- 不會自動按下 AI 平台的送出鍵，避免提示詞或附件尚未確認就送出
- 右側大型面板，避免與 AI 網站輸入框衝突
- 繁體中文與英文介面

變數範例：
`請為 [產品名稱] 撰寫一篇面向 [目標客群|新手使用者] 的介紹。`

支援平台：
- ChatGPT：chat.openai.com、chatgpt.com
- Claude：claude.ai
- Google Gemini：gemini.google.com
- Grok：grok.com

隱私與權限：
- `storage`：在裝置本機保存提示詞、設定、置頂與使用次數
- 四平台網站權限：只用於顯示面板，並依使用者操作插入提示詞
- 不要求 activeTab、瀏覽紀錄、分頁或身分權限
- 不使用遠端程式碼、分析、遙測或廣告 SDK
- 只有按下「插入提示詞」時，選定內容才會寫入正在使用的 AI 平台輸入框；是否送出由使用者決定

原始碼與支援：https://github.com/GsirGinRay/ai-prompts-plus
隱私權政策：https://gsirginray.github.io/ai-prompts-plus/privacy.html

## English

### Short description (132 characters max)
Local prompt manager for ChatGPT, Claude, Gemini, and Grok with variables, defaults, search, and safe review-before-send insertion.

### Detailed description
AI Prompts+ helps users create, organize, and use prompt templates on ChatGPT, Claude, Google Gemini, and Grok. Prompts and settings stay in local Chrome storage. There is no analytics, telemetry, backend account, or remote code.

Key features:
- Create, edit, delete, categorize, search, and pin prompts
- Import/export JSON backups
- Automatically recognize legacy `[variable]` templates
- Optional defaults with `[variable|default content]`
- Color-coded variable names and defaults in the editor
- “Insert Prompt” keeps the current draft and attachments so users can review or add context before manually sending
- The extension never presses the AI platform send button automatically
- Large right-side panel isolated from AI site composers
- Traditional Chinese and English UI

Permissions:
- `storage` stores prompts, settings, pins, and local usage counts on the device
- Access to the four supported AI sites displays the UI and performs user-requested insertion only
- No activeTab, browsing history, tabs, identity, analytics, telemetry, ads, or remote code

Source and support: https://github.com/GsirGinRay/ai-prompts-plus
Privacy policy: https://gsirginray.github.io/ai-prompts-plus/privacy.html

## Privacy practices dashboard copy

### Single purpose
Allow users to create, manage, and insert locally stored prompt templates on ChatGPT, Claude, Google Gemini, and Grok for review before manual sending.

### storage justification
Stores user-created prompt templates, local preferences, pin state, timestamps, and local usage counts on the user's device.

### Host permission justification
Access to chat.openai.com/chatgpt.com, claude.ai, gemini.google.com, and grok.com is required to show the prompt manager and, only after explicit user action, insert the chosen prompt in the active site's composer. The extension does not submit it.

### Remote code
No. All executable code is packaged with the extension.

### Data disclosure
The extension handles user-generated prompt content and local feature metadata on the device. It does not transmit these to the developer. A selected prompt is written to the active AI platform composer only when the user explicitly requests insertion; the user decides whether to send it.

### Limited Use certification
The extension's use of information complies with the Chrome Web Store User Data Policy, including the Limited Use requirements.