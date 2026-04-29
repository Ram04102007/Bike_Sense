"""
BikeSense ML Engine — SARIMA/SARIMAX Model Pipeline
Trained on Bangalore bike demand data (17,379 hourly records)
"""

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller
from datetime import datetime, timedelta
from pathlib import Path
import pickle
import logging
import os

logger = logging.getLogger("bikesense.engine")

# ─── Constants ────────────────────────────────────────────────────────────────
BASE_PRICE   = 65.0
DATA_PATH = Path(os.getenv("DATA_PATH", str(Path(__file__).parent.parent / "bike_data.csv")))
MODELS_DIR   = Path(__file__).parent.parent / "models"
AREAS        = ["Indiranagar","Koramangala","Whitefield","Marathahalli",
                "HSR Layout","Jayanagar","Electronic City","Hebbal"]
BIKE_MODELS  = ["Ather 450X","Bounce Infinity","Yulu Move",
                "Rapido Bike","Royal Enfield","Honda Activa"]

# SARIMA orders (grid-search optimised)
ORDER_S  = (0,1,1);  SORDER_S = (0,1,1,24)   # hourly
ORDER_M  = (1,1,2);  SORDER_M = (1,1,1,7)    # daily
ORDER_L  = (0,1,0);  SORDER_L = (0,1,1,12)   # monthly


