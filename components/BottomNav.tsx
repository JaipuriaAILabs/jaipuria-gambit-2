"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Lobby", glyph: "♟" },
  { href: "/futures", label: "Champion", glyph: "♛" },
  { href: "/leaderboard", label: "Board", glyph: "♜" },
  { href: "/me", label: "You", glyph: "♞" },
];

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const nav = isAdmin ? [...items, { href: "/admin", label: "Admin", glyph: "♚" }] : items;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "linear-gradient(0deg, rgba(8,8,11,0.96), rgba(8,8,11,0.7))",
        borderTop: "1px solid var(--color-line)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="wrap-wide flex items-stretch justify-around"
        style={{ maxWidth: 520, height: 64 }}
      >
        {nav.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-col items-center justify-center gap-1"
              style={{
                flex: 1,
                textDecoration: "none",
                color: active ? "var(--color-purple)" : "var(--color-faint)",
                transition: "color 0.15s",
                position: "relative",
                boxShadow: active ? "inset 0 2px 0 var(--color-purple)" : "none",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{it.glyph}</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
