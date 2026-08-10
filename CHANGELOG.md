# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.7] - 2026-08-10

### Added
- 支援既有 `[名稱]` 與含預設內容的 `[名稱|預設值]` 變數格式
- 提示詞編輯器以不同顏色顯示變數名稱與預設內容，並支援中文輸入法
- 四平台統一為「插入提示詞」模式，內容插入後由使用者檢查並手動送出
- 匯入檔案採 5 MiB／1,000 筆／欄位長度／合併容量的原子驗證

### Changed
- 四平台統一使用 480px 右側面板，採 closed Shadow DOM 隔離本機提示詞資料
- 插入會取代選取範圍或從游標位置插入，保留既有草稿與附件
- 提示詞 CRUD 統一經 background service worker 的序列化佇列處理
- 搜尋加入 debounce、每批 100 筆渲染與事件委派
- 面板樣式與提示詞資料在頁面初始化時預載，SPA 重建後於一秒內恢復

### Fixed
- 修復快速按鈕意外觸發網站表單送出的問題
- 修復 Grok 變數欄位點擊後焦點跳回對話框的問題
- 修復 closed Shadow DOM 搜尋事件 retargeting 導致 `startsWith` 例外
- 修復大量未閉合中括號造成解析卡頓，並避免改寫合法矩陣括號
- 移除自動點擊送出與 synthetic Enter，避免誤送、假成功及草稿遺失
- 修復編輯提示詞時遺失建立時間、使用次數、置頂及匯入資訊
- 修復多分頁同時寫入造成提示詞互相覆蓋
- 修復匯入內容注入、面板事件穿透、計時器重複及 Gemini 按鈕消失

### Security and privacy
- 使用者內容以 DOM property／`textContent` 建立，避免 attribute 注入
- 推廣連結加入 opener 與 referrer 防護，不傳送提示詞或對話網址
- 保持只有 `storage` 與既有四平台 host permissions，無遙測、後端或遠端程式碼

---
## [2.0.5] - 2026-01-20

### Fixed
- **權限優化**：移除未使用的 `activeTab` 權限（Chrome Web Store 審核要求）
  - 擴充功能僅需 `storage` 權限即可正常運作
  - 符合 Chrome 擴充功能最小權限原則

---

## [2.0.4] - 2026-01-10

### Added
- **推廣橫幅**：在提示詞面板內新增 AI投資學院+ 社群推廣橫幅
  - 首次安裝時顯示
  - 之後每週顯示一次
  - 提供「不再提醒」選項

### Changed
- **彈出視窗行為變更**：點擊擴充功能圖示的彈出視窗現在改為「複製到剪貼簿」
  - 可在任何網頁使用，不再限制於 AI 平台
  - 複製成功後顯示黑色提示訊息
  - 對話框面板（AI 頁面內）維持原本的「插入並送出」功能

---

## [2.0.3] - 2026-01-10

### Fixed
- **Claude 平台按鈕問題**：修復 Claude 平台進入後需要新開頁面才能看到按鈕的問題
  - SPA 導航時改用 `retryCreateButton()` 確保有重試機制
  - 使用 `data-testid="chat-input"` 作為主要選擇器，更可靠
  - 移除對 `mx-2` 的依賴（桌面端會變成 `mx-0`）
  - 按鈕寬度現在與輸入框同寬
- **Grok 平台送出問題**：修復 Grok 平台提示詞無法填入輸入框和點擊送出按鈕的問題
  - Grok 使用 `contenteditable` div 而非 textarea，已更新選擇器
  - 更新發送按鈕選擇器為 `button[type="submit"][aria-label="提交"]`
- **Grok 變數輸入焦點問題**：修復在 Grok 平台輸入變數時，焦點會跳到主輸入框的問題
  - 阻止變數輸入框的所有事件冒泡，防止 Grok 頁面捕獲事件

### Technical
- 更新 Grok textarea 選擇器：`div[contenteditable="true"].tiptap.ProseMirror`
- 更新 Grok sendButton 選擇器：`button[type="submit"][aria-label="提交"]`
- 重構 Claude 按鈕插入邏輯，優先使用 `chat-input` 定位
- 優化 Enter 鍵備用方案，支援所有平台的 contenteditable 編輯器

---

## [2.0.2] - 2025-01-08

### Added
- **Claude 支援**：新增支援 Anthropic Claude AI 平台 (claude.ai)
- **Grok 支援**：新增支援 xAI Grok 平台 (grok.com)
- **變數輸入 Enter 鍵支援**：在變數輸入框按 Enter 鍵可直接執行提示詞

### Changed
- **平台支援擴展**：從原本的 ChatGPT + Gemini，擴展到支援四個 AI 平台
- **多語言提示更新**：將「ChatGPT」相關提示改為通用「AI 對話頁面」

### Technical
- 新增 Claude 和 Grok 平台檢測和選擇器配置
- 優化按鈕插入邏輯，適應不同平台的 DOM 結構
- 定期檢查機制，確保按鈕在動態頁面中持續存在
- 更新 `manifest.json` 的 host_permissions 和 content_scripts.matches

---

## [2.0.0] - 2024-11-26

### Added
- **直接刪除功能**：在提示詞列表項目直接添加刪除按鈕，無需進入編輯模式
- **置頂功能**：新增星星圖標按鈕，可將常用提示詞置頂顯示
- **智能排序**：置頂項目優先顯示，其他按使用次數排序
- **視覺標記**：置頂項目有 📌 圖標和淡黃色背景
- **多語言翻譯**：新增置頂相關的中英文翻譯文本

### Changed
- **UI 優化**：三個操作按鈕採用不同懸停色彩
  - 置頂按鈕：金黃色
  - 編輯按鈕：藍色
  - 刪除按鈕：紅色
- **面板高度**：優化為 300px，避免遮擋輸入框
- **星星圖標**：置頂時填充為金色，未置頂時為空心

### Technical
- 更新 `content.js` 添加置頂和刪除處理函數
- 更新 `content.css` 添加新按鈕樣式和置頂項目樣式
- 優化排序邏輯，支援置頂優先排序

---

## [1.0.0] - 2024-11-24

### Added
- **多平台支援**：同時支援 ChatGPT 和 Google Gemini
- **提示詞管理**：新增、編輯、刪除提示詞模板
- **變數替換**：使用 `[變數名稱]` 格式標記可替換內容
- **多語言支援**：繁體中文與英文介面自由切換
- **匯入/匯出**：備份和分享提示詞為 JSON 檔案
- **快速訪問**：AI 對話頁面浮動按鈕，一鍵開啟
- **使用統計**：追蹤每個提示詞的使用次數
- **搜尋功能**：支援關鍵字搜尋和 `/` 快速搜尋
- **分類標籤**：為提示詞添加分類標籤

### Technical
- 使用 Chrome Extension Manifest V3
- 平台檢測系統，自動識別 ChatGPT 或 Gemini
- 支援 contenteditable 和 textarea 兩種輸入框類型
- 重試機制確保按鈕正確插入
- 本地儲存，不收集用戶資料

---

## Links

- [Repository](https://github.com/GsirGinRay/ai-prompts-plus)
- [AI Investment Academy+](https://www.skool.com/ai-investment-academy-plus)
