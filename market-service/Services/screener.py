import yfinance as yf
import pandas as pd
import numpy as np

def format_number(num):
    if pd.isna(num):
        return ""
    num = float(num)
    if abs(num) >= 1e12:
        return f"{num / 1e12:.1f}T"
    if abs(num) >= 1e9:
        return f"{num / 1e9:.1f}B"
    if abs(num) >= 1e6:
        return f"{num / 1e6:.1f}M"
    return f"{num:,.0f}"


def df_to_table(df, label):
    if df is None or df.empty:
        return []

    df = df.copy()
    # Replace NaN with None (which becomes null in JSON)
    df = df.replace({np.nan: None})
    
    df.columns = df.columns.strftime("%Y-%m-%d")
    
    # Transposing to show quarters as rows
    df_t = df.T
    df_t.reset_index(inplace=True)
    df_t.columns = ["Period"] + df.index.tolist()
    
    # Ensure transposed df also has no NaNs
    df_t = df_t.replace({np.nan: None})
    
    return df_t.to_dict(orient="records")


def get_financials(symbol):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

        # Financials
        quarterly_df = ticker.quarterly_income_stmt
        annual_df = ticker.income_stmt

        # Get Revenue and Net Income for charts (Annual)
        revenue_series = []
        profit_series = []

        if annual_df is not None and not annual_df.empty:
            # Sort by date ascending for charts
            sorted_fin = annual_df.T.sort_index()

            for date, row in sorted_fin.iterrows():
                try:
                    revenue = row.get("Total Revenue") or row.get("Operating Revenue")
                    profit = row.get("Net Income") or row.get("Net Income Common Stockholders", 0)
                    
                    if not pd.isna(revenue):
                        revenue_series.append({
                            "period": date.strftime("%Y"), 
                            "value": float(revenue)
                        })
                    
                    if not pd.isna(profit):
                        profit_series.append({
                            "period": date.strftime("%Y"), 
                            "value": float(profit)
                        })
                except:
                    continue


        # Calculate CAGR (5 Years)
        revenue_cagr = 0
        profit_cagr = 0

        if len(revenue_series) >= 2:
            start_rev = revenue_series[0]["value"]
            end_rev = revenue_series[-1]["value"]
            years = len(revenue_series) - 1
            if start_rev > 0 and years > 0:
               revenue_cagr = round(((end_rev / start_rev) ** (1 / years) - 1) * 100, 2)

        if len(profit_series) >= 2:
            start_prof = profit_series[0]["value"]
            end_prof = profit_series[-1]["value"]
            years = len(profit_series) - 1
            if start_prof > 0 and years > 0:
               profit_cagr = round(((end_prof / start_prof) ** (1 / years) - 1) * 100, 2)

        return {
            "symbol": symbol,
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "marketCap": format_number(info.get("marketCap")),
            "pe": info.get("trailingPE"),
            "roe": info.get("returnOnEquity"),
            "debtToEquity": info.get("debtToEquity"),
            "quarterly": df_to_table(quarterly_df, "Quarter"),
            "annual": df_to_table(annual_df, "Year"),
            "revenueCagr": revenue_cagr,
            "profitCagr": profit_cagr,
            "revenueSeries": revenue_series,
            "profitSeries": profit_series,
            "companyName": info.get("shortName")
        }

    except Exception as e:
        return {"error": str(e)}
