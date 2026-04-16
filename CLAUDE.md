# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TrailPaint 路小繪** is a hand-drawn style route map creation tool for hikers, cyclists, and travel bloggers. It runs entirely in the browser as a PWA (no backend). The app lives under the `online/` subdirectory — all development happens there.

## Commands

All commands should be run from the `online/` directory:

```bash
cd online

npm run dev        # Start dev server (Vite)
npm run build      # Type-check (tsc -b) then build
npm run lint       # ESLint
npm run preview    # Preview production build
```

There is no test framework configured.

## Architecture

```
online/src/
├── core/          # Leaflet-agnostic: store, models, utilities, UI components
│   ├── store/     # Zustand store with zundo undo/redo (useProjectStore.ts)
│   ├── models/    # TypeScript types (Project, Spot, Route, Mode)
│   ├── components/# Sidebar, editors, export/import UI
│   ├── hooks/     # useUndoRedo, useImageCompress
│   └── utils/     # GPX parsing, export rendering, geo math, APIs
├── map/           # Leaflet/react-leaflet integration layer
│   ├── MapView.tsx        # Main map container
│   ├── SpotMarker.tsx     # Individual markers
│   ├── RouteLayer.tsx     # Route polylines + arrows
│   ├── PlaybackManager.tsx# Route slideshow/playback
│   └── ...
├── i18n/          # Custom i18n (zh-TW, en, ja) — locale from URL param, env, or browser
└── data/examples/ # Sample routes
```

**Key architectural principle**: `core/` has no dependency on Leaflet. Map-specific code belongs in `map/`.

## State Management

Single Zustand store at `core/store/useProjectStore.ts` with `zundo` middleware for undo/redo. The store holds the entire `Project` (spots, routes, settings). All mutations go through store actions — never mutate state directly.

## Key External APIs (no auth required)

- **Nominatim** — reverse geocoding / location search
- **Open-Meteo** — elevation data for routes
- **TinyURL** — short link generation for share URLs

## Build Output

- Base path: `/app/` (configured in `vite.config.ts`)
- Outputs to `../app` (one level above `online/`)
- Deployed to GitHub Pages at `https://trailpaint.org/app/`

## i18n

Use the `t()` function from `src/i18n/index.ts`. Add new keys to all three locale files (`zh-TW.ts`, `en.ts`, `ja.ts`) simultaneously.

## Map Styles

Five base maps are supported: OpenStreetMap, CARTO Light/Dark, Protomaps Light/Dark (vector tiles via protomaps-leaflet). The "sketch" visual style is applied via SVG filters in `HandDrawnFilter.tsx` and CSS in `MapView.css`.

## Export Pipeline

Image export uses two paths:
1. **Canvas renderer** (`core/utils/exportRenderer.ts`) — draws spots and routes directly onto a canvas
2. **html-to-image** — captures the DOM for screenshot-based export

## PWA / Offline

Service worker (via vite-plugin-pwa + Workbox) caches map tiles with StaleWhileRevalidate (30-day TTL) and API responses with NetworkFirst strategy.
