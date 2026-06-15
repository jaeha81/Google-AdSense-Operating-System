"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/",         label: "대시보드",       icon: "📊" },
  { href: "/sites",    label: "사이트 포트폴리오", icon: "🏢" },
  { href: "/keywords", label: "키워드 리서치",    icon: "🔑" },
  { href: "/content",  label: "콘텐츠 파이프라인", icon: "✍️" },
  { href: "/revenue",  label: "수익 트래커",      icon: "💰" },
  { href: "/agents",   label: "AI 에이전트",      icon: "🤖" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#0d1117",
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6", letterSpacing: "-0.5px" }}>
          AdSense OS
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>AI 수익화 운영 시스템</div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginBottom: 2,
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#e2e8f0" : "#64748b",
                  background: active ? "rgba(59,130,246,0.12)" : "transparent",
                  borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #1e293b" }}>
        <div style={{ fontSize: 11, color: "#475569" }}>v1.0 · 디지털 건물주 OS</div>
      </div>
    </aside>
  );
}
