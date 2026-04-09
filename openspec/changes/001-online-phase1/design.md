# Change 001 — TrailPaint Online Phase 1

## 目標

在 `online/` 資料夾建立 Vite + React + TypeScript 專案，實作「Leaflet 地圖 + 景點卡片」作為線上版的核心差異化功能。

**不動現有檔案**：根目錄的 index.html / trailpaint.html / trailpaint-en.html / trailpaint-ja.html 完全不碰。現有 GitHub Pages 部署繼續指向離線版。

## 技術棧

| 項目 | 選擇 | 版本 | 大小 (gzip) |
|------|------|------|-------------|
| Build | Vite | ^6.x | dev only |
| UI | React + ReactDOM | ^19.x | ~45KB |
| 語言 | TypeScript | ^5.x | dev only |
| 地圖引擎 | Leaflet | ^1.9.4 | ~42KB |
| React 地圖 | react-leaflet | ^5.x | ~10KB |
| 狀態管理 | Zustand | ^5.x | ~1KB |
| PNG 匯出 | html-to-image | ^1.x | ~5KB |
| **合計 runtime** | | | **~103KB** |

圖磚：Carto basemaps（`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`），免 API key，CORS 支援。

## 專案結構

```
online/
├── src/
│   ├── core/                    # 共用核心（不能 import leaflet）
│   │   ├── components/
│   │   │   ├── SpotCard.tsx     # 景點卡片 UI（編號、名稱、照片、圖示）
│   │   │   ├── SpotEditor.tsx   # 景點編輯面板
│   │   │   ├── SpotList.tsx     # 側邊景點列表 + 排序
│   │   │   └── Sidebar.tsx      # 側邊欄框架
│   │   ├── models/
│   │   │   └── types.ts         # Spot, Project 型別定義
│   │   ├── store/
│   │   │   └── useProjectStore.ts  # Zustand store
│   │   ├── icons.ts             # 21 種 emoji 圖示定義
│   │   └── hooks/
│   │       └── useImageCompress.ts  # 照片壓縮 hook
│   ├── map/                     # Leaflet 整合層
│   │   ├── MapView.tsx          # Leaflet 地圖容器
│   │   ├── SpotMarker.tsx       # DivIcon + Portal 掛載 SpotCard
│   │   └── ExportButton.tsx     # html-to-image 匯出
│   ├── i18n/
│   │   ├── zh-TW.ts            # 中文語系
│   │   ├── en.ts               # 英文語系（Phase 1 全部翻譯）
│   │   └── index.ts            # t() 函數 + locale 從環境變數讀取
│   ├── App.tsx                  # 主 layout
│   ├── App.css                  # 全域樣式
│   └── main.tsx                 # entry
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

**核心原則**：`core/` 裡的任何檔案不能 `import` leaflet 或 react-leaflet。景點卡片是純 React 組件，地圖整合由 `map/SpotMarker.tsx` 負責橋接。

## 資料模型

```typescript
// core/models/types.ts

interface Spot {
  id: string;              // crypto.randomUUID()
  latlng: [number, number]; // [lat, lng] — 地圖座標
  num: number;              // 顯示編號
  title: string;            // 景點名稱
  desc: string;             // 描述（可空）
  photo: string | null;     // base64 data URL（壓縮後）
  iconId: string;           // ICONS 的 id（如 "pin", "leaf"）
  cardOffset: { x: number; y: number }; // 卡片相對 pin 的 pixel 偏移（螢幕座標）
}

// cardOffset 規格：
// - 單位：螢幕 pixel（不隨地圖縮放變化）
// - 原點：pin 圖示的正上方
// - 初值：{ x: 0, y: -60 }（卡片預設在 pin 正上方 60px）
// - 拖曳卡片時直接更新 pixel offset（mousedown delta 計算）
// - 不轉換為地圖座標，避免縮放時位置跑掉

interface Project {
  version: 1;
  name: string;
  center: [number, number]; // 地圖中心 [lat, lng]
  zoom: number;
  spots: Spot[];
}
```

與離線版差異：
- `x, y` (pixel) → `latlng` (經緯度)
- 其餘欄位（num, title, desc, photo, iconId, cardOffset）沿用

## 圖示集

沿用離線版 21 種 emoji 圖示，三類：

| 類別 | 圖示 |
|------|------|
| 生態 | 🌿植物 🌸花卉 🌲樹木 🐦鳥類 🦋昆蟲 💧水域 🐟魚類 🍄菌類 ⛰️岩石 |
| 設施 | 🚻廁所 🚌站牌 🪑休憩 🥤餐廳 🚲腳踏車 🅿️停車 🩺急救 |
| 通用 | 🔭觀景 📷拍照 ⚠️注意 ℹ️說明 📍標記 |

## 景點卡片視覺規格

沿用離線版的紙感手繪風：
- 卡片背景：米白色帶紙紋質感（CSS background + subtle noise）
- 邊框：手繪風格不規則邊（CSS border-radius 微調或 SVG filter）
- 圓形編號標記：數字白字、深色底
- 照片區域：上方，圓角
- 圖示 + 名稱：照片下方
- 卡片可拖曳調整相對位置（cardOffset）
- 連接線：卡片到 pin 的細線（SVG line，隨 cardOffset 即時更新）

具體 CSS 數值在 apply 階段依據離線版 canvas 繪製邏輯還原。

## 事件處理規格

| 操作 | 觸發 | 事件隔離 |
|------|------|---------|
| 點擊地圖空白處 | addSpot(latlng) | 正常冒泡 |
| 點擊卡片/pin | setSelectedSpot(id) | `e.stopPropagation()` 阻止觸發 addSpot |
| 拖曳 pin 圖示 | updateSpot latlng | Leaflet marker draggable 內建處理，不影響地圖 |
| 拖曳卡片 | updateSpot cardOffset | `e.stopPropagation()` + 地圖設 `dragging.disable()` 拖曳期間暫停地圖平移，mouseup 時 `dragging.enable()` |
| 點擊 sidebar 景點 | setSelectedSpot + map.flyTo(spot.latlng) | sidebar 不在地圖 DOM 內，無衝突 |

原則：卡片/pin 上的互動一律 `stopPropagation()`，防止穿透到地圖的 click/drag handler。

## Zustand Store 設計

```typescript
// core/store/useProjectStore.ts

