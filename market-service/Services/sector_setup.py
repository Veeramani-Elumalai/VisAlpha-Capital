import yfinance as yf
import pandas as pd
import numpy as np
import traceback
import math
from concurrent.futures import ThreadPoolExecutor

# Map user-friendly sector names to yfinance sector keys
SECTOR_KEYS = {
    "Basic Materials": "basic-materials",
    "Communication Services": "communication-services",
    "Consumer Cyclical": "consumer-cyclical",
    "Consumer Defensive": "consumer-defensive",
    "Energy": "energy",
    "Financial Services": "financial-services",
    "Healthcare": "healthcare",
    "Industrials": "industrials",
    "Real Estate": "real-estate",
    "Technology": "technology",
    "Utilities": "utilities"
}

def convert_to_native(val):
    """Convert numpy types and potential strings/inf/nan to native Python numbers for JSON serialization"""
    if pd.isna(val) or val is None or val == "" or val == "N/A" or val == "None":
        return 0
    
    # Handle infinity
    if isinstance(val, (float, np.floating)) and (math.isinf(val) or math.isnan(val)):
        return 0
        
    # Handle numpy types
    if isinstance(val, (np.integer, np.int64, np.int32)):
        return int(val)
    if isinstance(val, (np.floating, np.float64, np.float32)):
        return float(val)
    
    # Handle strings or other types by trying to cast to float
    try:
        f_val = float(val)
        if math.isinf(f_val) or math.isnan(f_val):
            return 0
        return f_val
    except (ValueError, TypeError):
        return 0

