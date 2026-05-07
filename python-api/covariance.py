"""
Covariance & Correlation Matrix
=================================
Covariance measures how two variables change together.
Cov(X,Y) = Σ[(Xi - X̄)(Yi - Ȳ)] / (n - 1)

Correlation normalizes covariance:
r = Cov(X,Y) / (σX × σY)

This module returns both matrices side by side so the
web app can display them together for comparison.
"""

import numpy as np
import pandas as pd
import os


def _load_batting():
    base = os.path.join(os.path.dirname(__file__), '..', 'data')
    df = pd.read_csv(os.path.join(base, 'odi-batting.csv'), index_col=0)
    df.rename(columns={"Ave": "Batting_Avg", "SR": "Strike_Rate", "Runs": "Runs_Scored"}, inplace=True)
    for col in ["Batting_Avg", "Strike_Rate", "Runs_Scored"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df.dropna(subset=["Batting_Avg", "Strike_Rate", "Runs_Scored"], inplace=True)
    return df


def _load_bowling():
    base = os.path.join(os.path.dirname(__file__), '..', 'data')
    df = pd.read_csv(os.path.join(base, 'odi-bowling.csv'), index_col=0)
    df.rename(columns={"Wkts": "Wickets", "Econ": "Economy_Rate", "Ave": "Bowling_Avg"}, inplace=True)
    for col in ["Wickets", "Economy_Rate", "Bowling_Avg"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df.dropna(subset=["Wickets", "Economy_Rate", "Bowling_Avg"], inplace=True)
    return df


def _matrix_to_rows(matrix: pd.DataFrame):
    """Convert a DataFrame matrix to a list of rows for the frontend table."""
    metrics = list(matrix.columns)
    rows = []
    for metric in metrics:
        rows.append({
            "metric": metric,
            "values": [round(float(matrix.loc[metric, m]), 4) for m in metrics]
        })
    return {"metrics": metrics, "rows": rows}


def compute_covariance(kind: str = "batting"):
    """
    Compute covariance and correlation matrices for batting or bowling.

    Parameters:
        kind : 'batting' or 'bowling'

    Returns dict with:
        - kind            : dataset used
        - metrics         : list of metric names
        - covariance      : covariance matrix as rows
        - correlation     : Pearson correlation matrix as rows
        - scatter_pairs   : scatter data for each metric pair
        - interpretation  : text explanation
    """
    if kind == "bowling":
        df      = _load_bowling()
        metrics = ["Wickets", "Economy_Rate", "Bowling_Avg"]
    else:
        df      = _load_batting()
        metrics = ["Batting_Avg", "Strike_Rate", "Runs_Scored"]
        kind    = "batting"

    subset = df[metrics].dropna()

    # Covariance matrix (ddof=1 → sample covariance)
    cov_matrix  = subset.cov()

    # Pearson correlation matrix
    corr_matrix = subset.corr(method="pearson")

    # Scatter pairs for each combination
    scatter_pairs = []
    for i in range(len(metrics)):
        for j in range(i + 1, len(metrics)):
            mx, my = metrics[i], metrics[j]
            points = [
                {"x": round(float(row[mx]), 3), "y": round(float(row[my]), 3)}
                for _, row in subset[[mx, my]].iterrows()
            ]
            scatter_pairs.append({
                "x_label": mx,
                "y_label": my,
                "points":  points,
                "cov":     round(float(cov_matrix.loc[mx, my]), 4),
                "corr":    round(float(corr_matrix.loc[mx, my]), 4),
            })

    # Build interpretation text
    strongest = max(scatter_pairs, key=lambda p: abs(p["corr"]))
    direction = "positive" if strongest["corr"] > 0 else "negative"

    return {
        "kind":        kind,
        "metrics":     metrics,
        "n":           len(subset),
        "covariance":  _matrix_to_rows(cov_matrix),
        "correlation": _matrix_to_rows(corr_matrix),
        "scatter_pairs": scatter_pairs,
        "formula":     "Cov(X,Y) = Σ[(Xi − X̄)(Yi − Ȳ)] / (n−1)",
        "interpretation": (
            f"Strongest relationship: {strongest['x_label'].replace('_',' ')} vs "
            f"{strongest['y_label'].replace('_',' ')} "
            f"(r = {strongest['corr']:.3f}, {direction} correlation). "
            f"Covariance values are in the original units² while correlation is unitless (−1 to +1)."
        )
    }
