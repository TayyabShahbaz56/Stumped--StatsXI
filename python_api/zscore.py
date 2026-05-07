"""
Z-Score Analysis
=================
Computes how many standard deviations each player's metric value
is from the dataset mean.

Z = (X - μ) / σ

Used to identify elite performers (high positive Z) and
underperformers (high negative Z) relative to the dataset.
"""

import numpy as np
import pandas as pd
import os


def _load_batting():
    """Load ODI batting CSV and normalize columns."""
    base = os.path.join(os.path.dirname(__file__), '..', 'data')
    df = pd.read_csv(os.path.join(base, 'odi-batting.csv'), index_col=0)
    df.rename(columns={"Ave": "Batting_Avg", "SR": "Strike_Rate", "Runs": "Runs_Scored"}, inplace=True)
    df["Batting_Avg"]  = pd.to_numeric(df["Batting_Avg"],  errors="coerce")
    df["Strike_Rate"]  = pd.to_numeric(df["Strike_Rate"],  errors="coerce")
    df["Runs_Scored"]  = pd.to_numeric(df["Runs_Scored"],  errors="coerce")
    df.dropna(subset=["Batting_Avg", "Strike_Rate", "Runs_Scored"], inplace=True)
    return df


def compute_zscore(metric: str = "Batting_Avg", top_n: int = 20):
    """
    Compute Z-scores for all players on the given metric.

    Parameters:
        metric : column name to analyse
        top_n  : number of top/bottom players to return for chart

    Returns dict with:
        - metric      : metric name
        - mean, std   : dataset statistics
        - bell_curve  : points for normal curve overlay
        - top_players : top N players by Z-score (for ranked bar chart)
        - bot_players : bottom N players by Z-score
        - all_scatter : all players as scatter points {name, value, z}
    """
    valid_metrics = ["Batting_Avg", "Strike_Rate", "Runs_Scored"]
    if metric not in valid_metrics:
        metric = "Batting_Avg"

    df = _load_batting()
    values = df[metric].dropna()
    mu    = float(values.mean())
    sigma = float(values.std())

    if sigma == 0:
        sigma = 1.0

    # Z-score for every player
    df = df.copy()
    df["z_score"] = (df[metric] - mu) / sigma
    df = df.dropna(subset=["z_score"])

    # Bell curve points (x = raw metric value, y = normal PDF)
    from scipy.stats import norm
    x_range = np.linspace(mu - 4 * sigma, mu + 4 * sigma, 120)
    bell = [
        {"x": round(float(x), 3), "y": round(float(norm.pdf(x, mu, sigma)), 6)}
        for x in x_range
    ]

    # Ranked bar chart data — top N and bottom N
    sorted_df = df.sort_values("z_score", ascending=False)
    top = sorted_df.head(top_n)
    bot = sorted_df.tail(top_n).sort_values("z_score")

    def player_row(row):
        return {
            "player": str(row["Player"])[:25],
            "value":  round(float(row[metric]), 2),
            "z":      round(float(row["z_score"]), 3),
            "category": (
                "elite"       if row["z_score"] >= 2  else
                "above_avg"   if row["z_score"] >= 0.5 else
                "below_avg"   if row["z_score"] >= -0.5 else
                "poor"
            )
        }

    top_players = [player_row(row) for _, row in top.iterrows()]
    bot_players = [player_row(row) for _, row in bot.iterrows()]

    # Scatter — all players (value vs z)
    all_scatter = [
        {
            "player": str(row["Player"])[:20],
            "value":  round(float(row[metric]), 2),
            "z":      round(float(row["z_score"]), 3),
        }
        for _, row in df.iterrows()
    ]

    return {
        "metric":      metric,
        "mean":        round(mu, 4),
        "std":         round(sigma, 4),
        "bell_curve":  bell,
        "top_players": top_players,
        "bot_players": bot_players,
        "all_scatter": all_scatter,
        "formula":     "Z = (X − μ) / σ",
        "interpretation": (
            f"Dataset mean {metric.replace('_',' ')}: {mu:.2f}, "
            f"std dev: {sigma:.2f}. "
            f"A Z-score of +2 means the player is in the top ~2.3% of the dataset. "
            f"A Z-score of -2 means they are in the bottom ~2.3%."
        )
    }
