"use client";

import { useEffect, useState } from "react";
import { api, Keyword } from "@/lib/api";

const GOLDEN_CATEGORIES = ["대출", "보험", "지원금", "청년지원", "실손보험", "자동차보험"];

function isGolden(k: Keyword) {
  return (
    k.intent_type === "action" &&
    k.search_volume >= 1000 && k.search_volume <= 30000 &&
    (k.age_group === "40plus" || GOLDEN_CATEGORIES.some(c => k.category.includes(c)))
  );
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);
  const [niche, setNiche] = useState("");
  const [agentResult, setAgentResult] = useState("");

  // Filter state
  const [filterIntent, setFilterIntent] = useState<"all" | "action" | "info">("all");
  const [filterAge, setFilterAge] = useState<"all" | "40plus">("all");
  const [filterGolden, setFilterGolden] = useState(false);
  const [filterComp, setFilterComp] = useState("all");
  const [svMin, setSvMin] = useState(0);
  const [svMax, setSvMax] = useState(100000);
  const [sortBy, setSortBy] = useState<"cpc" | "search_volume">("cpc");

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newKw, setNewKw] = useState({
    keyword: "", cpc: "", search_volume: "", competition: "medium",
    category: "", intent_type: "info", age_group: "all",
    quadrant_x: "0.5", quadrant_y: "0.5",
  });

  const refresh = () => api.keywords.list().then(setKeywords).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const runAgent = async () => {
    if (!niche.trim()) return;
    setAgentRunning(true); setAgentResult("");
    try {
      const res = await api.agents.runKeyword(niche);
      setAgentResult(`✅ ${res.saved}개 키워드 저장 완료`);
      await refresh();
    } catch { setAgentResult("❌ 에이전트 실행 실패"); }
    finally { setAgentRunning(false); }
  };

  const handleAdd = async () => {
    if (!newKw.keyword.trim()) return;
    await api.keywords.create({
      keyword: newKw.keyword,
      cpc: Number(newKw.cpc) || 0,
      search_volume: Number(newKw.search_volume) || 0,
      competition: newKw.competition,
      category: newKw.category,
      intent_type: newKw.intent_type,
      age_group: newKw.age_group,
      quadrant_x: Number(newKw.quadrant_x) || 0.5,
      quadrant_y: Number(newKw.quadrant_y) || 0.5,
    });
    setNewKw({ keyword: "", cpc: "", search_volume: "", competition: "medium", category: "", intent_type: "info", age_group: "all", quadrant_x: "0.5", quadrant_y: "0.5" });
    setShowAdd(false);
    await refresh();
  };

  const handleDelete = async (id: number) => {
    await api.keywords.delete(id);
    await refresh();
  };

  const filtered = keywords
    .filter(k => filterIntent === "all" || k.intent_type === filterIntent)
    .filter(k => filterAge === "all" || k.age_group === filterAge)
    .filter(k => filterComp === "all" || k.competition === filterComp)
    .filter(k => k.search_volume >= svMin && k.search_volume <= svMax)
    .filter(k => !filterGolden || isGolden(k))
    .sort((a, b) => sortBy === "cpc" ? b.cpc - a.cpc : b.search_volume - a.search_volume);

  const goldenCount = keywords.filter(isGolden).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>황금 키워드 분석</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            전체 {keywords.length}개 · 황금 키워드 {goldenCount}개
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(s => !s)}>
          + 키워드 추가
        </button>
      </div>

      {/* Golden keyword badge banner */}
      {goldenCount > 0 && (
        <div style={{
          padding: "10px 16px", marginBottom: 16, borderRadius: 8,
          background: "linear-gradient(90deg, rgba(245,158,11,0.1), rgba(16,185,129,0.1))",
          border: "1px solid rgba(245,158,11,0.3)", fontSize: 13,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          ⭐ <strong style={{ color: "#f59e0b" }}>황금 키워드 {goldenCount}개</strong>
          <span style={{ color: "#64748b" }}>— 행동요구형 + 월 1천~3만 검색 + 40대↑ 또는 고단가 카테고리</span>
        </div>
      )}

      {/* AI Agent */}
      <div className="card" style={{ padding: 18, marginBottom: 16, borderLeft: "3px solid #3b82f6" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 10 }}>🤖 AI 키워드 에이전트</div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <input value={niche} onChange={e => setNiche(e.target.value)}
              placeholder="예: 대출비교, 실손보험, 청년지원금, 자동차"
              onKeyDown={e => e.key === "Enter" && runAgent()} />
          </div>
          <button className="btn-primary" onClick={runAgent} disabled={agentRunning || !niche.trim()}>
            {agentRunning ? "⏳ 분석 중..." : "🔍 키워드 20개 생성"}
          </button>
        </div>
        {agentResult && (
          <div style={{ marginTop: 8, fontSize: 12, color: agentResult.startsWith("✅") ? "#10b981" : "#ef4444" }}>{agentResult}</div>
        )}
      </div>

      {/* Golden filter panel */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 12 }}>⭐ 황금 키워드 필터</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => setFilterGolden(g => !g)}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
              border: `1px solid ${filterGolden ? "#f59e0b" : "#1e293b"}`,
              background: filterGolden ? "rgba(245,158,11,0.15)" : "transparent",
              color: filterGolden ? "#f59e0b" : "#64748b" }}>
            ⭐ 황금만 보기
          </button>

          <div style={{ width: 1, height: 20, background: "#1e293b" }} />

          <span style={{ fontSize: 11, color: "#475569" }}>의도:</span>
          {(["all", "action", "info"] as const).map(v => (
            <button key={v} onClick={() => setFilterIntent(v)}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                border: `1px solid ${filterIntent === v ? "#3b82f6" : "#1e293b"}`,
                background: filterIntent === v ? "rgba(59,130,246,0.15)" : "transparent",
                color: filterIntent === v ? "#3b82f6" : "#64748b" }}>
              {v === "all" ? "전체" : v === "action" ? "✅ 행동형" : "ℹ️ 정보형"}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: "#1e293b" }} />

          <span style={{ fontSize: 11, color: "#475569" }}>연령:</span>
          {(["all", "40plus"] as const).map(v => (
            <button key={v} onClick={() => setFilterAge(v)}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                border: `1px solid ${filterAge === v ? "#8b5cf6" : "#1e293b"}`,
                background: filterAge === v ? "rgba(139,92,246,0.15)" : "transparent",
                color: filterAge === v ? "#8b5cf6" : "#64748b" }}>
              {v === "all" ? "전체" : "40대↑ 우선"}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: "#1e293b" }} />

          <span style={{ fontSize: 11, color: "#475569" }}>경쟁도:</span>
          {["all", "low", "medium", "high"].map(c => (
            <button key={c} onClick={() => setFilterComp(c)}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                border: `1px solid ${filterComp === c ? "#10b981" : "#1e293b"}`,
                background: filterComp === c ? "rgba(16,185,129,0.15)" : "transparent",
                color: filterComp === c ? "#10b981" : "#64748b" }}>
              {c === "all" ? "전체" : c === "low" ? "낮음" : c === "medium" ? "중간" : "높음"}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>새 키워드 추가</div>
          <div className="g3" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>키워드 *</div>
              <input value={newKw.keyword} onChange={e => setNewKw(n => ({ ...n, keyword: e.target.value }))} placeholder="예: 청년지원금 신청" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>CPC 단가 (원)</div>
              <input type="number" value={newKw.cpc} onChange={e => setNewKw(n => ({ ...n, cpc: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>월 검색량</div>
              <input type="number" value={newKw.search_volume} onChange={e => setNewKw(n => ({ ...n, search_volume: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>의도 유형</div>
              <select value={newKw.intent_type} onChange={e => setNewKw(n => ({ ...n, intent_type: e.target.value }))}>
                <option value="info">정보형</option>
                <option value="action">행동요구형</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>주요 연령대</div>
              <select value={newKw.age_group} onChange={e => setNewKw(n => ({ ...n, age_group: e.target.value }))}>
                <option value="all">전체</option>
                <option value="40plus">40대 이상</option>
                <option value="young">2030</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>카테고리</div>
              <input value={newKw.category} onChange={e => setNewKw(n => ({ ...n, category: e.target.value }))} placeholder="예: 보험" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>경쟁도</div>
              <select value={newKw.competition} onChange={e => setNewKw(n => ({ ...n, competition: e.target.value }))}>
                <option value="low">낮음</option>
                <option value="medium">중간</option>
                <option value="high">높음</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>SEO 잠재력 (0~1)</div>
              <input type="number" step="0.1" min="0" max="1" value={newKw.quadrant_x} onChange={e => setNewKw(n => ({ ...n, quadrant_x: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>수익화 잠재력 (0~1)</div>
              <input type="number" step="0.1" min="0" max="1" value={newKw.quadrant_y} onChange={e => setNewKw(n => ({ ...n, quadrant_y: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={handleAdd} disabled={!newKw.keyword.trim()}>저장</button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>취소</button>
          </div>
        </div>
      )}

      {/* Sort */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>정렬:</span>
        {(["cpc", "search_volume"] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={sortBy === s ? "btn-primary" : "btn-ghost"}
            style={{ padding: "5px 12px", fontSize: 12 }}>
            {s === "cpc" ? "CPC 높은순" : "검색량 높은순"}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "#475569", marginLeft: "auto" }}>
          {filtered.length}개 표시 / 전체 {keywords.length}개
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 60 }}>로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center", color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          키워드가 없습니다. AI 에이전트로 발굴하거나 직접 추가하세요.
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1117", borderBottom: "1px solid #1e293b" }}>
                {["", "키워드", "CPC (원)", "월 검색량", "경쟁도", "의도유형", "연령대", "카테고리", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((kw, i) => {
                const golden = isGolden(kw);
                return (
                  <tr key={kw.id} style={{ borderBottom: "1px solid #0d1117", background: golden ? "rgba(245,158,11,0.04)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "10px 14px", width: 24 }}>
                      {golden && <span title="황금 키워드">⭐</span>}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 500 }}>{kw.keyword}</td>
                    <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>
                      {kw.cpc > 0 ? `${(kw.cpc * 1350).toLocaleString()}원` : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                      {kw.search_volume.toLocaleString()}
                      {kw.search_volume >= 1000 && kw.search_volume <= 30000 && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: "#10b981" }}>황금구간</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span className={`badge badge-${kw.competition}`}>
                        {kw.competition === "low" ? "낮음" : kw.competition === "medium" ? "중간" : "높음"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, color: kw.intent_type === "action" ? "#10b981" : "#64748b" }}>
                        {kw.intent_type === "action" ? "✅ 행동형" : "ℹ️ 정보형"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 11 }}>
                      <span style={{ color: kw.age_group === "40plus" ? "#8b5cf6" : "#64748b" }}>
                        {kw.age_group === "40plus" ? "40대↑" : kw.age_group === "young" ? "2030" : "전체"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>{kw.category}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => handleDelete(kw.id)}
                        style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}>
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
