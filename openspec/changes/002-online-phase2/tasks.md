# Tasks — 002 Online Phase 2

## D1: Mode 系統 + Store 擴展

### Task 1.1: Route 型別 + 色盤
- 建立 `src/core/models/routes.ts`
- 定義 Route interface 和 ROUTE_COLORS 陣列（5 色，沿用離線版色碼）
- 更新 Project interface 為 v2（加 routes 欄位）

### Task 1.2: Store 擴展
- useProjectStore 加入：mode, currentDrawing, selectedRouteId
- 加入動作：setMode, addDrawingPoint, finishRoute, cancelDrawing, addRoute, updateRoutePt, deleteRoutePt, deleteRoute, setRouteColor, setSelectedRoute, importGpx
- finishRoute：currentDrawing 至少 2 點才存入，自動分配下一個顏色（routes.length % 5），清空 currentDrawing，切回 select 模式
- importJSON 遷移：v1 專案自動補 routes: []
- 預設 mode 改為 'select'

### Task 1.3: ModeToolbar 組件
- 建立 `src/core/components/ModeToolbar.tsx`
- 三個按鈕：🖱️ 選取 / 📍 加景點 / 🖊️ 畫路線
- 高亮當前 mode
- drawRoute 模式時底部顯示「完成路線」和「取消」按鈕
- 驗證：切換 mode 後 store 狀態正確

### Task 1.4: MapClickHandler 適配 mode
- 更新 MapView.tsx 的 MapClickHandler，完整事件流：
  - select + 點地圖空白 → setSelectedSpot(null) + setSelectedRoute(null)
  - select + 點景點 → setSelectedSpot(id)（由 SpotMarker stopPropagation 處理，不經過 MapClickHandler）
  - select + 點路線 → setSelectedRoute(id)（由 RouteLayer stopPropagation 處理）
  - addSpot + 點地圖空白 → addSpot(latlng)，完成後自動切回 select
  - addSpot + 點景點 → setSelectedSpot(id) + setMode('select')（由 SpotMarker 處理）
  - drawRoute + 點地圖 → addDrawingPoint(latlng)
- 景點/路線的 click 都在各自組件內 stopPropagation 後處理，MapClickHandler 只負責地圖空白處的 click

## D2: 路線繪製 + 預覽

### Task 2.1: DrawingPreview 組件
- 建立 `src/map/DrawingPreview.tsx`
- 監聽 store.currentDrawing，用 react-leaflet Polyline 渲染
- 虛線樣式（dashArray: '8 6'），顏色為 ROUTE_COLORS[store.routes.length % 5]（即下一條路線將分配到的顏色）
- 每個已加的點顯示小圓點 CircleMarker
- 驗證：drawRoute 模式下點地圖能看到即時預覽線

### Task 2.2: 整合到 MapView
- MapView 加入 DrawingPreview（只在 drawRoute 模式顯示）
- 驗證：完整流程——進入 drawRoute → 點幾個點 → 看到預覽 → 完成 → 路線存入

## D3: 路線顯示 + 編輯

### Task 3.1: RouteLayer 組件
- 建立 `src/map/RouteLayer.tsx`
- 遍歷 store.routes，每條用 Polyline 渲染
- 線寬 4px，顏色從 ROUTE_COLORS 對應
- Polyline click → stopPropagation + setSelectedRoute(id)
- 選中路線：線寬 6px + 更亮的顏色
- 整合到 MapView

### Task 3.2: 路線節點編輯
- 選中路線時，每個 pts[i] 顯示為 CircleMarker（draggable）
- 拖曳節點 → updateRoutePt(routeId, i, newLatLng)
- 雙擊節點 → deleteRoutePt(routeId, i)
- deleteRoutePt：若剩餘點 < 2，自動刪除整條路線
- 節點 CircleMarker 的事件一律 stopPropagation

### Task 3.3: RouteEditor 組件
- 建立 `src/core/components/RouteEditor.tsx`
- 在 sidebar 中，選中路線時顯示（取代 SpotList/SpotEditor）
- 內容：路線色盤（5 色按鈕切換）+ 刪除路線按鈕 + 關閉按鈕
- 刪除前 confirm 確認

### Task 3.4: Sidebar 整合
- Sidebar 邏輯：ModeToolbar 始終可見（sidebar 頂部，header 下方）。內容區域：selectedSpot → SpotEditor，selectedRoute → RouteEditor，都沒選 → SpotList
- ModeToolbar 始終可見的理由：編輯景點/路線時也需要能切換到其他模式（如從編輯景點切到畫路線）

## D4: GPX 解析 + 匯入

### Task 4.1: GPX 解析器
- 建立 `src/core/utils/gpxParser.ts`
- 純函式 parseGpx(xmlString): GpxData，失敗時 throw Error 附帶明確訊息
- 用 DOMParser 解析，提取 trk/trkseg/trkpt 和 wpt
- Error handling：XML parse 失敗 → throw「非有效 XML」；無 trk 且無 wpt → throw「找不到軌跡或航點」；trkpt 缺 lat/lon → 跳過該點
- 加入 Douglas-Peucker 簡化：若單條軌跡點數 > 500，以包圍盒對角線 / 10000 為初始 tolerance 迭代簡化到 ≤ 500 點
- 不依賴 leaflet

### Task 4.2: 匯入 UI + Store 整合
- sidebar 工具列加「匯入 GPX」按鈕
- importGpx store action：每條 track → addRoute，每個 waypoint → addSpot
- 匯入後設定 pendingFlyTo 為所有新點的 bounds center
- i18n 加相關字串

## D5: 高解析匯出

### Task 5.1: pixelRatio 匯出
- 更新 exportPng 函式，接受 pixelRatio 參數（1/2/3）
- 預設 2x
- pixelRatio 3 時加 confirm 警告（記憶體較大）
- sidebar 工具列的匯出按鈕改為下拉選單（1x 標準 / 2x 高清 / 3x 超清）

## D6: i18n + 整合測試

### Task 6.1: i18n 補充
- zh-TW.ts / en.ts 加入 Phase 2 所有新字串：
  - mode.select / mode.addSpot / mode.drawRoute
  - route.finish / route.cancel / route.delete / route.deleteConfirm / route.color
  - gpx.import / gpx.importFailed / gpx.simplified
  - export.1x / export.2x / export.3x / export.3xWarn

### Task 6.2: 整合測試
- 完整流程：畫路線 → 編輯節點 → 換色 → 匯入 GPX → 存檔 → 載入 → 匯出 2x PNG
- 驗證 v1 專案載入向後相容
- 手機 viewport 測試
