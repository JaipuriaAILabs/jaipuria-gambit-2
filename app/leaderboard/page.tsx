import { requireUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { AutoRefresh } from "@/components/AutoRefresh";
import { fmt, rankTitle, rankBadge } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const me = await requireUser();
  const rows = await getLeaderboard();

  return (
    <div className="wrap rise" style={{ paddingTop: 14 }}>
      <AutoRefresh />
      <div style={{ marginBottom: 14 }}>
        <h1 className="h-hero" style={{ fontSize: 26 }}>♜ The Board</h1>
        <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 4 }}>
          Everyone started at 1,000 Gambits. This is who read the room best.
        </p>
      </div>

      <div className="glass" style={{ padding: 6 }}>
        {rows.map((r, i) => {
          const isMe = r.id === me.id;
          return (
            <div
              key={r.id}
              className="flex items-center justify-between"
              style={{
                padding: "11px 12px",
                borderTop: i ? "1px solid var(--color-line)" : "none",
                borderRadius: 12,
                background: isMe ? "rgba(155,109,255,0.10)" : "transparent",
              }}
            >
              <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                <span
                  className="num"
                  style={{ width: 26, textAlign: "center", color: "var(--color-faint)", fontSize: 14 }}
                >
                  {rankBadge(i) || i + 1}
                </span>
                <Avatar name={r.name} size={34} />
                <div style={{ minWidth: 0 }}>
                  <div className="h-sec" style={{ fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.name}
                    {isMe && <span style={{ color: "var(--color-purple)", fontSize: 11, marginLeft: 6, fontFamily: "var(--font-mono)" }}>YOU</span>}
                    {r.is_admin && <span style={{ color: "var(--color-orange)", fontSize: 11, marginLeft: 6 }}>★</span>}
                  </div>
                  <div className="eyebrow" style={{ letterSpacing: "0.06em" }}>{rankTitle(r.balance)}</div>
                </div>
              </div>
              <div className="num" style={{ color: "var(--color-gold)", fontWeight: 600, fontSize: 15, whiteSpace: "nowrap" }}>
                {fmt(r.balance)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
