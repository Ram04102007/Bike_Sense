"""Prediction endpoints — demand + price forecasting."""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PredictRequest(BaseModel):
    date: str          # YYYY-MM-DD
    time: str          # HH:MM
    location: str = "City Center"
    bike_model: str = "All"


@router.post("/predict-demand")
async def predict_demand(req: PredictRequest, request: Request):
    engine = request.app.state.engine
    try:
        result = engine.predict(req.date, req.time, req.location, req.bike_model)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-price")
async def predict_price(req: PredictRequest, request: Request):
    engine = request.app.state.engine
    try:
        result = engine.predict(req.date, req.time, req.location, req.bike_model)
        return {
            "success": True,
            "data": {
                "predicted_price":    result["predicted_price"],
                "surge_multiplier":   result["surge_multiplier"],
                "price_label":        result["price_label"],
                "demand_level":       result["demand_level"],
                "savings_vs_peak":    result["savings_vs_peak"],
                "base_price":         result["base_price"],
                "confidence_interval": result["confidence_interval"],
                "alt_time":           result.get("alt_time"),
                "alt_price":          result.get("alt_price"),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast/short")
async def short_forecast(request: Request):
    """7-day hourly forecast series for charts."""
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_short_forecast()}


@router.get("/forecast/daily")
async def daily_forecast(request: Request):
    """30-day daily forecast."""
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_daily_forecast()}


@router.get("/forecast/monthly")
async def monthly_forecast(request: Request):
    """12-month forecast."""
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_monthly_forecast()}


@router.get("/forecast/metrics")
async def forecast_metrics(request: Request):
    """Model AIC and fit statistics."""
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_model_metrics()}


@router.get("/forecast/insights")
async def forecast_insights(request: Request):
    """Dynamic seasonal and event insights based on historical and forecasted data."""
    engine = request.app.state.engine
    return {"success": True, "data": engine.get_seasonal_insights()}


@router.get("/areas")
async def get_areas(request: Request):
    engine = request.app.state.engine
    return {"areas": engine.dynamic_zones}


@router.get("/bike-models")
async def get_bike_models(request: Request):
    engine = request.app.state.engine
    return {"bike_models": engine.dynamic_models}
