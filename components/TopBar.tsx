import Link from "next/link";
import { fmt } from "@/lib/format";

export function TopBar({ balance }: { name: string; balance: number; isAdmin: boolean }) {
  return (
    <header
      className="sticky top-0 z-30"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "linear-gradient(180deg, rgba(8,8,11,0.85), rgba(8,8,11,0.4))",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <div className="wrap-wide flex items-center justify-between" style={{ height: 56 }}>
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 20 }}>♞</span>
          <span
            className="h-sec"
            style={{ fontSize: 15, letterSpacing: "-0.01em" }}
          >
            The Jaipuria <span style={{ color: "var(--color-purple)" }}>Gambit</span>
          </span>
        </Link>
        <div
          className="flex items-center gap-2"
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid rgba(245,196,81,0.35)",
            background: "rgba(245,196,81,0.08)",
          }}
        >
          <span style={{ fontSize: 13 }}>🪙</span>
          <span className="num" style={{ color: "var(--color-gold)", fontWeight: 600, fontSize: 14 }}>
            {fmt(balance)}
          </span>
        </div>
      </div>
    </header>
  );
}
