import { requireUser } from "@/lib/auth";
import { getFutures } from "@/lib/queries";
import { FuturesForm } from "@/components/FuturesForm";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Avatar } from "@/components/Avatar";
import { fmt, oddsLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FuturesPage() {
  const user = await requireUser();
  const { players, totalPool, futuresOpen } = await getFutures();
  const alive = players.filter((p) => !p.eliminated);

  return (
    <div className="wrap rise" style={{ paddingTop: 14 }}>
      <AutoRefresh />
      <div style={{ marginBottom: 16, position: "relative" }}>
        <span className="watermark" aria-hidden>♛</span>
        <div className="eyebrow" style={{ marginBottom: 6 }}>champion futures</div>
        <h1 className="h-hero" style={{ fontSize: 28 }}>Who lifts<br />the trophy?</h1>
        <p style={{ color: "var(--color-muted)", fontSize: 13.5, marginTop: 8, maxWidth: 430 }}>
          One pool. Money on knocked-out players stays in the pot — the earlier and gutsier
          your call, the fatter the payout. Pool so far:{" "}
          <b className="num" style={{ color: "var(--color-gold)" }}>{fmt(totalPool)}</b>
        </p>
      </div>

      {futuresOpen && alive.length > 0 ? (
        <FuturesForm players={alive.map((p) => ({ player_id: p.player_id, name: p.name, odds: p.odds }))} balance={user.balance} />
      ) : (
        <div className="glass" style={{ padding: 14, textAlign: "center", color: "var(--color-orange)" }}>
          Futures betting is closed.
        </div>
      )}

      <section style={{ marginTop: 22 }}>
        <h2 className="eyebrow" style={{ marginBottom: 10 }}>The board</h2>
        <div className="glass" style={{ padding: 6 }}>
          {players.map((p, i) => (
            <div
              key={p.player_id}
              className="flex items-center justify-between"
              style={{
                padding: "10px 12px",
                borderTop: i ? "1px solid var(--color-line)" : "none",
                opacity: p.eliminated ? 0.4 : 1,
              }}
            >
              <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                <Avatar name={p.name} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div className="h-sec" style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.eliminated && <span style={{ textDecoration: "line-through" }}>{p.name}</span>}
                    {!p.eliminated && p.name}
                  </div>
                  <div className="eyebrow" style={{ letterSpacing: "0.06em" }}>
                    {p.backers} backer{p.backers === 1 ? "" : "s"} · {fmt(p.pool)} pool
                  </div>
                </div>
              </div>
              <div className="odds" style={{ fontSize: 15, color: p.eliminated ? "var(--color-faint)" : "var(--color-gold)" }}>
                {p.eliminated ? "OUT" : oddsLabel(p.odds)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
