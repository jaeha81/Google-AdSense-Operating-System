"use client";

import { useEffect, useState } from "react";
import { api, Revenue, Site } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

export default function RevenuePage() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [summary, setSummary] = useState<{ total: number; monthly_avg: number; best_month: { year: number; month: number; amount: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ site_id: "", year: new Date().getFullYear(), month: new Date().getMonth() + 1, amount: 0, notes: "" });
  const [saving, setSaving] = useState(false);

  const refresh = () =>
    Promise.all([api.revenue.list(), api.sites.list(), api.revenue.summary()])
      .then(([r, s, sum]) => { setRevenues(r); setSites(s); setSummary(sum); })
      .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const handleAdd = async () => {
    if (!form.site_id || !form.amount) return;
    setSaving(true);
    try {
      await api.revenue.create({ ...form, site_id: Number(form.site_id), amount: Number(form.amount) });
      setForm({ site_id: "", year: new Date().getFullYear(), month: new Date().getMonth() + 1, amount: 0, notes: "" });
      await refresh();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await api.revenue.delete(id);
    await refresh();
  };

  // Chart data: by site
  const chartData = sites.map(site => ({
    name: site.name.length > 10 ? site.name.slice(0, 10) + "…" : site.name,
    total: revenues.filter(r => r.site_id === site.id).reduce((s, r) => s + r.amount, 0),
  })).filter(d => d.total > 0);

  const getSiteName = (id: number) => sites.find(s => s.id === id)?.name ?? `Site ${id}`;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>수익 트래커</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>AdSense 수익 월별 기록 · {revenues.length}건</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "누적 총수익",   value: `$${(summary?.total ?? 0).toLocaleString()}`,       color: "#10b981" },
          { label: "월평균 수익",   value: `$${(summary?.monthly_avg ?? 0).toFixed(0)}`,        color: "#3b82f6" },
          { label: "최고 월 수익",  value: summary?.best_month?.amount ? `$${summary.best_month.amount.toLocaleString()} (${summary.best_month.year}.${String(summary.best_month.month).padStart(2,"0")})` : "-", color: "#f59e0b" },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{loading ? "—" : card.value}</div>
          </div>
        ))}
      </div>

      {/* Chart + Add Form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 20 }}>
        {/* Bar Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>사이트별 누적 수익</div>
          {chartData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 13 }}>
              데이터 없음
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}
                  formatter={(v) => [`$${Number(v).toLocaleString()}`, "수익"]}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Add Revenue */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>수익 입력</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>사이트</div>
              <select value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })}>
                <option value="">사이트 선택...</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>연도</div>
                <input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>월</div>
                <input type="number" min={1} max={12} value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>수익 ($)</div>
              <input type="number" step="0.01" value={form.amount || ""} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>메모 (선택)</div>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="특이사항..." />
            </div>
            <button className="btn-primary" onClick={handleAdd} disabled={saving || !form.site_id || !form.amount}>
              {saving ? "저장 중..." : "💰 수익 기록 추가"}
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      {!loading && revenues.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#0d1117", borderBottom: "1px solid #1e293b" }}>
                {["사이트", "기간", "수익", "메모", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenues.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "12px 16px", color: "#e2e8f0" }}>{getSiteName(r.site_id)}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{r.year}.{String(r.month).padStart(2, "0")}</td>
                  <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>${r.amount.toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{r.notes}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => handleDelete(r.id)} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
