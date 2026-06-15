"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Stats, AgentLog } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const KPI_CARDS = [
  { key: "site_count",    label: "디지털 건물",    unit: "개",  icon: "🏢", color: "#3b82f6" },
  { key: "monthly_revenue", label: "이번 달 수익", unit: "$", icon: "💰", color: "#10b981" },
  { key: "content_count", label: "총 콘텐츠",      unit: "개",  icon: "✍️", color: "#f59e0b" },
  { key: "keyword_count", label: "키워드 DB",      unit: "개",  icon: "🔑", color: "#8b5cf6" },
];

const QUICK_LINKS = [
  { href: "/sites",    label: "사이트 추가",         icon: "🏢" },
  { href: "/keywords", label: "키워드 분석 실행",     icon: "🤖" },
  { href: "/content",  label: "콘텐츠 생성",         icon: "✍️" },
  { href: "/revenue",  label: "수익 입력",            icon: "💰" },
];

const MOCK_CHART = [
  { month: "1월", revenue: 320 },
  { month: "2월", revenue: 480 },
  { month: "3월", revenue: 650 },
  { month: "4월", revenue: 820 },
  { month: "5월", revenue: 1100 },
  { month: "6월", revenue: 1450 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stats(), api.agents.logs()])
      .then(([s, l]) => { setStats(s); setLogs(l.slice(0, 6)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
          대시보드
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
          디지털 건물주 운영 현황 · Google AdSense OS
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {KPI_CARDS.map((card) => {
          const value = stats ? (stats as unknown as Record<string, number>)[card.key] : null;
          return (
            <div key={card.key} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>
                    {loading ? "—" : `${card.unit === "$" ? "$" : ""}${value?.toLocaleString() ?? 0}${card.unit !== "$" ? card.unit : ""}`}
                  </div>
                </div>
                <div style={{ fontSize: 28 }}>{card.icon}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>
            수익 추이 (월별)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_CHART}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Agent Activity */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>
            에이전트 최근 활동
          </div>
          {logs.length === 0 ? (
            <div style={{ fontSize: 13, color: "#475569", textAlign: "center", paddingTop: 40 }}>
              아직 실행 기록이 없습니다
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ fontSize: 20 }}>
                    {log.agent_type === "keyword" ? "🔑" : log.agent_type === "content" ? "✍️" : log.agent_type === "seo" ? "📈" : "💰"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.input_data}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {new Date(log.created_at).toLocaleString("ko-KR")}
                    </div>
                  </div>
                  <span className={`badge badge-${log.status}`}>{log.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>빠른 실행</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {QUICK_LINKS.map((q) => (
            <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
              <button className="btn-ghost" style={{ fontSize: 14 }}>
                <span>{q.icon}</span> {q.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
