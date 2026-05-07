"""
Stumped! by StatsXI — Python Statistics API
=============================================
Flask microservice exposing 4 advanced statistical endpoints:

  GET /api/poisson    — Poisson distribution (bowler wicket probability)
  GET /api/binomial   — Binomial distribution (batsman boundary probability)
  GET /api/zscore     — Z-Score analysis (player ranking by std deviations)
  GET /api/covariance — Covariance + Correlation matrices

Run locally:
    pip install -r requirements.txt
    python app.py

The Next.js app proxies requests to this service via /api/advanced/route.js
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

from poisson   import compute_poisson
from binomial  import compute_binomial
from zscore    import compute_zscore
from covariance import compute_covariance

app = Flask(__name__)
CORS(app)  # allow Next.js (different port/domain) to call this API


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "Stumped! Python Stats API",
        "status":  "ok",
        "endpoints": ["/api/poisson", "/api/binomial", "/api/zscore", "/api/covariance"]
    })


# ── Poisson Distribution ──────────────────────────────────────────────────────
@app.route("/api/poisson", methods=["GET"])
def poisson_endpoint():
    """
    Query params:
        lam   (float) : average wickets per match, default 2.5
        max_k (int)   : max k to compute, default 12
    """
    try:
        lam   = float(request.args.get("lam",   2.5))
        max_k = int(request.args.get("max_k",  12))
        result = compute_poisson(lam=lam, max_k=max_k)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Binomial Distribution ─────────────────────────────────────────────────────
@app.route("/api/binomial", methods=["GET"])
def binomial_endpoint():
    """
    Query params:
        n (int)   : number of balls faced, default 20
        p (float) : probability of boundary per ball, default 0.15
    """
    try:
        n = int(request.args.get("n", 20))
        p = float(request.args.get("p", 0.15))
        result = compute_binomial(n=n, p=p)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Z-Score Analysis ──────────────────────────────────────────────────────────
@app.route("/api/zscore", methods=["GET"])
def zscore_endpoint():
    """
    Query params:
        metric (str) : Batting_Avg | Strike_Rate | Runs_Scored, default Batting_Avg
        top_n  (int) : number of top/bottom players to return, default 20
    """
    try:
        metric = request.args.get("metric", "Batting_Avg")
        top_n  = int(request.args.get("top_n", 20))
        result = compute_zscore(metric=metric, top_n=top_n)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Covariance & Correlation ──────────────────────────────────────────────────
@app.route("/api/covariance", methods=["GET"])
def covariance_endpoint():
    """
    Query params:
        kind (str) : batting | bowling, default batting
    """
    try:
        kind   = request.args.get("kind", "batting")
        result = compute_covariance(kind=kind)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5328))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    print(f"\n  Stumped! Python API running on http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
