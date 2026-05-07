"""
Binomial Distribution — Pure Python
P(X=k) = C(n,k) * p^k * (1-p)^(n-k)
Models probability of hitting exactly k boundaries in n balls.
"""
import math
from stats_utils import binomial_pmf, normal_pdf


def compute_binomial(n: int, p: float):
    n = max(1, int(n))
    p = max(0.001, min(0.999, float(p)))

    mean_val = n * p
    var_val  = n * p * (1 - p)
    std_val  = math.sqrt(var_val)

    pmf = [binomial_pmf(k, n, p) for k in range(n + 1)]
    cdf = []
    running = 0
    for prob in pmf:
        running += prob
        cdf.append(min(running, 1.0))

    mode = pmf.index(max(pmf))

    # Only include bars with meaningful probability
    bars = [
        {
            "k":           k,
            "probability": round(pmf[k], 6),
            "cumulative":  round(cdf[k], 6),
            "label":       f"k={k}"
        }
        for k in range(n + 1)
        if pmf[k] > 0.0001
    ]

    # Normal approximation (only when valid)
    normal_approx = []
    normal_valid = (n * p >= 5) and (n * (1 - p) >= 5)
    if normal_valid and std_val > 0:
        steps = 80
        x_min = max(0, mean_val - 4 * std_val)
        x_max = min(n, mean_val + 4 * std_val)
        step  = (x_max - x_min) / steps
        normal_approx = [
            {"x": round(x_min + i * step, 3), "y": round(normal_pdf(x_min + i * step, mean_val, std_val), 6)}
            for i in range(steps + 1)
        ]

    return {
        "n":            n,
        "p":            round(p, 4),
        "bars":         bars,
        "mean":         round(mean_val, 4),
        "variance":     round(var_val, 4),
        "std":          round(std_val, 4),
        "mode":         mode,
        "normal_approx": normal_approx,
        "normal_valid": normal_valid,
        "formula":      f"P(X=k) = C({n},k) × {p:.3f}^k × {1-p:.3f}^({n}-k)",
        "interpretation": (
            f"In {n} balls with {p:.1%} boundary probability, "
            f"expected boundaries = {mean_val:.1f} (±{std_val:.1f}). "
            f"Most likely outcome: {mode} boundary/boundaries."
        )
    }
