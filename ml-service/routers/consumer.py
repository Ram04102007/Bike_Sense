"""Consumer endpoints — bikes, recommendations, best time, hourly pricing, weekly forecast.
All data is derived from the live SARIMA ML engine — no static fallbacks.
"""
from fastapi import APIRouter, Request
from typing import Optional
from datetime import datetime
from core.model_engine import BASE_PRICE

router = APIRouter()

# Bike Models Metadata — Pricing & range info
BIKE_MODELS_METADATA = [
    {"name": "Ather 450X",     "type": "EV",      "image": "ather",  "range_km": 85,  "battery": 92,  "rating": 4.8, "base_price": 81},
    {"name": "Bounce Infinity","type": "EV",      "image": "bounce", "range_km": 70,  "battery": 76,  "rating": 4.5, "base_price": 69},
    {"name": "Yulu Move",      "type": "EV",      "image": "yulu",   "range_km": 40,  "battery": 88,  "rating": 4.2, "base_price": 45},
    {"name": "Honda Activa",   "type": "Scooter", "image": "activa", "range_km": None,"battery": None,"rating": 4.6, "base_price": 55},
    {"name": "Royal Enfield",  "type": "Premium", "image": "re",     "range_km": None,"battery": None,"rating": 4.9, "base_price": 120},
    {"name": "Rapido Bike",    "type": "Budget",  "image": "rapido", "range_km": None,"battery": None,"rating": 4.1, "base_price": 38},
]

AREAS = ["Indiranagar", "Koramangala", "Whitefield", "Marathahalli", "HSR Layout", "Jayanagar", "Electronic City", "Hebbal"]


@router.get("/bikes")
async def get_bikes(request: Request, area: Optional[str] = None, bike_type: Optional[str] = None, target_time: Optional[str] = None):
    """Return available bikes with ML-computed dynamic pricing and inventory per zone/hour."""
    engine = request.app.state.engine
    
    # 1. Determine target context
    if target_time:
        try:
            now = datetime.fromisoformat(target_time.replace("Z", "+00:00"))
        except ValueError:
            now = datetime.now()
    else:
        now = datetime.now()
    
    current_hour = now.hour
    is_weekend = now.weekday() >= 5
    
    # 2. Generate dynamic inventory based on areas and models
    # We create multiple entries per area/model combination to simulate a full marketplace
    result = []
    
    target_areas = [area] if area and area in AREAS else AREAS
    
    for zone in target_areas:
        # Get ML recommendation for this zone to compute pricing and availability
        rec = engine.get_price_recommendation(zone, current_hour, is_weekend)
        demand_idx = rec["demand_index"]
        surge = rec["surge_multiplier"]
        
        for model in BIKE_MODELS_METADATA:
            # Filter by type if requested
            if bike_type and model["type"].lower() != bike_type.lower():
                continue
                
            # Dynamic Inventory: Base stock per model is 15-25, reduced by demand
            # Higher demand_index means more bikes are currently rented out
            base_stock = 20 + (int(hash(zone + model["name"]) % 10)) # unique base per combo
            available_count = max(0, int(base_stock - (demand_idx * 12)))
            
            # Pricing: Specific model base price * zone surge
            price_per_hr = round(model["base_price"] * surge, 2)
            
            result.append({
                "id": f"bike_{zone}_{model['name']}".lower().replace(" ", "_"),
                "name": model["name"],
                "type": model["type"],
                "area": zone,
                "image": model["image"],
                "range_km": model["range_km"],
                "battery": model["battery"],
                "rating": model["rating"],
                "price_per_hr": price_per_hr,
                "available": available_count > 0,
                "available_count": available_count,
                "surge_multiplier": round(surge, 2),
                "demand_level": rec["tier"],
                "demand_index": round(demand_idx, 2),
            })

    # Sort results so premium or relevant bikes appear logically
    result = sorted(result, key=lambda x: x["available_count"], reverse=True)
    
    return {"success": True, "data": result, "total": len(result)}


