# AI提示詞+ 官方提示詞庫

`library.json` 是唯一正本。不要直接修改 `dist/` 內的 JSON 或 Skool Markdown；它們都由 `build.js` 產生。

## 日後更新流程

1. 在 `library.json` 新增或修改提示詞。
2. 新提示詞使用全新且永久不變的 `sourceId`；修改既有提示詞時不可更換 `sourceId`。
3. 更新 `libraryVersion`，格式使用 `YYYY.MM.DD`；同日多次發布可加 `.2`、`.3`。
4. 執行 `node prompt-library/build.js`。
5. 執行 `node --test tests/*.test.js`。
6. 外掛介面有變動時，重拍第 01 課逐步截圖（輸出到 `dist/skool/images/`）：
   `node prompt-library-sync/capture-guide.mjs`（在 `D:\G股網\AI投資學院+\skool-course-uploader` 執行）。
7. 在同一個目錄先預覽、再發布到免費與付費兩個教室：
   - `node prompt-library-sync/sync.mjs`：只備份兩邊 20 頁並列出要更新的頁面
   - `node prompt-library-sync/sync.mjs --publish`：只更新有差異的頁面，第 01 課會一併替換 JSON 附件，完成後回讀驗證
   - 只換截圖、文字沒變時加 `--force --lessons=01`

不要直接在 Skool 上新增或修改提示詞；一律先改 `library.json`，否則下次同步會覆蓋線上內容。

第 01 課內文的正本是 `skool-lesson-01.md`（一個步驟搭配一張圖）；版本號、提示詞數量與附件檔名由 `build.js` 自動帶入，外掛版本與日期讀自 `GPTprompt/manifest.json` 與 `CHANGELOG.md`。第 02～10 課刻意不寫版本號，所以只有提示詞實際變動的課程會被重新發布。Skool 本身已顯示課程標題，因此產生的內文不再重複輸出 `01～10` 課程標題。

官方提示詞包採合併更新：以 `libraryId + sourceId` 判斷同一筆提示詞，只更新官方管理的名稱、分類與內容，保留會員自己的提示詞、使用次數、最後使用時間與釘選狀態，也不自動刪除官方舊提示詞。