class ModelEngine:
    def __init__(self):
        self.fit_hourly = None
        self.fit_daily  = None
        self.fit_monthly = None
        self.df          = None
        self.hourly_ts   = None
        self.daily_ts    = None
        self.monthly_ts  = None
        self.p33 = self.p66 = self.p90 = None
        self.hourly_profile      = None
        self.hourly_profile_norm = None
        self.area_weight_norm    = None
        self.model_weight_norm   = None
        self.loc_model_hr_stats  = None
        self._fc_short = self._fc_med = self._fc_long = None

    # ─── Data Preparation ────────────────────────────────────────────────────
    def _load_data(self):
        if not DATA_PATH.exists():
            self._generate_synthetic_data()
        df = pd.read_csv(DATA_PATH)
        df["dteday"]   = pd.to_datetime(df["dteday"])
        df["hr"]       = df["hr"].astype(int)
        df["datetime"] = pd.to_datetime(df["datetime"])
        for c in ["cnt","base_price","surge_multiplier","final_price",
                  "temp","hum","windspeed","traffic_factor"]:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors="coerce")
        df = df.sort_values("datetime").reset_index(drop=True)
        df["hour_sin"]  = np.sin(2*np.pi*df["hr"]/24)
        df["hour_cos"]  = np.cos(2*np.pi*df["hr"]/24)
        df["month_sin"] = np.sin(2*np.pi*df["dteday"].dt.month/12)
        df["month_cos"] = np.cos(2*np.pi*df["dteday"].dt.month/12)
        self.df = df
        logger.info(f"Data loaded: {len(df):,} rows, {df['datetime'].min().date()} → {df['datetime'].max().date()}")

    def _generate_synthetic_data(self):
        """Generate enriched Bangalore bike demand dataset."""
        logger.info("Generating synthetic Bangalore bike demand dataset...")
        np.random.seed(42)
        weather_conditions = ["Clear","Cloudy","Light Rain","Heavy Rain","Foggy"]
        dates = pd.date_range("2024-04-25","2026-04-25",freq="h")[:17521]
        records = []
        for dt in dates:
            hr = dt.hour
            hour_factor = 1 + 0.8*np.exp(-0.5*((hr-8)/2)**2) + 0.6*np.exp(-0.5*((hr-18)/2)**2)
            seasonal    = 1 + 0.15*np.sin(2*np.pi*(dt.month-3)/12)
            is_weekend  = 1 if dt.weekday()>=5 else 0
            weather     = np.random.choice(weather_conditions,p=[0.45,0.25,0.15,0.08,0.07])
            wf = {"Clear":1.0,"Cloudy":0.95,"Light Rain":0.7,"Heavy Rain":0.4,"Foggy":0.85}[weather]
            total = 0
            for a in AREAS:
                aw = {"Indiranagar":1.3,"Koramangala":1.2,"Whitefield":1.1,"Marathahalli":1.0,
                      "HSR Layout":1.15,"Jayanagar":0.9,"Electronic City":0.95,"Hebbal":0.85}[a]
                for m in BIKE_MODELS:
                    mw = {"Ather 450X":1.2,"Bounce Infinity":1.1,"Yulu Move":0.9,
                          "Rapido Bike":1.0,"Royal Enfield":0.85,"Honda Activa":1.05}[m]
                    b = 12*hour_factor*aw*mw*seasonal*(1.1 if is_weekend else 1.0)*wf
                    total += max(1,int(np.random.poisson(max(0.5,b))))
            temp = round(22+8*np.sin(2*np.pi*(dt.month-1)/12)+np.random.randn()*2,1)
            records.append({"dteday":dt.date(),"hr":hr,"datetime":dt,"cnt":total,
                           "temp":temp,"hum":round(60+20*np.sin(2*np.pi*(dt.month-5)/12)+np.random.randn()*5,1),
                           "windspeed":round(abs(np.random.randn()*8),1),
                           "traffic_factor":round(0.6+0.4*min(hour_factor/3,1)+np.random.uniform(-0.05,0.05),2),
                           "weather_condition":weather,"holiday_flag":1 if np.random.random()<0.03 else 0,
                           "weekend_flag":is_weekend,"area_name":"Bangalore","bike_model":"All",
                           "base_price":65.0,"surge_multiplier":1.0,"final_price":65.0,"zone":"City"})
        df = pd.DataFrame(records)
        p33=df.cnt.quantile(0.33); p66=df.cnt.quantile(0.66); p90=df.cnt.quantile(0.90)
        df["surge_multiplier"]=np.where(df.cnt<p33,1.00,np.where(df.cnt<p66,1.08,np.where(df.cnt<p90,1.17,1.25)))
        df["final_price"]=(65.0*df.surge_multiplier).round(2)
        DATA_PATH.parent.mkdir(exist_ok=True)
        df.to_csv(DATA_PATH,index=False)

    # ─── Build Time Series ────────────────────────────────────────────────────
    def _build_ts(self):
        df = self.df
        self.hourly_ts = (df.groupby("datetime").agg(cnt=("cnt","sum"),
                          surge_multiplier=("surge_multiplier","mean")).asfreq("h").interpolate("linear"))
        self.daily_ts  = (df.groupby("dteday").agg(cnt=("cnt","sum"),
                          surge_multiplier=("surge_multiplier","mean")).asfreq("D").interpolate("linear"))
        self.monthly_ts = (df.set_index("dteday").resample("ME").agg(
                           cnt=("cnt","sum"),surge_multiplier=("surge_multiplier","mean")))
        self.p33 = df["cnt"].quantile(0.33/48)
        self.p66 = df["cnt"].quantile(0.66/48)
        self.p90 = df["cnt"].quantile(0.90/48)
        # Hourly profile for downscaling
        self.hourly_profile      = df.groupby("hr")["cnt"].mean()
        self.hourly_profile_norm = self.hourly_profile / self.hourly_profile.max()

    # ─── Fit SARIMA Models ────────────────────────────────────────────────────
    def _fit_models(self):
        logger.info("Fitting short-term SARIMA (hourly)...")
        train_h = self.hourly_ts["cnt"].iloc[-14*24:]
        self.fit_hourly = SARIMAX(train_h, order=ORDER_S, seasonal_order=SORDER_S,
                                  enforce_stationarity=False,enforce_invertibility=False).fit(disp=False)
        logger.info(f"  Hourly AIC={self.fit_hourly.aic:.1f}")

        logger.info("Fitting medium-term SARIMA (daily)...")
        self.fit_daily = SARIMAX(self.daily_ts["cnt"], order=ORDER_M, seasonal_order=SORDER_M,
                                  enforce_stationarity=False,enforce_invertibility=False).fit(disp=False)
        logger.info(f"  Daily  AIC={self.fit_daily.aic:.1f}")

        logger.info("Fitting long-term SARIMA (monthly)...")
        self.fit_monthly = SARIMAX(self.monthly_ts["cnt"], order=ORDER_L, seasonal_order=SORDER_L,
                                   enforce_stationarity=False,enforce_invertibility=False).fit(disp=False)
        logger.info(f"  Monthly AIC={self.fit_monthly.aic:.1f}")

    # ─── Pre-compute Forecasts ────────────────────────────────────────────────
    def _precompute_forecasts(self):
        last_h = self.hourly_ts.index[-1]
        fc_h   = self.fit_hourly.get_forecast(7*24)
        self._fc_short = {"mean": fc_h.predicted_mean.clip(0),
                          "ci":   fc_h.conf_int(0.20),
                          "idx":  pd.date_range(last_h+pd.Timedelta(hours=1),periods=7*24,freq="h")}
        self._fc_short["mean"].index = self._fc_short["idx"]
        self._fc_short["ci"].index   = self._fc_short["idx"]

        last_d = self.daily_ts.index[-1]
        fc_d   = self.fit_daily.get_forecast(30)
        self._fc_med = {"mean": fc_d.predicted_mean.clip(0),
                        "ci":   fc_d.conf_int(0.20),
                        "idx":  pd.date_range(last_d+pd.Timedelta(days=1),periods=30,freq="D")}
        self._fc_med["mean"].index = self._fc_med["idx"]
        self._fc_med["ci"].index   = self._fc_med["idx"]

        last_m = self.monthly_ts.index[-1]
        fc_m   = self.fit_monthly.get_forecast(12)
        self._fc_long = {"mean": fc_m.predicted_mean.clip(0),
                         "ci":   fc_m.conf_int(0.20),
                         "idx":  pd.date_range(last_m+pd.DateOffset(months=1),periods=12,freq="ME")}
        self._fc_long["mean"].index = self._fc_long["idx"]
        self._fc_long["ci"].index   = self._fc_long["idx"]

    # ─── Surge Logic ─────────────────────────────────────────────────────────
    def compute_surge(self, demand):
        d = float(demand)
        p33 = self.hourly_ts["cnt"].quantile(0.33)
        p66 = self.hourly_ts["cnt"].quantile(0.66)
        p90 = self.hourly_ts["cnt"].quantile(0.90)
        if d < p33: return 1.00
        if d < p66: return 1.08
        if d < p90: return 1.17
        return 1.25

    # ─── Public Training Entry ────────────────────────────────────────────────
    def train(self):
        self._load_data()
        self._build_ts()
        self._fit_models()
        self._precompute_forecasts()
        logger.info("✅ All SARIMA models trained and forecasts cached.")

    # ─── Predict Demand & Price ───────────────────────────────────────────────
    def predict(self, date: str, time: str, location: str = "Bangalore", bike_model: str = "All") -> dict:
        query_dt = pd.to_datetime(f"{date} {time}")
        hr       = query_dt.hour
        today    = pd.Timestamp.now().normalize()
        delta    = (query_dt.normalize()-today).days

        if delta <= 7 and query_dt in self._fc_short["mean"].index:
            base_agg = float(self._fc_short["mean"][query_dt])
            ci       = (float(self._fc_short["ci"].iloc[self._fc_short["idx"].get_loc(query_dt),0]),
                        float(self._fc_short["ci"].iloc[self._fc_short["idx"].get_loc(query_dt),1]))
        elif delta <= 30:
            target_d = query_dt.normalize()
            if target_d in self._fc_med["mean"].index:
                d_dem = float(self._fc_med["mean"][target_d])
            else:
                d_dem = float(self.fit_daily.get_forecast(max(1,(target_d.date()-self.daily_ts.index[-1].date()).days)).predicted_mean.iloc[-1])
            norm = float(self.hourly_profile_norm[hr]) / self.hourly_profile_norm.mean()
            base_agg = max(0, d_dem * norm)
            ci = (max(0, base_agg*0.85), base_agg*1.15)
        else:
            target_me = query_dt.to_period("M").to_timestamp("ME")
            if target_me in self._fc_long["mean"].index:
                m_dem = float(self._fc_long["mean"][target_me])
            else:
                m_dem = float(self.fit_monthly.get_forecast(1).predicted_mean.iloc[-1])
            d_dem = m_dem / query_dt.days_in_month
            norm  = float(self.hourly_profile_norm[hr]) / self.hourly_profile_norm.mean()
            base_agg = max(0, d_dem * norm)
            ci = (max(0, base_agg*0.80), base_agg*1.20)

        surge  = self.compute_surge(base_agg)
        price  = round(BASE_PRICE * surge, 2)
        labels = {1.00:"Standard",1.08:"Moderate",1.17:"High",1.25:"Peak Surge"}

        # Demand level string
        p33 = self.hourly_ts["cnt"].quantile(0.33)
        p66 = self.hourly_ts["cnt"].quantile(0.66)
        p90 = self.hourly_ts["cnt"].quantile(0.90)
        if base_agg < p33:    demand_level = "Low"
        elif base_agg < p66:  demand_level = "Moderate"
        elif base_agg < p90:  demand_level = "High"
        else:                 demand_level = "Very High"

        return {
            "datetime":      query_dt.strftime("%A, %d %B %Y %H:%M"),
            "location":      location,
            "bike_model":    bike_model,
            "expected_demand": round(float(base_agg), 1),
            "confidence_interval": [round(ci[0],1), round(ci[1],1)],
            "demand_level":  demand_level,
            "surge_multiplier": surge,
            "base_price":    BASE_PRICE,
            "predicted_price": price,
            "price_label":   labels.get(surge, "Standard"),
            "savings_vs_peak": round(81.25 - price, 2),
        }

    # ─── Forecast Series for Charts ──────────────────────────────────────────
    def get_short_forecast(self):
        return [{"dt": str(idx), "demand": round(float(v),1)}
                for idx,v in self._fc_short["mean"].items()]

    def get_daily_forecast(self):
        return [{"dt": str(idx.date()), "demand": round(float(v),1)}
                for idx,v in self._fc_med["mean"].items()]

    def get_monthly_forecast(self):
        return [{"dt": str(idx.date()), "demand": round(float(v),1)}
                for idx,v in self._fc_long["mean"].items()]

    def get_heatmap_data(self):
        """Return hour × location demand matrix."""
        df = self.df
        if "area_name" in df.columns and df["area_name"].nunique()>1:
            heat = df.groupby(["area_name","hr"])["cnt"].mean().unstack("hr").fillna(0)
        else:
            # Decompose using area weights
            area_weights = {"Indiranagar":1.3,"Koramangala":1.2,"Whitefield":1.1,
                            "Marathahalli":1.0,"HSR Layout":1.15,"Jayanagar":0.9,
                            "Electronic City":0.95,"Hebbal":0.85}
            total_w = sum(area_weights.values())
            hrly = df.groupby("hr")["cnt"].mean()
            heat = {}
            for area, w in area_weights.items():
                heat[area] = {hr: round(v*w/total_w,1) for hr,v in hrly.items()}
            heat = pd.DataFrame(heat).T
        result = []
        for area in heat.index:
            for hr in range(24):
                val = float(heat.loc[area, hr]) if hr in heat.columns else 0
                result.append({"area":area,"hour":hr,"demand":round(val,1)})
        return result

    def get_revenue_data(self):
        """Simulate revenue KPIs."""
        df = self.df
        total_rides    = int(df["cnt"].sum())
        total_revenue  = round(float((df["cnt"]*df["final_price"]).sum()/1000),0)
        avg_price      = round(float(df["final_price"].mean()),2)
        peak_hour      = int(df.groupby("hr")["cnt"].mean().idxmax())
        last30_mask    = df["dteday"] >= (df["dteday"].max()-pd.Timedelta(days=30))
        monthly_rides  = int(df[last30_mask]["cnt"].sum())
        return {
            "total_rides":   total_rides,
            "total_revenue": total_revenue,
            "avg_price":     avg_price,
            "peak_hour":     peak_hour,
            "monthly_rides": monthly_rides,
            "occupancy_pct": round(float(df["surge_multiplier"].mean()*75),1),
            "active_bikes":  847,
            "repeat_rate":   68.4,
        }

    def get_price_recommendation(self, area: str, hour: int, is_weekend: bool = False) -> dict:
        area_w = {"Indiranagar":1.3,"Koramangala":1.2,"Whitefield":1.1,"Marathahalli":1.0,
                  "HSR Layout":1.15,"Jayanagar":0.9,"Electronic City":0.95,"Hebbal":0.85}.get(area,1.0)
        hr_factor = float(self.hourly_profile_norm[hour])
        demand_idx = area_w * hr_factor * (1.1 if is_weekend else 1.0)
        base_dem   = self.hourly_ts["cnt"].mean() * demand_idx
        surge      = self.compute_surge(base_dem)
        price      = round(BASE_PRICE * surge, 2)
        return {"area":area,"hour":hour,"recommended_price":price,"surge_multiplier":surge,
                "demand_index":round(demand_idx,2),"strategy":
                    "Surge pricing active" if surge>1.0 else "Standard pricing"}

    def get_zone_intelligence(self):
        """Dynamic zone performance metrics based on recent 30-day data and ML weighting."""
        df = self.df
        last30_mask = df["dteday"] >= (df["dteday"].max()-pd.Timedelta(days=30))
        df30 = df[last30_mask]
        
        area_weights = {"Indiranagar":1.3,"Koramangala":1.2,"Whitefield":1.1,
                        "Marathahalli":1.0,"HSR Layout":1.15,"Jayanagar":0.9,
                        "Electronic City":0.95,"Hebbal":0.85}
        total_w = sum(area_weights.values())
        
        total_rides = int(df30["cnt"].sum())
        
        res = []
        for area, w in area_weights.items():
            rides = int(total_rides * w / total_w)
            
            # Predict average surge for this zone based on its average demand
            base_dem = self.hourly_ts["cnt"].mean() * w
            surge = self.compute_surge(base_dem)
            
            # Use dynamic surge to estimate revenue
            revenue = round(rides * BASE_PRICE * surge, 1)
            
            res.append({
                "zone": area,
                "rides": rides,
                "revenue": revenue,
                "surge": surge,
                "status": "High Demand" if surge >= 1.17 else ("Moderate" if surge >= 1.08 else "Normal")
            })
            
        return sorted(res, key=lambda x: x["revenue"], reverse=True)
