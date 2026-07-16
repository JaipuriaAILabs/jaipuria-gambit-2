import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "The Jaipuria Gambit",
  description: "Office chess tournament — bet Gambits, top the board.",
};

export const viewport: Viewport = {
  themeColor: "#08080b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Co-locate serverless functions with the Mumbai (ap-south-1) database.
export const preferredRegion = "bom1";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full`}>
      <body className="min-h-full">
        <div className="backdrop" />
        <div className="dotgrid" />
        <div className="grain" />
        {user && <TopBar name={user.name} balance={user.balance} isAdmin={user.is_admin} />}
        <main style={{ paddingBottom: user ? 92 : 24, paddingTop: user ? 8 : 0 }}>{children}</main>
        {user && <BottomNav isAdmin={user.is_admin} />}
      </body>
    </html>
  );
}
