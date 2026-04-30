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
async def recommend_price(area: str, hour: int, is_weekend: bool = False, request: Request = None):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_price_recommendation(area, hour, is_weekend)}


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
async def zone_price_matrix(is_weekend: bool = False, request: Request = None):
    """Return current-hour ML price recommendation for every zone."""
    from datetime import datetime
    engine = request.app.state.engine
    current_hour = datetime.now().hour
    is_wknd = datetime.now().weekday() >= 5 or is_weekend
    zones = ["Indiranagar", "Koramangala", "Whitefield", "Marathahalli",
             "HSR Layout", "Jayanagar", "Electronic City", "Hebbal"]
    matrix = []
    for zone in zones:
        rec = engine.get_price_recommendation(zone, current_hour, is_wknd)
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
    """Simulated fleet models data."""
    import random
    random.seed(101)
    models = [
        {"model":"Ather 450X", "count":247, "available":random.randint(140, 200), "type":"EV", "avg_battery":random.randint(65, 95), "issues":random.randint(2, 12), "revenue":f"₹{round(random.uniform(3.5, 4.8), 1)}L"},
        {"model":"Bounce Infinity", "count":198, "available":random.randint(100, 150), "type":"EV", "avg_battery":random.randint(60, 90), "issues":random.randint(5, 15), "revenue":f"₹{round(random.uniform(2.5, 3.8), 1)}L"},
        {"model":"Yulu Move", "count":156, "available":random.randint(80, 130), "type":"EV", "avg_battery":random.randint(70, 95), "issues":random.randint(1, 8), "revenue":f"₹{round(random.uniform(1.2, 2.2), 1)}L"},
        {"model":"Honda Activa", "count":183, "available":random.randint(100, 160), "type":"Scooter", "avg_battery":None, "issues":random.randint(5, 15), "revenue":f"₹{round(random.uniform(2.0, 3.5), 1)}L"},
        {"model":"Royal Enfield", "count":87, "available":random.randint(40, 70), "type":"Premium", "avg_battery":None, "issues":random.randint(2, 10), "revenue":f"₹{round(random.uniform(2.5, 4.0), 1)}L"},
        {"model":"Rapido Bike", "count":132, "available":random.randint(70, 110), "type":"Budget", "avg_battery":None, "issues":random.randint(3, 12), "revenue":f"₹{round(random.uniform(1.0, 2.0), 1)}L"},
    ]
    return {"success": True, "data": models}


@router.get("/alerts")
async def get_live_alerts(request: Request):
    """Simulated live alerts based on ML engine data and fleet status."""
    import random
    alerts = []
    
    # 1. Demand spike alert
    areas = ["Indiranagar", "Koramangala", "Whitefield", "Marathahalli", "HSR Layout"]
    spike_area = random.choice(areas)
    alerts.append({
        "type": "warning",
        "msg": f"{spike_area} demand spike expected 5–7 PM (SARIMA forecast)",
        "time": f"{random.randint(1, 10)} min ago"
    })
    
    # 2. Rebalancing success
    rebalance_area = random.choice([a for a in areas if a != spike_area])
    alerts.append({
        "type": "success",
        "msg": f"Fleet automatically rebalanced in {rebalance_area} ({random.randint(5, 15)} bikes)",
        "time": f"{random.randint(11, 30)} min ago"
    })
    
    # 3. System info
    alerts.append({
        "type": "info",
        "msg": "ML model retraining completed successfully",
        "time": f"{random.randint(31, 59)} min ago"
    })
    
    # 4. Maintenance / Low Battery
    models = ["Ather 450X", "Bounce Infinity", "Yulu Move"]
    issue_model = random.choice(models)
    issue_area = random.choice(["Electronic City", "Jayanagar", "Hebbal"])
    alerts.append({
        "type": "warning",
        "msg": f"Low battery: {random.randint(3, 8)} {issue_model} in {issue_area}",
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
    monthly = df.groupby(df["dteday"].dt.to_period("M")).agg(
        rides=("cnt","sum"),revenue=("final_price","sum")
    ).reset_index()
    monthly["period"] = monthly["dteday"].astype(str)
    monthly["revenue"] = (monthly["revenue"]/1000).round(1)
    return {"success": True, "data": monthly[["period","rides","revenue"]].to_dict(orient="records")}


@router.get("/zone-intelligence")
async def get_zone_intelligence(request: Request):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_zone_intelligence()}
