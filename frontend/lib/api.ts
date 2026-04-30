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

const mockHourlyForecast = (hours: number) =>
  Array.from({ length: hours }, (_, i) => {
    const d = new Date(Date.now() + i * 3600000);
    const hour = d.getHours();
    // Peak hours: 8-10 AM and 5-8 PM
    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const baseDemand = isPeak ? 800 : 300;
    return {
      dt: d.toISOString(),
      demand: Math.round(baseDemand + (Math.random() - 0.5) * 100),
    };
  });

const mockDailyForecast = (days: number) =>
  Array.from({ length: days }, (_, i) => ({
    dt: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
    demand: Math.round(15000 + 5000 * Math.sin((i / days) * Math.PI) + (Math.random() - 0.5) * 2000),
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
export const getShortForecast   = () => apiFetch<ForecastPoint[]>(`${ML_API}/forecast/short`,  {}, mockHourlyForecast(7 * 24));
export const getDailyForecast   = () => apiFetch<ForecastPoint[]>(`${ML_API}/forecast/daily`,  {}, mockDailyForecast(30));
export const getMonthlyForecast = () => apiFetch<ForecastPoint[]>(`${ML_API}/forecast/monthly`, {}, mockDailyForecast(365));

// ─── Admin APIs ───────────────────────────────────────────────────────────────
export const getAdminRevenue = () =>
  apiFetch<RevenueData>(`${ML_API}/admin/revenue`, {}, {
    total_rides: 21090, total_revenue: 1452000, avg_price: 68.8,
    peak_hour: 8, monthly_rides: 2109, occupancy_pct: 73, active_bikes: 847, repeat_rate: 68.4,
  });

const mockHeatmap = [
  { area: "Indiranagar", hour: 8, demand: 85 },
  { area: "Koramangala", hour: 18, demand: 92 },
  { area: "Whitefield", hour: 9, demand: 78 },
  { area: "HSR Layout", hour: 19, demand: 88 },
  { area: "Marathahalli", hour: 17, demand: 70 },
];

export const getHeatmapData = (date?: string) => {
  const url = date ? `${ML_API}/admin/heatmap?date=${date}` : `${ML_API}/admin/heatmap`;
  return apiFetch<{ area: string; hour: number; demand: number }[]>(url, {}, mockHeatmap);
};

export const getFleetData         = () => apiFetch<any[]>(`${ML_API}/admin/fleet`, {}, []);
export const getBikeModels        = () => apiFetch<any[]>(`${ML_API}/admin/fleet/models`, {}, []);

const mockAlerts = [
  { type: "warning", msg: "Indiranagar demand spike expected 5–7 PM", time: "10 min ago" },
  { type: "success", msg: "Fleet automatically rebalanced in Whitefield", time: "24 min ago" },
  { type: "warning", msg: "Low battery: 5 Ather 450X in Koramangala", time: "1 hr ago" },
];
export const getLiveAlerts        = () => apiFetch<any[]>(`${ML_API}/admin/alerts`, {}, mockAlerts);

const mockZoneIntelligence = [
  { zone: "Koramangala", rides: 4210, revenue: 315000, surge: 1.25 },
  { zone: "Indiranagar", rides: 3890, revenue: 284000, surge: 1.15 },
  { zone: "HSR Layout", rides: 3450, revenue: 241000, surge: 1.08 },
  { zone: "Whitefield", rides: 3120, revenue: 215000, surge: 1.00 },
  { zone: "Marathahalli", rides: 2850, revenue: 198000, surge: 1.00 },
];
export const getZoneIntelligence  = () => apiFetch<any[]>(`${ML_API}/admin/zone-intelligence`, {}, mockZoneIntelligence);

export const getCustomerAnalytics = () => apiFetch<any>(`${ML_API}/admin/customers/analytics`, {}, {});
const mockMonthlyReport = [
  { period: "2024-01", rides: 1520, revenue: 10.5 },
  { period: "2024-02", rides: 1680, revenue: 11.6 },
  { period: "2024-03", rides: 1920, revenue: 13.2 },
  { period: "2024-04", rides: 2050, revenue: 14.1 },
  { period: "2024-05", rides: 2210, revenue: 15.2 },
  { period: "2024-06", rides: 1990, revenue: 13.7 },
  { period: "2024-07", rides: 2100, revenue: 14.5 },
  { period: "2024-08", rides: 2280, revenue: 15.7 },
  { period: "2024-09", rides: 2150, revenue: 14.8 },
  { period: "2024-10", rides: 2340, revenue: 16.1 },
  { period: "2024-11", rides: 2190, revenue: 15.1 },
  { period: "2024-12", rides: 2410, revenue: 16.6 },
];
export const getMonthlyReport     = () => apiFetch<any[]>(`${ML_API}/admin/reports/monthly`, {}, mockMonthlyReport);
export const getPricingRec        = (area: string, hour: number, is_weekend = false) =>
  apiFetch<any>(`${ML_API}/admin/pricing/recommend?area=${encodeURIComponent(area)}&hour=${hour}&is_weekend=${is_weekend}`, {}, null);

// Fallback: formula-based hourly schedule
const mockHourlySchedule = (area = "Indiranagar") => {
  const areaBoost: Record<string,number> = {
    Indiranagar:1.3, Koramangala:1.2, Whitefield:1.1, Marathahalli:1.0,
    "HSR Layout":1.15, Jayanagar:0.9, "Electronic City":0.95, Hebbal:0.85,
  };
  const ab = areaBoost[area] ?? 1.0;
  return Array.from({ length: 24 }, (_, h) => {
    const isRush = (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
    const isMid  = h >= 10 && h <= 15;
    const surge  = isRush ? 1.25 : isMid ? 1.0 : ab >= 1.2 ? 1.08 : 1.0;
    return { hour: h, hour_label: `${h.toString().padStart(2,"0")}:00`,
      price: parseFloat((65 * surge).toFixed(2)), surge,
      demand_index: parseFloat((ab * (isRush ? 1.4 : isMid ? 1.0 : 0.7)).toFixed(2)),
      strategy: surge > 1.0 ? "Surge pricing active" : "Standard pricing",
    };
  });
};

const mockZoneMatrix = [
  { zone:"Indiranagar",   price:76.05, surge:1.17, demand:"High",     demand_index:1.30, revenue:235980, rides:3120 },
  { zone:"Koramangala",   price:70.20, surge:1.08, demand:"Moderate", demand_index:1.20, revenue:215280, rides:2890 },
  { zone:"Whitefield",    price:70.20, surge:1.08, demand:"Moderate", demand_index:1.10, revenue:191790, rides:2640 },
  { zone:"HSR Layout",    price:70.20, surge:1.08, demand:"Moderate", demand_index:1.15, revenue:199410, rides:2700 },
  { zone:"Marathahalli",  price:65.00, surge:1.00, demand:"Normal",   demand_index:1.00, revenue:161460, rides:2480 },
  { zone:"Electronic City",price:65.00,surge:1.00, demand:"Normal",   demand_index:0.95, revenue:152490, rides:2350 },
  { zone:"Jayanagar",     price:65.00, surge:1.00, demand:"Normal",   demand_index:0.90, revenue:136620, rides:2100 },
  { zone:"Hebbal",        price:65.00, surge:1.00, demand:"Normal",   demand_index:0.85, revenue:115230, rides:1780 },
];

export const getHourlyPriceSchedule = (area = "Indiranagar", is_weekend = false) =>
  apiFetch<any[]>(`${ML_API}/admin/pricing/hourly-schedule?area=${encodeURIComponent(area)}&is_weekend=${is_weekend}`, {}, mockHourlySchedule(area));

export const getZonePriceMatrix = (is_weekend = false) =>
  apiFetch<any[]>(`${ML_API}/admin/pricing/zone-matrix?is_weekend=${is_weekend}`, {}, mockZoneMatrix);

// ─── Consumer APIs ────────────────────────────────────────────────────────────
export const getBikes = (area?: string, type?: string) =>
  apiFetch<BikeItem[]>(
    `${ML_API}/consumer/bikes${area ? `?area=${encodeURIComponent(area)}` : ""}${type ? `&bike_type=${encodeURIComponent(type)}` : ""}`,
    {}, []
  );

export const getBestTime        = (area?: string) => apiFetch<any>(`${ML_API}/consumer/best-time${area ? `?area=${encodeURIComponent(area)}` : ""}`, {}, {});
export const getRecommendations = (area?: string) => apiFetch<any>(`${ML_API}/consumer/recommendations${area ? `?area=${encodeURIComponent(area)}` : ""}`, {}, {});
export const getPriceTrend      = () => apiFetch<{ dt: string; price: number; demand: number }[]>(`${ML_API}/consumer/price-trend`, {}, []);

// ─── New Dynamic Consumer APIs ────────────────────────────────────────────────
export interface HourlyPricePoint {
  hour: number;
  hour_label: string;
  price: number;
  demand: number;
  demand_label: string;
  surge: number;
}

export interface WeeklyDayForecast {
  day: string;
  price: number;
  demand: number;
  demand_label: string;
  surge: number;
}

// Fallback: formula-based 24-hour static schedule (matches old hardcoded logic)
const mockHourlyPricing = (): HourlyPricePoint[] =>
  Array.from({ length: 24 }, (_, h) => {
    const isPeak = (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
    const isMid  = h >= 10 && h <= 15;
    const surge  = isPeak ? 1.25 : isMid ? 1.0 : h < 6 || h > 22 ? 1.0 : 1.08;
    return {
      hour: h, hour_label: `${h.toString().padStart(2, "0")}:00`,
      price: parseFloat((65 * surge).toFixed(2)), demand: 0,
      demand_label: isPeak ? "High" : "Moderate", surge,
    };
  });

// Fallback: formula-based weekly schedule
const mockWeeklyForecast = (): WeeklyDayForecast[] =>
  [
    { day: "Mon", price: 70.2,  demand: 0, demand_label: "Moderate", surge: 1.08 },
    { day: "Tue", price: 65,    demand: 0, demand_label: "Low",      surge: 1.00 },
    { day: "Wed", price: 65,    demand: 0, demand_label: "Low",      surge: 1.00 },
    { day: "Thu", price: 70.2,  demand: 0, demand_label: "Moderate", surge: 1.08 },
    { day: "Fri", price: 76,    demand: 0, demand_label: "High",     surge: 1.17 },
    { day: "Sat", price: 81.25, demand: 0, demand_label: "Very High",surge: 1.25 },
    { day: "Sun", price: 76,    demand: 0, demand_label: "High",     surge: 1.17 },
  ];

export const getHourlyPricing    = () => apiFetch<HourlyPricePoint[]>(`${ML_API}/consumer/hourly-pricing`, {}, mockHourlyPricing());
export const getWeeklyDayForecast = () => apiFetch<WeeklyDayForecast[]>(`${ML_API}/consumer/weekly-forecast`, {}, mockWeeklyForecast());

