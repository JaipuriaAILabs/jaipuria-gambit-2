import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMatch, getMatchBets, getUserMatchBet } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { BetForm } from "@/components/BetForm";
import { AutoRefresh } from "@/components/AutoRefresh";
import { fmt, oddsLabel, roundName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const m = await getMatch(id);
  if (!m) notFound();

  const bets = await getMatchBets(id);
  const myBet = await getUserMatchBet(user.id, id);
  const total = m.pool_p1 + m.pool_p2;
  const w1 = total > 0 ? (m.pool_p1 / total) * 100 : 50;

  const winP1 = m.status === "settled" && m.winner_player_id === m.p1_player_id;
  const winP2 = m.status === "settled" && m.winner_player_id === m.p2_player_id;
  const bettable = m.status === "open" && m.p1_name && m.p2_name;

  const PlayerBig = ({ name, pool, odds, win, lose }: { name: string | null; pool: number; odds: number | null; win: boolean; lose: boolean }) => (
    <div style={{ flex: 1, textAlign: "center", opacity: lose ? 0.45 : 1 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Avatar name={name ?? "?"} size={54} />
      </div>
      <div className="h-sec" style={{ fontSize: 15, lineHeight: 1.2 }}>
        {win && <span style={{ color: "var(--color-green)" }}>✓ </span>}
        {name ?? "TBD"}
      </div>
      <div className="odds" style={{ fontSize: 20, marginTop: 6, color: win ? "var(--color-green)" : "var(--color-ink)" }}>
        {oddsLabel(odds)}
      </div>
      <div className="eyebrow" style={{ marginTop: 2 }}>pool {fmt(pool)}</div>
    </div>
  );

  return (
    <div className="wrap rise" style={{ paddingTop: 12 }}>
      <AutoRefresh />
      <Link href="/" className="eyebrow" style={{ display: "inline-block", marginBottom: 12 }}>← Lobby</Link>

      <div className="glass" style={{ padding: 18 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span className="eyebrow">{m.id} · {roundName(m.round)}</span>
          <span className={`pill ${m.status === "open" ? "pill-live" : m.status === "locked" ? "pill-locked" : m.status === "settled" ? "pill-done" : "pill-soon"}`}>
            {m.status === "open" ? "● Betting open" : m.status === "locked" ? "◐ In play" : m.status === "settled" ? "Final" : "Upcoming"}
          </span>
        </div>

        <div className="flex items-center" style={{ gap: 8 }}>
          <PlayerBig name={m.p1_name} pool={m.pool_p1} odds={m.odds_p1} win={winP1} lose={winP2} />
          <div style={{ fontFamily: "var(--font-display)", color: "var(--color-faint)", fontSize: 13, fontWeight: 600 }}>VS</div>
          <PlayerBig name={m.p2_name} pool={m.pool_p2} odds={m.odds_p2} win={winP2} lose={winP1} />
        </div>

        <div className="meter" style={{ marginTop: 18 }}>
          <span style={{ width: `${w1}%`, background: total ? "var(--color-purple)" : "rgba(255,255,255,0.08)" }} />
          <span style={{ width: `${100 - w1}%`, background: total ? "var(--color-orange)" : "rgba(255,255,255,0.05)" }} />
        </div>
        <div className="eyebrow" style={{ marginTop: 8, textAlign: "center" }}>
          {m.bet_count} bet{m.bet_count === 1 ? "" : "s"} · total pot {fmt(total)} 🪙 · {m.scheduled_label}
        </div>
      </div>

      {myBet && (
        <div className="glass" style={{ marginTop: 12, padding: "10px 14px", fontSize: 13.5 }}>
          Your bet: <b>{myBet.side === "p1" ? m.p1_name : m.p2_name}</b> for{" "}
          <span className="num" style={{ color: "var(--color-gold)" }}>{fmt(myBet.amount)}</span>
        </div>
      )}

      {bettable ? (
        <div style={{ marginTop: 14 }}>
          <BetForm
            matchId={m.id}
            p1Name={m.p1_name!}
            p2Name={m.p2_name!}
            poolP1={m.pool_p1}
            poolP2={m.pool_p2}
            balance={user.balance}
            currentSide={(myBet?.side as "p1" | "p2") ?? null}
            currentAmount={myBet?.amount ?? 0}
          />
        </div>
      ) : m.status === "locked" ? (
        <div className="glass" style={{ marginTop: 14, padding: 14, textAlign: "center", color: "var(--color-orange)" }}>
          Betting is locked — the match is being played. Payouts drop when it's called.
        </div>
      ) : m.status === "settled" ? (
        <div className="glass" style={{ marginTop: 14, padding: 14, textAlign: "center" }}>
          <span className="h-sec" style={{ color: "var(--color-green)" }}>{m.winner_name} wins.</span>
          {myBet && (
            <div style={{ fontSize: 13, marginTop: 6, color: "var(--color-muted)" }}>
              {(myBet.side === "p1" ? winP1 : winP2)
                ? "You called it 🎯 — payout is in your wallet."
                : "Not this time. On to the next."}
            </div>
          )}
        </div>
      ) : null}

      {bets.length > 0 && (
        <section style={{ marginTop: 22 }}>
          <h2 className="eyebrow" style={{ marginBottom: 10 }}>Latest bets</h2>
          <div className="glass" style={{ padding: 6 }}>
            {bets.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
                style={{ padding: "9px 12px", borderTop: i ? "1px solid var(--color-line)" : "none", fontSize: 13.5 }}
              >
                <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                  <Avatar name={b.name} size={26} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</span>
                </div>
                <div style={{ color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                  {fmt(b.amount)} on {(b.side === "p1" ? m.p1_name : m.p2_name) ?? b.side}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
