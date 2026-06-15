"use client";

import { useEffect, useState } from "react";
import { api, RoadmapStep } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  not_started: "#475569",
  in_progress: "#3b82f6",
  completed: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "미시작",
  in_progress: "진행중",
  completed: "완료",
};

const STEP_DETAILS: Record<number, string[]> = {
  1: ["네이버 블로그 3개 개설", "애드포스트 신청 및 승인", "키워드 훈련 (황금 키워드 20개)", "쇼핑커넥트 운영 시작", "일 방문자 200명 목표"],
  2: ["블로그스팟 5개 개설", "애드센스 신청 및 승인 (달러 파이프라인)", "수익형 글 월 30개 목표", "네이버 백링크 전략 실행", "월 수익 50만원 목표"],
  3: ["AI 글 자동화 (80% AI 보조)", "OSMU 전환 (유튜브·인스타)", "전자책·강의 출시", "다중 계정 포트폴리오 구성", "월 수익 300만원 목표"],
};

export default function RoadmapPage() {
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ progress: 0, status: "not_started" });

  const load = () => api.roadmap.list().then(setSteps).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const startEdit = (step: RoadmapStep) => {
    setEditing(step.id);
    setDraft({ progress: step.progress, status: step.status });
  };

  const save = async (id: number) => {
    await api.roadmap.update(id, draft);
    setEditing(null);
    await load();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>수익 로드맵 단계 트래커</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>현재 위치 파악 및 다음 행동 유도 · 3단계 수익화 로드맵</p>
      </div>

      {loading ? (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 40 }}>로딩 중...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map((step, idx) => {
            const color = STATUS_COLORS[step.status];
            const isEditing = editing === step.id;
            const details = STEP_DETAILS[step.step_number] ?? [];

            return (
              <div key={step.id} className="card" style={{ padding: 24, borderLeft: `3px solid ${color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>STEP {step.step_number} of 3</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{step.description}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, padding: "4px 12px", borderRadius: 20,
                      background: `${color}22`, color,
                    }}>
                      {STATUS_LABELS[step.status]}
                    </span>
                    <button onClick={() => startEdit(step)}
                      style={{ fontSize: 11, padding: "4px 12px", borderRadius: 8, border: "1px solid #1e293b", background: "transparent", color: "#64748b", cursor: "pointer" }}>
                      수정
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>진행도</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>
                      {isEditing ? draft.progress : step.progress}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: "#1e293b", borderRadius: 4 }}>
                    <div style={{
                      width: `${isEditing ? draft.progress : step.progress}%`,
                      height: "100%", background: color, borderRadius: 4, transition: "width 0.3s",
                    }} />
                  </div>
                </div>

                {/* Edit controls */}
                {isEditing && (
                  <div style={{ padding: 14, background: "#0d1117", borderRadius: 8, marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8", width: 60 }}>진행도</span>
                      <input type="range" min={0} max={100} value={draft.progress}
                        onChange={e => setDraft(d => ({ ...d, progress: Number(e.target.value) }))}
                        style={{ flex: 1, accentColor: color }} />
                      <span style={{ fontSize: 13, color, width: 40 }}>{draft.progress}%</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8", width: 60 }}>상태</span>
                      {["not_started", "in_progress", "completed"].map(s => (
                        <button key={s} onClick={() => setDraft(d => ({ ...d, status: s }))}
                          style={{
                            fontSize: 11, padding: "4px 10px", borderRadius: 8,
                            border: `1px solid ${draft.status === s ? STATUS_COLORS[s] : "#1e293b"}`,
                            background: draft.status === s ? `${STATUS_COLORS[s]}22` : "transparent",
                            color: draft.status === s ? STATUS_COLORS[s] : "#64748b", cursor: "pointer",
                          }}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => save(step.id)}
                        style={{ fontSize: 12, padding: "6px 16px", borderRadius: 8, background: "#3b82f6", color: "white", border: "none", cursor: "pointer" }}>
                        저장
                      </button>
                      <button onClick={() => setEditing(null)}
                        style={{ fontSize: 12, padding: "6px 16px", borderRadius: 8, background: "transparent", color: "#64748b", border: "1px solid #1e293b", cursor: "pointer" }}>
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub tasks */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {details.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
                      <span style={{ color: step.status === "completed" ? "#10b981" : "#334155" }}>
                        {step.status === "completed" ? "✓" : "○"}
                      </span>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Arrow between steps */}
                {idx < steps.length - 1 && (
                  <div style={{ textAlign: "center", fontSize: 20, color: "#334155", marginTop: 4 }}>↓</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
