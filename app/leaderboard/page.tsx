import { requireUser } from "@/lib/auth";
import { getLeaderboard, getPlayerBoard, getSuperlatives } from "@/lib/queries";
import { BoardTabs } from "@/components/BoardTabs";
import { AutoRefresh } from "@/components/AutoRefresh";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

function Superlative({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass" style={{ padding: "11px 13px", minWidth: 0 }}>
      <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
      <div className="h-sec" style={{ fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      <div className="num" style={{ fontSize: 11.5, color: "var(--color-gold)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const me = await requireUser();
  const bettors = await getLeaderboard();
  const players = await getPlayerBoard();
  const supers = await getSuperlatives();

  const anySupers = supers.biggestHit || supers.mostActive || supers.boldest;

  return (
    <div className="wrap rise" style={{ paddingTop: 14 }}>
      <div style={{ marginBottom: 16, position: "relative" }}>
        <span className="watermark" aria-hidden>♜</span>
        <div className="eyebrow" style={{ marginBottom: 6 }}>standings</div>
        <h1 className="h-hero" style={{ fontSize: 28 }}>The Board</h1>
        <p style={{ color: "var(--color-muted)", fontSize: 13.5, marginTop: 6 }}>
          Punters started with 1,00,000 J-Coins each. Players fight for the bracket.
        </p>
      </div>

      {anySupers && (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 14 }}>
          {supers.biggestHit && (
            <Superlative label="Biggest hit" value={supers.biggestHit.name} sub={`+${fmt(supers.biggestHit.payout)} in one bet`} />
          )}
          {supers.boldest && (
            <Superlative label="Biggest stake" value={supers.boldest.name} sub={`${fmt(supers.boldest.amount)} on one match`} />
          )}
          {supers.mostActive && (
            <Superlative label="Most action" value={supers.mostActive.name} sub={`${supers.mostActive.bets} bets placed`} />
          )}
        </div>
      )}

      <BoardTabs bettors={bettors} players={players} meId={me.id} />
      <AutoRefresh />
    </div>
  );
}
