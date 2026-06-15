"use client";

import { useEffect, useState } from "react";
import { api, Keyword } from "@/lib/api";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell,
} from "recharts";

function quadrantInfo(x: number, y: number) {
  if (x >= 50 && y >= 50) return { label: "★ 최고추천", color: "#10b981" };
  if (x < 50  && y >= 50) return { label: "제품리뷰형", color: "#3b82f6" };
  if (x >= 50 && y < 50)  return { label: "정보유입형", color: "#f59e0b" };
  return { label: "비추천", color: "#475569" };
}

export default function QuadrantPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.keywords.list().then(setKeywords).finally(() => setLoading(false));
  }, []);

  const points = keywords.map(k => ({
    x: Math.round(k.quadrant_x * 100),
    y: Math.round(k.quadrant_y * 100),
    name: k.keyword, cpc: k.cpc,
    sv: k.search_volume, intent: k.intent_type,
  }));

  const optimal = points.filter(p => p.x >= 50 && p.y >= 50);
  const optimalPct = points.length > 0 ? Math.round((optimal.length / points.length) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>4사분면 콘텐츠 전략 매트릭스</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>우상단(★) 비율이 높을수록 수익성이 높습니다 · 현재 {optimalPct}%</p>
      </div>

      {!loading && points.length > 0 && optimalPct < 30 && (
        <div style={{ padding: "12px 16px", marginBottom: 16, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 13, color: "#ef4444" }}>
          ⚠️ 최고추천 키워드 비율 {optimalPct}% — 행동형·고단가 키워드를 추가하세요 (목표 30% 이상)
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "★ 최고추천",  sub: "우상단 · 행동형+고SEO", color: "#10b981", f: (p: typeof points[0]) => p.x >= 50 && p.y >= 50 },
          { label: "제품리뷰형",  sub: "좌상단 · 수익↑ SEO↓",   color: "#3b82f6", f: (p: typeof points[0]) => p.x < 50 && p.y >= 50  },
          { label: "정보유입형",  sub: "우하단 · SEO↑ 수익↓",   color: "#f59e0b", f: (p: typeof points[0]) => p.x >= 50 && p.y < 50   },
          { label: "비추천",      sub: "좌하단 · 일상/경험",      color: "#475569", f: (p: typeof points[0]) => p.x < 50 && p.y < 50   },
        ].map(q => (
          <div key={q.label} className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: q.color }}>{q.label}</div>
            <div style={{ fontSize: 10, color: "#475569", margin: "4px 0 8px" }}>{q.sub}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: q.color }}>{points.filter(q.f).length}</div>
            <div style={{ fontSize: 10, color: "#475569" }}>개 키워드</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>산점도 — X: SEO 유입 잠재력, Y: 수익화 잠재력 (0~100)</div>
        {loading ? (
          <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>로딩 중...</div>
        ) : points.length === 0 ? (
          <div style={{ height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 13, gap: 10 }}>
            <span style={{ fontSize: 40 }}>📐</span>
            키워드가 없습니다. 키워드 탭에서 추가하거나 AI 에이전트로 발굴하세요.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis type="number" dataKey="y" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <ReferenceLine x={50} stroke="#334155" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 4" />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as typeof points[0];
                const q = quadrantInfo(d.x, d.y);
                return (
                  <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: q.color }}>{q.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>CPC: ${d.cpc} · 검색량: {d.sv.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: d.intent === "action" ? "#10b981" : "#64748b" }}>
                      {d.intent === "action" ? "✅ 행동요구형" : "ℹ️ 정보형"}
                    </div>
                  </div>
                );
              }} />
              <Scatter data={points}>
                {points.map((p, i) => <Cell key={i} fill={quadrantInfo(p.x, p.y).color} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {points.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1117", borderBottom: "1px solid #1e293b" }}>
                {["키워드", "사분면", "CPC", "검색량", "의도유형"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...points].sort((a, b) => b.y - a.y || b.x - a.x).map((p, i) => {
                const q = quadrantInfo(p.x, p.y);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #0d1117" }}>
                    <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: `${q.color}22`, color: q.color }}>{q.label}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#10b981" }}>${p.cpc}</td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{p.sv.toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: p.intent === "action" ? "#10b981" : "#64748b" }}>
                      {p.intent === "action" ? "✅ 행동요구형" : "ℹ️ 정보형"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
