# Stumped! by StatsXI

Advanced cricket analytics web app built with Next.js for statistical and probability-based performance analysis across batting, bowling, live matches, and tournaments.

## Repo Description (GitHub one-liner)

Stumped! by StatsXI is a Next.js cricket analytics platform with descriptive statistics, regression, correlation, confidence intervals, outlier detection, live match integration, and player/tournament analysis.

## Features

- Multi-format analytics: `T20`, `ODI`, `TEST`
- Batting and bowling mode switching
- Descriptive statistics, probability/distribution analysis, and regression
- Dynamic correlation matrix (updates by selected format and kind)
- 95% confidence intervals and IQR outlier detection
- Player list and detailed player profile pages
- Form tracker (career vs live strike-rate comparison)
- Live matches and recent matches (CricAPI integration)
- Tournaments dashboard with summary cards and charts
- Smooth transitions and dashboard welcome splash

## Tech Stack

- Next.js 14 (App Router)
- React + Tailwind CSS
- Recharts (charts)
- Framer Motion (animations)
- Lucide React (icons)

## Project Structure

- `app/` - route pages and API routes
- `components/` - reusable UI components/charts
- `lib/` - dataset loading, normalization, and statistics helpers
- `data/` - CSV datasets (batting, bowling, tournaments)
- `public/` - static assets (logo, etc.)

## API Endpoints

- `GET /api/stats` - descriptive, correlation, regression, distribution, confidence intervals, outliers
- `GET /api/live` - live matches, recent matches, API status metadata
- `GET /api/player-form` - form tracking (career vs live)
- `GET /api/players` - players listing by kind/format
- `GET /api/players/[slug]` - single player profile
- `GET /api/tournaments` - tournaments rows + aggregated summary
- `POST /api/predict` - prediction helper endpoint
- `POST /api/outliers` - outlier helper endpoint

## Getting Started (Local)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env.local` in project root:

```env
CRICKETDATA_API_KEY=your_cricapi_key_here
```

### 3) Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

### 4) Production build check

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Push project to GitHub
2. Import repository in Vercel
3. Add environment variable:
   - `CRICKETDATA_API_KEY`
4. Deploy
5. Verify:
   - `/api/live` returns `"configured": true`
   - Format switching and analysis pages work correctly

## Notes

- Live API data depends on CricAPI availability and active matches.
- In `npm run dev`, navigation can feel slower than production due to dev tooling overhead.

## Viva and Technical Docs

- `VIVA_GUIDE.md` - page-wise formulas and chart explanation
- `TECHNICAL_BUILD_GUIDE.md` - architecture and implementation details

## License

For academic/project use.
# Stumped! | StatsXI - Cricket Analytics

Advanced cricket analytics with hybrid data (Kaggle + CricketData API).

## Premium Feature: Player Form Comparison
Merges Kaggle career statistics with real-time CricketData API match data.

## Setup
1. Copy `.env.local.example` to `.env.local` and add API key
2. Place `twb.csv` in `/data/`
3. Add `logo.png` in `/public/`
4. `npm install` then `npm run dev`

## Deploy: `vercel --prod`