import { ActivityRow } from "@/lib/queries";

function Item({ a }: { a: ActivityRow }) {
  const hot = a.kind === "upset" || a.kind === "champion";
  return (
    <span
      style={{
        padding: "0 22px",
        fontSize: 13,
        color: hot ? "var(--color-gold)" : "var(--color-muted)",
        fontWeight: hot ? 600 : 400,
        whiteSpace: "nowrap",
      }}
    >
      {a.text}
      <span style={{ color: "var(--color-faint)", marginLeft: 22 }}>·</span>
    </span>
  );
}

export function ActivityTicker({ items }: { items: ActivityRow[] }) {
  if (!items.length) {
    return (
      <div className="glass" style={{ padding: "10px 14px" }}>
        <span className="eyebrow">Live feed · quiet so far — place the first bet 👀</span>
      </div>
    );
  }

  // Few items: static row (a marquee with 2 entries looks broken).
  if (items.length < 4) {
    return (
      <div className="glass" style={{ overflowX: "auto", padding: "10px 0", scrollbarWidth: "none" }}>
        <div style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
          {items.map((a) => <Item key={a.id} a={a} />)}
        </div>
      </div>
    );
  }

  const loop = [...items, ...items];
  // Speed scales with content so it stays readable at any feed size.
  const duration = Math.max(24, items.length * 5);
  return (
    <div
      className="glass"
      style={{
        overflow: "hidden",
        padding: "10px 0",
        maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
      }}
    >
      <div className="marquee" style={{ animationDuration: `${duration}s` }}>
        {loop.map((a, i) => <Item key={i} a={a} />)}
      </div>
    </div>
  );
}
