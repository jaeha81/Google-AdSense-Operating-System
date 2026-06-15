"use client";

import { useEffect, useState } from "react";
import { api, Site } from "@/lib/api";

const PLATFORM_LABELS: Record<string, string> = {
  naver: "네이버 블로그",
  blogspot: "블로그스팟",
  wordpress: "워드프레스",
  tistory: "티스토리",
};

const ACCOUNT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  search: { label: "검색형", color: "#3b82f6" },
  homepage: { label: "홈판형", color: "#8b5cf6" },
  shopping: { label: "판매형", color: "#10b981" },
  mixed: { label: "혼합", color: "#64748b" },
};

function riskColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function riskLabel(score: number) {
  if (score >= 80) return "정상";
  if (score >= 60) return "주의";
  return "위험";
}

export default function AccountsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<Site>>({});

  const load = () => api.sites.list().then(setSites).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const startEdit = (site: Site) => {
    setEditId(site.id);
    setDraft({ risk_score: site.risk_score, account_type: site.account_type, daily_visitors: site.daily_visitors, ctr: site.ctr });
  };

  const save = async () => {
    if (!editId) return;
    await api.sites.update(editId, draft);
    setEditId(null);
    await load();
  };

  const totalRisk = sites.length > 0 ? Math.round(sites.reduce((a, s) => a + s.risk_score, 0) / sites.length) : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>계정 리스크 모니터링</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>제재는 당연히 온다 — 항상 분산·모니터링·대비</p>
      </div>

      {/* Overall risk score */}
      {sites.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: `3px solid ${riskColor(totalRisk)}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>포트폴리오 리스크 분산 점수</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: riskColor(totalRisk) }}>{totalRisk}점 / 100점</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: riskColor(totalRisk), fontWeight: 600 }}>{riskLabel(totalRisk)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>관리 계정 {sites.length}개</div>
            </div>
          </div>
          <div style={{ height: 8, background: "#1e293b", borderRadius: 4, marginTop: 12 }}>
            <div style={{ width: `${totalRisk}%`, height: "100%", background: riskColor(totalRisk), borderRadius: 4 }} />
          </div>
        </div>
      )}

      {/* Risk guide */}
      <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>
        ⚠️ <strong style={{ color: "#ef4444" }}>리스크 관리 원칙:</strong> 외부 링크 밀도 낮추기 · 카테고리 분산 · 발행 속도 조절 · 중복 콘텐츠 금지
      </div>

      {loading ? (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 40 }}>로딩 중...</div>
      ) : sites.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center", color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
          사이트가 없습니다 — 사이트 포트폴리오 탭에서 추가하세요
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sites.map(site => {
            const isEditing = editId === site.id;
            const rc = riskColor(site.risk_score);
            const atInfo = ACCOUNT_TYPE_LABELS[site.account_type] ?? { label: site.account_type, color: "#64748b" };
            return (
              <div key={site.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: rc, display: "inline-block" }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{site.name}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${atInfo.color}22`, color: atInfo.color }}>{atInfo.label}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#1e293b", color: "#64748b" }}>
                        {PLATFORM_LABELS[site.platform] ?? site.platform}
                      </span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: site.status === "approved" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: site.status === "approved" ? "#10b981" : "#f59e0b" }}>
                        {site.status === "approved" ? "승인" : site.status === "pending" ? "신청중" : "미승인"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{site.url}</div>

                    <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                      {[
                        { label: "일 방문자", value: `${site.daily_visitors.toLocaleString()}명` },
                        { label: "CTR", value: `${site.ctr}%` },
                        { label: "리스크 점수", value: `${site.risk_score}점`, color: rc },
                      ].map(m => (
                        <div key={m.label}>
                          <div style={{ fontSize: 10, color: "#475569" }}>{m.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: m.color ?? "#94a3b8" }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: rc }}>{site.risk_score}</div>
                    <div style={{ fontSize: 10, color: rc }}>{riskLabel(site.risk_score)}</div>
                    <button onClick={() => startEdit(site)}
                      style={{ fontSize: 11, padding: "4px 12px", borderRadius: 8, border: "1px solid #1e293b", background: "transparent", color: "#64748b", cursor: "pointer", marginTop: 4 }}>
                      업데이트
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div style={{ marginTop: 16, padding: 14, background: "#0d1117", borderRadius: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>리스크 점수 (0~100)</div>
                        <input type="range" min={0} max={100} value={draft.risk_score ?? 100}
                          onChange={e => setDraft(d => ({ ...d, risk_score: Number(e.target.value) }))}
                          style={{ width: "100%", accentColor: riskColor(draft.risk_score ?? 100) }} />
                        <div style={{ fontSize: 12, color: riskColor(draft.risk_score ?? 100), marginTop: 2 }}>
                          {draft.risk_score ?? 100}점 — {riskLabel(draft.risk_score ?? 100)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>계정 유형</div>
                        <select value={draft.account_type} onChange={e => setDraft(d => ({ ...d, account_type: e.target.value }))}>
                          <option value="search">검색형</option>
                          <option value="homepage">홈판형</option>
                          <option value="shopping">판매형</option>
                          <option value="mixed">혼합</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={save}
                        style={{ fontSize: 12, padding: "6px 16px", borderRadius: 8, background: "#3b82f6", color: "white", border: "none", cursor: "pointer" }}>
                        저장
                      </button>
                      <button onClick={() => setEditId(null)}
                        style={{ fontSize: 12, padding: "6px 16px", borderRadius: 8, background: "transparent", color: "#64748b", border: "1px solid #1e293b", cursor: "pointer" }}>
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
