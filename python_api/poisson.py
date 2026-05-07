"""
Poisson Distribution Analysis
==============================
Models the probability of a bowler taking exactly k wickets in a match.
Uses the Poisson PMF: P(X=k) = (e^-λ * λ^k) / k!
where λ (lambda) = average wickets per match
"""

import numpy as np
from scipy.stats import poisson


def compute_poisson(lam: float, max_k: int = 12):
    """
    Compute Poisson distribution probabilities for k = 0 to max_k.

    Parameters:
        lam   : average wickets per match (lambda)
        max_k : maximum k value to compute up to

    Returns dict with:
        - lam        : lambda used
        - bars       : list of {k, probability, cumulative} for chart
        - mean       : expected value (= lambda)
        - variance   : variance (= lambda for Poisson)
        - std        : standard deviation
        - mode       : most likely k value
    """
    lam = max(0.01, float(lam))
    k_values = np.arange(0, max_k + 1)

    # PMF: probability of exactly k wickets
    pmf = poisson.pmf(k_values, mu=lam)

    # CDF: cumulative probability up to k
    cdf = poisson.cdf(k_values, mu=lam)

    bars = [
        {
            "k": int(k),
            "probability": round(float(p), 6),
            "cumulative": round(float(c), 6),
            "label": f"P(X={k})"
        }
        for k, p, c in zip(k_values, pmf, cdf)
    ]

    mode = int(k_values[np.argmax(pmf)])

    return {
        "lam": round(lam, 4),
        "bars": bars,
        "mean": round(float(lam), 4),
        "variance": round(float(lam), 4),
        "std": round(float(np.sqrt(lam)), 4),
        "mode": mode,
        "formula": f"P(X=k) = (e^-{lam:.2f} × {lam:.2f}^k) / k!",
        "interpretation": (
            f"With an average of {lam:.2f} wickets per match, "
            f"the most likely outcome is {mode} wicket(s). "
            f"There is a {pmf[min(1, max_k)]:.1%} chance of taking exactly 1 wicket "
            f"and a {(1 - cdf[min(2, max_k)]):.1%} chance of taking more than 2."
        )
    }
