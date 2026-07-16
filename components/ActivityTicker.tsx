import { ActivityRow } from "@/lib/queries";

export function ActivityTicker({ items }: { items: ActivityRow[] }) {
  if (!items.length) {
    return (
      <div className="glass" style={{ padding: "10px 14px" }}>
        <span className="eyebrow">Live feed · quiet so far — place the first bet 👀</span>
      </div>
    );
  }
  const loop = [...items, ...items];
  return (
    <div className="glass" style={{ overflow: "hidden", padding: "10px 0", maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)" }}>
      <div className="marquee">
        {loop.map((a, i) => (
          <span
            key={i}
            style={{
              padding: "0 22px",
              fontSize: 13,
              color: a.kind === "upset" || a.kind === "champion" ? "var(--color-gold)" : "var(--color-muted)",
              fontWeight: a.kind === "upset" || a.kind === "champion" ? 600 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {a.text}
            <span style={{ color: "var(--color-faint)", marginLeft: 22 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
