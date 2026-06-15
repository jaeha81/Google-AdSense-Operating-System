"use client";

import { useEffect, useState } from "react";
import { api, ChecklistItem } from "@/lib/api";

const WEEK_LABELS: Record<number, string> = {
  1: "WEEK 1 (1~7일) — 계정·플랫폼 세팅",
  2: "WEEK 2 (8~14일) — 콘텐츠·SEO 확장",
  3: "WEEK 3~4 (15~30일) — 수익 확인·다음 단계",
};

const CAT_COLORS: Record<string, string> = {
  계정: "#3b82f6", 콘텐츠: "#8b5cf6", 수익화: "#10b981",
  키워드: "#f59e0b", SEO: "#ef4444",
};

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.checklist.list().then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const toggle = async (id: number) => {
    const updated = await api.checklist.toggle(id);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
  };

  const weeks = [1, 2, 3];
  const completed = items.filter(i => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>30일 실행 체크리스트</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>초보자 실행 가이드 · 수익화 첫 단계</p>
      </div>

      {/* Progress */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>전체 진행도</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: pct === 100 ? "#10b981" : "#3b82f6" }}>
            {completed}/{total} ({pct}%)
          </span>
        </div>
        <div style={{ height: 8, background: "#1e293b", borderRadius: 4 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#10b981" : "#3b82f6", borderRadius: 4, transition: "width 0.4s" }} />
        </div>
        {pct === 100 && (
          <div style={{ marginTop: 10, fontSize: 13, color: "#10b981" }}>
            🎉 30일 체크리스트 완료! 다음 단계로 이동하세요.
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 40 }}>로딩 중...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {weeks.map(week => {
            const weekItems = items.filter(i => i.week === week);
            const wCompleted = weekItems.filter(i => i.completed).length;
            return (
              <div key={week} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
                    {WEEK_LABELS[week]}
                  </div>
                  <span style={{ fontSize: 12, color: wCompleted === weekItems.length ? "#10b981" : "#64748b" }}>
                    {wCompleted}/{weekItems.length}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {weekItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", borderRadius: 8,
                        background: item.completed ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${item.completed ? "rgba(16,185,129,0.2)" : "#1e293b"}`,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${item.completed ? "#10b981" : "#334155"}`,
                        background: item.completed ? "#10b981" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {item.completed ? <span style={{ fontSize: 12, color: "white" }}>✓</span> : null}
                      </div>
                      <span style={{
                        fontSize: 13, color: item.completed ? "#64748b" : "#e2e8f0",
                        textDecoration: item.completed ? "line-through" : "none",
                        flex: 1,
                      }}>
                        {item.task}
                      </span>
                      {item.category && (
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 10,
                          background: `${CAT_COLORS[item.category] ?? "#475569"}22`,
                          color: CAT_COLORS[item.category] ?? "#475569",
                        }}>
                          {item.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
