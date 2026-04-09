# Tasks — 003 Online Phase 3

## D1: Undo/Redo

### Task 1.1: 安裝 zundo + Store 整合
- `npm install zundo`
- 用 temporal middleware 包裝 useProjectStore
- `partialize`：只追蹤 `project`（spots, routes, name, center, zoom），不追蹤 UI 狀態
- limit: 50 步
- 若 zundo 不相容 Zustand 5，備案：手動實作（快照陣列 + pointer）

### Task 1.2: 快捷鍵 + UI 按鈕
- 全域 keydown listener：Ctrl/Cmd+Z = undo，Ctrl/Cmd+Shift+Z = redo
- sidebar 工具列加 ↩ ↪ 按鈕（disabled 時灰色）
- i18n 加 'undo' / 'redo' 字串
- 驗證：加景點 → undo → 景點消失 → redo → 景點回來

## D2: 手繪搖晃效果

### Task 2.1: SVG Filter 注入
- 建立 `src/map/HandDrawnFilter.tsx`
- 在 MapContainer 內注入隱藏 SVG `<defs>`，包含 feTurbulence + feDisplacementMap filter（id="hand-drawn"）
- baseFrequency="0.03"，numOctaves=2，scale=3

### Task 2.2: 路線套用 filter
- RouteLayer.tsx：路線 Polyline 加 className，CSS 設定 `filter: url(#hand-drawn)`
- 只在 store.handDrawn === true 時套用
- DrawingPreview 也套用（預覽時就看到效果）
- 驗證：開關 handDrawn 路線外觀立即變化

### Task 2.3: 匯出相容性測試
- 用 html-to-image 匯出含 SVG filter 的地圖
- 若 filter 在匯出時不生效：匯出前暫時把 Polyline positions 做座標微移（同離線版 sin/cos 公式），匯出後還原
- 記錄測試結果

## D3: 路線箭頭

### Task 3.1: ArrowHead 組件
- 建立 `src/map/ArrowHead.tsx`
- 取路線最後兩點，計算 atan2 角度
- 用 L.divIcon 渲染旋轉的三角形 CSS（border trick 或 SVG）
- 顏色跟隨路線 stroke 色
- 箭頭大小：14px

### Task 3.2: 整合到 RouteLayer
- 每條路線（pts.length >= 2）的終點加 ArrowHead
- 選中路線時箭頭也高亮
- 驗證：路線方向正確，換色後箭頭同步

## D4: 浮水印

### Task 4.1: Watermark 組件
- 建立 `src/map/Watermark.tsx`
- 位於地圖右下角（absolute position），attribution 上方
- 內容：🌿 TrailPaint 路小繪 + notoriouslab
- 半透明白底，字色 #fde68a（同離線版）
- store.watermark === false 時隱藏
- 匯出時根據 watermark 設定決定是否顯示（html-to-image filter）

### Task 4.2: Store + 設定面板
- store 加 handDrawn: boolean（預設 true）、watermark: boolean（預設 true）
- store 加 toggleHandDrawn、toggleWatermark
- 建立 `src/core/components/SettingsPanel.tsx`：兩個 toggle 開關
- sidebar 底部加設定入口（⚙️ 圖示）
- i18n 加相關字串

## D5: RWD 完善

### Task 5.1: 手機端 sidebar 改善
- sidebar overlay 加半透明黑色背景 div（class="sidebar-backdrop"），點擊關閉 sidebar
- sidebar 開啟時 body 不能滾動（已由 overflow:hidden 保證）

### Task 5.2: 手機端浮動 ModeToolbar
- 768px 以下，sidebar 關閉時 ModeToolbar 浮動顯示在地圖底部中央
- 用 createPortal 掛載到 map container
- z-index 高於地圖控制項

### Task 5.3: 小螢幕卡片縮小
- SpotCard width 在 768px 以下改為 140px
- 字體和 padding 等比縮小

## D6: i18n + 整合測試

### Task 6.1: i18n 補充
- zh-TW / en 加入：undo/redo、settings.handDrawn/settings.watermark、settings.title

### Task 6.2: 整合測試
- Undo/Redo：加景點→undo→redo、畫路線→undo→redo
- 手繪效果：開/關切換，匯出 PNG 驗證
- 箭頭：路線方向正確
- 浮水印：開/關，匯出驗證
- 手機 viewport：sidebar overlay、浮動 ModeToolbar、卡片縮小
