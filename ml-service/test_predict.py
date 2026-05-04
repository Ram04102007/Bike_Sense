import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import pandas as pd
from core.model_engine import ModelEngine
engine = ModelEngine()
engine.train()
target_m = pd.to_datetime("2026-09-08").replace(day=1, hour=0, minute=0, second=0, microsecond=0)
steps = max(1, (target_m.year - engine.monthly_ts.index[-1].year)*12 + target_m.month - engine.monthly_ts.index[-1].month)
m_dem = float(engine.fit_monthly.get_forecast(steps).predicted_mean.iloc[-1])
print("Steps:", steps)
print("Monthly Demand:", m_dem)
