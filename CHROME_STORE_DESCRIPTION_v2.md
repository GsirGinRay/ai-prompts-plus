# Chrome Web Store 商店資料 — v2.0.7

## 繁體中文

### 簡短說明（132 字元內）
跨平台 AI 提示詞管理工具，支援 ChatGPT、Claude、Gemini、Grok、變數預設值、搜尋與雙語介面。

### 詳細說明
AI 提示詞+ — 你的 AI 對話效率神器。

支援 4 大主流 AI 平台：ChatGPT、Claude、Gemini、Grok。你可以建立自己的提示詞圖書館，快速搜尋、分類、置頂與插入常用模板。

主要功能：
- 建立、編輯、刪除、分類、搜尋及置頂提示詞
- 匯入／匯出 JSON 備份
- 自動辨識既有 `[變數名稱]`
- 支援 `[變數名稱|預設內容]`，使用時可沿用或修改預設值
- 編輯框以顏色區分變數名稱與預設內容
- 「插入提示詞」：保留目前草稿與附件，先檢查、補充或修改後，再由使用者手動送出
- 不會自動按下 AI 平台的送出鍵，避免提示詞或附件尚未確認就送出
- 右側大型面板，避免與 AI 網站輸入框衝突
- 繁體中文與英文介面

🎁 加入免費社群，領取 100+ 精選提示詞！

AI 投資學院+ 免費社群提供涵蓋工作、學習、創作等場景的提示詞模板，持續更新中：
👉 https://link.brain168.com/ai-invest

無論你是 AI 新手還是進階使用者，AI 提示詞+ 都能幫助你更有效率地與 AI 對話。

💡 由 AI 投資學院+ 團隊開發與維護。

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
隱私權政策：https://github.com/GsirGinRay/ai-prompts-plus#privacy-policy

## English

### Short description (132 characters max)
Cross-platform prompt manager for ChatGPT, Claude, Gemini, and Grok with variables, search, quick insertion, and bilingual UI.

### Detailed description
AI Prompts+ — your AI conversation productivity toolkit.

Use one prompt library across ChatGPT, Claude, Google Gemini, and Grok. Create, organize, search, and quickly insert reusable templates without repeatedly rewriting the same instructions.

Key features:
- Create, edit, delete, categorize, search, and pin prompts
- Import/export JSON backups
- Automatically recognize legacy `[variable]` templates
- Optional defaults with `[variable|default content]`
- Color-coded variable names and defaults in the editor
- “Insert Prompt” keeps the current draft and attachments so users can review, add context, or edit before manually sending
- The extension never presses the AI platform send button automatically
- Large right-side panel isolated from AI site composers
- Traditional Chinese and English UI

🎁 Join the free community and get 100+ curated prompts!

The AI Investment Academy+ community shares prompt templates for work, learning, and creative projects, with new resources added over time:
👉 https://link.brain168.com/ai-invest

Whether you are new to AI or an advanced user, AI Prompts+ helps you have more effective conversations with AI.

💡 Built and maintained by the AI Investment Academy+ team.

Permissions:
- `storage` stores prompts, settings, pins, and local usage counts on the device
- Access to the four supported AI sites displays the UI and performs user-requested insertion only
- No activeTab, browsing history, tabs, identity, analytics, telemetry, ads, or remote code

Source and support: https://github.com/GsirGinRay/ai-prompts-plus
Privacy policy: https://github.com/GsirGinRay/ai-prompts-plus#privacy-policy

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