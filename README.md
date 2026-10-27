# OUTLIER INTERIOR — 網站 Demo

依「outlier website presentation」簡報製作的可操作 Demo（純靜態網站：HTML / CSS / JavaScript，使用 GSAP 與 Lenis）。

- 需求核對清單：[需求清單.md](需求清單.md)
- 內容資料（案例、archive、聯絡資訊）：[assets/js/data.js](assets/js/data.js)

## 本機執行

```bash
python -m http.server 5180
```

接著開啟 <http://localhost:5180>。也可以直接雙擊 `index.html`（但跨頁轉場只在 http 網址下出現）。

## 頁面

| 檔案 | 內容 |
|---|---|
| `index.html` | 首頁 showcase（橫向瀏覽、慣性滑動、hover 效果） |
| `case.html?id=yunzai` | 案例頁（左欄固定、右欄捲動、圖文交錯、輪播與放大） |
| `archive.html` | Archive（點擊照片以共享元素轉場放大 / 縮回） |
| `about.html`、`podcasts.html` | 占位頁（簡報未定義版型） |

Menu 與 Contact 為各頁共用的浮層；網址加 `#menu` 或 `#contact` 可直接開啟。
