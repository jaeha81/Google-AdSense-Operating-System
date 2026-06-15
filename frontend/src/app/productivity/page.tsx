"use client";

import { useEffect, useState } from "react";
import { api, AgentLog, Stats } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

// 에이전트 유형별 절감 시간 기준 (분)
const TIME_MAP: Record<string, number> = {
  keyword: 30,   // 키워드 리서치 30분 절감
  content: 60,   // 콘텐츠 작성 60분 절감
  seo: 20,       // SEO 최적화 20분 절감
  revenue: 15,   // 수익 분석 15분 절감
};

const HOURLY_RATE = 20000; // 시간당 단가 (₩)

const AGENT_LABELS: Record<string, { label: string; color: string }> = {
  keyword:  { label: "키워드 리서치", color: "#3b82f6" },
  content:  { label: "콘텐츠 작성",   color: "#10b981" },
  seo:      { label: "SEO 최적화",    color: "#f59e0b" },
  revenue:  { label: "수익 분석",     color: "#a78bfa" },
};

export default function ProductivityPage() {
  const [logs, setLogs]   = useState<AgentLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.agents.logs(), api.stats()])
      .then(([l, s]) => { setLogs(l); setStats(s); })
      .finally(() => setLoading(false));
  }, []);

  // 에이전트 유형별 집계
  const byType = Object.entries(
    logs.reduce<Record<string, { total: number; ok: number }>>((acc, log) => {
      const t = log.agent_type;
      if (!acc[t]) acc[t] = { total: 0, ok: 0 };
      acc[t].total++;
      if (log.status === "completed") acc[t].ok++;
      return acc;
    }, {})
  ).map(([type, v]) => ({
    type,
    ...v,
    label: AGENT_LABELS[type]?.label ?? type,
    color: AGENT_LABELS[type]?.color ?? "#64748b",
    savedMin: v.ok * (TIME_MAP[type] ?? 10),
  }));

  const totalRuns     = logs.length;
  const completedRuns = logs.filter(l => l.status === "completed").length;
  const totalSavedMin = byType.reduce((s, t) => s + t.savedMin, 0);
  const totalSavedKrw = Math.round((totalSavedMin / 60) * HOURLY_RATE);
  const successRate   = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  // AI 생산성 지표 (콘텐츠 카운트 기준 추정)
  const contentCount  = stats?.content_count ?? 0;
  const keywordCount  = stats?.keyword_count ?? 0;
  const aiEstMin      = contentCount * 60 + keywordCount * 30;
  const aiEstKrw      = Math.round((aiEstMin / 60) * HOURLY_RATE);

  const barData = byType.map(t => ({ name: t.label, runs: t.total, saved: t.savedMin, color: t.color }));

  const kpiCards = [
    { label: "총 AI 실행 횟수",   value: `${totalRuns}회`,            color: "#3b82f6" },
    { label: "성공률",             value: loading ? "—" : `${successRate}%`, color: successRate >= 80 ? "#10b981" : "#f59e0b" },
    { label: "절감 추정 시간",    value: `${Math.round(totalSavedMin / 60)}시간 ${totalSavedMin % 60}분`, color: "#a78bfa" },
    { label: "절감 추정 비용",    value: `₩${totalSavedKrw.toLocaleString()}`, color: "#10b981" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>AI 생산성 지표</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
          AI 에이전트가 절감한 시간·비용 추정 · 시간당 단가 ₩{HOURLY_RATE.toLocaleString()}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {kpiCards.map(c => (
          <div key={c.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{loading ? "—" : c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* 에이전트별 실행 횟수 */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>에이전트별 실행 횟수</div>
          {barData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 13 }}>
              에이전트를 한 번 실행하면 데이터가 표시됩니다
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}
                  formatter={(v) => [`${v}회`, "실행"]}
                />
                <Bar dataKey="runs" radius={[4, 4, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 절감 시간 */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>에이전트별 절감 시간 (분)</div>
          {barData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 13 }}>
              데이터 없음
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}
                  formatter={(v) => [`${v}분`, "절감"]}
                />
                <Bar dataKey="saved" radius={[4, 4, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 콘텐츠 기반 생산성 추정 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>AI 없이 했다면? (콘텐츠·키워드 기준)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "콘텐츠 작성", count: contentCount, unit: "건", minPer: 60, color: "#10b981" },
              { label: "키워드 리서치", count: keywordCount, unit: "건", minPer: 30, color: "#3b82f6" },
            ].map(item => {
              const min = item.count * item.minPer;
              const hrs = Math.floor(min / 60);
              const rem = min % 60;
              return (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#0d1117", borderRadius: 8, border: "1px solid #1e293b" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#e2e8f0" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{item.count}{item.unit} × {item.minPer}분/건</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{hrs}시간 {rem}분</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>₩{Math.round((min / 60) * HOURLY_RATE).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
            <div style={{ padding: "12px 14px", background: "rgba(139,92,246,0.1)", borderRadius: 8, border: "1px solid rgba(139,92,246,0.3)", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa" }}>총 절감 추정</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#a78bfa" }}>₩{aiEstKrw.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* 에이전트 상세 */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>절감 단가 기준</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(TIME_MAP).map(([type, min]) => (
              <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#0d1117", borderRadius: 6, border: "1px solid #1e293b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: AGENT_LABELS[type]?.color ?? "#64748b" }} />
                  <span style={{ fontSize: 13, color: "#e2e8f0" }}>{AGENT_LABELS[type]?.label ?? type}</span>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>절감 {min}분/회</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>₩{Math.round((min / 60) * HOURLY_RATE).toLocaleString()}/회</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: 11, color: "#334155", padding: "0 4px" }}>
              * 시간당 단가 ₩{HOURLY_RATE.toLocaleString()} 기준 추정값
            </div>
          </div>
        </div>
      </div>

      {/* Agent Log Table */}
      {logs.length > 0 && (
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>최근 AI 실행 로그 (50건)</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1117" }}>
                {["에이전트", "상태", "절감 시간", "실행 시각"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log, i) => {
                const min = log.status === "completed" ? (TIME_MAP[log.agent_type] ?? 10) : 0;
                return (
                  <tr key={log.id} style={{ borderTop: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ color: AGENT_LABELS[log.agent_type]?.color ?? "#94a3b8", fontWeight: 600 }}>
                        {AGENT_LABELS[log.agent_type]?.label ?? log.agent_type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        background: log.status === "completed" ? "rgba(16,185,129,0.15)" : log.status === "failed" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                        color: log.status === "completed" ? "#10b981" : log.status === "failed" ? "#ef4444" : "#f59e0b",
                        borderRadius: 4, padding: "2px 8px", fontSize: 11,
                      }}>
                        {log.status === "completed" ? "완료" : log.status === "failed" ? "실패" : "실행중"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: min > 0 ? "#a78bfa" : "#334155" }}>
                      {min > 0 ? `${min}분` : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", color: "#475569", fontSize: 12 }}>
                      {new Date(log.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 14, color: "#64748b" }}>아직 AI 에이전트 실행 기록이 없습니다</div>
          <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>AI 에이전트 탭에서 키워드·콘텐츠 에이전트를 실행해보세요</div>
        </div>
      )}
    </div>
  );
}
