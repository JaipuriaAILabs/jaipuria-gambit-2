import Link from "next/link";
import { MatchRow } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { fmt, oddsLabel, roundName } from "@/lib/format";

function refLabel(ref: string): string {
  const m = ref.match(/^winner:(M\d+)$/);
  return m ? `Winner of ${m[1]}` : "TBD";
}

function StatusPill({ status }: { status: MatchRow["status"] }) {
  if (status === "open")
    return (
      <span className="pill pill-live">
        <span className="live-dot" /> betting open
      </span>
    );
  if (status === "locked") return <span className="pill pill-locked">◐ in play</span>;
  if (status === "settled") return <span className="pill pill-done">final</span>;
  return <span className="pill pill-soon">upcoming</span>;
}

function Side({
  name,
  ref_,
  odds,
  side,
  align,
  win,
  lose,
}: {
  name: string | null;
  ref_: string;
  odds: number | null;
  side: "p1" | "p2";
  align: "left" | "right";
  win: boolean;
  lose: boolean;
}) {
  const known = !!name;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "left" ? "flex-start" : "flex-end",
        gap: 7,
        opacity: lose ? 0.38 : 1,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{ flexDirection: align === "right" ? "row-reverse" : "row", maxWidth: "100%" }}
      >
        {known ? <Avatar name={name!} size={30} /> : <span style={{ fontSize: 20, opacity: 0.35 }}>♟</span>}
        <span
          className="h-sec"
          style={{
            fontSize: 14.5,
            color: known ? "var(--color-ink)" : "var(--color-faint)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: lose ? "line-through" : "none",
          }}
        >
          {win && <span style={{ color: "var(--color-green)" }}>✓ </span>}
          {known ? name : refLabel(ref_)}
        </span>
      </div>
      {known && (
        <span className={`oddsbox ${win ? "oddsbox-won" : side === "p1" ? "oddsbox-p1" : "oddsbox-p2"}`}>
          {oddsLabel(odds)}
        </span>
      )}
    </div>
  );
}

export function MatchCard({ m }: { m: MatchRow }) {
  const total = m.pool_p1 + m.pool_p2;
  const w1 = total > 0 ? (m.pool_p1 / total) * 100 : 50;
  const clickable = m.status !== "pending";
  const winP1 = m.status === "settled" && m.winner_player_id === m.p1_player_id;
  const winP2 = m.status === "settled" && m.winner_player_id === m.p2_player_id;

  const inner = (
    <div className={`glass ${clickable ? "card-hover" : ""}`} style={{ padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14, gap: 8 }}>
        <span className="eyebrow" style={{ whiteSpace: "nowrap" }}>
          {m.id} · {roundName(m.round)}
        </span>
        <div className="flex items-center gap-2">
          {m.game_url && m.status !== "settled" && (
            <span className="pill pill-gold">♟ watch</span>
          )}
          <StatusPill status={m.status} />
        </div>
      </div>

      <div className="flex items-center" style={{ gap: 10 }}>
        <Side name={m.p1_name} ref_={m.p1_ref} odds={m.odds_p1} side="p1" align="left" win={winP1} lose={winP2} />
        <span className="vs-seal">VS</span>
        <Side name={m.p2_name} ref_={m.p2_ref} odds={m.odds_p2} side="p2" align="right" win={winP2} lose={winP1} />
      </div>

      <div className="meter" style={{ marginTop: 14 }}>
        {total > 0 ? (
          <>
            <span className="meter-p1" style={{ width: `${w1}%` }} />
            <span className="meter-p2" style={{ width: `${100 - w1}%` }} />
          </>
        ) : (
          <span className="meter-empty" style={{ width: "100%" }} />
        )}
      </div>

      <div className="flex items-center justify-between hairline" style={{ marginTop: 12, paddingTop: 10 }}>
        <span className="eyebrow" style={{ letterSpacing: "0.1em" }}>
          {m.bet_count} bet{m.bet_count === 1 ? "" : "s"} · pot{" "}
          <span style={{ color: "var(--color-gold)" }}>{fmt(total)}</span>
        </span>
        <span style={{ fontSize: 11, color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {m.status === "open" ? "tap to bet →" : m.scheduled_label ?? ""}
        </span>
      </div>
    </div>
  );

  return clickable ? (
    <Link href={`/match/${m.id}`} style={{ textDecoration: "none" }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
