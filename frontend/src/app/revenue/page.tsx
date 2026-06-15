"use client";

import { useEffect, useState } from "react";
import { api, Revenue, Site } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PLATFORMS = [
  { key: "adsense_usd",   label: "AdSense",      unit: "$",  color: "#3b82f6" },
  { key: "adpost_krw",    label: "애드포스트",    unit: "₩",  color: "#10b981" },
  { key: "shopping_krw",  label: "쇼핑커넥트",   unit: "₩",  color: "#f59e0b" },
  { key: "coupang_krw",   label: "쿠팡파트너스", unit: "₩",  color: "#ef4444" },
] as const;

type PlatformKey = typeof PLATFORMS[number]["key"];

type Summary = {
  total: number;
  monthly_avg: number;
  best_month: { year: number; month: number; amount: number };
  total_adsense_usd: number;
  total_adpost_krw: number;
  total_shopping_krw: number;
  total_coupang_krw: number;
};

const emptyForm = () => ({
  site_id: "",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  adsense_usd: 0,
  adpost_krw: 0,
  shopping_krw: 0,
  coupang_krw: 0,
  notes: "",
});

export default function RevenuePage() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const refresh = () =>
    Promise.all([api.revenue.list(), api.sites.list(), api.revenue.summary()])
      .then(([r, s, sum]) => {
        setRevenues(r);
        setSites(s);
        setSummary(sum as Summary);
      })
      .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!form.site_id) return;
    const hasValue = form.adsense_usd || form.adpost_krw || form.shopping_krw || form.coupang_krw;
    if (!hasValue) return;
    setSaving(true);
    try {
      const payload = {
        site_id: Number(form.site_id),
        year: form.year,
        month: form.month,
        adsense_usd: Number(form.adsense_usd) || 0,
        adpost_krw: Number(form.adpost_krw) || 0,
        shopping_krw: Number(form.shopping_krw) || 0,
        coupang_krw: Number(form.coupang_krw) || 0,
        notes: form.notes,
      };
      if (editId !== null) {
        await api.revenue.update(editId, payload);
        setEditId(null);
      } else {
        await api.revenue.create(payload);
      }
      setForm(emptyForm());
      await refresh();
    } finally { setSaving(false); }
  };

  const handleEdit = (r: Revenue) => {
    setEditId(r.id);
    setForm({
      site_id: String(r.site_id),
      year: r.year,
      month: r.month,
      adsense_usd: r.adsense_usd,
      adpost_krw: r.adpost_krw,
      shopping_krw: r.shopping_krw,
      coupang_krw: r.coupang_krw,
      notes: r.notes,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await api.revenue.delete(id);
    await refresh();
  };

  const getSiteName = (id: number) => sites.find(s => s.id === id)?.name ?? `Site ${id}`;

  // 월별 차트 데이터 (최근 6개월, KRW 환산 합산)
  const monthlyChart = (() => {
    const map = new Map<string, Record<PlatformKey, number>>();
    revenues.forEach(r => {
      const key = `${r.year}.${String(r.month).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { adsense_usd: 0, adpost_krw: 0, shopping_krw: 0, coupang_krw: 0 });
      const entry = map.get(key)!;
      entry.adsense_usd += r.adsense_usd;
      entry.adpost_krw += r.adpost_krw;
      entry.shopping_krw += r.shopping_krw;
      entry.coupang_krw += r.coupang_krw;
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, v]) => ({ month, ...v }));
  })();

  // 파이차트 데이터 (플랫폼별 KRW 환산 합계)
  const pieData = [
    { name: "AdSense", value: Math.round((summary?.total_adsense_usd ?? 0) * 1400), color: "#3b82f6" },
    { name: "애드포스트", value: summary?.total_adpost_krw ?? 0, color: "#10b981" },
    { name: "쇼핑커넥트", value: summary?.total_shopping_krw ?? 0, color: "#f59e0b" },
    { name: "쿠팡파트너스", value: summary?.total_coupang_krw ?? 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>수익 트래커</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>플랫폼별 수익 입력 · {revenues.length}건</p>
      </div>

      {/* Platform Summary Cards */}
      <div className="g4" style={{ marginBottom: 20 }}>
        {PLATFORMS.map(p => {
          const summaryKey = `total_${p.key}` as keyof Summary;
          const val = summary ? (summary[summaryKey] as number) : 0;
          return (
            <div key={p.key} className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{p.label} 누적</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: p.color }}>
                {loading ? "—" : `${p.unit}${val.toLocaleString()}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="g-chart" style={{ marginBottom: 20 }}>
        {/* Stacked Bar Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>월별 플랫폼 수익 (최근 6개월)</div>
          {monthlyChart.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 13 }}>데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyChart}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}
                  formatter={(v, name) => {
                    const p = PLATFORMS.find(pl => pl.key === name);
                    return [`${p?.unit ?? ""}${Number(v).toLocaleString()}`, p?.label ?? name];
                  }}
                />
                {PLATFORMS.map(p => (
                  <Bar key={p.key} dataKey={p.key} stackId="a" fill={p.color} radius={p.key === "coupang_krw" ? [4, 4, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>플랫폼 비중 (KRW 환산)</div>
          {pieData.length === 0 ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 13 }}>데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}
                  formatter={(v) => [`₩${Number(v).toLocaleString()}`]}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>
          {editId !== null ? "✏️ 수익 수정" : "💰 수익 입력"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px repeat(4, 1fr) 1fr auto", gap: 10, alignItems: "end" }}>
          {/* Site */}
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>사이트</div>
            <select value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })}>
              <option value="">선택...</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {/* Year */}
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>연도</div>
            <input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
          </div>
          {/* Month */}
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>월</div>
            <input type="number" min={1} max={12} value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })} />
          </div>
          {/* Platform fields */}
          {PLATFORMS.map(p => (
            <div key={p.key}>
              <div style={{ fontSize: 11, marginBottom: 6, color: p.color }}>{p.label} ({p.unit})</div>
              <input
                type="number"
                step={p.unit === "$" ? "0.01" : "1"}
                value={(form[p.key as keyof typeof form] as number) || ""}
                onChange={e => setForm({ ...form, [p.key]: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          ))}
          {/* Notes */}
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>메모</div>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="선택..." />
          </div>
          {/* Button */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !form.site_id || !(form.adsense_usd || form.adpost_krw || form.shopping_krw || form.coupang_krw)}
              style={{ whiteSpace: "nowrap" }}
            >
              {saving ? "저장..." : editId !== null ? "수정" : "추가"}
            </button>
            {editId !== null && (
              <button
                onClick={() => { setEditId(null); setForm(emptyForm()); }}
                style={{ background: "rgba(100,116,139,0.2)", color: "#94a3b8", border: "none", borderRadius: 6, padding: "0 12px", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      {!loading && revenues.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1117", borderBottom: "1px solid #1e293b" }}>
                {["사이트", "기간", "AdSense($)", "애드포스트(₩)", "쇼핑커넥트(₩)", "쿠팡(₩)", "메모", ""].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenues.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>{getSiteName(r.site_id)}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{r.year}.{String(r.month).padStart(2, "0")}</td>
                  <td style={{ padding: "10px 14px", color: "#3b82f6", fontWeight: 600 }}>${r.adsense_usd.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", color: "#10b981" }}>₩{r.adpost_krw.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", color: "#f59e0b" }}>₩{r.shopping_krw.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", color: "#ef4444" }}>₩{r.coupang_krw.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{r.notes}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleEdit(r)}
                        style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
