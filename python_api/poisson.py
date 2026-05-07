"""
Poisson Distribution — Pure Python
P(X=k) = (e^-λ * λ^k) / k!
Models probability of a bowler taking exactly k wickets in a match.
"""
import math
from stats_utils import poisson_pmf, normal_pdf


def compute_poisson(lam: float, max_k: int = 12):
    lam = max(0.01, float(lam))
    k_values = list(range(0, max_k + 1))

    pmf = [poisson_pmf(k, lam) for k in k_values]
    cdf = []
    running = 0
    for p in pmf:
        running += p
        cdf.append(min(running, 1.0))

    mode = k_values[pmf.index(max(pmf))]

    bars = [
        {
            "k":           k,
            "probability": round(p, 6),
            "cumulative":  round(c, 6),
            "label":       f"P(X={k})"
        }
        for k, p, c in zip(k_values, pmf, cdf)
    ]

    return {
        "lam":      round(lam, 4),
        "bars":     bars,
        "mean":     round(lam, 4),
        "variance": round(lam, 4),
        "std":      round(math.sqrt(lam), 4),
        "mode":     mode,
        "formula":  f"P(X=k) = (e^-{lam:.2f} × {lam:.2f}^k) / k!",
        "interpretation": (
            f"With an average of {lam:.2f} wickets per match, "
            f"the most likely outcome is {mode} wicket(s). "
            f"P(exactly 1 wicket) = {pmf[min(1,max_k)]:.1%}, "
            f"P(more than 2) = {1 - cdf[min(2,max_k)]:.1%}."
        )
    }
