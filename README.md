# Stumped! by StatsXI

> Advanced cricket analytics platform with real-time live match data, statistical modeling, and interactive player comparisons.

🌐 **Live Demo:** [stumped-stats-xi-24f-0506.vercel.app](https://stumped-stats-xi-24f-0506.vercel.app)

---

## What is this?

Stumped! by StatsXI is a full-stack cricket analytics web app built with **Next.js 14**. It combines historical CSV datasets (batting, bowling, tournaments) with live match data from the **CricketData API** to deliver statistical insights across T20, ODI, and Test formats.

---

## Features

- **Multi-format support** — T20, ODI, and Test for both batting and bowling
- **Descriptive statistics** — Mean, median, standard deviation, skewness, kurtosis, Q1/Q3
- **Regression modeling** — Linear regression with R² score and prediction equation
- **Probability distributions** — Histogram + normal curve overlay per metric
- **95% Confidence intervals** — Computed per metric with margin of error
- **Outlier detection** — IQR method with lower/upper bounds
- **Correlation matrix** — Pearson correlation, updates dynamically per format
- **Player profiles** — Z-score based radar charts and stat summaries
- **Player form tracker** — Compares career strike rate vs live innings performance
- **Live matches** — Real-time scores via CricketData API, auto-refreshes every 2 minutes
- **Tournaments dashboard** — KPI cards, top winners chart, format distribution pie
- **Smooth UX** — Framer Motion transitions, loading states, welcome splash

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React + Tailwind CSS |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Data | Local CSV + CricketData API |

---

## Project Structure

```
stumped-statsxi/
├── app/
│   ├── page.js                  # Dashboard
│   ├── analysis/page.js         # Deep analysis (tabs)
│   ├── players/page.js          # Players list
│   ├── players/[slug]/page.js   # Player profile
│   ├── form-tracker/page.js     # Form tracker
│   ├── live/page.js             # Live matches
│   ├── tournaments/page.js      # Tournaments
│   └── api/                     # API routes (stats, live, players, etc.)
├── components/                  # Reusable chart and UI components
├── lib/
│   ├── dataProcessor.js         # CSV schema normalization
│   ├── datasets.js              # Dataset loading and caching
│   └── statistics.js            # Math helpers (mean, std, regression, IQR)
├── data/                        # CSV datasets (batting, bowling, tournaments)
└── public/                      # Static assets (logo)
```

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/stats` | GET | Descriptive stats, regression, distribution, CI, outliers, correlation |
| `/api/live` | GET | Live and recent matches + API status |
| `/api/player-form` | GET | Career vs live form comparison |
| `/api/players` | GET | Player list by kind and format |
| `/api/players/[slug]` | GET | Single player profile |
| `/api/tournaments` | GET | Tournament rows + aggregated summary |
| `/api/predict` | POST | Regression prediction |
| `/api/outliers` | POST | IQR outlier details for a metric |

---

## Getting Started Locally

### 1. Clone the repo

```bash
git clone https://github.com/your-username/stumped-statsxi.git
cd stumped-statsxi
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
CRICKETDATA_API_KEY=your_api_key_here
```

Get a free API key from [cricketdata.org](https://cricketdata.org).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

This project is deployed on **Vercel**.

To deploy your own:

1. Push the repo to GitHub
2. Import it in [vercel.com](https://vercel.com)
3. Add the environment variable `CRICKETDATA_API_KEY` in project settings
4. Deploy

Or via CLI:

```bash
vercel env add CRICKETDATA_API_KEY production
vercel --prod
```

---

## Screenshots

> Dashboard with live stats, regression plot, and distribution chart
<img width="1512" height="882" alt="image" src="https://github.com/user-attachments/assets/6ff8985d-68f4-4328-b7e9-0700119a77d4" />

> Player profile with radar chart and z-score analysis
<img width="1443" height="749" alt="image" src="https://github.com/user-attachments/assets/c883a538-35ea-4334-b4ab-bdf4dd3f1784" />

> Live matches with real-time scores
<img width="1438" height="745" alt="image" src="https://github.com/user-attachments/assets/317fda22-95b2-4962-8844-eddfb5ead105" />


---

## Notes

- Live match data depends on CricketData API availability and active matches
- Some Test format regressions may show weak results due to missing strike-rate values in datasets
- Dev mode (`npm run dev`) is slower than production due to HMR overhead

---

## License

For academic and project use only.
