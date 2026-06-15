"use client";

import { useEffect, useState } from "react";
import { api, AgentLog, Keyword, Site } from "@/lib/api";

const AGENT_CARDS = [
  {
    key: "keyword",
    label: "키워드 리서치 에이전트",
    desc: "니치 주제로 고수익 키워드 20개 자동 발굴",
    icon: "🔑",
    color: "#3b82f6",
  },
  {
    key: "content",
    label: "콘텐츠 생성 에이전트",
    desc: "키워드 기반 SEO 최적화 블로그 포스트 자동 작성",
    icon: "✍️",
    color: "#8b5cf6",
  },
  {
    key: "seo",
    label: "SEO 감사 에이전트",
    desc: "콘텐츠 SEO 점수 측정 및 개선안 제안",
    icon: "📈",
    color: "#f59e0b",
  },
  {
    key: "revenue",
    label: "수익 분석 에이전트",
    desc: "사이트별 수익 추이 분석 및 성장 전략 제안",
    icon: "💰",
    color: "#10b981",
  },
];

export default function AgentsPage() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  // Inputs
  const [kwNiche, setKwNiche] = useState("");
  const [contentKwId, setContentKwId] = useState<number | "">("");
  const [seoSiteId, setSeoSiteId] = useState<number | "">("");
  const [revSiteId, setRevSiteId] = useState<number | "">("");

  const refresh = () =>
    Promise.all([api.agents.logs(), api.keywords.list(), api.sites.list()])
      .then(([l, k, s]) => { setLogs(l); setKeywords(k); setSites(s); })
      .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const runKeyword = async () => {
    if (!kwNiche.trim()) return;
    setRunning("keyword");
    try {
      const res = await api.agents.runKeyword(kwNiche);
      setResults(r => ({ ...r, keyword: `✅ ${res.saved}개 키워드 저장됨` }));
      await refresh();
    } catch { setResults(r => ({ ...r, keyword: "❌ 실패" })); }
    finally { setRunning(null); }
  };

  const runContent = async () => {
    if (!contentKwId) return;
    setRunning("content");
    try {
      const res = await api.agents.runContent(Number(contentKwId));
      setResults(r => ({ ...r, content: `✅ 콘텐츠 생성 완료: "${res.title}"` }));
      await refresh();
    } catch { setResults(r => ({ ...r, content: "❌ 실패" })); }
    finally { setRunning(null); }
  };

  const runSeo = async () => {
    if (!seoSiteId) return;
    const content = await api.content.list();
    const siteContent = content.find(c => c.site_id === Number(seoSiteId) && c.body);
    if (!siteContent) {
      setResults(r => ({ ...r, seo: "❌ 해당 사이트에 콘텐츠가 없습니다" }));
      return;
    }
    setRunning("seo");
    try {
      const res = await api.agents.runSeo(siteContent.id) as { score: number; suggestions?: string[] };
      setResults(r => ({ ...r, seo: `✅ SEO 점수: ${res.score}/100 · 개선사항 ${res.suggestions?.length ?? 0}개` }));
      await refresh();
    } catch { setResults(r => ({ ...r, seo: "❌ 실패" })); }
    finally { setRunning(null); }
  };

  const runRevenue = async () => {
    if (!revSiteId) return;
    setRunning("revenue");
    try {
      const res = await api.agents.runRevenue(Number(revSiteId)) as { trend: string; next_month_prediction: number; strategies?: string[] };
      setResults(r => ({ ...r, revenue: `✅ 추이: ${res.trend} | 다음달 예측: $${res.next_month_prediction?.toFixed(0)}` }));
      await refresh();
    } catch { setResults(r => ({ ...r, revenue: "❌ 실패" })); }
    finally { setRunning(null); }
  };

  const agentActions: Record<string, React.ReactNode> = {
    keyword: (
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={kwNiche} onChange={e => setKwNiche(e.target.value)} placeholder="주제 입력 (재테크, 다이어트...)" style={{ flex: 1 }} />
        <button className="btn-primary" onClick={runKeyword} disabled={running === "keyword" || !kwNiche.trim()}
          style={{ background: "#3b82f6", whiteSpace: "nowrap" }}>
          {running === "keyword" ? "⏳" : "실행"}
        </button>
      </div>
    ),
    content: (
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <select value={contentKwId} onChange={e => setContentKwId(e.target.value ? Number(e.target.value) : "")} style={{ flex: 1 }}>
          <option value="">키워드 선택...</option>
          {keywords.map(k => <option key={k.id} value={k.id}>{k.keyword}</option>)}
        </select>
        <button className="btn-primary" onClick={runContent} disabled={running === "content" || !contentKwId}
          style={{ background: "#8b5cf6", whiteSpace: "nowrap" }}>
          {running === "content" ? "⏳" : "실행"}
        </button>
      </div>
    ),
    seo: (
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <select value={seoSiteId} onChange={e => setSeoSiteId(e.target.value ? Number(e.target.value) : "")} style={{ flex: 1 }}>
          <option value="">사이트 선택...</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn-primary" onClick={runSeo} disabled={running === "seo" || !seoSiteId}
          style={{ background: "#f59e0b", whiteSpace: "nowrap" }}>
          {running === "seo" ? "⏳" : "실행"}
        </button>
      </div>
    ),
    revenue: (
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <select value={revSiteId} onChange={e => setRevSiteId(e.target.value ? Number(e.target.value) : "")} style={{ flex: 1 }}>
          <option value="">사이트 선택...</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn-primary" onClick={runRevenue} disabled={running === "revenue" || !revSiteId}
          style={{ background: "#10b981", whiteSpace: "nowrap" }}>
          {running === "revenue" ? "⏳" : "실행"}
        </button>
      </div>
    ),
  };

  const lastLog = (type: string) => logs.find(l => l.agent_type === type);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>AI 에이전트 컨트롤</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Claude 기반 자동화 에이전트 · 실행 기록 {logs.length}건</p>
      </div>

      {/* Agent Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 28 }}>
        {AGENT_CARDS.map(agent => {
          const last = lastLog(agent.key);
          return (
            <div key={agent.key} className="card" style={{ padding: 20, borderTop: `3px solid ${agent.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{agent.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{agent.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{agent.desc}</div>
                </div>
              </div>

              {last && (
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>
                  마지막 실행: {new Date(last.created_at).toLocaleString("ko-KR")} ·{" "}
                  <span className={`badge badge-${last.status}`} style={{ fontSize: 10 }}>{last.status}</span>
                </div>
              )}

              {agentActions[agent.key]}

              {results[agent.key] && (
                <div style={{ marginTop: 10, fontSize: 13, color: results[agent.key].startsWith("✅") ? "#10b981" : "#ef4444" }}>
                  {results[agent.key]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Log Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b", fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
          실행 로그
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>로딩 중...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>아직 실행 기록이 없습니다</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1117" }}>
                {["에이전트", "입력", "결과", "상태", "시간"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 16 }}>
                      {log.agent_type === "keyword" ? "🔑" : log.agent_type === "content" ? "✍️" : log.agent_type === "seo" ? "📈" : "💰"}
                    </span>
                    <span style={{ marginLeft: 6, color: "#94a3b8" }}>{log.agent_type}</span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#e2e8f0", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.input_data}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#64748b", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.output_data?.slice(0, 60) || "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span className={`badge badge-${log.status}`}>{log.status}</span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#64748b", fontSize: 12 }}>
                    {new Date(log.created_at).toLocaleString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
