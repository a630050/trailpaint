# Tasks — 001 Online Phase 1

## D1: 專案初始化 + Leaflet 地圖

### Task 1.1: Vite + React + TypeScript 腳手架
- 在 `online/` 建立 Vite 專案（`npm create vite@latest online -- --template react-ts`）
- 安裝依賴：`leaflet react-leaflet zustand html-to-image`
- 安裝 dev 依賴：`@types/leaflet`
- 設定 `tsconfig.json`（strict mode）
- 設定 `vite.config.ts`（base path 預設 `/`）
- 驗證：`npm run dev` 能啟動，瀏覽器看到預設頁面

### Task 1.2: Leaflet 地圖容器
- 建立 `src/map/MapView.tsx`：全螢幕 Leaflet 地圖
- 圖磚：Carto Voyager（`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`）
- 預設中心：台灣（約 [23.5, 121]），zoom 8
- 加入 OSM attribution
- 驗證：瀏覽器看到完整地圖，可平移縮放

### Task 1.3: CORS 匯出可行性驗證
- 用 html-to-image 對地圖容器做 `toPng()`，確認 Carto 圖磚不會 taint canvas
- 若 CORS 失敗：記錄問題，備案切 OpenFreeMap 或 Leaflet preferCanvas
- 驗證：能產出含底圖的 PNG blob

## D2: 資料模型 + 狀態管理

### Task 2.1: 型別定義
- 建立 `src/core/models/types.ts`：Spot, Project interface
- 欄位如 design.md 定義

### Task 2.2: 圖示集
- 建立 `src/core/icons.ts`：21 種 emoji 圖示陣列，沿用離線版
- 匯出型別 `IconDef = { id: string; emoji: string; label: string }`

### Task 2.3: Zustand Store
- 建立 `src/core/store/useProjectStore.ts`
- 實作：addSpot, updateSpot, removeSpot, swapSpots, setSelectedSpot, setMapView, exportJSON, importJSON
- addSpot：新景點 cardOffset 初值 `{ x: 0, y: -60 }`（pin 正上方 60px）
- removeSpot：刪除後自動遍歷剩餘 spots 重編號 num = index + 1
- swapSpots(index, 'up'|'down')：相鄰交換，交換後全部重編號
- exportJSON 輸出 `Project` JSON 字串；importJSON 解析並載入
- 驗證：在 React DevTools 或 console 測試 store 動作正確

## D3: 景點卡片 UI

### Task 3.1: SpotCard 組件
- 建立 `src/core/components/SpotCard.tsx`
- 純 React 組件，props 接收 Spot 資料 + callbacks
- 視覺：米白紙感背景、圓形編號標記（深色底白字）、照片區（圓角）、emoji 圖示 + 名稱
- 紙紋效果：CSS repeating-radial-gradient 或 subtle box-shadow
- 手繪風邊框：略不規則的 border-radius（如 `4px 8px 6px 10px`）
- 卡片寬度固定 180px，高度依內容自適應
- 不依賴 leaflet

### Task 3.2: SpotMarker（地圖掛載）
- 建立 `src/map/SpotMarker.tsx`
- 用 react-leaflet 的 Marker + DivIcon
- DivIcon 容器內渲染 SpotCard
- marker pin draggable：拖曳 pin 圖示更新 spot.latlng（景點在地圖上的實際位置）
- 卡片本體 draggable：拖曳卡片更新 spot.cardOffset（螢幕 pixel 偏移，不隨縮放變化）。拖曳期間 `stopPropagation()` + `map.dragging.disable()`，mouseup 時 `map.dragging.enable()`
- 卡片到 pin 的連接線：SVG line 元素，隨 cardOffset 即時更新
- 點擊卡片 → 選中該景點（setSelectedSpot）

### Task 3.3: 地圖點擊新增景點
- MapView 監聽地圖 click 事件
- click → addSpot(latlng)，自動分配下一個編號，cardOffset 初值 `{ x: 0, y: -60 }`
- 新增後自動選中該景點，開啟編輯
- 卡片/pin 上的 click 事件一律 `stopPropagation()`，不觸發 addSpot

## D4: 景點編輯 + 側邊欄

### Task 4.1: SpotEditor 組件
- 建立 `src/core/components/SpotEditor.tsx`
- 編輯：名稱（text input）、描述（textarea）、圖示選擇（grid picker）、照片上傳
- 刪除按鈕（確認後刪除，剩餘景點自動重編號）
- 不依賴 leaflet

### Task 4.2: 照片壓縮 hook
- 建立 `src/core/hooks/useImageCompress.ts`
- 接收 File，canvas resize 到最大邊 800px，JPEG 0.7 品質
- 回傳 base64 data URL
- SpotEditor 上傳照片時呼叫

### Task 4.3: Sidebar + SpotList
- 建立 `src/core/components/Sidebar.tsx`：左側側邊欄框架，可收合
- 建立 `src/core/components/SpotList.tsx`：景點列表
- 每個項目顯示：編號、emoji、名稱
- ▲▼ 排序按鈕（呼叫 swapSpots：相鄰交換，交換後全部重編號）
- 點擊項目 → 選中景點 + 地圖 flyTo

### Task 4.4: App 主 layout
- 建立 `src/App.tsx`：Sidebar 在左、MapView 在右
- RWD：手機上 Sidebar 變為 overlay（全螢幕覆蓋，左上角收合按鈕；比 bottom sheet 簡單且不衝突地圖互動）
- 頂部工具列：匯出按鈕、存檔/載入按鈕

## D5: 匯出 + 存檔載入

### Task 5.1: PNG 匯出
- 建立 `src/map/ExportButton.tsx`
- 流程：隱藏 UI → 等 tile load → toPng() → Blob URL → 觸發下載 → 還原 UI
- 檔名格式：`trailpaint-{project.name}-{date}.png`

### Task 5.2: 專案存檔/載入
- 存檔：exportJSON() → Blob → 下載 `.trailpaint.json`
- 載入：file input → 讀取 JSON → importJSON() → 地圖 flyTo 存檔的 center/zoom
- 驗證：存檔後重新載入，所有景點位置和內容正確還原

## D6: i18n + 收尾

### Task 6.1: i18n 架構
- 建立 `src/i18n/zh-TW.ts`、`src/i18n/en.ts`、`src/i18n/index.ts`
- 所有 UI 字串改用 `t('key')` 呼叫
- en.ts 須翻譯全部 key（Phase 1 就完整），不留空殼
- `VITE_LOCALE` 環境變數控制語系
- 驗證：`VITE_LOCALE=en npm run dev` 顯示英文，無 key fallback

### Task 6.2: 樣式打磨
- 全域色調、字體對齊離線版的紙感風格
- Loading 畫面（同離線版的 🌿 風格）
- 深色模式不做（離線版也沒有）

### Task 6.3: 整合測試
- 完整流程走一次：開地圖 → 加景點 → 編輯 → 上傳照片 → 排序 → 匯出 PNG → 存檔 → 載入
- 手機 viewport 測試（Chrome DevTools）
- 修正發現的問題
