# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