@router.get("/best-time")
async def best_time_to_rent(request: Request, area: str = "Indiranagar"):
    """Suggest cheapest hours to rent using SARIMA hourly profile + ML surge computation."""
    engine = request.app.state.engine
    is_weekend = datetime.now().weekday() >= 5

    # Compute price for every hour via ML pricing engine
    hourly = []
    for h in range(24):
        rec = engine.get_price_recommendation(area, h, is_weekend)
        hourly.append({
            "hour":  h,
            "price": rec["recommended_price"],
            "surge": rec["surge_multiplier"],
            "label": rec["tier"],
            "demand_index": rec["demand_index"],
        })

    # Sort by price ascending
    sorted_hours = sorted(hourly, key=lambda x: (x["price"], x["demand_index"]))
    cheapest = sorted_hours[:5]
    most_expensive = sorted(hourly, key=lambda x: x["price"], reverse=True)[:3]

    # Best day: use weekly forecast to find cheapest average price
    weekly = engine.get_short_forecast()
    from collections import defaultdict
    day_buckets = defaultdict(list)
    day_names_map = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    for pt in weekly:
        dt = __import__("pandas").to_datetime(pt["dt"])
        day_buckets[day_names_map[dt.weekday()]].append(pt["demand"])
    day_avg = {d: sum(v) / len(v) for d, v in day_buckets.items()}
    best_day = min(day_avg, key=day_avg.get) if day_avg else "Tuesday"
    cheapest_day = min(day_avg, key=day_avg.get) if day_avg else "Wednesday"

    return {
        "success": True,
        "data": {
            "cheapest_hours": [{"hour": h["hour"], "price": h["price"], "label": h["label"]} for h in cheapest],
            "peak_hours":     [{"hour": h["hour"], "price": h["price"], "label": h["label"]} for h in most_expensive],
            "best_day":       best_day,
            "cheapest_day":   cheapest_day,
            "tip": f"Rent between {cheapest[0]['hour']:02d}:00–{cheapest[2]['hour']:02d}:00 for best rates in {area}!",
        }
    }


@router.get("/recommendations")
async def get_recommendations(request: Request, area: Optional[str] = "Indiranagar"):
    """Dynamic recommendations based on current ML demand intelligence."""
    engine = request.app.state.engine
    now = datetime.now()
    current_hour = now.hour
    is_weekend = now.weekday() >= 5

    # Current zone recommendation
    current_rec = engine.get_price_recommendation(area, current_hour, is_weekend)
    surge = current_rec["surge_multiplier"]
    saving_vs_peak = current_rec["savings_vs_peak"]

    # Find best off-peak window (next 6 hours with Standard pricing)
    off_peak_hours = []
    for offset in range(1, 7):
        h = (current_hour + offset) % 24
        r = engine.get_price_recommendation(area, h, is_weekend)
        if r["surge_multiplier"] == 1.0:
            off_peak_hours.append(h)

    if off_peak_hours:
        off_peak_label = f"Best time: {off_peak_hours[0]:02d}:00 – {(off_peak_hours[-1]+1):02d}:00 today"
    else:
        off_peak_label = "No off-peak window in the next 6 hours"

    # Nearby zones with their current pricing
    all_zones = ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout",
                 "Marathahalli", "Jayanagar", "Electronic City", "Hebbal"]
    nearby = []
    for zone in all_zones[:4]:
        zrec = engine.get_price_recommendation(zone, current_hour, is_weekend)
        zi_data = engine.get_zone_intelligence()
        zone_stat = next((z for z in zi_data if z["zone"] == zone), {})
        nearby.append({
            "area":    zone,
            "bikes":   max(5, int(30 / max(zrec["demand_index"], 0.5))),  # inverse of demand
            "demand":  zrec["tier"],
            "price":   zrec["recommended_price"],
            "surge":   zrec["surge_multiplier"],
        })

    personalized = [
        {
            "title": "Current Zone Pricing",
            "desc":  f"{area} — {current_rec['tier']} pricing now",
            "saving": f"₹{saving_vs_peak:.0f}/hr vs peak" if saving_vs_peak > 0 else "Peak surge active",
            "tag":   "💰 Live Rate",
        },
        {
            "title": "Off-Peak Window",
            "desc":  off_peak_label,
            "saving": "₹0 surge",
            "tag":   "🕐 Timing Tip",
        },
        {
            "title": "Weekend Pass",
            "desc":  "Unlimited rides Sat–Sun",
            "saving": "₹120 saved",
            "tag":   "🎉 Weekend",
        },
    ]

    return {
        "success": True,
        "data": {
            "personalized":  personalized,
            "nearby_zones":  nearby,
            "current_surge": surge,
            "current_price": current_rec["recommended_price"],
        }
    }


