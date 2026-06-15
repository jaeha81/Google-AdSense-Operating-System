"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

const CATEGORIES = [
  { name: "패션/의류",       shopping: 3.0, coupang: 3.0, winner: "tie" },
  { name: "뷰티/화장품",    shopping: 3.0, coupang: 2.5, winner: "shopping" },
  { name: "가전/디지털",    shopping: 1.5, coupang: 2.0, winner: "coupang" },
  { name: "식품/건강",      shopping: 2.5, coupang: 2.0, winner: "shopping" },
  { name: "도서/문구",      shopping: 3.0, coupang: 3.0, winner: "tie" },
  { name: "생활/주방",      shopping: 2.0, coupang: 3.0, winner: "coupang" },
  { name: "스포츠/레저",   shopping: 2.5, coupang: 2.5, winner: "tie" },
  { name: "유아/완구",      shopping: 2.0, coupang: 2.5, winner: "coupang" },
  { name: "반려동물",       shopping: 3.0, coupang: 2.0, winner: "shopping" },
  { name: "자동차/공구",   shopping: 2.0, coupang: 1.5, winner: "shopping" },
];

const STRATEGY = [
  { condition: "네이버 블로그 주력", recommend: "쇼핑커넥트", reason: "네이버 검색→쇼핑 연동으로 시너지 극대화" },
  { condition: "생활용품·육아 콘텐츠", recommend: "쿠팡파트너스", reason: "로켓배송 전환율 2~3배 높음" },
  { condition: "가격비교 콘텐츠", recommend: "쇼핑커넥트", reason: "30일 쿠키로 구매 결정 대기 가능" },
  { condition: "핫딜·타임세일", recommend: "쿠팡파트너스", reason: "즉시구매 유도 → 24시간 쿠키 적합" },
  { condition: "고관여 제품(가전·가구)", recommend: "쇼핑커넥트", reason: "긴 쿠키로 장기 구매 결정 커버" },
  { condition: "콘텐츠 다채널 배포", recommend: "병행 운영", reason: "카테고리별 최고 수수료 플랫폼 분리 적용" },
];

