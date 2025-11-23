# Chrome Web Store 提交完整檢查清單

## 📋 提交前準備清單

### 1️⃣ **ZIP 檔案準備** ✅

- [ ] 創建臨時資料夾
- [ ] 複製 10 個必要檔案（見 CREATE_ZIP_INSTRUCTIONS.txt）
- [ ] 複製 icons 資料夾
- [ ] **確認沒有** .md 檔案
- [ ] **確認沒有** .vscode 資料夾
- [ ] 創建 ZIP 檔案（選取檔案後壓縮，不是壓縮整個資料夾）
- [ ] 驗證 ZIP 結構正確（解壓後直接看到 manifest.json）

---

### 2️⃣ **截圖準備** 📸（必須）

**Chrome Web Store 要求：3-5 張截圖**

#### 建議截圖內容：

**截圖 1：主介面 - Popup 視窗**
- 打開擴充功能 popup
- 顯示提示詞列表
- 尺寸：1280x800 或 640x400
- 重點：展示乾淨的 UI 和提示詞卡片

**截圖 2：新增提示詞**
- 顯示新增提示詞的表單
- 展示變數功能 [變數名稱]
- 重點：讓用戶看到如何創建提示詞

**截圖 3：變數輸入介面**
- 顯示填寫變數的模態框
- 展示多個變數輸入框
- 重點：展示變數替換功能

**截圖 4：ChatGPT 頁面整合**
- 在 ChatGPT 頁面的浮動按鈕
- 點開後的提示詞面板
- 重點：展示實際使用情境

**截圖 5：語言切換（可選）**
- 並排顯示中文和英文介面
- 展示雙語支援
- 重點：國際化功能

#### 截圖工具：
- Windows：Win + Shift + S（截圖工具）
- Chrome：F12 → 設定 → Device Toolbar (Ctrl+Shift+M) 設定解析度
- 專業工具：Snagit, Greenshot

#### 截圖要求：
- 格式：JPG 或 PNG
- 尺寸：1280x800 或 640x400（推薦 1280x800）
- 檔案大小：每張 < 5MB
- 數量：3-5 張

---

### 3️⃣ **商店資訊準備** 📝

#### **短描述**（132 字元以內）
```
Manage and use ChatGPT prompt templates efficiently. Support variables, quick insertion, and bilingual interface (English/繁體中文).
```

#### **詳細說明**
請參考 `STORE_LISTING.md` 檔案中的 "詳細說明" 部分。

重點包含：
- ✨ Key Features
- 🎯 Perfect For
- 🚀 How to Use
- 🔒 Privacy & Security
- 💡 Example Prompts

---

### 4️⃣ **圖示準備** 🎨

已完成：
- [x] icon16.png (16x16)
- [x] icon48.png (48x48)
- [x] icon128.png (128x128)

建議額外準備（可選但推薦）：
- [ ] Small Promo Tile (440x280) - 商店推薦圖
- [ ] Marquee Promo Tile (1400x560) - 大橫幅（可選）

---

### 5️⃣ **隱私政策** 🔒

**是否需要？** 根據你使用的權限判斷

你的 manifest.json 使用的權限：
- `storage` - 本地儲存
- `activeTab` - 當前分頁

**建議：** 提供簡單的隱私政策說明

可以直接在 GitHub README 中添加：
```markdown
## Privacy Policy

This extension does not collect any personal data.
All prompts and settings are stored locally on your device using Chrome's local storage.
No data is sent to external servers.
No analytics or tracking is implemented.
```

隱私政策 URL：你的 GitHub README 連結
`https://github.com/GsirGinRay/chatgpt-prompt-manager#privacy-policy`

---

### 6️⃣ **其他資訊準備** 📋

- [ ] **類別**：Productivity
- [ ] **語言**：English, 繁體中文 (Traditional Chinese)
- [ ] **定價**：免費
- [ ] **支援 URL**：`https://github.com/GsirGinRay/chatgpt-prompt-manager`
- [ ] **版本號**：1.0.0（確認 manifest.json 中的版本）

---

### 7️⃣ **開發者帳號準備** 💳

- [ ] 註冊 Google 帳號（如果還沒有）
- [ ] 前往 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [ ] 支付一次性開發者註冊費：**$5 USD**
- [ ] 完成開發者資料設定

---

## 🚀 提交流程

### **步驟 1：註冊開發者帳號**
1. 前往：https://chrome.google.com/webstore/devconsole
2. 使用 Google 帳號登入
3. 同意開發者協議
4. 支付 $5 USD 註冊費（一次性，終身有效）
5. 填寫發行者資料（名稱、Email、網站）

### **步驟 2：上傳擴充功能**
1. 點擊「New Item」（新增項目）
2. 上傳你的 ZIP 檔案
3. 等待系統驗證（約 1-2 分鐘）
4. 如果有錯誤，修正後重新上傳

### **步驟 3：填寫商店資訊**
1. **Store listing**（商店資訊）
   - 詳細說明（從 STORE_LISTING.md 複製）
   - 簡短說明
   - 截圖（上傳 3-5 張）
   - 小圖示（已包含在 ZIP 中）
   - 類別：Productivity
   - 語言：English + 繁體中文

2. **Privacy practices**（隱私實踐）
   - 選擇「This item does not collect user data」（如果不收集資料）
   - 或提供隱私政策 URL

3. **Distribution**（發布範圍）
   - 選擇發布地區（建議：所有地區）
   - 選擇可見性：Public（公開）

### **步驟 4：提交審核**
1. 檢查所有資訊
2. 點擊「Submit for review」（提交審核）
3. 等待 Google 審核（通常 1-3 個工作天）

---

## ⚠️ 常見審核失敗原因

1. **截圖不符合要求**
   - 尺寸不對
   - 數量不足（少於 3 張）

2. **隱私政策缺失**
   - 使用某些權限需要提供隱私政策

3. **描述不清楚**
   - 說明太簡短
   - 沒有說明功能

4. **ZIP 結構錯誤**
   - ZIP 內有外層資料夾
   - 包含不必要的檔案

5. **manifest.json 錯誤**
   - 權限過多
   - 圖示路徑錯誤

---

## ✅ 提交前最終檢查

- [ ] ZIP 檔案結構正確
- [ ] 已準備 3-5 張截圖
- [ ] 商店說明文字準備好（英文）
- [ ] 隱私政策準備好
- [ ] 開發者帳號已註冊
- [ ] 已支付 $5 USD
- [ ] 在本機測試無錯誤
- [ ] 已清除 chrome://extensions/ 的錯誤記錄
- [ ] 版本號正確（1.0.0）

---

## 📞 提交後

### **審核中**
- 審核時間：通常 1-3 個工作天
- 你會收到 Email 通知

### **審核通過**
- 擴充功能會出現在 Chrome Web Store
- 你會獲得商店連結
- 可以開始推廣

### **審核被拒**
- 檢查拒絕原因
- 修正問題
- 重新提交

---

## 🎉 完成！

提交後，你的擴充功能將在 1-3 個工作天內審核完成。
審核通過後，全世界的 Chrome 用戶都可以安裝你的擴充功能了！

祝你提交順利！🚀
