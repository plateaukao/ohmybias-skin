# OhMyBias 皮膚設計器

OhMyBias 米（嘸蝦米鍵盤，[Android](https://github.com/plateaukao/ohmybias-android)／iOS）的皮膚設計器。
純靜態網頁（vanilla HTML/CSS/JS，零依賴、零 build step），可直接放 GitHub Pages。

本設計器是 Ryan「蝦米輸入法皮膚設計器」的**純化版**：只保留 OhMyBias 兩個 App
實際會讀取的設定（配色、字級、工具列、佈局選項、滑動與長按開關），移除 iOS
元書輸入法專屬功能（AI 配色、九鍵盤套用範圍、分行滑動開關、jsonnet 佈局編譯打包等），
並針對手機瀏覽器優化。

## 使用方式

1. 開啟網頁，選擇目標平台（Android／iOS，影響工具列可用按鈕）
2. 調整配色（淺色與深色各一套）、字級、工具列、佈局 — 上方鍵盤預覽即時反映
3. 按「匯出 .cskin」下載皮膚檔
4. 到 OhMyBias App 設定頁 →「匯入皮膚（.cskin）」選檔 → 重開鍵盤生效

設計進度會自動存在瀏覽器（localStorage）；換裝置或清資料前請先匯出 `.cskin` 備份。
也可匯入既有的 `.cskin`（本設計器或 Ryan 設計器匯出的皆可）繼續編輯。

## 檔案格式

匯出的 `.cskin` 是 zip 容器，內含 `jsonnet/settings.json`（扁平 schema）：
`skinInfo.name`、`keyboardLayout`、`longPressLayout`、`toolbarButtons`、
五個滑動／長按布林旗標、`palette.light/dark`（24 色＋`borderSize`）、`groups`（7 個字級）。
與 App 端 `SkinSettings` 的解析邏輯一一對應；預覽的取色 fallback 鏈與內建
sweetlime 預設值也與 App 端 `KeyboardTheme` 相同，所見即所得。

## 開發

```bash
python3 -m http.server 8642   # ES modules 需經 http 供檔，不能直接 file:// 開啟
open http://localhost:8642
```