export default function ShoppingPage() {
  const [summary, setSummary] = useState<{ total_shopping_krw: number; total_coupang_krw: number } | null>(null);

  useEffect(() => {
    api.revenue.summary().then(s => setSummary(s as typeof summary)).catch(() => {});
  }, []);

  const totalShopping = summary?.total_shopping_krw ?? 0;
  const totalCoupang = summary?.total_coupang_krw ?? 0;
  const total = totalShopping + totalCoupang;
  const shopPct = total > 0 ? Math.round((totalShopping / total) * 100) : 0;
  const coupangPct = total > 0 ? Math.round((totalCoupang / total) * 100) : 0;

  const barData = [
    { name: "쇼핑커넥트", value: totalShopping, color: "#f59e0b" },
    { name: "쿠팡파트너스", value: totalCoupang, color: "#ef4444" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>쇼핑 파트너 비교</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>쇼핑커넥트 vs 쿠팡파트너스 — 카테고리별 수수료 · 전략 가이드</p>
      </div>

      {/* Quick Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 0, marginBottom: 20 }}>
        {/* 쇼핑커넥트 */}
        <div className="card" style={{ padding: 24, borderRight: "none", borderRadius: "8px 0 0 8px" }}>
          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>쇼핑커넥트 (네이버)</div>
          <div className="g2">
            {[
              { label: "쿠키 기간", value: "30일", good: true },
              { label: "수수료", value: "1.5~3%", good: true },
              { label: "지급일", value: "익월 말", good: false },
              { label: "최소 지급", value: "없음", good: true },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.good ? "#f59e0b" : "#94a3b8" }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(245,158,11,0.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", marginBottom: 4 }}>핵심 강점</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
              · 네이버 검색 → 쇼핑 시너지<br/>
              · 30일 쿠키로 고관여 제품 유리<br/>
              · 뷰티·패션·반려동물 수수료 우세
            </div>
          </div>
        </div>

        {/* VS */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1a", border: "1px solid #1e293b" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#334155" }}>VS</span>
        </div>

        {/* 쿠팡파트너스 */}
        <div className="card" style={{ padding: 24, borderLeft: "none", borderRadius: "0 8px 8px 0" }}>
          <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>쿠팡파트너스</div>
          <div className="g2">
            {[
              { label: "쿠키 기간", value: "24시간", good: false },
              { label: "수수료", value: "1.5~3%", good: true },
              { label: "지급일", value: "매월 25일", good: true },
              { label: "최소 지급", value: "없음", good: true },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.good ? "#ef4444" : "#94a3b8" }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>핵심 강점</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
              · 로켓배송 전환율 2~3배 우세<br/>
              · 생활용품·유아 카테고리 강점<br/>
              · 빠른 정산 (매월 25일)
            </div>
          </div>
        </div>
      </div>

      {/* Category Commission Table + Bar Chart */}
      <div className="g-chart" style={{ marginBottom: 20 }}>
        {/* Table */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>카테고리별 수수료율 비교</div>
          </div>
          <div className="table-wrap"><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1117" }}>
                <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 500 }}>카테고리</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>쇼핑커넥트</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, color: "#ef4444", fontWeight: 600 }}>쿠팡파트너스</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, color: "#64748b", fontWeight: 500 }}>추천</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat, i) => (
                <tr key={cat.name} style={{ borderTop: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "10px 20px", color: "#e2e8f0", fontWeight: 500 }}>{cat.name}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <span style={{
                      color: cat.winner === "shopping" ? "#f59e0b" : "#64748b",
                      fontWeight: cat.winner === "shopping" ? 700 : 400,
                    }}>{cat.shopping}%</span>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <span style={{
                      color: cat.winner === "coupang" ? "#ef4444" : "#64748b",
                      fontWeight: cat.winner === "coupang" ? 700 : 400,
                    }}>{cat.coupang}%</span>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    {cat.winner === "shopping" && (
                      <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>쇼핑</span>
                    )}
                    {cat.winner === "coupang" && (
                      <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>쿠팡</span>
                    )}
                    {cat.winner === "tie" && (
                      <span style={{ color: "#475569", fontSize: 11 }}>동일</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>

        {/* My Performance + Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* My Revenue */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>내 수익 현황</div>
            {total === 0 ? (
              <div style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "20px 0" }}>
                수익 데이터 없음<br/>
                <span style={{ fontSize: 11, color: "#334155", marginTop: 4, display: "block" }}>수익 트래커에서 입력하세요</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `₩${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip
                      contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}
                      formatter={(v) => [`₩${Number(v).toLocaleString()}`]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>쇼핑커넥트</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>₩{totalShopping.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{shopPct}%</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>쿠팡파트너스</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>₩{totalCoupang.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{coupangPct}%</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cookie Info */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>쿠키 전략</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={{ color: "#f59e0b", fontWeight: 600, minWidth: 60 }}>30일</span>
                <span>가격비교·고관여 제품. 콘텐츠 후 며칠 내 구매하는 독자 커버</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#ef4444", fontWeight: 600, minWidth: 60 }}>24시간</span>
                <span>핫딜·즉시구매 콘텐츠. 클릭 당일 전환 유도 필수</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Table */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>상황별 전략 가이드</div>
        </div>
        <div className="table-wrap"><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#0d1117" }}>
              {["내 콘텐츠 유형", "추천 플랫폼", "이유"].map(h => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STRATEGY.map((s, i) => (
              <tr key={i} style={{ borderTop: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "11px 20px", color: "#e2e8f0", fontWeight: 500 }}>{s.condition}</td>
                <td style={{ padding: "11px 20px" }}>
                  <span style={{
                    background: s.recommend === "쇼핑커넥트"
                      ? "rgba(245,158,11,0.15)"
                      : s.recommend === "쿠팡파트너스"
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(139,92,246,0.15)",
                    color: s.recommend === "쇼핑커넥트"
                      ? "#f59e0b"
                      : s.recommend === "쿠팡파트너스"
                      ? "#ef4444"
                      : "#a78bfa",
                    borderRadius: 4, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                  }}>{s.recommend}</span>
                </td>
                <td style={{ padding: "11px 20px", color: "#64748b" }}>{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