interface ProjectState {
  // 專案資料
  project: Project;

  // UI 狀態
  selectedSpotId: string | null;
  sidebarOpen: boolean;

  // 動作
  addSpot: (latlng: [number, number]) => void;
  updateSpot: (id: string, patch: Partial<Spot>) => void;
  removeSpot: (id: string) => void; // 刪除後 store 內部自動遍歷剩餘 spots 重編號 num = index + 1
  swapSpots: (index: number, direction: 'up' | 'down') => void; // 相鄰交換，交換後自動重編號 num = index + 1
  setSelectedSpot: (id: string | null) => void;
  setMapView: (center: [number, number], zoom: number) => void;

  // 存檔/載入
  exportJSON: () => string;
  importJSON: (json: string) => void;
}
```

## i18n 設計

```typescript
// i18n/index.ts
const locale = (import.meta.env.VITE_LOCALE as string) || 'zh-TW';
const messages = localeMap[locale];
export function t(key: string): string { return messages[key] ?? key; }
```

Build 指令：
- `vite build` → 預設中文
- `VITE_LOCALE=en vite build --outDir dist-en` → 英文版

## PNG 匯出流程

1. 隱藏 sidebar 和 UI 控制項
2. 等待所有 tile 載入完成（監聽 Leaflet `load` event）
3. 呼叫 `html-to-image` 的 `toPng()` 截取地圖 + 景點卡片
4. 產生 Blob URL，觸發下載
5. 還原 UI

已知限制：Phase 1 的匯出解析度受限於螢幕 DPI。Phase 2 升級為 Canvas 重繪方案。

## 照片壓縮

使用者上傳的照片在存入 store 前，經過 canvas resize：
- 最大邊 800px
- JPEG 品質 0.7
- 輸出 base64 data URL

離線版也有類似邏輯，未來可共用。

## 不做的事（Phase 2+）

| 功能 | 排入 |
|------|------|
| GPX 匯入 | Phase 2 |
| 路線繪製/編輯 | Phase 2 |
| 區域遮蓋/濾鏡 | Phase 3 |
| Undo/Redo | Phase 3（Zustand middleware 已預留） |
| 高解析 PNG 匯出 | Phase 2 |
| 替換離線版 | 不在此 change 範圍。線上版 Phase 3 完成共用核心後再評估 |

## 風險與對策

| 風險 | 影響 | 對策 |
|------|------|------|
| Carto CORS + html-to-image 匯出失敗 | PNG 匯出不含底圖 | Task 1 完成後立即實測；備案：換 OpenFreeMap 或用 Leaflet canvas renderer |
| DivIcon + Portal 景點多時效能差 | 50+ 景點卡頓 | Phase 1 不處理，一般登山路線 <20 個景點 |
| 照片 base64 存 JSON 過大 | 存檔/載入慢 | canvas 壓縮到 800px + 0.7 品質，單張 <100KB |
| cardOffset 拖曳超出地圖可視區 | 卡片看不到 | 不加邊界限制（同離線版行為），使用者可自行拖回 |

---

## G1 審查修正紀錄

Sub-Agent 報告 6 critical + 5 warning，已全部修正：

| Issue | 修正 |
|-------|------|
| [C1] cardOffset 初值未定義 | 資料模型加入初值 `{ x: 0, y: -60 }` + 坐標系說明 |
| [C2] reorderSpots 語義衝突 | 改為 `swapSpots(index, 'up'\|'down')` 明確相鄰交換 |
| [C3] click 事件冒泡 | 新增「事件處理規格」表格，卡片/pin 一律 stopPropagation |
| [C4] cardOffset 坐標系不清 | 明確為螢幕 pixel、不隨縮放變化 |
| [C5] 卡片 drag 與地圖 drag 衝突 | 拖曳期間 map.dragging.disable()，mouseup 還原 |
| [C6] removeSpot 重編號職責 | 明確寫入 store 內部自動重編號 |
| [W1] flyTo 目標 | 已在 tasks.md 明確寫 flyTo(spot.latlng) |
| [W2] 英文版完成度 | 改為 Phase 1 全部翻譯，不留空殼 |
| [W3] 連接線方案 | 明確選 SVG line |
| [W4] 手機 Sidebar | 明確選 overlay（比 bottom sheet 簡單） |
| [W5] cardOffset 邊界 | 不加限制，加入風險表說明 |
