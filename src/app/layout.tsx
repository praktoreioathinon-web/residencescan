import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "ResidenceScan — Your Property. Fully Known.",
  description: "Digital property record.",
};

const themeInitScript = `
(function () {
  try {
    var theme = localStorage.getItem("rs_theme");
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
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
