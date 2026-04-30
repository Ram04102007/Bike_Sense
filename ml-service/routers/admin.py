"""Admin endpoints — revenue, heatmap, fleet, pricing."""
from fastapi import APIRouter, Request
from typing import Optional

router = APIRouter()


@router.get("/revenue")
async def get_revenue(request: Request):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_revenue_data()}


@router.get("/heatmap")
async def get_heatmap(date: Optional[str] = None, request: Request = None):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_heatmap_data(date)}


@router.get("/pricing/recommend")
async def recommend_price(area: str, hour: int, is_weekend: bool = False, date: Optional[str] = None, request: Request = None):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_price_recommendation(area, hour, is_weekend, date)}


@router.get("/pricing/hourly-schedule")
async def hourly_price_schedule(area: str = "Indiranagar", is_weekend: bool = False, request: Request = None):
    """Return ML-computed price for every hour (0-23) for the given area."""
    engine = request.app.state.engine
    schedule = []
    for h in range(24):
        rec = engine.get_price_recommendation(area, h, is_weekend)
        schedule.append({
            "hour": h,
            "hour_label": f"{h:02d}:00",
            "price": rec["recommended_price"],
            "surge": rec["surge_multiplier"],
            "demand_index": rec["demand_index"],
            "strategy": rec["strategy"],
        })
    return {"success": True, "data": schedule}


@router.get("/pricing/zone-matrix")
async def zone_price_matrix(is_weekend: bool = False, date: str = None, hour: int = None, request: Request = None):
    """Return ML price recommendation for every zone. If date/hour is provided, forecasts for that date/time."""
    from datetime import datetime
    engine = request.app.state.engine
    current_hour = hour if hour is not None else datetime.now().hour
    is_wknd = datetime.now().weekday() >= 5 or is_weekend
    zones = ["Indiranagar", "Koramangala", "Whitefield", "Marathahalli",
             "HSR Layout", "Jayanagar", "Electronic City", "Hebbal"]
    matrix = []
    for zone in zones:
        rec = engine.get_price_recommendation(zone, current_hour, is_wknd, date)
        surge = rec["surge_multiplier"]
        demand = ("High" if surge >= 1.17 else ("Moderate" if surge >= 1.08 else "Normal"))
        # Estimate zone revenue from zone intelligence
        zi = engine.get_zone_intelligence()
        zone_data = next((z for z in zi if z["zone"] == zone), {})
        matrix.append({
            "zone": zone,
            "price": rec["recommended_price"],
            "surge": surge,
            "demand": demand,
            "demand_index": rec["demand_index"],
            "revenue": zone_data.get("revenue", 0),
            "rides": zone_data.get("rides", 0),
        })
    return {"success": True, "data": matrix}


@router.get("/fleet")
async def get_fleet(request: Request):
    """Simulated fleet status data with dynamic ML demand scoring."""
    import random
    from datetime import datetime
    
    # Dynamic demand from ML engine
    engine = request.app.state.engine
    current_hour = datetime.now().hour
    is_weekend = datetime.now().weekday() >= 5

    # We remove the hardcoded seed to make hardware stats vary slightly on refresh
    # but keep them within realistic ranges
    areas = ["Indiranagar","Koramangala","Whitefield","Marathahalli",
             "HSR Layout","Jayanagar","Electronic City","Hebbal"]
    fleet = []
    for a in areas:
        total = random.randint(80, 150)
        available = random.randint(40, total-10)
        maintenance = random.randint(3, 12)
        
        # Pull real demand index from the SARIMA model engine
        ml_data = engine.get_price_recommendation(a, current_hour, is_weekend)
        demand_score = ml_data.get("demand_index", 1.0)

        fleet.append({
            "area": a,
            "total": total,
            "available": available,
            "in_use": total - available - maintenance,
            "maintenance": maintenance,
            "low_battery": random.randint(2, 8),
            "demand_score": demand_score,
        })
    return {"success": True, "data": fleet}


@router.get("/fleet/models")
async def get_fleet_models(request: Request):
    """Fleet model stats with ML-derived revenue estimates."""
    import random
    from datetime import datetime
    engine = request.app.state.engine
    current_hour = datetime.now().hour
    is_weekend = datetime.now().weekday() >= 5

    # Get current-hour city-wide demand from SARIMA
    rec = engine.get_price_recommendation("Indiranagar", current_hour, is_weekend)
    demand_idx = rec.get("demand_index", 1.0)
    surge = rec.get("surge_multiplier", 1.0)

    model_configs = [
        {"model": "Ather 450X",      "count": 247, "type": "EV",      "avg_battery": True,  "base_rev": 4.2},
        {"model": "Bounce Infinity",  "count": 198, "type": "EV",      "avg_battery": True,  "base_rev": 3.1},
        {"model": "Yulu Move",        "count": 156, "type": "EV",      "avg_battery": True,  "base_rev": 1.8},
        {"model": "Honda Activa",     "count": 183, "type": "Scooter", "avg_battery": False, "base_rev": 2.8},
        {"model": "Royal Enfield",    "count":  87, "type": "Premium", "avg_battery": False, "base_rev": 3.4},
        {"model": "Rapido Bike",      "count": 132, "type": "Budget",  "avg_battery": False, "base_rev": 1.4},
    ]
    models = []
    for m in model_configs:
        # Available varies slightly around 65% of fleet
        available = random.randint(int(m["count"] * 0.55), int(m["count"] * 0.75))
        issues    = random.randint(3, 14)
        # Revenue scales with current ML demand index
        rev = round(m["base_rev"] * demand_idx * surge, 1)
        entry = {
            "model":    m["model"],
            "count":    m["count"],
            "available": available,
            "type":     m["type"],
            "issues":   issues,
            "revenue":  f"₹{rev}L",
            "demand_idx": round(demand_idx, 2),
        }
        if m["avg_battery"]:
            entry["avg_battery"] = random.randint(60, 95)
        else:
            entry["avg_battery"] = None
        models.append(entry)
    return {"success": True, "data": models}



