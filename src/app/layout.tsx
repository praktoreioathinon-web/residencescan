import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "ResidenceScan — Your Property. Fully Known.",
  description: "Digital property record.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
