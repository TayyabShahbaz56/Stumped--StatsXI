# Stumped! Technical Build Guide

This document explains how the project is engineered: architecture, data pipeline, APIs, frontend modules, performance choices, and deployment.

---

## 1) Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript (React, server routes)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Data Sources:** Local CSV + CricAPI

---

## 2) High-level Architecture

### App layer (`app/*`)
- Route pages for Dashboard, Analysis, Players, Form Tracker, Live, Tournaments
- Shared layout (`app/layout.js`), transition wrapper (`app/template.js`), loading UI (`app/loading.js`)

### API layer (`app/api/*/route.js`)
- Server-side routes that compute statistics and shape responses
- Prevents heavy data logic from running in client components

### Data/Math layer (`lib/*`)
- `dataProcessor.js`: schema normalization + parsing
- `datasets.js`: dataset discovery, classification, caching, selection
- `statistics.js`: reusable stat math (mean, std, percentile, IQR, regression)

### UI Components (`components/*`)
- Reusable chart and panel modules (`DistributionChart`, `RegressionPlot`, `PlayerCompare`, etc.)

---

## 3) Data Pipeline

1. CSV files in `data/` are discovered by `loadDatasets()`
2. File name is used to infer:
   - kind: batting / bowling / tournament
   - format: t20 / odi / test
3. Row-level normalization maps different raw headers into unified fields
4. API routes pull selected dataset via `getDataset({ kind, format })`
5. Server computes stats and returns compact JSON for UI

### Caching strategy
- `datasets.js` keeps a module-level cache (`cached`) to avoid repeated disk parsing on every API call.

---

## 4) API Contracts

### `/api/stats` (GET)
**Query:** `kind`, `format`, `metric`

**Returns:**
- `descriptive`
- `correlation`
- `regression`
- `distribution`
- `confidence_intervals`
- `outliers`
- `player_comparison`
- `dataset_info`

**Implementation notes:**
- Metric fallback if requested metric has no numeric data
- Defensive handling for empty columns, invalid min/max, equal-value distributions
- Regression returns note + empty sample when insufficient pair rows

### `/api/players` (GET)
**Query:** `q`, `limit`, `kind`, `format`

Returns list shape based on kind (batting/bowling fields).

### `/api/players/[slug]` (GET)
**Query:** `kind`, `format`

Returns full player profile + dataset-relative summary stats.

### `/api/player-form` (GET)
**Query:** `player` (optional)

Hybrid endpoint combining career CSV + live scorecards for form delta analysis.

### `/api/live` (GET)
Returns `live_matches`, `recent_matches`, and `api` metadata (`configured`, `live_ok`, errors, etc.).

### `/api/tournaments` (GET)
Returns raw rows + aggregate tournament summary (`topWinners`, `byFormat`, etc.).

### Legacy utility APIs
- `/api/predict` (POST): regression prediction endpoint
- `/api/outliers` (POST): IQR outlier details for one metric

---

## 5) Frontend Composition by Page

### Dashboard (`app/page.js`)
- Controls drive one `/api/stats` request
- Welcome splash (`STUMPED! by StatsXI`) appears for ~3.4 sec before dashboard
- Renders all key panels from a single stats payload to reduce multiple round-trips

### Deep Analysis (`app/analysis/page.js`)
- Tabbed analysis UI
- Correlation table now uses live `stats.correlation` data (format-aware)

### Players (`app/players/page.js`, `app/players/[slug]/page.js`)
- List endpoint + detail endpoint
- Profile page supports runtime switching of kind/format via URL search params

### Form Tracker (`app/form-tracker/page.js`)
- Uses `PlayerFormComparison` component
- Supports search-by-player request flow

### Live (`app/live/page.js`)
- Polling refresh every 120s
- Robust score rendering for object/array/string score structures

### Tournaments (`app/tournaments/page.js`)
- KPI cards + two charts + filterable table
- Client recomputes summary for active filters

---

## 6) Smoothness/UX Optimizations Implemented

- Header route prefetch (`router.prefetch`) on mount + hover
- App-level route fade via `app/template.js`
- Loading UI in `app/loading.js`
- Reduced heavy stagger animations to short duration transitions
- Kept shell visible during data fetches where possible (less hard blocking)

Note: Dev mode (`npm run dev`) can still feel slower than production due to HMR/instrumentation.

---

## 7) Error Handling & Stability

- API routes use `try/catch` and return JSON errors with status codes
- Empty-data safe handling in distribution/regression/correlation
- Live score rendering guarded against object rendering errors
- UI fallback states for no-data and API-not-configured paths

---

## 8) Environment & Configuration

Required env variable for live features:

```env
CRICKETDATA_API_KEY=your_key_here
```

- Must be present in `.env.local` for local
- Must be set in Vercel project env variables for deployment
- Server restart required after env change

---

## 9) Build/Run Commands

```bash
npm install
npm run dev
npm run build
npm start
```

Recommended pre-deploy check:
1. `npm run build`
2. Run production server (`npm start`)
3. Smoke test all pages + format/kind switches

---

## 10) Deployment (Vercel)

1. Push repo to GitHub
2. Import project in Vercel
3. Set env var `CRICKETDATA_API_KEY`
4. Deploy
5. Verify API routes:
   - `/api/live`
   - `/api/stats?kind=batting&format=t20&metric=Batting_Avg`

---

## 11) Limitations / Future Improvements

- CSV parsing currently uses simple comma splitting (acceptable for current dataset; could be upgraded to robust CSV parser for quoted-comma cases)
- Live API data depends on provider availability, quota, and active matches
- Add server-side unit tests for statistical helper functions
- Add persistent cache layer (Redis/file cache) for larger datasets

---

## 12) Quick File Map

- Core stats API: `app/api/stats/route.js`
- Live API: `app/api/live/route.js`
- Form tracker API: `app/api/player-form/route.js`
- Dataset loader: `lib/datasets.js`
- Data normalization: `lib/dataProcessor.js`
- Math functions: `lib/statistics.js`
- Dashboard page: `app/page.js`
- Analysis page: `app/analysis/page.js`
- Compare component: `components/PlayerCompare.js`
- Form component: `components/PlayerFormComparison.js`
