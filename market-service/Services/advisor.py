def calculate_valuation_score(metrics):
    """
    Replicates the React ValuationScore component logic in Python.
    Scoring:
    - PE < 20: +25
    - ROE > 15: +25
    - Debt/Equity < 0.5: +25
    - Revenue Growth > 10%: +25
    """
    score = 0
    pe = metrics.get("pe")
    roe = metrics.get("roe")
    debt_equity = metrics.get("debtToEquity")
    rev_growth = metrics.get("revenueCagr")

    if pe and pe < 20: score += 15
    if roe and roe > 15: score += 35
    if debt_equity is not None and debt_equity < 0.5: score += 15
    if rev_growth and rev_growth > 10: score += 35
    
    return score

def analyze_stock(metrics):
    """
    Deterministic rule-based scoring engine for stock analysis.
    Provides detailed reasons and dynamic insights.
    """
    valuation_score = calculate_valuation_score(metrics)
    rev_cagr = metrics.get("revenueCagr", 0)
    prof_cagr = metrics.get("profitCagr", 0)
    roe = metrics.get("roe", 0)
    debt_to_equity = metrics.get("debtToEquity", 0)
    pe = metrics.get("pe", 0)

    score = 0
    catalysts = []
    concerns = []

    # Scoring Rules and Reason Extraction
    if valuation_score > 75:
        score += 2
        catalysts.append(f"Exceptional fundamental strength with a valuation score of {valuation_score}/100.")
    elif valuation_score > 50:
        score += 1
        catalysts.append(f"Solid financial foundations with a valuation score of {valuation_score}/100.")
    
    if rev_cagr > 15:
        score += 3
        catalysts.append(f"Rapid revenue expansion at {rev_cagr}% CAGR, indicating strong market demand.")
    elif rev_cagr > 10:
        score += 2
        catalysts.append(f"Sustainable revenue growth of {rev_cagr}% CAGR over the last 5 years.")
    elif rev_cagr < 0:
        score -= 1
        concerns.append(f"Revenue contraction ({rev_cagr}% CAGR) suggests potential market share loss or industry headwinds.")
    
    if prof_cagr > 15:
        score += 3
        catalysts.append(f"Outstanding profit growth ({prof_cagr}% CAGR) outperforming revenue expansion.")
    elif prof_cagr > 10:
        score += 2
        catalysts.append(f"Consistent profitability with {prof_cagr}% CAGR in net income.")
    
    if roe and roe > 0.20: # 20%
        score += 3
        catalysts.append(f"Superior capital efficiency with an ROE of {(roe*100):.1f}%, highlighting effective management.")
    elif roe and roe > 0.15: # 15%
        score += 2 
        catalysts.append(f"Strong Return on Equity ({(roe*100):.1f}%) above industry benchmarks.")
    elif roe and roe < 0.10: # 10%
        concerns.append(f"Sub-optimal capital efficiency with an ROE of {(roe*100):.1f}%.")
    
    if debt_to_equity is not None:
        if debt_to_equity < 0.5:
            score += 1
            catalysts.append(f"Conservative capital structure with very low debt-to-equity ({debt_to_equity:.2f}).")
        elif debt_to_equity > 1.5:
            score -= 1
            concerns.append(f"Elevated leverage noted with a debt-to-equity ratio of {debt_to_equity:.2f}.")

    if pe:
        if pe < 15:
            score += 1
            catalysts.append(f"Attractive relative valuation with a P/E ratio of {pe:.1f}.")
        elif pe > 45:
            score -= 1
            concerns.append(f"The P/E ratio of {pe:.1f} appears stretched compared to earnings growth.")

    # Final Verdict
    if score >= 5:
        verdict = "BUY"
    elif score >= 2:
        verdict = "HOLD"
    else:
        verdict = "AVOID"

    # Confidence Score (Normalization)
    confidence = max(0, min(100, int((score / 10) * 100)))

    # Summary Generation
    comp_name = metrics.get('companyName', metrics.get('symbol'))
    if verdict == "BUY":
        summary = f"{comp_name} presents a compelling investment case. The confluence of high capital efficiency, robust growth trajectories, and a solid balance sheet supports a top-tier rating."
    elif verdict == "HOLD":
        summary = f"We maintain a neutral stance on {comp_name}. While the company possesses some notable strengths, current valuation or growth headwinds suggest limited immediate upside."
    else:
        summary = f"Caution is advised for {comp_name}. Structural concerns regarding {concerns[0] if concerns else 'valuation and growth'} outweigh the existing positive factors at this time."

    return {
        "symbol": metrics.get("symbol"),
        "verdict": verdict,
        "confidence": confidence,
        "summary": summary,
        "catalysts": catalysts,
        "concerns": concerns,
        "metricsUsed": {
            "valuationScore": valuation_score,
            "revenueCagr": rev_cagr,
            "profitCagr": prof_cagr,
            "roe": roe,
            "debtToEquity": debt_to_equity,
            "pe": pe
        }
    }
