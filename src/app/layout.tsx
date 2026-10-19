import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "ResidenceScan — Your Property. Fully Known.",
  description: "Digital property record.",
  appleWebApp: { capable: true, title: "ResidenceScan", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#071017",
  width: "device-width",
  initialScale: 1,
};

const themeInitScript = `
(function () {
  try {
    var theme = localStorage.getItem("rs_theme");
    var isLight = theme === "light" || (!theme && window.matchMedia("(prefers-color-scheme: light)").matches);
    if (isLight) document.documentElement.setAttribute("data-theme", "light");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
