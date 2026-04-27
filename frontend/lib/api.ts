/**
 * BikeSense API Client
 * Connects to FastAPI ML microservice on Render
 * Falls back to mock data if backend is unavailable (Render free tier may sleep)
 */

const ML_API = (process.env.NEXT_PUBLIC_ML_API_URL || "").replace(/\/$/, "");

// ─── Mock Data Fallbacks ──────────────────────────────────────────────────────
const mockPrediction = (date: string, time: string, location: string, bike_model: string) => {
  const hour = parseInt(time.split(":")[0]);
  const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
  const surge = isPeak ? 1.25 : hour >= 11 && hour <= 15 ? 1.08 : 1.00;
  const price = Math.round(65 * surge * 100) / 100;
  return {
    datetime: `${date} ${time}`,
    location,
    bike_model,
    expected_demand: isPeak ? 820 : 450,
    confidence_interval: [isPeak ? 740 : 390, isPeak ? 900 : 520] as [number, number],
    demand_level: isPeak ? "High" : "Moderate" as any,
    surge_multiplier: surge,
    base_price: 65,
    predicted_price: price,
    price_label: surge === 1.25 ? "Peak Surge" : surge === 1.08 ? "Moderate" : "Standard",
    savings_vs_peak: Math.round((81.25 - price) * 100) / 100,
  };
};

const mockForecast = (days: number) =>
  Array.from({ length: days }, (_, i) => ({
    dt: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
    demand: Math.round(400 + 300 * Math.sin((i / days) * Math.PI) + Math.random() * 80),
  }));

// ─── Safe Fetch ───────────────────────────────────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  if (!ML_API) {
    if (fallback !== undefined) return fallback;
    throw new Error("ML_API_URL not configured");
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (json.success === false) throw new Error(json.error || "Unknown error");
    return json.data ?? json;
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PredictInput {
  date: string;
  time: string;
  location?: string;
  bike_model?: string;
}

export interface PredictionResult {
  datetime: string;
  location: string;
  bike_model: string;
  expected_demand: number;
  confidence_interval: [number, number];
  demand_level: "Low" | "Moderate" | "High" | "Very High";
  surge_multiplier: number;
  base_price: number;
  predicted_price: number;
  price_label: string;
  savings_vs_peak: number;
}

export interface ForecastPoint { dt: string; demand: number; }

export interface RevenueData {
  total_rides: number;
  total_revenue: number;
  avg_price: number;
  peak_hour: number;
  monthly_rides: number;
  occupancy_pct: number;
  active_bikes: number;
  repeat_rate: number;
}

export interface BikeItem {
  id: string; name: string; type: string; area: string;
  price_per_hr: number; rating: number; available: boolean;
  image: string; range_km: number | null; battery: number | null;
}

// ─── Prediction APIs ──────────────────────────────────────────────────────────
export const predictDemand = (input: PredictInput) =>
  apiFetch<PredictionResult>(
    `${ML_API}/api/v1/predict-demand`,
    { method: "POST", body: JSON.stringify(input) },
    mockPrediction(input.date, input.time, input.location ?? "Bangalore", input.bike_model ?? "All")
  );

export const predictPrice = (input: PredictInput) =>
  apiFetch<{ predicted_price: number; surge_multiplier: number; price_label: string; demand_level: string; savings_vs_peak: number; base_price: number }>(
    `${ML_API}/api/v1/predict-price`,
    { method: "POST", body: JSON.stringify(input) },
    {
      predicted_price: 65,
      surge_multiplier: 1.0,
      price_label: "Standard",
      demand_level: "Moderate",
      savings_vs_peak: 16.25,
      base_price: 65,
    }
  );

// ─── Forecast Series ──────────────────────────────────────────────────────────
export const getShortForecast   = () => apiFetch<ForecastPoint[]>(`${ML_API}/api/v1/forecast/short`,  {}, mockForecast(7 * 24));
export const getDailyForecast   = () => apiFetch<ForecastPoint[]>(`${ML_API}/api/v1/forecast/daily`,  {}, mockForecast(30));
export const getMonthlyForecast = () => apiFetch<ForecastPoint[]>(`${ML_API}/api/v1/forecast/monthly`, {}, mockForecast(12));

// ─── Admin APIs ───────────────────────────────────────────────────────────────
export const getAdminRevenue = () =>
  apiFetch<RevenueData>(`${ML_API}/api/v1/admin/revenue`, {}, {
    total_rides: 21090, total_revenue: 1452000, avg_price: 68.8,
    peak_hour: 8, monthly_rides: 2109, occupancy_pct: 73, active_bikes: 847, repeat_rate: 68.4,
  });

export const getHeatmapData = () =>
  apiFetch<{ area: string; hour: number; demand: number }[]>(`${ML_API}/api/v1/admin/heatmap`, {}, []);

export const getFleetData         = () => apiFetch<any[]>(`${ML_API}/api/v1/admin/fleet`, {}, []);
export const getCustomerAnalytics = () => apiFetch<any>(`${ML_API}/api/v1/admin/customers/analytics`, {}, {});
export const getMonthlyReport     = () => apiFetch<any[]>(`${ML_API}/api/v1/admin/reports/monthly`, {}, []);
export const getPricingRec        = (area: string, hour: number, is_weekend = false) =>
  apiFetch<any>(`${ML_API}/api/v1/admin/pricing/recommend?area=${area}&hour=${hour}&is_weekend=${is_weekend}`, {}, {});

// ─── Consumer APIs ────────────────────────────────────────────────────────────
export const getBikes = (area?: string, type?: string) =>
  apiFetch<BikeItem[]>(
    `${ML_API}/api/v1/consumer/bikes${area ? `?area=${area}` : ""}${type ? `&bike_type=${type}` : ""}`,
    {},
    []
  );

export const getBestTime        = (area?: string) => apiFetch<any>(`${ML_API}/api/v1/consumer/best-time${area ? `?area=${area}` : ""}`, {}, {});
export const getRecommendations = (area?: string) => apiFetch<any>(`${ML_API}/api/v1/consumer/recommendations${area ? `?area=${area}` : ""}`, {}, {});
export const getPriceTrend      = () => apiFetch<{ dt: string; price: number; demand: number }[]>(`${ML_API}/api/v1/consumer/price-trend`, {}, []);
