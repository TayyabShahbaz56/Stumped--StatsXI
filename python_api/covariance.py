"""
Covariance & Correlation Matrix — Pure Python
Cov(X,Y) = Σ[(Xi - X̄)(Yi - Ȳ)] / (n-1)
r = Cov(X,Y) / (σX × σY)
"""
from stats_utils import mean, std, load_batting_csv, load_bowling_csv


def covariance(x, y):
    """Sample covariance between two lists."""
    n = min(len(x), len(y))
    if n < 2:
        return 0
    mx, my = mean(x[:n]), mean(y[:n])
    return sum((x[i] - mx) * (y[i] - my) for i in range(n)) / (n - 1)


def pearson(x, y):
    """Pearson correlation coefficient."""
    sx, sy = std(x), std(y)
    if sx == 0 or sy == 0:
        return 0
    return max(-1, min(1, covariance(x, y) / (sx * sy)))


def compute_covariance(kind: str = "batting"):
    if kind == "bowling":
        rows    = load_bowling_csv()
        metrics = ["Wickets", "Economy_Rate", "Bowling_Avg"]
    else:
        rows    = load_batting_csv()
        metrics = ["Batting_Avg", "Strike_Rate", "Runs_Scored"]
        kind    = "batting"

    # Extract columns
    cols = {m: [r[m] for r in rows if r.get(m, 0) > 0] for m in metrics}
    # Align lengths
    min_len = min(len(cols[m]) for m in metrics)
    cols    = {m: cols[m][:min_len] for m in metrics}

    # Build covariance matrix
    cov_rows = []
    for m1 in metrics:
        cov_rows.append({
            "metric": m1,
            "values": [round(covariance(cols[m1], cols[m2]), 4) for m2 in metrics]
        })

    # Build correlation matrix
    corr_rows = []
    for m1 in metrics:
        corr_rows.append({
            "metric": m1,
            "values": [round(pearson(cols[m1], cols[m2]), 4) for m2 in metrics]
        })

    # Scatter pairs
    scatter_pairs = []
    for i in range(len(metrics)):
        for j in range(i + 1, len(metrics)):
            mx, my = metrics[i], metrics[j]
            points = [{"x": round(cols[mx][k], 3), "y": round(cols[my][k], 3)} for k in range(min_len)]
            cov_val  = covariance(cols[mx], cols[my])
            corr_val = pearson(cols[mx], cols[my])
            scatter_pairs.append({
                "x_label": mx,
                "y_label": my,
                "points":  points,
                "cov":     round(cov_val, 4),
                "corr":    round(corr_val, 4),
            })

    strongest = max(scatter_pairs, key=lambda p: abs(p["corr"]))
    direction = "positive" if strongest["corr"] > 0 else "negative"

    return {
        "kind":        kind,
        "metrics":     metrics,
        "n":           min_len,
        "covariance":  {"metrics": metrics, "rows": cov_rows},
        "correlation": {"metrics": metrics, "rows": corr_rows},
        "scatter_pairs": scatter_pairs,
        "formula":     "Cov(X,Y) = Σ[(Xi − X̄)(Yi − Ȳ)] / (n−1)",
        "interpretation": (
            f"Strongest: {strongest['x_label'].replace('_',' ')} vs "
            f"{strongest['y_label'].replace('_',' ')} "
            f"(r = {strongest['corr']:.3f}, {direction}). "
            f"Covariance is in original units², correlation is unitless (−1 to +1)."
        )
    }
