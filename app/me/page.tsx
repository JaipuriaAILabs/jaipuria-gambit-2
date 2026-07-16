import { requireUser } from "@/lib/auth";
import { getUserBets } from "@/lib/queries";
import { logoutAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { AutoRefresh } from "@/components/AutoRefresh";
import { fmt, rankTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, { c: string; label: string }> = {
  open: { c: "var(--color-muted)", label: "live" },
  won: { c: "var(--color-green)", label: "won" },
  lost: { c: "var(--color-red)", label: "lost" },
  refunded: { c: "var(--color-muted)", label: "refunded" },
};

export default async function MePage() {
  const user = await requireUser();
  const { match, futures } = await getUserBets(user.id);

  const all = [...match, ...futures];
  const won = all.filter((b) => b.bet_status === "won").length;
  const lost = all.filter((b) => b.bet_status === "lost").length;
  const biggest = Math.max(0, ...all.map((b) => b.payout));

  return (
    <div className="wrap rise" style={{ paddingTop: 14 }}>
      <AutoRefresh />

      <div className="glass" style={{ padding: 18 }}>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={52} />
          <div style={{ minWidth: 0 }}>
            <div className="h-hero" style={{ fontSize: 22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div className="eyebrow">{rankTitle(user.balance)}{user.is_admin ? " · Admin ★" : ""}</div>
          </div>
        </div>
        <div className="flex items-end justify-between" style={{ marginTop: 16 }}>
          <div>
            <div className="eyebrow">Wallet</div>
            <div className="num" style={{ fontSize: 30, color: "var(--color-gold)", fontWeight: 700 }}>{fmt(user.balance)}</div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--color-muted)" }}>
            <div>{won}W · {lost}L</div>
            <div>best hit {fmt(biggest)} 🪙</div>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 20 }}>
        <h2 className="eyebrow" style={{ marginBottom: 10 }}>Match bets</h2>
        {match.length === 0 ? (
          <div className="glass" style={{ padding: 14, color: "var(--color-faint)", fontSize: 13.5 }}>No match bets yet. The lobby's waiting.</div>
        ) : (
          <div className="glass" style={{ padding: 6 }}>
            {match.map((b, i) => {
              const st = statusStyle[b.bet_status] ?? statusStyle.open;
              return (
                <div key={i} className="flex items-center justify-between" style={{ padding: "10px 12px", borderTop: i ? "1px solid var(--color-line)" : "none" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{b.match_id} </span>
                      {b.backed_name}
                    </div>
                    <div className="eyebrow">{fmt(b.amount)} staked{b.winner_name ? ` · ${b.winner_name} won` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: st.c, fontSize: 12, fontFamily: "var(--font-mono)" }}>{st.label}</div>
                    {b.payout > 0 && <div className="num" style={{ color: "var(--color-gold)", fontSize: 13 }}>+{fmt(b.payout)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {futures.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2 className="eyebrow" style={{ marginBottom: 10 }}>Champion futures</h2>
          <div className="glass" style={{ padding: 6 }}>
            {futures.map((b, i) => {
              const st = statusStyle[b.bet_status] ?? statusStyle.open;
              return (
                <div key={i} className="flex items-center justify-between" style={{ padding: "10px 12px", borderTop: i ? "1px solid var(--color-line)" : "none" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5 }}>{b.player_name} {b.eliminated && <span style={{ color: "var(--color-red)", fontSize: 11 }}>OUT</span>}</div>
                    <div className="eyebrow">{fmt(b.amount)} to win it all</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: st.c, fontSize: 12, fontFamily: "var(--font-mono)" }}>{st.label}</div>
                    {b.payout > 0 && <div className="num" style={{ color: "var(--color-gold)", fontSize: 13 }}>+{fmt(b.payout)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <form action={logoutAction} style={{ marginTop: 24 }}>
        <button className="btn btn-ghost btn-block" type="submit">Log out</button>
      </form>
    </div>
  );
}
