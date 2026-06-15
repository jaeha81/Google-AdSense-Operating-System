const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- types ---
export interface Site {
  id: number;
  name: string;
  url: string;
  platform: string;
  status: string;
  monthly_revenue: number;
  content_count: number;
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
  total_revenue: number;
  monthly_revenue: number;
}

// --- api ---
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
    delete: (id: number) => req<{ ok: boolean }>(`/api/keywords/${id}`, { method: "DELETE" }),
  },

  content: {
    list: () => req<Content[]>("/api/content/"),
    update: (id: number, data: Partial<Content>) => req<Content>(`/api/content/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => req<{ ok: boolean }>(`/api/content/${id}`, { method: "DELETE" }),
  },

  revenue: {
    list: () => req<Revenue[]>("/api/revenue/"),
    summary: () => req<{ total: number; monthly_avg: number; best_month: { year: number; month: number; amount: number } }>("/api/revenue/summary"),
    create: (data: Partial<Revenue>) => req<Revenue>("/api/revenue/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => req<{ ok: boolean }>(`/api/revenue/${id}`, { method: "DELETE" }),
  },

  agents: {
    logs: () => req<AgentLog[]>("/api/agents/logs"),
    runKeyword: (niche: string) => req<{ keywords: Keyword[]; saved: number }>("/api/agents/keyword", { method: "POST", body: JSON.stringify({ niche }) }),
    runContent: (keyword_id: number, site_id?: number) => req<Content>("/api/agents/content", { method: "POST", body: JSON.stringify({ keyword_id, site_id }) }),
    runSeo: (content_id: number) => req<Record<string, unknown>>("/api/agents/seo", { method: "POST", body: JSON.stringify({ content_id }) }),
    runRevenue: (site_id: number) => req<Record<string, unknown>>("/api/agents/revenue", { method: "POST", body: JSON.stringify({ site_id }) }),
  },
};
