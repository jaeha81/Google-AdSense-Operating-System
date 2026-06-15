const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────
export interface Site {
  id: number;
  name: string;
  url: string;
  platform: string;
  status: string;
  monthly_revenue: number;
  content_count: number;
  daily_visitors: number;
  ctr: number;
  rpm: number;
  avg_cpc: number;
  risk_score: number;
  account_type: string;
  created_at: string;
}

export interface Keyword {
  id: number;
  keyword: string;
  cpc: number;
  search_volume: number;
  competition: string;
  category: string;
  site_id: number | null;
  intent_type: string;   // "info" | "action"
  age_group: string;     // "all" | "40plus" | "young"
  quadrant_x: number;   // 0~1 SEO 유입 잠재력
  quadrant_y: number;   // 0~1 수익화 잠재력
  created_at: string;
}

export interface Content {
  id: number;
  title: string;
  keyword_id: number | null;
  site_id: number | null;
  body: string;
  status: string;
  word_count: number;
  created_at: string;
}

export interface Revenue {
  id: number;
  site_id: number;
  year: number;
  month: number;
  amount: number;
  adsense_usd: number;
  adpost_krw: number;
  shopping_krw: number;
  coupang_krw: number;
  notes: string;
  created_at: string;
}

export interface AgentLog {
  id: number;
  agent_type: string;
  input_data: string;
  output_data: string;
  status: string;
  created_at: string;
}

export interface Stats {
  site_count: number;
  keyword_count: number;
  content_count: number;
  published_count: number;
  monthly_revenue: number;
  adsense_usd: number;
  adpost_krw: number;
  shopping_krw: number;
  coupang_krw: number;
  avg_visitors: number;
  avg_cpc: number;
}

export interface DailyStat {
  id?: number;
  date: string;
  visitors: number;
  pageviews: number;
  adsense_usd: number;
  adpost_krw: number;
  shopping_krw: number;
  coupang_krw: number;
  search_ratio: number;
  external_ratio: number;
  paid_ratio: number;
}

export interface ChecklistItem {
  id: number;
  week: number;
  day_range: string;
  task: string;
  completed: number;
  category: string;
}

export interface RoadmapStep {
  id: number;
  step_number: number;
  title: string;
  description: string;
  progress: number;
  status: string;
}

export interface OsmuItem {
  id: number;
  title: string;
  source: string;
  naver_blog: number;
  tistory: number;
  youtube_shorts: number;
  instagram: number;
  kakao: number;
  threads: number;
  notes: string;
  created_at: string;
}

export interface OsmuSummary {
  total_items: number;
  total_distributions: number;
  avg_platforms_per_item: number;
  platform_counts: Record<string, number>;
}

export interface CalcResult {
  daily_clicks: number;
  daily_revenue_krw: number;
  monthly_revenue_krw: number;
  annual_revenue_krw: number;
  action_monthly_krw: number;
  upside_multiplier: number;
  cpc_presets: Record<string, number>;
}

// ── API Object ─────────────────────────────────────────────────────
export const api = {
  stats: () => req<Stats>("/api/stats"),

  sites: {
    list: () => req<Site[]>("/api/sites/"),
    create: (data: Partial<Site>) => req<Site>("/api/sites/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Site>) => req<Site>(`/api/sites/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => req<{ ok: boolean }>(`/api/sites/${id}`, { method: "DELETE" }),
  },

  keywords: {
    list: () => req<Keyword[]>("/api/keywords/"),
    create: (data: Partial<Keyword>) => req<Keyword>("/api/keywords/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Keyword>) => req<Keyword>(`/api/keywords/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => req<{ ok: boolean }>(`/api/keywords/${id}`, { method: "DELETE" }),
  },

  content: {
    list: () => req<Content[]>("/api/content/"),
    update: (id: number, data: Partial<Content>) => req<Content>(`/api/content/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => req<{ ok: boolean }>(`/api/content/${id}`, { method: "DELETE" }),
  },

  revenue: {
    list: () => req<Revenue[]>("/api/revenue/"),
    summary: () => req<{
      total: number;
      monthly_avg: number;
      best_month: { year: number; month: number; amount: number };
      total_adsense_usd: number;
      total_adpost_krw: number;
      total_shopping_krw: number;
      total_coupang_krw: number;
    }>("/api/revenue/summary"),
    create: (data: Partial<Revenue>) => req<Revenue>("/api/revenue/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Revenue>) => req<Revenue>(`/api/revenue/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => req<{ ok: boolean }>(`/api/revenue/${id}`, { method: "DELETE" }),
  },

  agents: {
    logs: () => req<AgentLog[]>("/api/agents/logs"),
    runKeyword: (niche: string) => req<{ keywords: Keyword[]; saved: number }>("/api/agents/keyword", { method: "POST", body: JSON.stringify({ niche }) }),
    runContent: (keyword_id: number, site_id?: number) => req<Content>("/api/agents/content", { method: "POST", body: JSON.stringify({ keyword_id, site_id }) }),
    runSeo: (content_id: number) => req<Record<string, unknown>>("/api/agents/seo", { method: "POST", body: JSON.stringify({ content_id }) }),
    runRevenue: (site_id: number) => req<Record<string, unknown>>("/api/agents/revenue", { method: "POST", body: JSON.stringify({ site_id }) }),
  },

  dailyStats: {
    list: (limit = 30) => req<DailyStat[]>(`/api/daily-stats/?limit=${limit}`),
    upsert: (data: Partial<DailyStat>) => req<DailyStat>("/api/daily-stats/", { method: "POST", body: JSON.stringify(data) }),
    summary: () => req<{ avg_visitors: number; total_adsense_usd: number; total_krw: number; data_points: number }>("/api/daily-stats/summary"),
  },

  checklist: {
    list: () => req<ChecklistItem[]>("/api/checklist/"),
    toggle: (id: number) => req<ChecklistItem>(`/api/checklist/${id}/toggle`, { method: "PATCH", body: "{}" }),
  },

  roadmap: {
    list: () => req<RoadmapStep[]>("/api/roadmap/"),
    update: (id: number, data: { progress?: number; status?: string }) =>
      req<RoadmapStep>(`/api/roadmap/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  calculator: {
    estimate: (daily_visitors: number, ctr_percent: number, cpc_krw: number, days = 30) =>
      req<CalcResult>("/api/calculator/estimate", {
        method: "POST",
        body: JSON.stringify({ daily_visitors, ctr_percent, cpc_krw, days }),
      }),
  },

  osmu: {
    list: () => req<OsmuItem[]>("/api/osmu/"),
    summary: () => req<OsmuSummary>("/api/osmu/summary"),
    create: (data: Partial<OsmuItem>) => req<OsmuItem>("/api/osmu/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<OsmuItem>) => req<OsmuItem>(`/api/osmu/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => req<{ ok: boolean }>(`/api/osmu/${id}`, { method: "DELETE" }),
  },
};
