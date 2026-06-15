"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Stats, DailyStat } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const KPI = [
  { key: "avg_visitors",  label: "일 평균 방문자", unit: "명",  color: "#3b82f6", icon: "👤" },
  { key: "adsense_usd",   label: "이번달 애드센스", unit: "$",  color: "#10b981", icon: "💵" },
  { key: "adpost_krw",    label: "이번달 애드포스트", unit: "원", color: "#8b5cf6", icon: "📰" },
  { key: "shopping_krw",  label: "이번달 쇼핑커넥트", unit: "원", color: "#f59e0b", icon: "🛍️" },
  { key: "avg_cpc",       label: "평균 CPC",       unit: "$",  color: "#ef4444", icon: "💡" },
  { key: "content_count", label: "총 글 수",        unit: "개", color: "#64748b", icon: "✍️" },
];

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stats(), api.dailyStats.list(30)])
      .then(([s, d]) => { setStats(s); setDaily([...d].reverse()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats
    ? [
        { name: "애드센스(USD→KRW)", value: Math.round(stats.adsense_usd * 1350) },
        { name: "애드포스트", value: stats.adpost_krw },
        { name: "쇼핑커넥트", value: stats.shopping_krw },
        { name: "쿠팡파트너스", value: stats.coupang_krw },
      ].filter(d => d.value > 0)
    : [];

  const totalKrw = pieData.reduce((a, b) => a + b.value, 0);
  const goalPct = Math.min(100, Math.round((totalKrw / 1000000) * 100));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>수익 개요</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          구조를 아는 자가 승리한다 · 키워드 → 트래픽 → 유입 → 전환
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {KPI.map((card) => {
          const raw = stats ? (stats as unknown as Record<string, number>)[card.key] ?? 0 : null;
          const fmt = raw === null ? "—"
            : card.unit === "$" ? `$${Number(raw).toFixed(2)}`
            : card.unit === "원" ? `${Number(raw).toLocaleString()}원`
            : `${Number(raw).toLocaleString()}${card.unit}`;
          return (
            <div key={card.key} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>{card.label}</span>
                <span style={{ fontSize: 20 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>
                {loading ? "—" : fmt}
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal progress bar */}
      {!loading && (
        <div style={{
          padding: "12px 18px", marginBottom: 20, borderRadius: 10,
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>월 목표 100만원 달성률</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>
                {totalKrw.toLocaleString()}원 / {goalPct}%
              </span>
            </div>
            <div style={{ height: 6, background: "#1e293b", borderRadius: 3 }}>
              <div style={{ width: `${goalPct}%`, height: "100%", background: "#10b981", borderRadius: 3, transition: "width 0.5s" }} />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>30일 방문자 추이</div>
          {daily.length === 0 ? (
            <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 12, gap: 8 }}>
              <span style={{ fontSize: 32 }}>📊</span>
              트래픽 분석 탭에서 일별 데이터를 입력하세요
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={daily}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>플랫폼별 수익 비중</div>
          {pieData.length === 0 ? (
            <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 12, gap: 6 }}>
              <span style={{ fontSize: 28 }}>💰</span>
              수익 데이터 없음
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${Number(v).toLocaleString()}원`]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { href: "/keywords",  icon: "🎯", label: "황금 키워드",      desc: "행동형·40대↑ 필터" },
          { href: "/quadrant",  icon: "📐", label: "4사분면 전략",      desc: "콘텐츠 방향 진단" },
          { href: "/calculator",icon: "🧮", label: "수익 계산기",       desc: "CPC×CTR×PV 시뮬" },
          { href: "/checklist", icon: "✅", label: "30일 체크리스트",   desc: "실행 가이드" },
        ].map(q => (
          <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: 16, cursor: "pointer" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{q.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{q.label}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{q.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
