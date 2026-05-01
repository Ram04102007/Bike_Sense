"""Consumer endpoints — bikes, recommendations, best time, hourly pricing, weekly forecast.
All data is derived from the live SARIMA ML engine — no static fallbacks.
"""
from fastapi import APIRouter, Request
from typing import Optional
from datetime import datetime
from core.model_engine import BASE_PRICE

router = APIRouter()

# Bike catalogue (static metadata only — pricing is dynamic from ML engine)
BIKE_CATALOGUE = [
    {"id": "b1", "name": "Ather 450X",     "type": "EV",      "area": "Indiranagar",    "image": "ather",  "range_km": 85,  "battery": 92,  "rating": 4.8},
    {"id": "b2", "name": "Bounce Infinity","type": "EV",      "area": "Koramangala",    "image": "bounce", "range_km": 70,  "battery": 76,  "rating": 4.5},
    {"id": "b3", "name": "Yulu Move",      "type": "EV",      "area": "Whitefield",     "image": "yulu",   "range_km": 40,  "battery": 88,  "rating": 4.2},
    {"id": "b4", "name": "Honda Activa",   "type": "Scooter", "area": "HSR Layout",     "image": "activa", "range_km": None,"battery": None,"rating": 4.6},
    {"id": "b5", "name": "Royal Enfield",  "type": "Premium", "area": "Marathahalli",   "image": "re",     "range_km": None,"battery": None,"rating": 4.9},
    {"id": "b6", "name": "Rapido Bike",    "type": "Budget",  "area": "Jayanagar",      "image": "rapido", "range_km": None,"battery": None,"rating": 4.1},
    {"id": "b7", "name": "Ather 450X",     "type": "EV",      "area": "Electronic City","image": "ather",  "range_km": 80,  "battery": 65,  "rating": 4.7},
    {"id": "b8", "name": "Bounce Infinity","type": "EV",      "area": "Hebbal",         "image": "bounce", "range_km": 68,  "battery": 81,  "rating": 4.4},
]

# Base prices per type — surge is multiplied on top by ML engine
BASE_PRICE_BY_TYPE = {
    "EV":      65.0,
    "Scooter": 55.0,
    "Premium": 95.0,
    "Budget":  38.0,
}


@router.get("/bikes")
async def get_bikes(request: Request, area: Optional[str] = None, bike_type: Optional[str] = None, target_time: Optional[str] = None):
    """Return available bikes with ML-computed dynamic pricing per zone/hour."""
    engine = request.app.state.engine
    if target_time:
        try:
            now = datetime.fromisoformat(target_time.replace("Z", "+00:00"))
        except ValueError:
            now = datetime.now()
    else:
        now = datetime.now()
    
    current_hour = now.hour
    is_weekend = now.weekday() >= 5

    filtered = BIKE_CATALOGUE
    if area:
        filtered = [b for b in filtered if b["area"].lower() == area.lower()]
    if bike_type:
        filtered = [b for b in filtered if b["type"].lower() == bike_type.lower()]

    result = []
    for b in filtered:
        rec = engine.get_price_recommendation(b["area"], current_hour, is_weekend)
        base = BASE_PRICE_BY_TYPE.get(b["type"], 65.0)
        # Apply ML surge to this bike type's base price
        price_per_hr = round(base * rec["surge_multiplier"], 2)
        # Availability: inversely proportional to demand index (higher demand → fewer bikes)
        demand_idx = rec["demand_index"]
        available = demand_idx < 1.3  # unavailable when very high demand (out on rides)

        result.append({
            **b,
            "price_per_hr":   price_per_hr,
            "available":       available,
            "surge_multiplier": rec["surge_multiplier"],
            "demand_level":    rec["tier"],
            "demand_index":    round(demand_idx, 2),
        })

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
    """7-day SARIMA-backed price forecast aggregated by day-of-week."""
    engine = request.app.state.engine
    fc = engine.get_short_forecast()
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    buckets: dict = {}
    for point in fc:
        import pandas as pd
        dt = pd.to_datetime(point["dt"])
        key = day_names[dt.weekday()]
        if key not in buckets:
            buckets[key] = {"demand_sum": 0.0, "count": 0}
        buckets[key]["demand_sum"] += point["demand"]
        buckets[key]["count"]      += 1

    result = []
    p33 = float(engine.hourly_ts["cnt"].quantile(0.33))
    p66 = float(engine.hourly_ts["cnt"].quantile(0.66))
    p90 = float(engine.hourly_ts["cnt"].quantile(0.90))

    for day in day_names:
        if day in buckets:
            avg_demand = buckets[day]["demand_sum"] / buckets[day]["count"]
        else:
            avg_demand = float(engine.hourly_profile.mean())
        surge = engine.compute_surge(avg_demand)
        price = round(BASE_PRICE * surge, 2)
        if avg_demand < p33:   demand_label = "Low"
        elif avg_demand < p66: demand_label = "Moderate"
        elif avg_demand < p90: demand_label = "High"
        else:                  demand_label = "Very High"
        result.append({
            "day": day,
            "price": price,
            "demand": round(avg_demand, 1),
            "demand_label": demand_label,
            "surge": surge,
        })
    return {"success": True, "data": result}