@router.get("/alerts")
async def get_live_alerts(request: Request):
    """Dynamic live alerts based on actual ML engine predictions."""
    import random
    from datetime import datetime, timedelta
    engine = request.app.state.engine
    alerts = []
    
    now = datetime.now()
    next_time = now + timedelta(hours=1)
    next_hour = next_time.hour
    is_wknd = next_time.weekday() >= 5
    date_str = next_time.strftime("%Y-%m-%d")
    
    areas = ["Indiranagar", "Koramangala", "Whitefield", "Marathahalli", "HSR Layout", "Jayanagar", "Electronic City", "Hebbal"]
    
    # Evaluate surge for next hour to generate a predictive alert
    surges = []
    for a in areas:
        rec = engine.get_price_recommendation(a, next_hour, is_wknd, date=date_str)
        surges.append((a, rec["surge_multiplier"]))
    
    # Sort by highest surge
    surges.sort(key=lambda x: x[1], reverse=True)
    top_area, top_surge = surges[0]
    
    if top_surge > 1.0:
        time_str = f"{(next_hour % 12) or 12} {'AM' if next_hour < 12 else 'PM'}"
        alerts.append({
            "type": "warning",
            "msg": f"{top_area} demand spike expected at {time_str} (SARIMA forecast: {top_surge}x surge)",
            "time": "Just now"
        })
    else:
        alerts.append({
            "type": "info",
            "msg": "Demand stable across all zones for the next hour.",
            "time": "Just now"
        })
    
    # Generate Rebalance Alert based on secondary demand zones
    rebalance_area = surges[1][0] if len(surges) > 1 else areas[0]
    alerts.append({
        "type": "success",
        "msg": f"Fleet proactively rebalanced in {rebalance_area} ahead of predicted demand.",
        "time": f"{random.randint(5, 15)} min ago"
    })
    
    # 3. System info
    alerts.append({
        "type": "info",
        "msg": "ML model predictions actively syncing with fleet routing.",
        "time": f"{random.randint(1, 3)} hr ago"
    })
    
    return {"success": True, "data": alerts}


@router.get("/customers/analytics")
async def customer_analytics(request: Request):
    return {
        "success": True,
        "data": {
            "total_customers": 12847,
            "returning_users": 8341,
            "high_spend_users": 1204,
            "churn_risk": 673,
            "new_this_month": 891,
            "avg_ltv": 4820,
            "segments": [
                {"name":"Daily Commuters","count":4120,"avg_rides":22,"color":"#3B82F6"},
                {"name":"Weekend Riders","count":3210,"avg_rides":8,"color":"#10B981"},
                {"name":"Occasional","count":3870,"avg_rides":3,"color":"#F59E0B"},
                {"name":"Power Users","count":1647,"avg_rides":31,"color":"#8B5CF6"},
            ]
        }
    }


@router.get("/reports/monthly")
async def monthly_report(request: Request):
    engine = request.app.state.engine
    import pandas as pd
    df = engine.df

    # Pre-compute per-record revenue (rides × price)
    df = df.copy()
    df["ride_revenue"] = df["cnt"] * df["final_price"]

    # Number of zone×model combinations in the synthetic data
    # cnt is the SUM across 8 zones × 6 models = 48 combos per hour
    # Divide by 48 to get realistic single city-wide demand
    COMBO_SCALE = 48

    # 1. Historical monthly data
    monthly = df.groupby(df["dteday"].dt.to_period("M")).agg(
        rides_raw=("cnt", "sum"),
        revenue_raw=("ride_revenue", "sum")
    ).reset_index()
    monthly["period"]  = monthly["dteday"].astype(str)
    monthly["rides"]   = (monthly["rides_raw"] / COMBO_SCALE).astype(int)
    monthly["revenue"] = (monthly["revenue_raw"] / COMBO_SCALE / 100000).round(1)  # → ₹L
    historical_data = monthly[["period", "rides", "revenue"]].to_dict(orient="records")

    # 2. SARIMA Forecast (trained on the same scale → divide by same factor)
    forecast_data = engine.get_monthly_forecast()
    avg_price = float(df["final_price"].mean())   # ~₹65–70

    forecast_records = []
    for f in forecast_data:
        dt = pd.to_datetime(f["dt"])
        period  = f"{dt.year}-{dt.month:02d}"
        rides   = max(0, int(f["demand"] / COMBO_SCALE))          # scale to realistic rides
        revenue = round((rides * avg_price) / 100000, 1)           # rupees → ₹L
        forecast_records.append({
            "period":      period,
            "rides":       rides,
            "revenue":     revenue,
            "is_forecast": True,
        })

    combined_data = historical_data + forecast_records
    return {"success": True, "data": combined_data}


@router.get("/zone-intelligence")
async def get_zone_intelligence(request: Request):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_zone_intelligence()}

@router.get("/pricing/events")
async def event_pricing_list(request: Request = None):
    """Return dynamic festival and event pricing extracted from historical SARIMA ML data."""
    engine = request.app.state.engine
    events = engine.get_event_pricing()
    return {"success": True, "data": events}
