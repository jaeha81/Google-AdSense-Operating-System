"use client";

import { useEffect, useState } from "react";
import { api, DailyStat } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";

const today = () => new Date().toISOString().slice(0, 10);

export default function TrafficPage() {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<DailyStat>>({
    date: today(), visitors: 0, pageviews: 0,
    adsense_usd: 0, adpost_krw: 0, shopping_krw: 0, coupang_krw: 0,
    search_ratio: 0.6, external_ratio: 0.3, paid_ratio: 0.1,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => api.dailyStats.list(30).then(d => setStats([...d].reverse())).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.dailyStats.upsert(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await load();
    } finally { setSaving(false); }
  };

  const latest = stats[stats.length - 1];
  const avgSearch = stats.length > 0 ? stats.reduce((a, s) => a + s.search_ratio, 0) / stats.length : 0.6;
  const avgExternal = stats.length > 0 ? stats.reduce((a, s) => a + s.external_ratio, 0) / stats.length : 0.3;
  const avgPaid = stats.length > 0 ? stats.reduce((a, s) => a + s.paid_ratio, 0) / stats.length : 0.1;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>트래픽 구조 분석</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>검색유입(SEO) → 외부유입(SNS) → 광고유입 순서 권고</p>
      </div>

      {/* Traffic channel guide */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "검색유입 (SEO)", role: "기본기 · 안정적", color: "#3b82f6", target: "60%+", avg: `${Math.round(avgSearch * 100)}%` },
          { label: "외부유입 (SNS·커뮤니티)", role: "증폭기 · 빠름", color: "#10b981", target: "30%±", avg: `${Math.round(avgExternal * 100)}%` },
          { label: "광고유입", role: "가속기 · 중급↑", color: "#f59e0b", target: "10%", avg: `${Math.round(avgPaid * 100)}%` },
        ].map(ch => (
          <div key={ch.label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: ch.color, marginBottom: 6 }}>{ch.label}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{ch.role}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: ch.color }}>{ch.avg}</div>
            <div style={{ fontSize: 10, color: "#475569" }}>권장: {ch.target}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
        {/* Visitor chart */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>30일 방문자 & 수익 추이</div>
          {stats.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 13 }}>
              데이터 없음 — 오른쪽에서 입력하세요
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={false} name="방문자" />
                <Line yAxisId="right" type="monotone" dataKey="adsense_usd" stroke="#10b981" strokeWidth={2} dot={false} name="애드센스($)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily data input */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>일별 데이터 입력</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>날짜</div>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>방문자</div>
                <input type="number" value={form.visitors || ""} onChange={e => setForm({ ...form, visitors: Number(e.target.value) })} placeholder="0" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>페이지뷰</div>
                <input type="number" value={form.pageviews || ""} onChange={e => setForm({ ...form, pageviews: Number(e.target.value) })} placeholder="0" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>애드센스($)</div>
                <input type="number" step="0.01" value={form.adsense_usd || ""} onChange={e => setForm({ ...form, adsense_usd: Number(e.target.value) })} placeholder="0.00" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>애드포스트(원)</div>
                <input type="number" value={form.adpost_krw || ""} onChange={e => setForm({ ...form, adpost_krw: Number(e.target.value) })} placeholder="0" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>쇼핑커넥트(원)</div>
                <input type="number" value={form.shopping_krw || ""} onChange={e => setForm({ ...form, shopping_krw: Number(e.target.value) })} placeholder="0" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>쿠팡파트너스(원)</div>
                <input type="number" value={form.coupang_krw || ""} onChange={e => setForm({ ...form, coupang_krw: Number(e.target.value) })} placeholder="0" />
              </div>
            </div>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : saved ? "✅ 저장됨" : "📊 데이터 저장"}
            </button>
          </div>
        </div>
      </div>

      {/* Traffic ratio chart */}
      {stats.length > 0 && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>트래픽 채널 구성 추이</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats} stackOffset="expand">
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
              <YAxis tickFormatter={v => `${Math.round(v * 100)}%`} stroke="#64748b" tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                formatter={(v: unknown) => [`${Math.round(Number(v) * 100)}%`]}
              />
              <Bar dataKey="search_ratio" stackId="a" fill="#3b82f6" name="검색유입" />
              <Bar dataKey="external_ratio" stackId="a" fill="#10b981" name="외부유입" />
              <Bar dataKey="paid_ratio" stackId="a" fill="#f59e0b" name="광고유입" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
