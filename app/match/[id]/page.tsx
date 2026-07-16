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

  const PlayerBig = ({
    name,
    pool,
    odds,
    side,
    win,
    lose,
  }: {
    name: string | null;
    pool: number;
    odds: number | null;
    side: "p1" | "p2";
    win: boolean;
    lose: boolean;
  }) => (
    <div style={{ flex: 1, textAlign: "center", opacity: lose ? 0.4 : 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Avatar name={name ?? "?"} size={54} />
      </div>
      <div className="h-sec" style={{ fontSize: 15, lineHeight: 1.2, textDecoration: lose ? "line-through" : "none", overflowWrap: "anywhere" }}>
        {win && <span style={{ color: "var(--color-green)" }}>✓ </span>}
        {name ?? "TBD"}
      </div>
      <div style={{ marginTop: 8 }}>
        <span
          className={`oddsbox ${win ? "oddsbox-won" : side === "p1" ? "oddsbox-p1" : "oddsbox-p2"}`}
          style={{ fontSize: 17, padding: "8px 12px" }}
        >
          {oddsLabel(odds)}
        </span>
      </div>
      <div className="eyebrow" style={{ marginTop: 8 }}>pool {fmt(pool)}</div>
    </div>
  );

  return (
    <div className="wrap rise" style={{ paddingTop: 12 }}>
      <AutoRefresh />
      <Link href="/" className="eyebrow eyebrow-bright" style={{ display: "inline-block", marginBottom: 12 }}>
        ← lobby
      </Link>

      <div className="glass" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
        <span className="watermark" aria-hidden>♞</span>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span className="eyebrow">{m.id} · {roundName(m.round)}</span>
          <span
            className={`pill ${
              m.status === "open" ? "pill-live" : m.status === "locked" ? "pill-locked" : m.status === "settled" ? "pill-done" : "pill-soon"
            }`}
          >
            {m.status === "open" ? (
              <>
                <span className="live-dot" /> betting open
              </>
            ) : m.status === "locked" ? (
              "◐ in play"
            ) : m.status === "settled" ? (
              "final"
            ) : (
              "upcoming"
            )}
          </span>
        </div>

        <div className="flex items-center" style={{ gap: 8 }}>
          <PlayerBig name={m.p1_name} pool={m.pool_p1} odds={m.odds_p1} side="p1" win={winP1} lose={winP2} />
          <span className="vs-seal">VS</span>
          <PlayerBig name={m.p2_name} pool={m.pool_p2} odds={m.odds_p2} side="p2" win={winP2} lose={winP1} />
        </div>

        <div className="meter" style={{ marginTop: 18 }}>
          {total > 0 ? (
            <>
              <span className="meter-p1" style={{ width: `${w1}%` }} />
              <span className="meter-p2" style={{ width: `${100 - w1}%` }} />
            </>
          ) : (
            <span className="meter-empty" style={{ width: "100%" }} />
          )}
        </div>
        <div className="eyebrow" style={{ marginTop: 10, textAlign: "center" }}>
          {m.bet_count} bet{m.bet_count === 1 ? "" : "s"} · total pot{" "}
          <span style={{ color: "var(--color-gold)" }}>{fmt(total)}</span>
          {m.scheduled_label ? ` · ${m.scheduled_label}` : ""}
        </div>
      </div>

      {m.game_url && m.status !== "settled" && (
        <a
          href={m.game_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-block"
          style={{ marginTop: 12, borderColor: "rgba(245,196,81,0.35)", color: "var(--color-gold)" }}
        >
          ♟ Watch this game live on chess.com ↗
        </a>
      )}

      {myBet && (
        <div className="glass" style={{ marginTop: 12, padding: "11px 14px", fontSize: 13.5 }}>
          Your bet:{" "}
          <b className={myBet.side === "p1" ? "side-p1" : "side-p2"}>
            {myBet.side === "p1" ? m.p1_name : m.p2_name}
          </b>{" "}
          for <span className="num" style={{ color: "var(--color-gold)" }}>{fmt(myBet.amount)}</span>
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
        <div className="glass" style={{ marginTop: 14, padding: 14, textAlign: "center", color: "var(--color-orange)", fontSize: 14 }}>
          Betting is locked — the match is being played. Payouts drop when it&apos;s called.
        </div>
      ) : m.status === "settled" ? (
        <div className="glass" style={{ marginTop: 14, padding: 16, textAlign: "center" }}>
          <span className="h-sec" style={{ color: "var(--color-green)", fontSize: 16 }}>
            {m.winner_name} wins.
          </span>
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
                <div style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                  <span className="num" style={{ color: "var(--color-gold)" }}>{fmt(b.amount)}</span>{" "}
                  <span style={{ color: "var(--color-faint)" }}>on</span>{" "}
                  <span className={b.side === "p1" ? "side-p1" : "side-p2"}>
                    {(b.side === "p1" ? m.p1_name : m.p2_name) ?? b.side}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
