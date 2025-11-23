# 圖示檔案說明

## 📌 必要檔案

請在此資料夾中放置以下三個圖示檔案：

1. **icon16.png** - 16x16 像素
2. **icon48.png** - 48x48 像素
3. **icon128.png** - 128x128 像素

## 🎨 圖示設計建議

### 設計概念
建議使用與 ChatGPT 或提示詞相關的圖示，例如：
- 聊天氣泡 💬
- 文件圖示 📄
- 筆記本 📓
- 對話框 💭
- 閃電符號 ⚡（代表快速）

### 配色建議
- 主色：#10a37f（ChatGPT 品牌綠色）
- 輔色：#ffffff（白色）
- 背景：透明或純色

### 設計工具

**線上工具：**
- [Canva](https://www.canva.com) - 免費線上設計工具
- [Figma](https://www.figma.com) - 專業設計工具
- [Favicon.io](https://favicon.io) - 快速產生圖示

**桌面工具：**
- Adobe Illustrator
- Sketch
- Photoshop

## 🚀 快速建立圖示

### 方法 1：使用 Emoji 轉圖示

1. 前往 [Favicon.io](https://favicon.io/emoji-favicons/)
2. 選擇 💬 或 📝 emoji
3. 選擇背景色：#10a37f
4. 下載並重新命名檔案

### 方法 2：使用文字圖示

1. 前往 [Favicon.io](https://favicon.io/favicon-generator/)
2. 輸入文字：「P」（Prompt 的縮寫）
3. 選擇背景色：#10a37f
4. 選擇文字色：#ffffff
5. 下載並重新命名檔案

### 方法 3：使用 AI 產生

使用 AI 繪圖工具（如 DALL-E、Midjourney）產生：

提示詞範例：
```
A simple, modern icon for a ChatGPT prompt manager extension.
Features a chat bubble with a sparkle or lightning bolt.
Flat design, minimalist style, green (#10a37f) and white colors,
transparent background, 128x128 pixels.
```

## 📏 尺寸要求

| 檔案名稱 | 尺寸 | 用途 |
|---------|------|------|
| icon16.png | 16x16px | 擴充功能列表、工具列 |
| icon48.png | 48x48px | 擴充功能管理頁面 |
| icon128.png | 128x128px | Chrome 線上應用程式商店 |

## ✅ 暫時替代方案

如果暫時沒有設計的圖示，可以使用純色方塊：

### 使用線上工具建立純色圖示

1. 前往 [Placeholder.com](https://placeholder.com)
2. 使用以下網址直接下載：
   - 16x16: `https://via.placeholder.com/16/10a37f/ffffff?text=P`
   - 48x48: `https://via.placeholder.com/48/10a37f/ffffff?text=P`
   - 128x128: `https://via.placeholder.com/128/10a37f/ffffff?text=P`

### 使用 Canvas API 建立（進階）

建立一個 HTML 檔案並在瀏覽器中開啟：

```html
<!DOCTYPE html>
<html>
<body>
  <canvas id="canvas" width="128" height="128"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = '#10a37f';
    ctx.fillRect(0, 0, 128, 128);

    // 文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💬', 64, 64);

    // 下載
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'icon128.png';
      a.click();
    });
  </script>
</body>
</html>
```

## 🔍 檢查清單

在安裝擴充功能之前，請確認：

- [ ] icon16.png 存在且為 16x16 像素
- [ ] icon48.png 存在且為 48x48 像素
- [ ] icon128.png 存在且為 128x128 像素
- [ ] 所有圖示都是 PNG 格式
- [ ] 圖示清晰可辨識
- [ ] 檔案大小合理（建議每個檔案小於 50KB）

## 💡 提示

- 使用透明背景可以適應不同主題
- 簡單的設計在小尺寸下更清晰
- 保持一致的視覺風格
- 測試在深色和淺色背景下的可見度

---

**準備好圖示後，請返回專案根目錄查看 INSTALLATION.md 繼續安裝步驟。**