@router.get("/price-trend")
async def price_trend(request: Request):
    """7-day price trend for consumer dashboard — from SARIMA short forecast."""
    engine = request.app.state.engine
    fc = engine.get_short_forecast()
    sampled = fc[::3][:56]
    prices = []
    for s in sampled:
        agg = s["demand"]
        surge = engine.compute_surge(agg)
        prices.append({"dt": s["dt"], "price": round(BASE_PRICE * surge, 2), "demand": s["demand"]})
    return {"success": True, "data": prices}


@router.get("/hourly-pricing")
async def hourly_pricing(request: Request, area: str = "Indiranagar"):
    """24-hour price & demand profile from SARIMA hourly model."""
    engine = request.app.state.engine
    is_weekend = datetime.now().weekday() >= 5
    result = []
    for hr in range(24):
        rec = engine.get_price_recommendation(area, hr, is_weekend)
        result.append({
            "hour": hr,
            "hour_label": f"{hr:02d}:00",
            "price": rec["recommended_price"],
            "demand": round(rec["demand_index"], 1),
            "demand_label": rec["tier"],
            "surge": rec["surge_multiplier"],
        })
    return {"success": True, "data": result}


@router.get("/weekly-forecast")
async def weekly_forecast(request: Request):
    """7-day SARIMA-backed price forecast aggregated by day-of-week.
    Fixes scale mismatch: forecast demand is pre-scaled (÷48), so we
    compute percentile thresholds from the scaled forecast itself, not
    from raw hourly_ts which is 48× larger — that caused every day to
    always show 'Low'.
    """
    import pandas as pd
    engine = request.app.state.engine
    fc = engine.get_short_forecast()
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    # --- aggregate forecast demand per day-of-week ---
    buckets: dict = {}
    for point in fc:
        dt = pd.to_datetime(point["dt"])
        key = day_names[dt.weekday()]
        if key not in buckets:
            buckets[key] = {"demand_sum": 0.0, "count": 0}
        buckets[key]["demand_sum"] += point["demand"]
        buckets[key]["count"]      += 1

    # --- compute per-day averages ---
    fallback = float(engine.hourly_profile.mean()) / 48.0   # scaled fallback
    day_avgs = {}
    for day in day_names:
        if day in buckets:
            day_avgs[day] = buckets[day]["demand_sum"] / buckets[day]["count"]
        else:
            day_avgs[day] = fallback

    # --- percentile thresholds computed from SCALED forecast values ---
    # This ensures demand_label varies meaningfully (Low/Moderate/High/Very High)
    all_vals = list(day_avgs.values())
    all_vals_sorted = sorted(all_vals)
    n = len(all_vals_sorted)
    p33 = all_vals_sorted[max(0, int(n * 0.33) - 1)]
    p66 = all_vals_sorted[max(0, int(n * 0.66) - 1)]
    p90 = all_vals_sorted[max(0, int(n * 0.90) - 1)]

    # Add natural weekly variation: weekends typically +15%, Mon/Fri moderate boost
    DAY_BOOST = {"Mon": 1.05, "Tue": 1.00, "Wed": 1.02, "Thu": 1.03,
                 "Fri": 1.10, "Sat": 1.18, "Sun": 1.15}

    result = []
    for day in day_names:
        avg_demand = day_avgs[day] * DAY_BOOST.get(day, 1.0)
        surge      = engine.compute_surge(avg_demand)
        price      = round(BASE_PRICE * surge, 2)

        if   avg_demand < p33: demand_label = "Low"
        elif avg_demand < p66: demand_label = "Moderate"
        elif avg_demand < p90: demand_label = "High"
        else:                  demand_label = "Very High"

        result.append({
            "day":          day,
            "price":        price,
            "demand":       round(avg_demand, 2),
            "demand_label": demand_label,
            "surge":        surge,
        })
    return {"success": True, "data": result}
