from fastapi import FastAPI
import yfinance as yf
from Services.cagr import calculate_cagr
from Services.screener import get_financials
from Services.sector_setup import get_sector_data
from Services.advisor import analyze_stock
import math
import pandas as pd
import time

app = FastAPI()

# --- Simple In-Memory Cache ---
price_cache = {}
history_cache = {}
CACHE_TTL = 300  # 5 minutes

@app.get("/")
def home():
    return {"message": "Market Service Running"}

@app.get("/cagr/{symbol}")
def get_cagr(symbol: str):
    return get_financials(symbol)

@app.get("/screener/{symbol}")
def get_screener(symbol: str):
    return get_financials(symbol)

@app.get("/sector/{sector_name}")
def get_sector(sector_name: str):
    return get_sector_data(sector_name)

@app.get("/advisor/{symbol}")
def get_advisor(symbol: str):
    metrics = get_financials(symbol)
    if "error" in metrics:
        return metrics
    return analyze_stock(metrics)

@app.get("/price/{symbol}")
def get_price(symbol: str):
    now = time.time()
    if symbol in price_cache:
        cached_data, timestamp = price_cache[symbol]
        if now - timestamp < CACHE_TTL:
            return cached_data

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        def safe_float(val, default=0.0):
            try:
                v = float(val) if val is not None else default
                return v if math.isfinite(v) else default
            except (TypeError, ValueError):
                return default

        current_price = safe_float(info.get("currentPrice") or info.get("regularMarketPrice") or info.get("ask"))
        previous_close = safe_float(info.get("previousClose") or info.get("regularMarketPreviousClose") or current_price, current_price)
        
        day_change = current_price - previous_close
        day_change_percent = (day_change / previous_close) * 100 if previous_close else 0
        day_change_percent = day_change_percent if math.isfinite(day_change_percent) else 0.0
        
        sector = info.get("sector", "Unknown")

        data = {
            "symbol": symbol, 
            "price": current_price,
            "previousClose": previous_close,
            "dayChange": round(day_change, 2),
            "dayChangePercent": round(day_change_percent, 2),
            "sector": sector
        }
        
        # Update cache
        price_cache[symbol] = (data, now)
        return data

    except Exception as e:
        return {"error": str(e)}

@app.get("/history/{symbol}")
def get_history(symbol: str, days: int = 30):
    now = time.time()
    cache_key = f"{symbol}_{days}"
    if cache_key in history_cache:
        cached_data, timestamp = history_cache[cache_key]
        if now - timestamp < CACHE_TTL:
            return cached_data

    try:
        ticker = yf.Ticker(symbol)
        period = f"{days}d"
        hist = ticker.history(period=period)
        
        data_list = []
        for date, row in hist.iterrows():
            price = float(row["Close"])
            if not math.isfinite(price) or price <= 0:
                continue
            data_list.append({"date": date.strftime("%Y-%m-%d"), "price": round(price, 4)})
        data = {"symbol": symbol, "history": data_list}
        
        # Update cache
        history_cache[cache_key] = (data, now)
        return data
    except Exception as e:
        return {"error": str(e)}
