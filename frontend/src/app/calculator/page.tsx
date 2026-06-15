"use client";

import { useState } from "react";
import { api, CalcResult } from "@/lib/api";

const CPC_PRESETS = [
  { label: "저단가 (일반 정보형)", value: 200, color: "#64748b" },
  { label: "중단가 (지원금·생활)", value: 800, color: "#3b82f6" },
  { label: "고단가 (보험·대출)", value: 3000, color: "#f59e0b" },
  { label: "행동요구형 (최고단가)", value: 8000, color: "#10b981" },
];

export default function CalculatorPage() {
  const [visitors, setVisitors] = useState(1000);
  const [ctr, setCtr] = useState(3);
  const [cpcKrw, setCpcKrw] = useState(500);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calc = async () => {
    setLoading(true);
    try {
      const res = await api.calculator.estimate(visitors, ctr, cpcKrw);
      setResult(res);
    } catch {
      // fallback: local calculation
      const daily_clicks = visitors * (ctr / 100);
      const daily_revenue_krw = daily_clicks * cpcKrw;
      setResult({
        daily_clicks: Math.round(daily_clicks * 10) / 10,
        daily_revenue_krw: Math.round(daily_revenue_krw),
        monthly_revenue_krw: Math.round(daily_revenue_krw * 30),
        annual_revenue_krw: Math.round(daily_revenue_krw * 365),
        action_monthly_krw: Math.round(daily_clicks * 8000 * 30),
        upside_multiplier: cpcKrw > 0 ? Math.round(8000 / cpcKrw * 10) / 10 : 0,
        cpc_presets: { low: 200, mid: 800, high: 3000, action: 8000 },
      });
    } finally {
      setLoading(false);
    }
  };

  // realtime local calc for immediate feedback
  const dailyClicks = Math.round(visitors * (ctr / 100) * 10) / 10;
  const dailyRev = Math.round(dailyClicks * cpcKrw);
  const monthlyRev = dailyRev * 30;
  const actionMonthly = Math.round(dailyClicks * 8000 * 30);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>수익 계산기</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>CPC × CTR × 방문자 = 예상 수익 시뮬레이터</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Inputs */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 20 }}>입력값 설정</div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>일 방문자 수</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>{visitors.toLocaleString()}명</span>
            </div>
            <input type="range" min={100} max={100000} step={100} value={visitors}
              onChange={e => setVisitors(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#3b82f6" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#475569", marginTop: 4 }}>
              <span>100명</span><span>10만명</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>평균 CTR (클릭률)</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#8b5cf6" }}>{ctr}%</span>
            </div>
            <input type="range" min={0.5} max={15} step={0.5} value={ctr}
              onChange={e => setCtr(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#8b5cf6" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#475569", marginTop: 4 }}>
              <span>0.5%</span><span>15%</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>평균 CPC 단가</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{cpcKrw.toLocaleString()}원</span>
            </div>
            <input type="range" min={100} max={10000} step={100} value={cpcKrw}
              onChange={e => setCpcKrw(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f59e0b" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#475569", marginTop: 4 }}>
              <span>100원</span><span>10,000원</span>
            </div>
          </div>

          {/* CPC presets */}
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>빠른 선택</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CPC_PRESETS.map(p => (
              <button key={p.value} onClick={() => setCpcKrw(p.value)}
                style={{
                  padding: "8px 10px", borderRadius: 8, border: `1px solid ${cpcKrw === p.value ? p.color : "#1e293b"}`,
                  background: cpcKrw === p.value ? `${p.color}18` : "transparent",
                  color: cpcKrw === p.value ? p.color : "#64748b",
                  fontSize: 11, cursor: "pointer", textAlign: "left",
                }}>
                <div style={{ fontWeight: 600 }}>{p.value.toLocaleString()}원</div>
                <div style={{ fontSize: 10, marginTop: 2 }}>{p.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          {/* Realtime preview */}
          <div className="card" style={{ padding: 24, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>실시간 예상 수익</div>
            {[
              { label: "일 예상 클릭", value: `${dailyClicks}회`, color: "#64748b" },
              { label: "일 예상 수익", value: `${dailyRev.toLocaleString()}원`, color: "#3b82f6" },
              { label: "월 예상 수익", value: `${monthlyRev.toLocaleString()}원`, color: "#10b981" },
              { label: "연 예상 수익", value: `${(dailyRev * 365).toLocaleString()}원`, color: "#f59e0b" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{item.label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Action keyword upside */}
          <div style={{
            padding: 20, borderRadius: 12, marginBottom: 14,
            background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))",
            border: "1px solid rgba(16,185,129,0.3)",
          }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>💡 행동요구형 키워드로 전환 시</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
              {actionMonthly.toLocaleString()}원/월
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              현재 대비 최대 <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                {cpcKrw > 0 ? Math.round(8000 / cpcKrw) : 0}배
              </span> 수익 상승 가능
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>
              대출·보험·지원금 키워드 기준 CPC 8,000원
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#334155", background: "#0d1117", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ marginBottom: 4, color: "#475569" }}>📌 수익 공식</div>
            일 수익 = 방문자({visitors.toLocaleString()}) × CTR({ctr}%) × CPC({cpcKrw.toLocaleString()}원)<br/>
            = 클릭 {dailyClicks}회 × {cpcKrw.toLocaleString()}원 = {dailyRev.toLocaleString()}원/일
          </div>
        </div>
      </div>
    </div>
  );
}
