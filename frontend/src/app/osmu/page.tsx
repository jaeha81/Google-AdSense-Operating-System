"use client";

import { useEffect, useState } from "react";
import { api, OsmuItem, OsmuSummary } from "@/lib/api";

const PLATFORMS: { key: keyof OsmuItem; label: string; color: string }[] = [
  { key: "naver_blog",     label: "네이버 블로그", color: "#03c75a" },
  { key: "tistory",        label: "티스토리",      color: "#f97316" },
  { key: "youtube_shorts", label: "유튜브 쇼츠",   color: "#ef4444" },
  { key: "instagram",      label: "인스타그램",    color: "#a855f7" },
  { key: "kakao",          label: "카카오",        color: "#f59e0b" },
  { key: "threads",        label: "스레드",        color: "#64748b" },
];

const emptyForm = () => ({ title: "", source: "blog", notes: "" });

export default function OsmuPage() {
  const [items, setItems]     = useState<OsmuItem[]>([]);
  const [summary, setSummary] = useState<OsmuSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(emptyForm());
  const [saving, setSaving]   = useState(false);

  const refresh = () =>
    Promise.all([api.osmu.list(), api.osmu.summary()])
      .then(([i, s]) => { setItems(i); setSummary(s); })
      .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.osmu.create({ title: form.title, source: form.source, notes: form.notes });
      setForm(emptyForm());
      await refresh();
    } finally { setSaving(false); }
  };

  const togglePlatform = async (item: OsmuItem, key: keyof OsmuItem) => {
    const cur = item[key] as number;
    await api.osmu.update(item.id, { [key]: cur === 1 ? 0 : 1 } as Partial<OsmuItem>);
    await refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await api.osmu.delete(id);
    await refresh();
  };

  const totalDist    = summary?.total_distributions ?? 0;
  const avgPlatforms = summary?.avg_platforms_per_item ?? 0;
  const totalItems   = summary?.total_items ?? 0;
  const maxPossible  = totalItems * PLATFORMS.length;
  const coveragePct  = maxPossible > 0 ? Math.round((totalDist / maxPossible) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>OSMU 확산 현황</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
          One Source Multi Use — 콘텐츠 × 플랫폼 배포 매트릭스
        </p>
      </div>

      {/* Summary Cards */}
      <div className="g4" style={{ marginBottom: 20 }}>
        {[
          { label: "원본 콘텐츠",        value: `${totalItems}건`,           color: "#3b82f6" },
          { label: "총 배포 건수",        value: `${totalDist}건`,            color: "#10b981" },
          { label: "평균 배포 플랫폼",   value: `${avgPlatforms}개/콘텐츠`,  color: "#f59e0b" },
          { label: "플랫폼 커버리지",    value: `${coveragePct}%`,           color: coveragePct >= 60 ? "#10b981" : "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{loading ? "—" : c.value}</div>
          </div>
        ))}
      </div>

      {/* Platform Coverage Bar */}
      {totalItems > 0 && summary && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>플랫폼별 배포 현황</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PLATFORMS.map(p => {
              const count = summary.platform_counts[p.key] ?? 0;
              const pct   = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
              return (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 100, fontSize: 12, color: "#94a3b8", textAlign: "right", flexShrink: 0 }}>{p.label}</div>
                  <div style={{ flex: 1, height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: p.color, borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ width: 60, fontSize: 12, color: "#64748b" }}>{count}/{totalItems} ({pct}%)</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Form */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>콘텐츠 추가</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>콘텐츠 제목</div>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="예: 40대 재테크 키워드 분석..."
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>원본 유형</div>
            <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              <option value="blog">블로그 글</option>
              <option value="video">영상</option>
              <option value="short">쇼츠</option>
              <option value="newsletter">뉴스레터</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>메모</div>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="선택..." />
          </div>
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={saving || !form.title.trim()}
            style={{ whiteSpace: "nowrap" }}
          >
            {saving ? "추가중..." : "＋ 추가"}
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      {!loading && items.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔁</div>
          <div style={{ fontSize: 14, color: "#64748b" }}>원본 콘텐츠를 추가하면 배포 매트릭스가 생성됩니다</div>
        </div>
      )}

      {items.length > 0 && (
        <div className="card" style={{ overflow: "auto", padding: 0 }}>
          <div className="table-wrap"><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1117", position: "sticky", top: 0 }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 500, minWidth: 200 }}>콘텐츠 제목</th>
                <th style={{ padding: "12px 10px", textAlign: "center", fontSize: 11, color: "#64748b", fontWeight: 500 }}>유형</th>
                {PLATFORMS.map(p => (
                  <th key={p.key} style={{ padding: "12px 10px", textAlign: "center", fontSize: 11, color: p.color, fontWeight: 600, minWidth: 80 }}>
                    {p.label}
                  </th>
                ))}
                <th style={{ padding: "12px 10px", textAlign: "center", fontSize: 11, color: "#64748b", fontWeight: 500 }}>배포수</th>
                <th style={{ padding: "12px 10px" }} />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const distCount = PLATFORMS.filter(p => item[p.key] === 1).length;
                return (
                  <tr key={item.id} style={{ borderTop: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ color: "#e2e8f0", fontWeight: 500 }}>{item.title}</div>
                      {item.notes && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{item.notes}</div>}
                    </td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <span style={{ background: "#1e293b", color: "#64748b", borderRadius: 4, padding: "2px 7px", fontSize: 11 }}>
                        {item.source}
                      </span>
                    </td>
                    {PLATFORMS.map(p => {
                      const done = item[p.key] === 1;
                      return (
                        <td key={p.key} style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            onClick={() => togglePlatform(item, p.key)}
                            style={{
                              width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer",
                              background: done ? p.color + "25" : "#1e293b",
                              color: done ? p.color : "#334155",
                              fontSize: 14, fontWeight: 700,
                              transition: "all 0.15s",
                            }}
                            title={done ? `${p.label} 배포 완료 (클릭하여 해제)` : `${p.label} 배포 안됨 (클릭하여 완료 표시)`}
                          >
                            {done ? "✓" : "·"}
                          </button>
                        </td>
                      );
                    })}
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <span style={{
                        fontWeight: 700,
                        color: distCount >= 4 ? "#10b981" : distCount >= 2 ? "#f59e0b" : "#64748b",
                        fontSize: 14,
                      }}>
                        {distCount}/{PLATFORMS.length}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}
