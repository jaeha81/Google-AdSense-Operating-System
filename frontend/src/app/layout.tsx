import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AdSense OS",
  description: "AI 수익화 운영 시스템",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AdSense OS",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className="min-h-full flex"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <Sidebar />
        <main className="main-content flex-1 overflow-auto">
          {children}
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js');`,
          }}
        />
      </body>
    </html>
  );
}
