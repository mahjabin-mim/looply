import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly List",
  description: "A simple month-by-month checklist that carries unfinished items forward.",
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
        {children}
      </body>
    </html>
  );
}
