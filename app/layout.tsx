import "./globals.css";
import type { Metadata, Viewport } from "next";
import InstallPrompt from "@/components/InstallPrompt";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Looply",
  description: "A simple month-by-month checklist that carries unfinished items forward.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Looply", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1020",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}`,
          }}
        />
      </head>
      <body>
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <RegisterSW />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