def fetch_single_ticker(symbol, sector_name):
    """Fetch info for a single ticker with error handling"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        if not info or not isinstance(info, dict):
            return None
            
        current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        
        if current_price and prev_close:
            try:
                change = float(current_price) - float(prev_close)
                change_p = (change / float(prev_close)) * 100
            except:
                change = 0
                change_p = 0
        else:
            change = 0
            change_p = 0

        return {
            "symbol": symbol,
            "name": info.get("shortName", symbol),
            "price": convert_to_native(current_price),
            "marketCap": convert_to_native(info.get("marketCap", 0)),
            "peRatio": convert_to_native(info.get("trailingPE", 0)),
            "beta": convert_to_native(info.get("beta", 0)),
            "fiftyTwoWeekHigh": convert_to_native(info.get("fiftyTwoWeekHigh", 0)),
            "fiftyTwoWeekLow": convert_to_native(info.get("fiftyTwoWeekLow", 0)),
            "dividendYield": convert_to_native((info.get("dividendYield", 0) or 0) * 100),
            "priceToBook": convert_to_native(info.get("priceToBook", 0)),
            "change": round(float(change), 2),
            "changePercent": round(float(change_p), 2),
            "volume": convert_to_native(info.get("volume", 0)),
            "sector": sector_name,
            "industry": info.get("industry", "Unknown")
        }
    except Exception:
        return None

def get_sector_data(sector_name):
    try:
        mapped_key = None
        normalized_name = sector_name.capitalize()
        
        for k, v in SECTOR_KEYS.items():
            if k.lower() == sector_name.lower():
                mapped_key = v
                normalized_name = k
                break
                
        if not mapped_key:
            return {"error": f"Sector '{sector_name}' not found."}

        sector_obj = yf.Sector(mapped_key)
        top_companies = sector_obj.top_companies
        
        if top_companies is None or top_companies.empty:
            return {"error": f"No summary data available for {normalized_name}"}
        
        if hasattr(top_companies, 'index'):
            tickers = top_companies.index.tolist()
        else:
            tickers = top_companies['symbol'].tolist() if 'symbol' in top_companies.columns else []
        
        if not tickers:
            return {"error": f"No ticker symbols found for {normalized_name}"}
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(lambda s: fetch_single_ticker(s, normalized_name), tickers[:50]))
        
        data = [r for r in results if r is not None]

        if not data:
            return {"error": "Failed to retrieve stock details."}

        df = pd.DataFrame(data)
        
        # Force numeric types and handle Inf/NaN early
        numeric_cols = ["price", "marketCap", "peRatio", "beta", "dividendYield", "priceToBook", "change", "changePercent", "volume"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').replace([np.inf, -np.inf], np.nan).fillna(0)

        # Calculate sector-level stats
        avg_pe = 0
        avg_mcap = 0
        top_stock = "N/A"
        top_change = 0
        worst_stock = "N/A"
        worst_change = 0
        
        if not df.empty:
            # P/E can be outlier, filter reasonably but ensure it's not inf
            valid_pe = df[df["peRatio"] > 0]["peRatio"]
            avg_pe = valid_pe.mean() if not valid_pe.empty else 0
            if math.isinf(avg_pe) or math.isnan(avg_pe):
                avg_pe = 0
                
            avg_mcap = df["marketCap"].mean()
            if math.isinf(avg_mcap) or math.isnan(avg_mcap):
                avg_mcap = 0
            
            non_na_change = df["changePercent"].replace([np.inf, -np.inf], np.nan).dropna()
            if not non_na_change.empty:
                best_idx = non_na_change.idxmax()
                worst_idx = non_na_change.idxmin()
                
                best_performer = df.loc[best_idx]
                worst_performer = df.loc[worst_idx]
                
                top_stock = str(best_performer.get("symbol", "N/A"))
                top_change = best_performer.get("changePercent", 0)
                worst_stock = str(worst_performer.get("symbol", "N/A"))
                worst_change = worst_performer.get("changePercent", 0)

        # Group by industry
        industries = []
        if not df.empty:
            grouped = df.groupby("industry")
            
            for industry_name, industry_df in grouped:
                industry_stocks = industry_df.to_dict('records')
                stock_count = len(industry_df)
                
                # Aggregation for industry
                valid_ind_pe = industry_df[industry_df["peRatio"] > 0]["peRatio"]
                avg_industry_pe = valid_ind_pe.mean() if not valid_ind_pe.empty else 0
                if math.isinf(avg_industry_pe) or math.isnan(avg_industry_pe): avg_industry_pe = 0
                
                total_market_cap = industry_df["marketCap"].sum()
                if math.isinf(total_market_cap) or math.isnan(total_market_cap): total_market_cap = 0
                
                valid_beta = industry_df[industry_df["beta"] > 0]["beta"]
                avg_industry_beta = valid_beta.mean() if not valid_beta.empty else 0
                if math.isinf(avg_industry_beta) or math.isnan(avg_industry_beta): avg_industry_beta = 0
                
                valid_div = industry_df[industry_df["dividendYield"] > 0]["dividendYield"]
                avg_industry_div_yield = valid_div.mean() if not valid_div.empty else 0
                if math.isinf(avg_industry_div_yield) or math.isnan(avg_industry_div_yield): avg_industry_div_yield = 0
                
                # Top performer in industry
                ind_top_stock = "N/A"
                ind_top_change = 0
                non_na_ind_change = industry_df["changePercent"].replace([np.inf, -np.inf], np.nan).dropna()
                if not non_na_ind_change.empty:
                    best_ind_idx = non_na_ind_change.idxmax()
                    industry_best = industry_df.loc[best_ind_idx]
                    ind_top_stock = str(industry_best.get("symbol", "N/A"))
                    ind_top_change = industry_best.get("changePercent", 0)
                
                industries.append({
                    "name": industry_name,
                    "stockCount": int(stock_count),
                    "avgPe": round(float(avg_industry_pe), 2),
                    "totalMarketCap": float(total_market_cap),
                    "avgMarketCap": round(float(total_market_cap / stock_count), 2) if stock_count > 0 else 0,
                    "avgBeta": round(float(avg_industry_beta), 2),
                    "avgDividendYield": round(float(avg_industry_div_yield), 2),
                    "topStock": ind_top_stock,
                    "topStockChange": round(float(ind_top_change), 2),
                    "stocks": industry_stocks
                })
            
            industries.sort(key=lambda x: x["totalMarketCap"], reverse=True)

        return {
            "sector": normalized_name,
            "stats": {
                "avgPe": round(float(avg_pe), 2),
                "avgMarketCap": float(avg_mcap),
                "topStock": top_stock,
                "topStockChange": float(top_change),
                "worstStock": worst_stock,
                "worstStockChange": float(worst_change)
            },
            "industries": industries,
            "stocks": data
        }

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        print(traceback.format_exc())
        return {"error": f"Server error: {str(e)}"}
