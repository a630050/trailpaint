# Change 002 — TrailPaint Online Phase 2

## 目標

在線上版加入路線繪製、GPX 匯入、高解析匯出。Phase 1 是景點卡片，Phase 2 讓它成為完整的路線規劃工具。

## 資料模型擴展

```typescript
// 新增 Route 型別
interface Route {
  id: string;
  pts: [number, number][];  // [lat, lng][]
  color: string;            // ROUTE_COLORS 的 id（'orange' | 'blue' | 'green' | 'red' | 'purple'）
}

// Project 升級 v2
interface Project {
  version: 2;               // 從 1 升級
  name: string;
  center: [number, number];
  zoom: number;
  spots: Spot[];
  routes: Route[];           // 新增
}
```

向後相容：importJSON 載入 v1 專案時，自動補 `routes: []` 並升級 version 為 2。

## 路線色盤

沿用離線版 5 色，新路線自動循環分配：

| id | 色碼 | 名稱 |
|----|------|------|
| orange | #e05a1a | 橘 |
| blue | #2563eb | 藍 |
| green | #16a34a | 綠 |
| red | #dc2626 | 紅 |
| purple | #9333ea | 紫 |

## Mode 系統

Phase 1 沒有明確 mode，點地圖就加景點。Phase 2 需要模式切換：

| Mode | 行為 | 進入方式 |
|------|------|---------|
| `select` | 點地圖空白 → 取消選取。點景點/路線 → 選取編輯 | 預設模式 |
| `addSpot` | 點地圖 → 加景點（Phase 1 行為） | sidebar 按鈕 |
| `drawRoute` | 點地圖 → 加路線點。「完成路線」按鈕結束 | sidebar 按鈕 |

預設模式改為 `select`（較安全），不再一點就加景點。

Mode 切換 UI：sidebar toolbar 加三個圖示按鈕（游標/景點/路線），高亮當前模式。

## 路線繪製流程

1. 使用者點 sidebar 的路線按鈕 → 進入 `drawRoute` 模式
2. 點地圖 → 座標加入 `currentDrawing: [number, number][]`
3. 地圖上即時顯示折線預覽（虛線）
4. sidebar 底部出現「完成路線」和「取消」按鈕
5. 點「完成路線」→ `currentDrawing` 轉成 Route 存入 store，自動分配下一個顏色
6. 點「取消」→ 清空 currentDrawing，回到 select 模式
7. 至少 2 個點才能完成路線

## 路線顯示

- 使用 react-leaflet 的 `Polyline` 組件
- 線寬 4px，帶 glow 效果（用 CSS filter 或雙層 polyline）
- 未選中路線：正常顯示
- 選中路線：高亮色 + 顯示可拖曳節點

## 路線編輯（select 模式）

1. 點擊路線 → `selectedRouteId` 設為該路線 id
2. 路線上每個點顯示為圓形 marker（可拖曳）
3. 拖曳節點 → 更新 route.pts[i]
4. 雙擊節點 → 刪除該點（少於 2 點時刪除整條路線）
5. sidebar 顯示路線編輯器：換色（5 色選擇）+ 刪除路線
6. 點地圖空白處 → 取消選取路線

## GPX 解析

```typescript
// core/utils/gpxParser.ts（純函式，不依賴 leaflet）

interface GpxData {
  tracks: [number, number][][];  // 多條軌跡 [lat, lng][]
  waypoints: { latlng: [number, number]; name: string }[];
}

function parseGpx(xmlString: string): GpxData
```

解析邏輯：
- 使用 DOMParser 解析 XML
- `<trk>` → `<trkseg>` → `<trkpt lat="" lon="">` → 提取座標
- `<wpt lat="" lon="">` → `<name>` → 提取航點名稱和座標
- 不依賴任何外部 library

## GPX 匯入行為

1. 使用者點 sidebar 的「匯入 GPX」按鈕 → file input
2. 讀取 .gpx 檔 → parseGpx()
3. 每條 track → 新增一條 Route（自動分配顏色）
4. 每個 waypoint → 新增一個 Spot（自動編號，icon 用 'pin'）
5. 匯入後 map.fitBounds() 涵蓋所有新加的點
6. 不清除現有資料（追加模式）

