# Change 003 — TrailPaint Online Phase 3

## 目標

增強線上版的視覺品質和操作體驗：手繪搖晃效果、路線箭頭、Undo/Redo、浮水印、RWD 完善。

## 手繪搖晃效果

離線版路線用 sin/cos 微移每個點座標模擬手繪風格。線上版用 SVG filter 實現：

在 Leaflet Polyline 上套用 SVG `feTurbulence` + `feDisplacementMap` filter，讓路線看起來像手繪。

```svg
<filter id="hand-drawn">
  <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="2" result="noise" />
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
</filter>
```

方案比較：
- **A. SVG filter**（推薦）：一行 CSS `filter: url(#hand-drawn)` 套在 SVG path 上，不需改座標計算，Leaflet 的 SVG renderer 天然支援
- **B. 座標微移**（離線版做法）：要在每次 render 時計算，且 Leaflet Polyline 不方便直接操作座標
- **C. Canvas renderer + pixel manipulation**：太重

→ 選 A。在地圖 container 注入一個隱藏的 SVG `<defs>` 包含 filter，Polyline 的 CSS class 引用它。

開關：store 加 `handDrawn: boolean`，預設 true。sidebar 設定區加開關。

## 路線箭頭

在路線終點顯示三角形箭頭標示行進方向。

實作：用 react-leaflet 的自訂組件，在路線最後兩點計算角度，放一個旋轉的三角形 marker（L.divIcon）。

箭頭顏色跟隨路線顏色（離線版行為）。

## Undo/Redo

使用 Zustand 的 `temporal` middleware（zundo 套件）。

```typescript
import { temporal } from 'zundo';

const useProjectStore = create<ProjectState>()(
  temporal(
    (set, get) => ({ ... }),
    { limit: 50 }  // 最多 50 步
  )
);
```

快捷鍵：Ctrl/Cmd+Z = undo，Ctrl/Cmd+Shift+Z = redo。
UI：sidebar 工具列加 ↩ ↪ 按鈕。

temporal middleware 只追蹤 project 狀態變化（spots, routes），不追蹤 UI 狀態（selectedSpotId, mode 等）。用 `partialize` 參數過濾。

## 浮水印

地圖右下角（attribution 上方）顯示半透明浮水印：
```
🌿 TrailPaint 路小繪
notoriouslab
```

store 加 `watermark: boolean`，預設 true。sidebar 設定加開關。匯出 PNG 時根據設定決定是否顯示。

## RWD 完善

手機端（≤768px）改善：
- sidebar overlay 加半透明黑色背景（點背景關閉）
- ModeToolbar 在 sidebar 關閉時浮動顯示在地圖底部
- 匯出/存檔按鈕縮小為 icon-only
- 景點卡片在小螢幕上縮小（width: 140px）

## Store 擴展

```typescript
// 新增欄位
handDrawn: boolean;    // 手繪效果開關，預設 true
watermark: boolean;    // 浮水印開關，預設 true

// 新增動作
toggleHandDrawn: () => void;
toggleWatermark: () => void;
undo: () => void;      // temporal middleware 提供
redo: () => void;
```

## 新增檔案

```
online/src/
├── core/components/
│   └── SettingsPanel.tsx    # 手繪效果 + 浮水印開關
├── map/
│   ├── ArrowHead.tsx        # 路線終點箭頭
│   ├── HandDrawnFilter.tsx  # SVG filter 定義
│   └── Watermark.tsx        # 浮水印組件
```

## 新增依賴

- `zundo`：Zustand temporal middleware（Undo/Redo）

## 不做的事

| 功能 | 原因 |
|------|------|
| 區域遮蓋 | 線上版底圖乾淨，需求不大 |
| 清爽濾鏡 | OSM 圖磚已有風格，不需要 |
| 共用核心打包 | Phase 4 |

## 風險與對策

| 風險 | 對策 |
|------|------|
| SVG filter 效能（大量路線時） | handDrawn 可關閉；filter 只套 path 不套整個地圖 |
| zundo 與 Zustand 5 相容性 | 先查版本相容，不相容則手動實作快照陣列 |
| 匯出 PNG 時 SVG filter 不生效 | html-to-image 可能會忽略 SVG filter，需實測；備案：匯出前暫時用座標微移替代 |
