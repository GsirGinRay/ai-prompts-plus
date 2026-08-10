# AI 提示詞+ / AI Prompts+

**AI 投資學院+ 官方推薦工具 / Recommended by AI Investment Academy+**

Version 2.0.7

[繁體中文](#繁體中文) · [English](#english) · [Privacy Policy](#privacy-policy)

## 繁體中文

AI 提示詞+ 是一款支援 ChatGPT、Claude、Google Gemini 與 Grok 的 Chrome 提示詞圖書館。你可以建立、分類、搜尋及置頂常用模板，使用變數與預設值快速客製內容，再將提示詞插入目前的 AI 對話框中檢查後手動送出。

### 主要功能

- 在 ChatGPT、Claude、Gemini 與 Grok 共用一套提示詞圖書館
- 建立、編輯、刪除、分類、搜尋及置頂提示詞
- 相容既有的 [變數名稱] 語法
- 支援 [變數名稱|預設內容]，使用時可沿用或修改預設值
- 編輯框以顏色區分變數名稱與預設內容
- 匯入與匯出 JSON 備份
- 插入時保留目前草稿與附件
- 不會自動按下 AI 平台送出鍵，由使用者檢查後手動送出
- 提供繁體中文與英文介面

### 使用方式

1. 點擊擴充功能圖示，建立一則提示詞。
2. 選取需要替換的文字並點擊「設為變數」，或直接輸入 [名稱]、[名稱|預設內容]。
3. 前往支援的 AI 平台，點擊輸入框附近的「提示詞」按鈕。
4. 選擇模板並填寫變數。
5. 點擊「插入提示詞」，檢查、修改或加入附件後，再自行送出。

變數範例：

    請為 [產品名稱] 撰寫一篇面向 [目標客群|新手使用者] 的介紹。

### 開發版本安裝

1. 下載或 clone 此專案。
2. 前往 chrome://extensions/。
3. 開啟「開發人員模式」。
4. 點擊「載入未封裝項目」，選擇 GPTprompt/ 資料夾。

### 免費提示詞社群

AI 投資學院+ 社群提供涵蓋工作、學習與創作等場景的 100+ 精選提示詞，並持續更新：

[加入 AI 投資學院+](https://link.brain168.com/ai-invest)

## English

AI Prompts+ is a Chrome prompt library for ChatGPT, Claude, Google Gemini, and Grok. Create, categorize, search, and pin reusable templates; customize them with variables and optional defaults; then insert prompts into the active AI composer for review before manually sending.

### Key features

- Use one prompt library across ChatGPT, Claude, Gemini, and Grok
- Create, edit, delete, categorize, search, and pin prompts
- Recognize existing [variable] syntax
- Support optional defaults with [variable|default content]
- Color-code variable names and default content in the editor
- Import and export JSON backups
- Preserve the current draft and attachments when inserting
- Never press the AI platform send button automatically
- Provide Traditional Chinese and English interfaces

### How to use

1. Click the extension icon and create a prompt.
2. Select replaceable text and choose “Set as Variable,” or type [name] or [name|default content] directly.
3. Open a supported AI platform and click the “Prompts” button near its composer.
4. Choose a template and complete any variables.
5. Click “Insert Prompt,” review or edit it, add attachments if needed, and send it manually.

Variable example:

    Write an introduction for [product name] aimed at [target audience|new users].

### Install the development version

1. Download or clone this repository.
2. Open chrome://extensions/.
3. Enable Developer mode.
4. Select “Load unpacked” and choose the GPTprompt/ folder.

### Free prompt community

The AI Investment Academy+ community shares 100+ curated prompts for work, learning, and creative projects, with new resources added over time:

[Join AI Investment Academy+](https://link.brain168.com/ai-invest)

## Privacy Policy

Last updated: August 10, 2026 / 最後更新：2026 年 8 月 10 日

### 繁體中文

AI 提示詞+ 的單一用途，是讓使用者在 ChatGPT、Claude、Google Gemini 與 Grok 建立、管理及插入提示詞模板，供使用者檢查後手動送出。

- **本機資料**：提示詞名稱、分類、內容、變數與預設值、介面設定、建立與更新時間、置頂狀態、使用次數及最近使用時間，皆保存在使用者裝置的 chrome.storage.local。開發者沒有接收這些資料的後端。
- **AI 平台**：只有使用者明確點擊「插入提示詞」時，所選模板與填入的變數內容才會寫入目前 AI 平台的輸入框。擴充功能不會自動按下送出鍵；是否送出由使用者決定。擴充功能不讀取或上傳既有對話與附件，也不會把提示詞或目前對話網址傳給開發者。
- **權限**：storage 用於保存本機提示詞與設定；ChatGPT、Claude、Gemini、Grok 的網站權限僅用於顯示提示詞介面及執行使用者要求的插入操作。擴充功能不要求瀏覽紀錄、分頁或身分驗證等非必要權限，也不執行遠端程式碼。
- **第三方與 Limited Use**：擴充功能沒有分析、遙測、廣告 SDK、後端 API 或資料經紀服務。資料只用於提供或改善上述單一功能，不出售或移轉給廣告平台、資料經紀商或資訊轉售者，也不用於個人化廣告、信用評估或貸款。開發者或其他人員不會閱讀使用者的提示詞或對話。
- **使用者控制**：使用者可隨時編輯、刪除、匯入或匯出提示詞。移除擴充功能時，Chrome 會依其機制移除本機資料；建議移除前先匯出需要保留的內容。

問題可透過 [GitHub Issues](https://github.com/GsirGinRay/ai-prompts-plus/issues) 聯絡。

### English

AI Prompts+ has one purpose: helping users create, manage, and insert prompt templates on ChatGPT, Claude, Google Gemini, and Grok for review before manual sending.

- **Local data**: Prompt names, categories, content, variables and defaults, interface preferences, timestamps, pin state, local usage counts, and last-used times are stored on the user's device with chrome.storage.local. The developer operates no backend that receives this data.
- **AI platforms**: Only when the user explicitly selects “Insert Prompt” does the chosen template and supplied variable content enter the active AI site's composer. The extension never presses the send button automatically; the user decides whether to send it. The extension does not read or upload existing conversations or attachments and does not send prompts or the current conversation URL to the developer.
- **Permissions**: storage saves local prompts and settings. Host access to ChatGPT, Claude, Gemini, and Grok is used only to display the prompt interface and perform user-requested insertion. The extension does not request browsing history, tabs, identity, or other unnecessary permissions and executes no remote code.
- **Third parties and Limited Use**: There is no analytics, telemetry, advertising SDK, backend API, or data broker. Information is used only to provide or improve the disclosed single purpose; it is not sold or transferred to advertising platforms, data brokers, or information resellers; it is not used for personalized advertising, creditworthiness, or lending; and humans are not allowed to read users' prompts or conversations.
- **User control**: Users can edit, delete, import, or export prompts at any time. Chrome removes extension-local data according to its uninstall behavior; export anything that should be retained before uninstalling.

Questions may be submitted through [GitHub Issues](https://github.com/GsirGinRay/ai-prompts-plus/issues).

## Changelog / 更新日誌

### v2.0.7 — 2026-08-10

- Added localized Chrome Web Store metadata for Traditional Chinese and English / 新增 Chrome Web Store 繁體中文與英文多語系資訊
- Added optional variable defaults and editor color highlighting / 新增變數預設值語法與編輯器顏色提示
- Fixed focus and insertion behavior on all supported AI platforms / 修復四個 AI 平台的欄位焦點與插入行為
- Preserved drafts and attachments during insertion / 插入提示詞時保留現有草稿與附件
- Standardized manual sending on every platform / 所有平台統一由使用者檢查後手動送出
- Improved panel isolation, safety, import validation, and performance / 強化面板隔離、安全性、匯入驗證與效能

See [CHANGELOG.md](CHANGELOG.md) for previous releases.

## License / 授權

[MIT License](LICENSE)

Made with ❤️ for better AI conversations.
