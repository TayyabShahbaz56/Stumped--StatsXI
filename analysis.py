"""
Stumped! by StatsXI - Python Statistical Analysis
===================================================
Probability & Statistics Semester Project - Spring 2026

This script performs full statistical analysis on cricket datasets:
- Descriptive Statistics
- Probability Distribution (Normal)
- 95% Confidence Intervals
- Linear Regression Modeling & Predictions
- Outlier Detection (IQR Method)
- Pearson Correlation Matrix

All charts are saved as PNG files in the 'output/' folder.
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from scipy import stats
from scipy.stats import norm

# ── Output folder ──────────────────────────────────────────────────────────────
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Color theme (matches the web app) ─────────────────────────────────────────
CRICKET_GREEN = "#10b981"
BG_COLOR      = "#0f172a"
PANEL_COLOR   = "#1e293b"
TEXT_COLOR    = "#f1f5f9"
ACCENT_COLOR  = "#34d399"

plt.rcParams.update({
    "figure.facecolor":  BG_COLOR,
    "axes.facecolor":    PANEL_COLOR,
    "axes.edgecolor":    "#334155",
    "axes.labelcolor":   TEXT_COLOR,
    "xtick.color":       TEXT_COLOR,
    "ytick.color":       TEXT_COLOR,
    "text.color":        TEXT_COLOR,
    "grid.color":        "#334155",
    "grid.linestyle":    "--",
    "grid.alpha":        0.5,
    "font.family":       "sans-serif",
})

# ══════════════════════════════════════════════════════════════════════════════
# 1. LOAD DATA
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "="*60)
print("  STUMPED! by StatsXI — Python Statistical Analysis")
print("="*60)

# ODI Batting
batting = pd.read_csv("data/odi-batting.csv", index_col=0)
batting.rename(columns={"Ave": "Batting_Avg", "SR": "Strike_Rate", "Runs": "Runs_Scored", "Wkts": "Wickets"}, inplace=True)
batting["Batting_Avg"] = pd.to_numeric(batting["Batting_Avg"], errors="coerce")
batting["Strike_Rate"] = pd.to_numeric(batting["Strike_Rate"], errors="coerce")
batting["Runs_Scored"] = pd.to_numeric(batting["Runs_Scored"], errors="coerce")
batting.dropna(subset=["Batting_Avg", "Strike_Rate", "Runs_Scored"], inplace=True)

# ODI Bowling
bowling = pd.read_csv("data/odi-bowling.csv", index_col=0)
bowling.rename(columns={"Wkts": "Wickets", "Econ": "Economy_Rate", "Ave": "Bowling_Avg"}, inplace=True)
bowling["Wickets"]     = pd.to_numeric(bowling["Wickets"],     errors="coerce")
bowling["Economy_Rate"]= pd.to_numeric(bowling["Economy_Rate"],errors="coerce")
bowling["Bowling_Avg"] = pd.to_numeric(bowling["Bowling_Avg"], errors="coerce")
bowling.dropna(subset=["Wickets", "Economy_Rate", "Bowling_Avg"], inplace=True)

print(f"\n✔ Batting dataset loaded  — {len(batting)} players")
print(f"✔ Bowling dataset loaded  — {len(bowling)} players")


# ══════════════════════════════════════════════════════════════════════════════
# 2. DESCRIPTIVE STATISTICS
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "-"*60)
print("  DESCRIPTIVE STATISTICS — ODI Batting")
print("-"*60)

bat_metrics = ["Batting_Avg", "Strike_Rate", "Runs_Scored"]
desc = batting[bat_metrics].describe().T
desc["skewness"] = batting[bat_metrics].skew()
desc["kurtosis"] = batting[bat_metrics].kurt()
print(desc.to_string())

print("\n" + "-"*60)
print("  DESCRIPTIVE STATISTICS — ODI Bowling")
print("-"*60)

bowl_metrics = ["Wickets", "Economy_Rate", "Bowling_Avg"]
desc_bowl = bowling[bowl_metrics].describe().T
desc_bowl["skewness"] = bowling[bowl_metrics].skew()
desc_bowl["kurtosis"] = bowling[bowl_metrics].kurt()
print(desc_bowl.to_string())

# ── Chart: Descriptive Stats Bar Chart ────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(16, 5))
fig.suptitle("ODI Batting — Descriptive Statistics", color=TEXT_COLOR, fontsize=14, fontweight="bold")

for ax, metric in zip(axes, bat_metrics):
    data = batting[metric].dropna()
    ax.bar(["Mean", "Median", "Std Dev", "Min", "Max"],
           [data.mean(), data.median(), data.std(), data.min(), data.max()],
           color=[CRICKET_GREEN, ACCENT_COLOR, "#6366f1", "#f59e0b", "#ef4444"])
    ax.set_title(metric.replace("_", " "), color=ACCENT_COLOR, fontsize=11)
    ax.grid(axis="y")

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/1_descriptive_stats.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"\n✔ Saved: {OUTPUT_DIR}/1_descriptive_stats.png")


# ══════════════════════════════════════════════════════════════════════════════
# 3. PROBABILITY DISTRIBUTION (Normal Distribution)
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "-"*60)
print("  PROBABILITY DISTRIBUTION — Batting Average")
print("-"*60)

metric     = "Batting_Avg"
data       = batting[metric].dropna()
mu, sigma  = data.mean(), data.std()

# Shapiro-Wilk normality test
stat_sw, p_sw = stats.shapiro(data[:5000])  # shapiro works best on <5000 samples
print(f"  Metric : {metric}")
print(f"  Mean   : {mu:.4f}")
print(f"  Std Dev: {sigma:.4f}")
print(f"  Shapiro-Wilk p-value: {p_sw:.4f}  ({'Normal' if p_sw > 0.05 else 'Non-normal'})")

# ── Chart: Histogram + Normal Curve ───────────────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 5))
fig.suptitle("Probability Distribution — ODI Batting Average", color=TEXT_COLOR, fontsize=13, fontweight="bold")

n, bins, patches = ax.hist(data, bins=30, density=True, color=CRICKET_GREEN, alpha=0.7, edgecolor="#0f172a", label="Histogram")

x = np.linspace(data.min(), data.max(), 300)
ax.plot(x, norm.pdf(x, mu, sigma), color="#f59e0b", linewidth=2.5, label=f"Normal Curve  μ={mu:.2f}  σ={sigma:.2f}")

ax.axvline(mu, color=ACCENT_COLOR, linestyle="--", linewidth=1.5, label=f"Mean = {mu:.2f}")
ax.set_xlabel("Batting Average")
ax.set_ylabel("Density")
ax.legend(facecolor=PANEL_COLOR, edgecolor="#334155")
ax.grid(True)

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/2_distribution.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"✔ Saved: {OUTPUT_DIR}/2_distribution.png")


# ══════════════════════════════════════════════════════════════════════════════
# 4. CONFIDENCE INTERVALS (95%)
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "-"*60)
print("  95% CONFIDENCE INTERVALS — ODI Batting")
print("-"*60)

ci_results = []
for m in bat_metrics:
    d   = batting[m].dropna()
    n   = len(d)
    se  = d.std() / np.sqrt(n)
    margin = 1.96 * se
    ci_results.append({
        "Metric"  : m,
        "Mean"    : round(d.mean(), 4),
        "Std Dev" : round(d.std(), 4),
        "SE"      : round(se, 4),
        "Lower CI": round(d.mean() - margin, 4),
        "Upper CI": round(d.mean() + margin, 4),
        "Margin"  : round(margin, 4),
        "n"       : n,
    })

ci_df = pd.DataFrame(ci_results)
print(ci_df.to_string(index=False))

# ── Chart: Confidence Interval Error Bar ──────────────────────────────────────
fig, ax = plt.subplots(figsize=(9, 5))
fig.suptitle("95% Confidence Intervals — ODI Batting Metrics", color=TEXT_COLOR, fontsize=13, fontweight="bold")

means   = [r["Mean"]   for r in ci_results]
margins = [r["Margin"] for r in ci_results]
labels  = [r["Metric"].replace("_", " ") for r in ci_results]

ax.barh(labels, means, xerr=margins, color=CRICKET_GREEN, alpha=0.8,
        error_kw=dict(ecolor=ACCENT_COLOR, capsize=8, linewidth=2))
ax.set_xlabel("Value")
ax.grid(axis="x")

for i, r in enumerate(ci_results):
    ax.text(r["Mean"] + r["Margin"] + 0.3, i,
            f'[{r["Lower CI"]:.2f}, {r["Upper CI"]:.2f}]',
            va="center", color=TEXT_COLOR, fontsize=9)

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/3_confidence_intervals.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"✔ Saved: {OUTPUT_DIR}/3_confidence_intervals.png")


# ══════════════════════════════════════════════════════════════════════════════
# 5. LINEAR REGRESSION — Strike Rate → Batting Average
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "-"*60)
print("  LINEAR REGRESSION — Strike Rate → Batting Average")
print("-"*60)

x = batting["Strike_Rate"].dropna()
y = batting["Batting_Avg"].dropna()
common = batting[["Strike_Rate", "Batting_Avg"]].dropna()
x, y = common["Strike_Rate"], common["Batting_Avg"]

slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
r2 = r_value ** 2

print(f"  Equation : Batting_Avg = {slope:.4f} × Strike_Rate + {intercept:.4f}")
print(f"  R² Score : {r2:.4f}")
print(f"  P-value  : {p_value:.6f}")
print(f"  Std Error: {std_err:.4f}")

# Prediction examples
print("\n  Sample Predictions:")
for sr in [60, 80, 100, 120, 140]:
    pred = slope * sr + intercept
    print(f"    Strike Rate = {sr:>3}  →  Predicted Batting Avg = {pred:.2f}")

# ── Chart: Regression Scatter + Line ──────────────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 6))
fig.suptitle("Linear Regression — Strike Rate vs Batting Average (ODI)", color=TEXT_COLOR, fontsize=13, fontweight="bold")

ax.scatter(x, y, color=CRICKET_GREEN, alpha=0.5, s=25, label="Players")

x_line = np.linspace(x.min(), x.max(), 200)
y_line = slope * x_line + intercept
ax.plot(x_line, y_line, color="#f59e0b", linewidth=2.5,
        label=f"y = {slope:.3f}x + {intercept:.3f}  (R²={r2:.3f})")

ax.set_xlabel("Strike Rate")
ax.set_ylabel("Batting Average")
ax.legend(facecolor=PANEL_COLOR, edgecolor="#334155")
ax.grid(True)

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/4_regression.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"\n✔ Saved: {OUTPUT_DIR}/4_regression.png")


# ══════════════════════════════════════════════════════════════════════════════
# 6. OUTLIER DETECTION (IQR Method)
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "-"*60)
print("  OUTLIER DETECTION — IQR Method")
print("-"*60)

outlier_results = []
for m in bat_metrics:
    d   = batting[m].dropna()
    Q1  = d.quantile(0.25)
    Q3  = d.quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    outliers = d[(d < lower) | (d > upper)]
    outlier_results.append({
        "Metric"  : m,
        "Q1"      : round(Q1, 2),
        "Q3"      : round(Q3, 2),
        "IQR"     : round(IQR, 2),
        "Lower"   : round(lower, 2),
        "Upper"   : round(upper, 2),
        "Outliers": len(outliers),
    })
    print(f"  {m}: Q1={Q1:.2f}, Q3={Q3:.2f}, IQR={IQR:.2f}, "
          f"Bounds=[{lower:.2f}, {upper:.2f}], Outliers={len(outliers)}")

# ── Chart: Box Plots ───────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(15, 5))
fig.suptitle("Outlier Detection — Box Plots (ODI Batting)", color=TEXT_COLOR, fontsize=13, fontweight="bold")

for ax, metric in zip(axes, bat_metrics):
    d = batting[metric].dropna()
    bp = ax.boxplot(d, patch_artist=True, notch=False,
                    boxprops=dict(facecolor=CRICKET_GREEN, color=ACCENT_COLOR),
                    medianprops=dict(color="#f59e0b", linewidth=2),
                    whiskerprops=dict(color=ACCENT_COLOR),
                    capprops=dict(color=ACCENT_COLOR),
                    flierprops=dict(marker="o", color="#ef4444", markersize=4, alpha=0.6))
    ax.set_title(metric.replace("_", " "), color=ACCENT_COLOR)
    ax.set_ylabel("Value")
    ax.grid(axis="y")

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/5_outliers_boxplot.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"✔ Saved: {OUTPUT_DIR}/5_outliers_boxplot.png")


# ══════════════════════════════════════════════════════════════════════════════
# 7. PEARSON CORRELATION MATRIX
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "-"*60)
print("  PEARSON CORRELATION MATRIX — ODI Batting")
print("-"*60)

corr_matrix = batting[bat_metrics].corr(method="pearson")
print(corr_matrix.to_string())

# ── Chart: Heatmap ─────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(7, 5))
fig.suptitle("Pearson Correlation Matrix — ODI Batting", color=TEXT_COLOR, fontsize=13, fontweight="bold")

sns.heatmap(
    corr_matrix,
    annot=True,
    fmt=".3f",
    cmap="RdYlGn",
    center=0,
    linewidths=0.5,
    linecolor="#0f172a",
    ax=ax,
    annot_kws={"size": 11, "weight": "bold"},
)
ax.set_xticklabels([m.replace("_", "\n") for m in bat_metrics], rotation=0)
ax.set_yticklabels([m.replace("_", "\n") for m in bat_metrics], rotation=0)

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/6_correlation_matrix.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"✔ Saved: {OUTPUT_DIR}/6_correlation_matrix.png")


# ══════════════════════════════════════════════════════════════════════════════
# 8. BOWLING REGRESSION — Economy Rate → Wickets
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "-"*60)
print("  LINEAR REGRESSION — Economy Rate → Wickets (Bowling)")
print("-"*60)

common_b = bowling[["Economy_Rate", "Wickets"]].dropna()
xb, yb   = common_b["Economy_Rate"], common_b["Wickets"]

slope_b, intercept_b, r_b, p_b, se_b = stats.linregress(xb, yb)
r2_b = r_b ** 2

print(f"  Equation : Wickets = {slope_b:.4f} × Economy_Rate + {intercept_b:.4f}")
print(f"  R² Score : {r2_b:.4f}")
print(f"  P-value  : {p_b:.6f}")

fig, ax = plt.subplots(figsize=(10, 6))
fig.suptitle("Linear Regression — Economy Rate vs Wickets (ODI Bowling)", color=TEXT_COLOR, fontsize=13, fontweight="bold")

ax.scatter(xb, yb, color="#6366f1", alpha=0.5, s=25, label="Bowlers")
x_line_b = np.linspace(xb.min(), xb.max(), 200)
y_line_b = slope_b * x_line_b + intercept_b
ax.plot(x_line_b, y_line_b, color="#f59e0b", linewidth=2.5,
        label=f"y = {slope_b:.3f}x + {intercept_b:.3f}  (R²={r2_b:.3f})")

ax.set_xlabel("Economy Rate")
ax.set_ylabel("Wickets")
ax.legend(facecolor=PANEL_COLOR, edgecolor="#334155")
ax.grid(True)

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/7_bowling_regression.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"✔ Saved: {OUTPUT_DIR}/7_bowling_regression.png")


# ══════════════════════════════════════════════════════════════════════════════
# 9. SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "="*60)
print("  ANALYSIS COMPLETE — All charts saved to 'output/' folder")
print("="*60)
print(f"""
  Charts generated:
  1. output/1_descriptive_stats.png
  2. output/2_distribution.png
  3. output/3_confidence_intervals.png
  4. output/4_regression.png
  5. output/5_outliers_boxplot.png
  6. output/6_correlation_matrix.png
  7. output/7_bowling_regression.png
""")
