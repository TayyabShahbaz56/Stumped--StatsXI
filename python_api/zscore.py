"""
Z-Score Analysis — Pure Python
Z = (X - μ) / σ
Ranks players by how many std deviations they are from the dataset mean.
"""
import math
from stats_utils import mean, std, normal_pdf, load_batting_csv


def compute_zscore(metric: str = "Batting_Avg", top_n: int = 20):
    valid = ["Batting_Avg", "Strike_Rate", "Runs_Scored"]
    if metric not in valid:
        metric = "Batting_Avg"

    rows   = load_batting_csv()
    values = [r[metric] for r in rows if r[metric] > 0]

    mu    = mean(values)
    sigma = std(values)
    if sigma == 0:
        sigma = 1.0

    # Bell curve points
    steps  = 120
    x_min  = mu - 4 * sigma
    x_max  = mu + 4 * sigma
    step   = (x_max - x_min) / steps
    bell   = [
        {"x": round(x_min + i * step, 3), "y": round(normal_pdf(x_min + i * step, mu, sigma), 6)}
        for i in range(steps + 1)
    ]

    # Z-score per player
    players = []
    for r in rows:
        v = r[metric]
        if v <= 0:
            continue
        z = (v - mu) / sigma
        players.append({
            "player": r["Player"][:25],
            "value":  round(v, 2),
            "z":      round(z, 3),
            "category": (
                "elite"      if z >= 2   else
                "above_avg"  if z >= 0.5 else
                "below_avg"  if z >= -0.5 else
                "poor"
            )
        })

    players_sorted = sorted(players, key=lambda x: x["z"], reverse=True)
    top_players = players_sorted[:top_n]
    bot_players = list(reversed(players_sorted[-top_n:]))

    return {
        "metric":      metric,
        "mean":        round(mu, 4),
        "std":         round(sigma, 4),
        "bell_curve":  bell,
        "top_players": top_players,
        "bot_players": bot_players,
        "all_scatter": [{"player": p["player"], "value": p["value"], "z": p["z"]} for p in players],
        "formula":     "Z = (X − μ) / σ",
        "interpretation": (
            f"Mean {metric.replace('_',' ')}: {mu:.2f}, std dev: {sigma:.2f}. "
            f"Z = +2 means top ~2.3% of dataset. Z = -2 means bottom ~2.3%."
        )
    }
