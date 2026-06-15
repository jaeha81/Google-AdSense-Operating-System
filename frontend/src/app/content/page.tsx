"use client";

import { useEffect, useState } from "react";
import { api, Content, Keyword, Site } from "@/lib/api";

const STATUS_COLS = [
  { key: "draft",     label: "초안",   color: "#94a3b8" },
  { key: "review",    label: "검토 중", color: "#f59e0b" },
  { key: "published", label: "발행됨",  color: "#10b981" },
];

export default function ContentPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);
  const [selectedKwId, setSelectedKwId] = useState<number | "">("");
  const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
  const [agentResult, setAgentResult] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const refresh = () =>
    Promise.all([api.content.list(), api.keywords.list(), api.sites.list()])
      .then(([c, k, s]) => { setContent(c); setKeywords(k); setSites(s); })
      .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const runContentAgent = async () => {
    if (!selectedKwId) return;
    setAgentRunning(true);
    setAgentResult("");
    try {
      const result = await api.agents.runContent(Number(selectedKwId), selectedSiteId ? Number(selectedSiteId) : undefined);
      setAgentResult(`✅ 콘텐츠 생성 완료: "${result.title}"`);
      await refresh();
    } catch {
      setAgentResult("❌ 콘텐츠 생성 실패");
    } finally {
      setAgentRunning(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await api.content.update(id, { status });
    await refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 콘텐츠를 삭제하시겠습니까?")) return;
    await api.content.delete(id);
    await refresh();
  };

  const byStatus = (status: string) => content.filter(c => c.status === status);

  const getKwName = (id: number | null) => keywords.find(k => k.id === id)?.keyword ?? "";
  const getSiteName = (id: number | null) => sites.find(s => s.id === id)?.name ?? "";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>콘텐츠 파이프라인</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>AI 블로그 포스트 생성 · {content.length}개 관리 중</p>
        </div>
      </div>

      {/* AI Agent Panel */}
      <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: "3px solid #8b5cf6" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>
          🤖 콘텐츠 생성 AI 에이전트
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>대상 키워드</div>
            <select value={selectedKwId} onChange={e => setSelectedKwId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">키워드 선택...</option>
              {keywords.map(k => <option key={k.id} value={k.id}>{k.keyword} (${k.cpc})</option>)}
            </select>
          </div>
          <div style={{ minWidth: 200 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>대상 사이트 (선택)</div>
            <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">사이트 선택...</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={runContentAgent} disabled={agentRunning || !selectedKwId}
            style={{ background: "#8b5cf6" }}>
            {agentRunning ? "⏳ 작성 중..." : "✍️ 블로그 포스트 생성"}
          </button>
        </div>
        {agentResult && (
          <div style={{ marginTop: 10, fontSize: 13, color: agentResult.startsWith("✅") ? "#10b981" : "#ef4444" }}>
            {agentResult}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 60 }}>로딩 중...</div>
      ) : (
        <div className="g3">
          {STATUS_COLS.map(col => (
            <div key={col.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{col.label}</span>
                <span style={{ fontSize: 12, color: "#64748b", background: "#1e293b", borderRadius: 12, padding: "1px 8px" }}>
                  {byStatus(col.key).length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {byStatus(col.key).length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#475569", fontSize: 13, border: "1px dashed #1e293b", borderRadius: 10 }}>
                    없음
                  </div>
                ) : (
                  byStatus(col.key).map(item => (
                    <div key={item.id} className="card" style={{ padding: 14, cursor: "pointer" }}
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 6, lineHeight: 1.4 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                        {getKwName(item.keyword_id) && <span>🔑 {getKwName(item.keyword_id)}</span>}
                        {getSiteName(item.site_id) && <span style={{ marginLeft: 8 }}>🏢 {getSiteName(item.site_id)}</span>}
                        <span style={{ marginLeft: 8 }}>{item.word_count.toLocaleString()}자</span>
                      </div>

                      {expanded === item.id && (
                        <div>
                          <div style={{ fontSize: 12, color: "#94a3b8", background: "#1e293b", padding: 10, borderRadius: 6, marginBottom: 10, maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                            {item.body.slice(0, 400)}...
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        {STATUS_COLS.filter(c => c.key !== item.status).map(c => (
                          <button
                            key={c.key}
                            onClick={e => { e.stopPropagation(); handleStatusChange(item.id, c.key); }}
                            style={{ fontSize: 11, padding: "3px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid #1e293b", borderRadius: 6, color: "#94a3b8", cursor: "pointer" }}
                          >
                            → {c.label}
                          </button>
                        ))}
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                          style={{ fontSize: 11, padding: "3px 8px", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", marginLeft: "auto" }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
