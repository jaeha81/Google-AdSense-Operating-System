"use client";

import { useEffect, useState } from "react";
import { api, Site } from "@/lib/api";

const PLATFORMS = ["tistory", "blogspot", "wordpress", "naver"];
const STATUSES = ["pending", "approved", "rejected"];
const STATUS_LABELS: Record<string, string> = { pending: "심사 중", approved: "승인", rejected: "거부" };
const PLATFORM_ICONS: Record<string, string> = {
  tistory: "📝", blogspot: "🌐", wordpress: "🔷", naver: "🟢",
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", platform: "tistory", status: "pending", monthly_revenue: 0 });
  const [saving, setSaving] = useState(false);

  const refresh = () => api.sites.list().then(setSites).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.sites.create(form);
      setShowForm(false);
      setForm({ name: "", url: "", platform: "tistory", status: "pending", monthly_revenue: 0 });
      await refresh();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 사이트를 삭제하시겠습니까?")) return;
    await api.sites.delete(id);
    await refresh();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await api.sites.update(id, { status });
    await refresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>사이트 포트폴리오</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>디지털 건물 관리 · {sites.length}개 운영 중</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + 사이트 추가
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>새 사이트 등록</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>사이트 이름</div>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="내 티스토리 블로그" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>URL</div>
              <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://myblog.tistory.com" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>플랫폼</div>
              <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>애드센스 상태</div>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving || !form.name || !form.url}>
              {saving ? "저장 중..." : "저장"}
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>취소</button>
          </div>
        </div>
      )}

      {/* Sites Grid */}
      {loading ? (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 60 }}>로딩 중...</div>
      ) : sites.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
          <div>아직 등록된 사이트가 없습니다.</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>위 버튼으로 첫 번째 디지털 건물을 추가하세요.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {sites.map((site) => (
            <div key={site.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{PLATFORM_ICONS[site.platform] ?? "🌐"}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{site.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{site.platform}</div>
                  </div>
                </div>
                <span className={`badge badge-${site.status}`}>{STATUS_LABELS[site.status] ?? site.status}</span>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {site.url}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>${site.monthly_revenue.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>월 수익</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6" }}>{site.content_count}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>콘텐츠</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={site.status}
                  onChange={e => handleStatusChange(site.id, e.target.value)}
                  style={{ flex: 1, fontSize: 12 }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <button onClick={() => handleDelete(site.id)} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
