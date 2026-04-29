/**
 * BikeSense API Client
 * Routes all ML requests through the Next.js /api/ml/* proxy
 * which rewrites to ML_API_URL/api/v1/* (see next.config.js).
 * Falls back to graceful mock data if the backend is unreachable.
 */

// Use the Next.js proxy path — works in both local dev and Vercel
const ML_API = "/api/ml";

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
    demand: Math.round(400 + 300 * Math.sin((i / days) * Math.PI) + (Math.random() - 0.5) * 80),
  }));

// ─── Safe Fetch ───────────────────────────────────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s — Render cold start
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
    console.warn("[BikeSense API] Falling back to mock data:", err);
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
    `${ML_API}/predict-demand`,
    { method: "POST", body: JSON.stringify({ ...input, location: input.location ?? "Bangalore", bike_model: input.bike_model ?? "All" }) },
    mockPrediction(input.date, input.time, input.location ?? "Bangalore", input.bike_model ?? "All")
  );

export const predictPrice = (input: PredictInput) =>
  apiFetch<{ predicted_price: number; surge_multiplier: number; price_label: string; demand_level: string; savings_vs_peak: number; base_price: number; confidence_interval: [number,number] }>(
    `${ML_API}/predict-price`,
    { method: "POST", body: JSON.stringify({ ...input, location: input.location ?? "Bangalore", bike_model: input.bike_model ?? "All" }) },
    { predicted_price: 65, surge_multiplier: 1.0, price_label: "Standard", demand_level: "Moderate", savings_vs_peak: 16.25, base_price: 65, confidence_interval: [55, 75] }
  );

// ─── Forecast Series ──────────────────────────────────────────────────────────
export const getShortForecast   = () => apiFetch<ForecastPoint[]>(`${ML_API}/forecast/short`,  {}, mockForecast(7 * 24));
export const getDailyForecast   = () => apiFetch<ForecastPoint[]>(`${ML_API}/forecast/daily`,  {}, mockForecast(30));
export const getMonthlyForecast = () => apiFetch<ForecastPoint[]>(`${ML_API}/forecast/monthly`, {}, mockForecast(12));

// ─── Admin APIs ───────────────────────────────────────────────────────────────
export const getAdminRevenue = () =>
  apiFetch<RevenueData>(`${ML_API}/admin/revenue`, {}, {
    total_rides: 21090, total_revenue: 1452000, avg_price: 68.8,
    peak_hour: 8, monthly_rides: 2109, occupancy_pct: 73, active_bikes: 847, repeat_rate: 68.4,
  });

export const getHeatmapData = () =>
  apiFetch<{ area: string; hour: number; demand: number }[]>(`${ML_API}/admin/heatmap`, {}, []);

export const getFleetData         = () => apiFetch<any[]>(`${ML_API}/admin/fleet`, {}, []);
export const getBikeModels        = () => apiFetch<any[]>(`${ML_API}/admin/fleet/models`, {}, []);
export const getLiveAlerts        = () => apiFetch<any[]>(`${ML_API}/admin/alerts`, {}, []);
export const getZoneIntelligence  = () => apiFetch<any[]>(`${ML_API}/admin/zone-intelligence`, {}, []);
export const getCustomerAnalytics = () => apiFetch<any>(`${ML_API}/admin/customers/analytics`, {}, {});
export const getMonthlyReport     = () => apiFetch<any[]>(`${ML_API}/admin/reports/monthly`, {}, []);
export const getPricingRec        = (area: string, hour: number, is_weekend = false) =>
  apiFetch<any>(`${ML_API}/admin/pricing/recommend?area=${encodeURIComponent(area)}&hour=${hour}&is_weekend=${is_weekend}`, {}, null);

// ─── Consumer APIs ────────────────────────────────────────────────────────────
export const getBikes = (area?: string, type?: string) =>
  apiFetch<BikeItem[]>(
    `${ML_API}/consumer/bikes${area ? `?area=${encodeURIComponent(area)}` : ""}${type ? `&bike_type=${encodeURIComponent(type)}` : ""}`,
    {}, []
  );

export const getBestTime        = (area?: string) => apiFetch<any>(`${ML_API}/consumer/best-time${area ? `?area=${encodeURIComponent(area)}` : ""}`, {}, {});
export const getRecommendations = (area?: string) => apiFetch<any>(`${ML_API}/consumer/recommendations${area ? `?area=${encodeURIComponent(area)}` : ""}`, {}, {});
export const getPriceTrend      = () => apiFetch<{ dt: string; price: number; demand: number }[]>(`${ML_API}/consumer/price-trend`, {}, []);
