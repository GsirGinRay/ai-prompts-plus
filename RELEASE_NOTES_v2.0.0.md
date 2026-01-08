# 🎉 AI 提示詞+ v2.0.0

**支援 ChatGPT 和 Google Gemini 的提示詞管理工具**

這是一個重大更新，新增了直接刪除和置頂功能，讓提示詞管理更加便捷！

---

## ✨ 新增功能

### 🗑️ 直接刪除功能
- 在提示詞列表項目直接添加刪除按鈕
- 無需進入編輯模式，一鍵刪除
- 刪除前有確認對話框，避免誤操作

### ⭐ 置頂功能
- 點擊星星圖標可將常用提示詞置頂
- 置頂項目永遠顯示在列表最上方
- 置頂項目有視覺標記（📌 圖標 + 淡黃色背景）
- 星星圖標在置頂時填充為金色

### 🔄 智能排序
- 置頂的提示詞優先顯示
- 其他提示詞按使用次數自動排序
- 常用的提示詞更容易找到

---

## 🎨 UI 優化

### 三色按鈕系統
每個操作按鈕都有獨特的懸停色彩，讓操作更直觀：
- **置頂按鈕** - 🟡 金黃色
- **編輯按鈕** - 🔵 藍色
- **刪除按鈕** - 🔴 紅色

### 面板高度優化
- 將面板最大高度調整為 300px
- 避免面板過高遮擋輸入框
- 在 ChatGPT 和 Gemini 上都有良好的顯示效果

---

## 🌐 多語言支援

新增置頂功能的中英文翻譯：
- 繁體中文：置頂、取消置頂、已置頂
- English: Pin, Unpin, Pinned

---

## 📦 安裝方式

### 方式一：從 Chrome Web Store 安裝（即將推出）
敬請期待...

### 方式二：手動安裝（開發者模式）

1. 下載本 Release 的 Source Code (zip)
2. 解壓縮到任意資料夾
3. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`
4. 開啟右上角的「開發人員模式」
5. 點擊「載入未封裝項目」，選擇 `GPTprompt` 資料夾
6. 前往 [ChatGPT](https://chatgpt.com) 或 [Google Gemini](https://gemini.google.com) 開始使用！

---

## 🔧 技術改進

- 優化提示詞渲染邏輯，支援置頂排序
- 新增 `togglePinPrompt()` 和 `deletePrompt()` 函數
- 更新 CSS 樣式，支援置頂項目的視覺效果
- 改進事件綁定機制，避免按鈕衝突

---

## 📝 完整變更記錄

查看 [CHANGELOG.md](https://github.com/GsirGinRay/ai-prompts-plus/blob/master/CHANGELOG.md) 了解詳細的版本變更歷史。

---

## 🎁 獲取更多提示詞

想要存取 **100+ 進階提示詞模板**？

加入 **[AI投資學院+](https://www.skool.com/ai-investment-academy-plus)** 即可獲得：
- 📚 100+ 進階提示詞庫（定期更新）
- 🎯 各產業專用模板（行銷、銷售、管理等）
- 🔥 最新 AI 應用技巧
- 👥 社群成員互助交流
- 🎓 線上課程與工作坊

**[→ 立即加入 AI投資學院+](https://www.skool.com/ai-investment-academy-plus)**

---

## 🐛 問題回報

如果您遇到任何問題或有功能建議，歡迎：
- 提交 [Issue](https://github.com/GsirGinRay/ai-prompts-plus/issues)
- 或加入 AI投資學院+ 社群討論

---

## 📄 授權條款

MIT License - 詳見 [LICENSE](https://github.com/GsirGinRay/ai-prompts-plus/blob/master/LICENSE) 檔案

---

**Made with ❤️ for better AI chat experience**
