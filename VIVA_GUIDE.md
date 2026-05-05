# Stumped! Viva Guide (Page-wise + Calculations)

This guide is for viva preparation. It explains, in simple order, what each page does, what calculations are happening, and how each chart is generated.

---

## 1) Project Overview (Opening answer in viva)

- Project name: **Stumped! by StatsXI**
- Stack: **Next.js (App Router) + React + Tailwind + Recharts + Framer Motion**
- Data sources:
  - Local CSV datasets (batting, bowling, tournaments)
  - Live cricket data from **CricAPI** via `CRICKETDATA_API_KEY`
- Core objective:
  - Apply statistical methods (descriptive stats, probability/distribution, regression, confidence intervals, outliers, correlation) to cricket data
  - Present in an interactive web app

---

## 2) Dashboard (`/`)

### What this page shows
- Dataset controls (batting/bowling + ODI/T20/TEST + metric)
- KPI cards
- Player comparison
- Regression chart
- Distribution chart
- Confidence interval table
- Outlier detection
- Radar/table for top players
- Live matches + form tracker section

### What calculations happen
All major stats come from `GET /api/stats`:

1. **Descriptive statistics** per metric
   - Mean: `sum(x) / n`
   - Median: percentile(50)
   - Standard deviation: `sqrt(sum((x-mean)^2)/n)`
   - Min/Max
   - Q1/Q3
   - Skewness and kurtosis (moment-based)

2. **Regression**
   - Batting mode: `Strike_Rate -> Runs_Scored`
   - Bowling mode: `Economy_Rate -> Wickets`
   - Uses linear regression:
     - Slope `m = (n*sum(xy)-sum(x)sum(y)) / (n*sum(x^2)-sum(x)^2)`
     - Intercept `b = (sum(y)-m*sum(x))/n`
     - `R² = 1 - SS_residual/SS_total`
   - Prediction is computed by `y = m*x + b`

3. **Distribution**
   - Histogram with fixed bins (30)
   - Normal curve (PDF) over metric using mean and std dev
   - Safe handling for empty/invalid columns

4. **Confidence intervals (95%)**
   - `SE = std / sqrt(n)`
   - Margin of error: `1.96 * SE`
   - CI: `[mean - margin, mean + margin]`

5. **Outliers (IQR rule)**
   - `IQR = Q3 - Q1`
   - Lower bound `Q1 - 1.5*IQR`
   - Upper bound `Q3 + 1.5*IQR`
   - Any value outside bounds is outlier

### How charts are made
- `RegressionPlot` uses sample points + fitted line values
- `DistributionChart` uses histogram counts and generated pdf curve points
- `ConfidenceInterval` shows bar/range-style visual + table values
- `OutlierDetection` uses count + bounds returned from API

---

## 3) Deep Analysis (`/analysis`)

### Tabs and logic
1. **Descriptive** tab
   - Same descriptive values as API
   - Table + histogram + format pie

2. **Probability** tab
   - Distribution mean, std, normality placeholder fields

3. **Regression** tab
   - Displays regression equation, R², and live prediction box

4. **Correlation** tab (fixed)
   - Matrix now updates with selected kind/format
   - Correlation is Pearson-based:
     - For two metrics `a,b`:
       - Compute covariance numerator and denominator from centered values
       - `r = cov(a,b)/(std(a)*std(b))`
       - Clamped between `-1` and `1`

### Viva note
If asked why values change across formats: each switch loads a different dataset (`getDataset(kind, format)`), so correlations and all stats are recomputed on that subset.

---

## 4) Players (`/players`) and Player Profile (`/players/[slug]`)

### Players list
- Calls `/api/players`
- Shows player cards from selected dataset shape

### Player profile
- Calls `/api/players/[slug]?kind=&format=`
- Builds **dataset-relative summary** (mean/std for selected metrics)
- Uses z-score:
  - `z = (value - dataset_mean)/dataset_std`
- For bowling profile radar:
  - Economy and bowling average are inverted in visualization so higher plotted score means better performance

### Charts
- Radar chart: z-scores by metric
- Bar chart: milestone/core stats

---

## 5) Form Tracker (`/form-tracker`)

### Data flow
- Endpoint: `/api/player-form`
- Reads career batting data from CSV (`twb.csv`)
- If API key available:
  - Fetches live matches
  - Fetches scorecards
  - Extracts batsman innings (`runs`, `balls`, `sr`)
  - Matches live names with career names

### Form calculation
- Career SR = from dataset
- Live SR = from scorecard or `(runs/balls)*100`
- Form delta:
  - `delta% = ((liveSR - careerSR)/careerSR) * 100`
- Assessment thresholds:
  - `> +15%` => **above**
  - `< -15%` => **below**
  - otherwise => **average**

### Fallback behavior
- If no live match data, it returns top 6 career players with simulated live numbers, so UI remains demonstrable.

---

## 6) Live Matches (`/live`)

### Endpoint and calls
- Endpoint: `/api/live`
- Calls CricAPI:
  - `/currentMatches`
  - `/matches`

### What page shows
- Live matches cards
- Recent matches cards
- Auto-refresh every 2 minutes

### Score formatting fix
- `match.score` can be string/object/array.
- UI now formats all shapes safely before rendering (prevents React child object runtime error).

---

## 7) Tournaments (`/tournaments`)

### Data source
- Endpoint: `/api/tournaments`
- Combines all tournament CSV rows

### Summary calculations
- Total rows
- Unique series/tournaments
- Inconclusive count (draw/no-result/tied/abandoned)
- Wins grouped by winner
- Format distribution grouped by `Format`

### Charts
- Horizontal bar: top winners by wins
- Pie chart: format share
- Filtered view recomputes summary client-side for responsive analysis

---

## 8) API Summary (quick viva answers)

- `/api/stats` -> descriptive, correlation, regression, distribution, CI, outliers, top players
- `/api/live` -> live/recent + API status metadata
- `/api/player-form` -> career vs live form comparison
- `/api/players` -> list for batting/bowling by format
- `/api/players/[slug]` -> single player profile summary
- `/api/tournaments` -> rows + aggregate summary
- `/api/predict` (optional endpoint) -> regression prediction with confidence interval
- `/api/outliers` (optional endpoint) -> IQR outliers for selected metric

---

## 9) Common Viva Questions + Strong Answers

### Q: How do you ensure data from different CSV schemas works together?
A: We normalize fields in `lib/dataProcessor.js` (e.g., `Ave` -> `Batting_Avg`, `Econ` -> `Economy_Rate`) and assign consistent keys like `Match_Type`, `Player_ID`, etc.

### Q: Why do some TEST regressions show weak/empty results?
A: Some TEST batting files may have missing strike-rate values. Regression requires paired numeric `x,y`; if insufficient, API returns safe fallback with a note.

### Q: How is correlation calculated?
A: Pearson correlation from numeric pairs in current selected dataset; values are recomputed after each format/kind switch.

### Q: How are outliers detected?
A: IQR method: values outside `Q1-1.5*IQR` and `Q3+1.5*IQR`.

### Q: How do you handle API failure/no live matches?
A: Endpoints return safe empty arrays with metadata; UI shows fallback states without crashing.

---

## 10) Final viva checklist

- Explain one full flow: **UI control -> API route -> formula -> chart**
- Be ready to define: mean, std dev, CI, IQR, Pearson `r`, regression slope/intercept, `R²`
- Show one batting format and one bowling format switch live
- Show one player profile and one form tracker example
- Mention limitations honestly (external API can return empty data at certain times)
