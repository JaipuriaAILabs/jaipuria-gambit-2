import { initials, avatarStyle } from "@/lib/format";

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const s = avatarStyle(name);
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: s.background,
        color: s.color,
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: size * 0.4,
        border: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </span>
  );
}
