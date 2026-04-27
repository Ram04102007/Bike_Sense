"""Admin endpoints — revenue, heatmap, fleet, pricing."""
from fastapi import APIRouter, Request
from typing import Optional

router = APIRouter()


@router.get("/revenue")
async def get_revenue(request: Request):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_revenue_data()}


@router.get("/heatmap")
async def get_heatmap(request: Request):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_heatmap_data()}


@router.get("/pricing/recommend")
async def recommend_price(area: str, hour: int, is_weekend: bool = False, request: Request = None):
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_price_recommendation(area, hour, is_weekend)}


@router.get("/fleet")
async def get_fleet(request: Request):
    """Simulated fleet status data."""
    import random
    random.seed(42)
    areas = ["Indiranagar","Koramangala","Whitefield","Marathahalli",
             "HSR Layout","Jayanagar","Electronic City","Hebbal"]
    fleet = []
    for a in areas:
        total = random.randint(80, 150)
        available = random.randint(40, total-10)
        maintenance = random.randint(3, 12)
        fleet.append({
            "area": a,
            "total": total,
            "available": available,
            "in_use": total - available - maintenance,
            "maintenance": maintenance,
            "low_battery": random.randint(2, 8),
            "demand_score": round(random.uniform(0.6, 1.4), 2),
        })
    return {"success": True, "data": fleet}


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
