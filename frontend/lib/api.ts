/**
 * BikeSense API Client
 * Connects to FastAPI ML microservice
 */

const ML_API = process.env.NEXT_PUBLIC_ML_API_URL || "http://localhost:8000";
const API    = process.env.NEXT_PUBLIC_API_URL    || "";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.error || "Unknown error");
  return json.data ?? json;
}

// ─── Prediction APIs ───────────────────────────────────────────────────────
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

export const predictDemand = (input: PredictInput) =>
  apiFetch<PredictionResult>(`${ML_API}/api/v1/predict-demand`, {
    method: "POST", body: JSON.stringify(input),
  });

export const predictPrice = (input: PredictInput) =>
  apiFetch<{predicted_price:number; surge_multiplier:number; price_label:string; demand_level:string; savings_vs_peak:number}>(
    `${ML_API}/api/v1/predict-price`, { method: "POST", body: JSON.stringify(input) }
  );

// ─── Forecast Series ──────────────────────────────────────────────────────
export interface ForecastPoint { dt: string; demand: number; }

export const getShortForecast  = () => apiFetch<ForecastPoint[]>(`${ML_API}/api/v1/forecast/short`);
export const getDailyForecast  = () => apiFetch<ForecastPoint[]>(`${ML_API}/api/v1/forecast/daily`);
export const getMonthlyForecast = () => apiFetch<ForecastPoint[]>(`${ML_API}/api/v1/forecast/monthly`);

// ─── Admin APIs ───────────────────────────────────────────────────────────
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

export const getAdminRevenue  = () => apiFetch<RevenueData>(`${ML_API}/api/v1/admin/revenue`);
export const getHeatmapData   = () => apiFetch<{area:string;hour:number;demand:number}[]>(`${ML_API}/api/v1/admin/heatmap`);
export const getFleetData     = () => apiFetch<any[]>(`${ML_API}/api/v1/admin/fleet`);
export const getCustomerAnalytics = () => apiFetch<any>(`${ML_API}/api/v1/admin/customers/analytics`);
export const getMonthlyReport = () => apiFetch<any[]>(`${ML_API}/api/v1/admin/reports/monthly`);
export const getPricingRec    = (area:string, hour:number, is_weekend=false) =>
  apiFetch<any>(`${ML_API}/api/v1/admin/pricing/recommend?area=${area}&hour=${hour}&is_weekend=${is_weekend}`);

// ─── Consumer APIs ────────────────────────────────────────────────────────
export interface BikeItem {
  id: string; name: string; type: string; area: string;
  price_per_hr: number; rating: number; available: boolean;
  image: string; range_km: number | null; battery: number | null;
}

export const getBikes           = (area?:string, type?:string) =>
  apiFetch<BikeItem[]>(`${ML_API}/api/v1/consumer/bikes${area?`?area=${area}`:''}${type?`&bike_type=${type}`:''}`);
export const getBestTime        = (area?:string) =>
  apiFetch<any>(`${ML_API}/api/v1/consumer/best-time${area?`?area=${area}`:''}`);
export const getRecommendations = (area?:string) =>
  apiFetch<any>(`${ML_API}/api/v1/consumer/recommendations${area?`?area=${area}`:''}`);
export const getPriceTrend      = () =>
  apiFetch<{dt:string;price:number;demand:number}[]>(`${ML_API}/api/v1/consumer/price-trend`);
