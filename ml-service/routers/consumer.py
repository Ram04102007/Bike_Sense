"""Consumer endpoints — bikes, recommendations, best time, hourly pricing, weekly forecast."""
from fastapi import APIRouter, Request
from typing import Optional
import random
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/bikes")
async def get_bikes(area: Optional[str] = None, bike_type: Optional[str] = None):
    """Return available bikes with pricing."""
    random.seed(99)
    bikes = [
        {"id":"b1","name":"Ather 450X","type":"EV","area":"Indiranagar",
         "price_per_hr":81,"rating":4.8,"available":True,"image":"ather","range_km":85,"battery":92},
        {"id":"b2","name":"Bounce Infinity","type":"EV","area":"Koramangala",
         "price_per_hr":69,"rating":4.5,"available":True,"image":"bounce","range_km":70,"battery":76},
        {"id":"b3","name":"Yulu Move","type":"EV","area":"Whitefield",
         "price_per_hr":45,"rating":4.2,"available":True,"image":"yulu","range_km":40,"battery":88},
        {"id":"b4","name":"Honda Activa","type":"Scooter","area":"HSR Layout",
         "price_per_hr":55,"rating":4.6,"available":True,"image":"activa","range_km":None,"battery":None},
        {"id":"b5","name":"Royal Enfield","type":"Premium","area":"Marathahalli",
         "price_per_hr":120,"rating":4.9,"available":False,"image":"re","range_km":None,"battery":None},
        {"id":"b6","name":"Rapido Bike","type":"Budget","area":"Jayanagar",
         "price_per_hr":38,"rating":4.1,"available":True,"image":"rapido","range_km":None,"battery":None},
        {"id":"b7","name":"Ather 450X","type":"EV","area":"Electronic City",
         "price_per_hr":76,"rating":4.7,"available":True,"image":"ather","range_km":80,"battery":65},
        {"id":"b8","name":"Bounce Infinity","type":"EV","area":"Hebbal",
         "price_per_hr":65,"rating":4.4,"available":True,"image":"bounce","range_km":68,"battery":81},
    ]
    filtered = bikes
    if area:
        filtered = [b for b in filtered if b["area"].lower() == area.lower()]
    if bike_type:
        filtered = [b for b in filtered if b["type"].lower() == bike_type.lower()]
    return {"success": True, "data": filtered, "total": len(filtered)}


@router.get("/best-time")
async def best_time_to_rent(request: Request, area: str = "Indiranagar"):
    """Suggest cheapest hours to rent."""
    engine = request.app.state.engine
    hp = engine.hourly_profile
    sorted_hrs = hp.sort_values().index.tolist()
    cheapest = sorted_hrs[:5]
    most_exp  = sorted_hrs[-3:]
    return {
        "success": True,
        "data": {
            "cheapest_hours": [{"hour":h,"price":65.0,"label":"Standard"} for h in cheapest],
            "peak_hours":     [{"hour":h,"price":81.25,"label":"Peak Surge"} for h in most_exp],
            "best_day":       "Tuesday",
            "cheapest_day":   "Wednesday",
            "tip":            "Rent between 10 AM–4 PM for best rates — up to 20% cheaper!",
        }
    }


@router.get("/recommendations")
async def get_recommendations(area: Optional[str] = "Indiranagar"):
    return {
        "success": True,
        "data": {
            "personalized": [
                {"title":"Morning Commuter Deal","desc":"Ride now at standard price","saving":"₹16/hr","tag":"💚 Best Value"},
                {"title":"Off-Peak Window","desc":"Best time: 11 AM – 3 PM today","saving":"₹0 surge","tag":"🕐 Timing Tip"},
                {"title":"Weekend Pass","desc":"Unlimited rides Sat–Sun","saving":"₹120 saved","tag":"🎉 Weekend"},
            ],
            "nearby_zones": [
                {"area":"Indiranagar","bikes":23,"demand":"Moderate","price":70.20},
                {"area":"Koramangala","bikes":18,"demand":"High","price":76.05},
                {"area":"HSR Layout","bikes":31,"demand":"Low","price":65.00},
            ]
        }
    }


@router.get("/price-trend")
async def price_trend(request: Request):
    """7-day price trend for consumer dashboard."""
    engine = request.app.state.engine
    fc = engine.get_short_forecast()
    # Sample every 3 hours
    sampled = fc[::3][:56]
    prices = []
    for s in sampled:
        agg = s["demand"]
        surge = engine.compute_surge(agg)
        prices.append({"dt":s["dt"],"price":round(65.0*surge,2),"demand":s["demand"]})
    return {"success": True, "data": prices}


@router.get("/hourly-pricing")
async def hourly_pricing(request: Request):
    """Return 24-hour price & demand profile derived from SARIMA hourly model."""
    engine = request.app.state.engine
    hp = engine.hourly_profile          # pd.Series indexed by hour (0-23)
    hp_max = float(hp.max())
    result = []
    for hr in range(24):
        avg_demand = float(hp.get(hr, hp.mean()))
        surge = engine.compute_surge(avg_demand)
        price = round(65.0 * surge, 2)
        # demand label
        p33 = float(engine.hourly_ts["cnt"].quantile(0.33))
        p66 = float(engine.hourly_ts["cnt"].quantile(0.66))
        p90 = float(engine.hourly_ts["cnt"].quantile(0.90))
        if avg_demand < p33:   label = "Low"
        elif avg_demand < p66: label = "Moderate"
        elif avg_demand < p90: label = "High"
        else:                  label = "Very High"
        result.append({
            "hour": hr,
            "hour_label": f"{hr:02d}:00",
            "price": price,
            "demand": round(avg_demand, 1),
            "demand_label": label,
            "surge": surge,
        })
    return {"success": True, "data": result}


@router.get("/weekly-forecast")
async def weekly_forecast(request: Request):
    """Return 7-day SARIMA-backed price forecast aggregated by day-of-week."""
    engine = request.app.state.engine
    fc = engine.get_short_forecast()          # list of {dt, demand} — next 7×24 hrs
    day_names = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    buckets: dict = {}

    for point in fc:
        dt = datetime.fromisoformat(point["dt"])
        # weekday() returns 0=Mon … 6=Sun
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
        price = round(65.0 * surge, 2)
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

