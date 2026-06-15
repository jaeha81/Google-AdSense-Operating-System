"use client";

import { useEffect, useState } from "react";
import { api, Keyword } from "@/lib/api";

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);
  const [niche, setNiche] = useState("");
  const [agentResult, setAgentResult] = useState<string>("");
  const [sortBy, setSortBy] = useState<"cpc" | "search_volume">("cpc");
  const [filterComp, setFilterComp] = useState<string>("all");

  const refresh = () => api.keywords.list().then(setKeywords).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const runAgent = async () => {
    if (!niche.trim()) return;
    setAgentRunning(true);
    setAgentResult("");
    try {
      const res = await api.agents.runKeyword(niche);
      setAgentResult(`✅ ${res.saved}개 키워드 저장 완료`);
      await refresh();
    } catch (e) {
      setAgentResult("❌ 에이전트 실행 실패");
    } finally {
      setAgentRunning(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.keywords.delete(id);
    await refresh();
  };

  const sorted = [...keywords]
    .filter(k => filterComp === "all" || k.competition === filterComp)
    .sort((a, b) => (sortBy === "cpc" ? b.cpc - a.cpc : b.search_volume - a.search_volume));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>키워드 리서치</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>고수익 키워드 발굴 · {keywords.length}개 보유</p>
        </div>
      </div>

      {/* AI Agent Panel */}
      <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: "3px solid #3b82f6" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>
          🤖 키워드 AI 에이전트
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>수익화 니치 주제</div>
            <input
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="예: 다이어트, 재테크, 영어공부, 자동차"
              onKeyDown={e => e.key === "Enter" && runAgent()}
            />
          </div>
          <button className="btn-primary" onClick={runAgent} disabled={agentRunning || !niche.trim()}>
            {agentRunning ? "⏳ 분석 중..." : "🔍 키워드 20개 생성"}
          </button>
        </div>
        {agentResult && (
          <div style={{ marginTop: 10, fontSize: 13, color: agentResult.startsWith("✅") ? "#10b981" : "#ef4444" }}>
            {agentResult}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>정렬:</div>
        <button
          className={sortBy === "cpc" ? "btn-primary" : "btn-ghost"}
          style={{ padding: "6px 14px", fontSize: 13 }}
          onClick={() => setSortBy("cpc")}
        >CPC 높은순</button>
        <button
          className={sortBy === "search_volume" ? "btn-primary" : "btn-ghost"}
          style={{ padding: "6px 14px", fontSize: 13 }}
          onClick={() => setSortBy("search_volume")}
        >검색량 높은순</button>
        <div style={{ marginLeft: 8, fontSize: 13, color: "#64748b" }}>경쟁도:</div>
        {["all", "low", "medium", "high"].map(c => (
          <button
            key={c}
            className={filterComp === c ? "btn-primary" : "btn-ghost"}
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => setFilterComp(c)}
          >
            {c === "all" ? "전체" : c === "low" ? "낮음" : c === "medium" ? "중간" : "높음"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 60 }}>로딩 중...</div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
          <div>아직 키워드가 없습니다.</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>위 AI 에이전트로 키워드를 발굴하세요.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#0d1117", borderBottom: "1px solid #1e293b" }}>
                {["키워드", "예상 CPC", "월 검색량", "경쟁도", "카테고리", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((kw, i) => (
                <tr key={kw.id} style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "12px 16px", color: "#e2e8f0", fontWeight: 500 }}>{kw.keyword}</td>
                  <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700 }}>${kw.cpc.toFixed(2)}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{kw.search_volume.toLocaleString()}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge badge-${kw.competition}`}>
                      {kw.competition === "low" ? "낮음" : kw.competition === "medium" ? "중간" : "높음"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{kw.category}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => handleDelete(kw.id)} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}>
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
