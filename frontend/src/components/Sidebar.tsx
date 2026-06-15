"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const sections = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "대시보드", icon: "📊" },
    ],
  },
  {
    label: "수익화 핵심",
    items: [
      { href: "/keywords", label: "황금 키워드", icon: "🎯" },
      { href: "/quadrant", label: "4사분면 전략", icon: "📐" },
      { href: "/calculator", label: "수익 계산기", icon: "🧮" },
      { href: "/shopping", label: "쇼핑 파트너 비교", icon: "🛒" },
    ],
  },
  {
    label: "수익 관리",
    items: [
      { href: "/revenue", label: "플랫폼별 수익", icon: "💰" },
      { href: "/traffic", label: "트래픽 분석", icon: "📈" },
    ],
  },
  {
    label: "콘텐츠",
    items: [
      { href: "/content", label: "콘텐츠 파이프라인", icon: "✍️" },
      { href: "/osmu", label: "OSMU 확산 현황", icon: "🔁" },
      { href: "/agents", label: "AI 에이전트", icon: "🤖" },
      { href: "/productivity", label: "AI 생산성 지표", icon: "⚡" },
    ],
  },
  {
    label: "체계화",
    items: [
      { href: "/checklist", label: "30일 체크리스트", icon: "✅" },
      { href: "/roadmap", label: "수익 로드맵", icon: "🗺️" },
    ],
  },
  {
    label: "관리",
    items: [
      { href: "/sites", label: "사이트 포트폴리오", icon: "🏢" },
      { href: "/accounts", label: "계정 모니터링", icon: "🛡️" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button className="mobile-menu-btn" onClick={() => setOpen(true)} aria-label="메뉴 열기">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
          <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
          <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar panel */}
      <aside className={`sidebar-wrap${open ? " sidebar-open" : ""}`}>
        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={() => setOpen(false)} aria-label="메뉴 닫기">✕</button>

        {/* Logo */}
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6", letterSpacing: "-0.5px" }}>
            AdSense OS
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>AI 수익화 운영 시스템</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
          {sections.map((section, si) => (
            <div key={si} style={{ marginBottom: 4 }}>
              {section.label && (
                <div style={{
                  fontSize: 10, fontWeight: 600, color: "#334155",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  padding: "12px 10px 4px",
                }}>
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "8px 10px", borderRadius: 7, marginBottom: 1,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      color: active ? "#e2e8f0" : "#64748b",
                      background: active ? "rgba(59,130,246,0.12)" : "transparent",
                      borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 15 }}>{item.icon}</span>
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1e293b", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#334155" }}>v2.2 · 구조를 아는 자가 승리한다</div>
        </div>
      </aside>
    </>
  );
}
