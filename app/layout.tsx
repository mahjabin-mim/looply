import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import InstallPrompt from "@/components/InstallPrompt";
import RegisterSW from "@/components/RegisterSW";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Looply",
  description: "A simple month-by-month checklist that carries unfinished items forward.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    title: "Looply",
    statusBarStyle: "black-translucent",
    // launch screens for iPhones added to the home screen (otherwise iOS flashes white)
    startupImage: (
      [[440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3],
       [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2], [320, 568, 2]] as const
    ).map(([w, h, r]) => ({
      url: `/splash/${w}x${h}@${r}x.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0e1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
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
