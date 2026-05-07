"""
Pure Python statistical utilities — no numpy/scipy/pandas required.
All math done with Python's built-in math module and csv module.
"""
import math
import csv
import os


def mean(data):
    return sum(data) / len(data) if data else 0


def variance(data, ddof=1):
    if len(data) < 2:
        return 0
    m = mean(data)
    return sum((x - m) ** 2 for x in data) / (len(data) - ddof)


def std(data, ddof=1):
    return math.sqrt(variance(data, ddof))


def percentile(data, p):
    sorted_data = sorted(data)
    n = len(sorted_data)
    idx = (p / 100) * (n - 1)
    lo, hi = int(idx), min(int(idx) + 1, n - 1)
    return sorted_data[lo] + (idx - lo) * (sorted_data[hi] - sorted_data[lo])


def normal_pdf(x, mu, sigma):
    """Normal probability density function."""
    if sigma == 0:
        return 0
    return (1 / (sigma * math.sqrt(2 * math.pi))) * math.exp(-0.5 * ((x - mu) / sigma) ** 2)


def factorial(n):
    return math.factorial(int(n))


def poisson_pmf(k, lam):
    """P(X=k) for Poisson distribution."""
    return (math.exp(-lam) * (lam ** k)) / factorial(k)


def binom_coeff(n, k):
    return factorial(n) / (factorial(k) * factorial(n - k))


def binomial_pmf(k, n, p):
    """P(X=k) for Binomial distribution."""
    return binom_coeff(n, k) * (p ** k) * ((1 - p) ** (n - k))


def load_batting_csv():
    """Load ODI batting CSV and return list of dicts with normalized columns."""
    base = os.path.join(os.path.dirname(__file__), '..', 'data')
    rows = []
    with open(os.path.join(base, 'odi-batting.csv'), newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                avg = float(row.get('Ave', '') or 0)
                sr  = float(row.get('SR',  '') or 0)
                runs= float(row.get('Runs','') or 0)
                if avg > 0 and sr > 0 and runs > 0:
                    rows.append({
                        'Player':      row.get('Player', ''),
                        'Batting_Avg': avg,
                        'Strike_Rate': sr,
                        'Runs_Scored': runs,
                    })
            except (ValueError, TypeError):
                continue
    return rows


def load_bowling_csv():
    """Load ODI bowling CSV and return list of dicts with normalized columns."""
    base = os.path.join(os.path.dirname(__file__), '..', 'data')
    rows = []
    with open(os.path.join(base, 'odi-bowling.csv'), newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                wkts = float(row.get('Wkts', '') or 0)
                econ = float(row.get('Econ', '') or 0)
                avg  = float(row.get('Ave',  '') or 0)
                if wkts > 0 and econ > 0:
                    rows.append({
                        'Player':       row.get('Player', ''),
                        'Wickets':      wkts,
                        'Economy_Rate': econ,
                        'Bowling_Avg':  avg,
                    })
            except (ValueError, TypeError):
                continue
    return rows
