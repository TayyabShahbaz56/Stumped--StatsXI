"""
Binomial Distribution Analysis
================================
Models the probability of a batsman hitting exactly k boundaries (4s or 6s)
in n balls, given a fixed probability p of hitting a boundary per ball.

Uses Binomial PMF: P(X=k) = C(n,k) * p^k * (1-p)^(n-k)
"""

import numpy as np
from scipy.stats import binom
from math import comb


def compute_binomial(n: int, p: float):
    """
    Compute Binomial distribution probabilities for k = 0 to n.

    Parameters:
        n : number of balls faced (trials)
        p : probability of hitting a boundary per ball (success probability)

    Returns dict with:
        - n, p       : parameters used
        - bars       : list of {k, probability, cumulative} for chart
        - mean       : expected boundaries = n*p
        - variance   : n*p*(1-p)
        - std        : standard deviation
        - mode       : most likely k
        - normal_approx : normal approximation curve points (for overlay)
    """
    n = max(1, int(n))
    p = max(0.001, min(0.999, float(p)))

    k_values = np.arange(0, n + 1)

    # PMF and CDF
    pmf = binom.pmf(k_values, n=n, p=p)
    cdf = binom.cdf(k_values, n=n, p=p)

    bars = [
        {
            "k": int(k),
            "probability": round(float(prob), 6),
            "cumulative": round(float(c), 6),
            "label": f"k={k}"
        }
        for k, prob, c in zip(k_values, pmf, cdf)
        if float(prob) > 0.0001  # skip near-zero tails for cleaner chart
    ]

    mean = n * p
    variance = n * p * (1 - p)
    std = np.sqrt(variance)
    mode = int(k_values[np.argmax(pmf)])

    # Normal approximation curve (valid when n*p >= 5 and n*(1-p) >= 5)
    normal_approx = []
    if n * p >= 5 and n * (1 - p) >= 5:
        from scipy.stats import norm
        x_fine = np.linspace(max(0, mean - 4 * std), min(n, mean + 4 * std), 80)
        y_fine = norm.pdf(x_fine, loc=mean, scale=std)
        normal_approx = [
            {"x": round(float(x), 3), "y": round(float(y), 6)}
            for x, y in zip(x_fine, y_fine)
        ]

    return {
        "n": n,
        "p": round(p, 4),
        "bars": bars,
        "mean": round(float(mean), 4),
        "variance": round(float(variance), 4),
        "std": round(float(std), 4),
        "mode": mode,
        "normal_approx": normal_approx,
        "normal_valid": n * p >= 5 and n * (1 - p) >= 5,
        "formula": f"P(X=k) = C({n},k) × {p:.3f}^k × {1-p:.3f}^({n}-k)",
        "interpretation": (
            f"In {n} balls with a {p:.1%} boundary probability, "
            f"the expected number of boundaries is {mean:.1f} (±{std:.1f}). "
            f"The most likely outcome is {mode} boundary/boundaries."
        )
    }