## 高解析匯出

Phase 1 用 html-to-image 的 `toPng()`，解析度受限於螢幕。

Phase 2 升級：使用 html-to-image 的 `pixelRatio` 參數。

```typescript
toPng(mapEl, {
  pixelRatio: 2, // 或 3，2x 足夠大多數用途
  ...
});
```

UI：匯出按鈕旁加下拉選 1x / 2x / 3x。預設 2x。

決策理由：
- 方案 A：html-to-image pixelRatio — 一行改動，2x 就有 4 倍像素
- 方案 B：Canvas 重繪（手動拼 tiles + 繪製路線/卡片）— 完全控制但實作量大
- 選 A。如果主公覺得品質不夠再升級 B。

## Store 擴展

```typescript
// 新增欄位
mode: 'select' | 'addSpot' | 'drawRoute';
currentDrawing: [number, number][];  // drawRoute 模式暫存
selectedRouteId: string | null;

// 新增動作
setMode: (mode: Mode) => void;
addDrawingPoint: (latlng: [number, number]) => void;
finishRoute: () => void;
cancelDrawing: () => void;
addRoute: (route: Route) => void;       // GPX 匯入用
updateRoutePt: (routeId: string, ptIndex: number, latlng: [number, number]) => void;
deleteRoutePt: (routeId: string, ptIndex: number) => void;
deleteRoute: (id: string) => void;
setRouteColor: (id: string, color: string) => void;
setSelectedRoute: (id: string | null) => void;
importGpx: (data: GpxData) => void;
```

## 事件處理（Phase 2 更新）

| Mode | 點地圖空白 | 點景點 | 點路線 |
|------|-----------|--------|--------|
| select | 取消所有選取 | setSelectedSpot | setSelectedRoute |
| addSpot | addSpot | setSelectedSpot + 切回 select | — |
| drawRoute | addDrawingPoint | — | — |

路線 Polyline 的 click 事件一律 `stopPropagation()`。

## 新增檔案

```
online/src/
├── core/
│   ├── components/
│   │   ├── ModeToolbar.tsx      # 模式切換按鈕列
│   │   └── RouteEditor.tsx      # 路線編輯面板（換色/刪除）
│   ├── models/
│   │   └── routes.ts            # Route 型別 + ROUTE_COLORS
│   └── utils/
│       └── gpxParser.ts         # GPX 解析（純函式）
├── map/
│   ├── RouteLayer.tsx           # 路線 Polyline + 節點 markers
│   └── DrawingPreview.tsx       # drawRoute 模式的即時預覽線
```

## 不做的事

| 功能 | 排入 |
|------|------|
| 手繪搖晃效果 | Phase 3（離線版有，線上版先用直線） |
| 路線箭頭方向標示 | Phase 3 |
| 區域遮蓋/濾鏡 | Phase 3 |
| Undo/Redo | Phase 3 |

## 風險與對策

| 風險 | 影響 | 對策 |
|------|------|------|
| pixelRatio: 3 記憶體爆掉 | 大地圖匯出時 canvas 太大 | 預設 2x，3x 加警告提示 |
| GPX 檔案格式不一致 | 解析失敗 | 用 try-catch 包裝，失敗時顯示明確錯誤訊息 |
| 路線 click 和地圖 click 衝突 | 點路線卻觸發加景點 | Polyline click 一律 stopPropagation |
| 路線節點太多影響效能 | GPX 軌跡可能有上千點 | Douglas-Peucker 簡化：匯入時若點數 > 500 自動簡化 |

---

## G1 審查修正紀錄

| Issue | 修正 |
|-------|------|
| [C1] Task 1.4 事件流不完整 | 補充完整 mode × click type 組合，明確 stopPropagation 邊界 |
| [C2] ModeToolbar 顯示邏輯矛盾 | 改為始終可見（編輯時也需要切模式） |
| [C3] GPX error handling 缺失 | Task 4.1 加入具體 error 場景和處理方式 |
| [C4] 顏色分配邏輯未重述 | Task 2.1 明確寫 ROUTE_COLORS[routes.length % 5] |
