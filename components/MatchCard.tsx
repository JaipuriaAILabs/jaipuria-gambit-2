import Link from "next/link";
import { MatchRow } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { fmt, oddsLabel, roundName } from "@/lib/format";

function refLabel(ref: string): string {
  const m = ref.match(/^winner:(M\d+)$/);
  return m ? `Winner of ${m[1]}` : "TBD";
}

function StatusPill({ status }: { status: MatchRow["status"] }) {
  const map = {
    open: { cls: "pill pill-live", label: "● Betting open" },
    locked: { cls: "pill pill-locked", label: "◐ In play" },
    settled: { cls: "pill pill-done", label: "Final" },
    pending: { cls: "pill pill-soon", label: "Upcoming" },
  } as const;
  const s = map[status];
  return <span className={s.cls}>{s.label}</span>;
}

function Side({
  name,
  ref_,
  odds,
  align,
  win,
  lose,
}: {
  name: string | null;
  ref_: string;
  odds: number | null;
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
        gap: 6,
        opacity: lose ? 0.4 : 1,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div className="flex items-center gap-2" style={{ flexDirection: align === "right" ? "row-reverse" : "row", maxWidth: "100%" }}>
        {known ? <Avatar name={name!} size={30} /> : <span style={{ fontSize: 22, opacity: 0.4 }}>♟</span>}
        <span
          className="h-sec"
          style={{
            fontSize: 14.5,
            color: known ? "var(--color-ink)" : "var(--color-faint)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {win && "✓ "}
          {known ? name : refLabel(ref_)}
        </span>
      </div>
      {known && (
        <span className="odds" style={{ fontSize: 12, color: win ? "var(--color-green)" : "var(--color-muted)" }}>
          {oddsLabel(odds)}
        </span>
      )}
    </div>
  );
}

export function MatchCard({ m }: { m: MatchRow }) {
  const total = m.pool_p1 + m.pool_p2;
  const w1 = total > 0 ? (m.pool_p1 / total) * 100 : 50;
  const w2 = 100 - w1;
  const clickable = m.status !== "pending";
  const winP1 = m.status === "settled" && m.winner_player_id === m.p1_player_id;
  const winP2 = m.status === "settled" && m.winner_player_id === m.p2_player_id;

  const inner = (
    <div className="glass card-hover" style={{ padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <span className="eyebrow">
          {m.id} · {roundName(m.round)}
        </span>
        <StatusPill status={m.status} />
      </div>

      <div className="flex items-center" style={{ gap: 10 }}>
        <Side name={m.p1_name} ref_={m.p1_ref} odds={m.odds_p1} align="left" win={winP1} lose={winP2} />
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-faint)", fontSize: 12 }}>vs</span>
        <Side name={m.p2_name} ref_={m.p2_ref} odds={m.odds_p2} align="right" win={winP2} lose={winP1} />
      </div>

      <div className="meter" style={{ marginTop: 14 }}>
        <span style={{ width: `${w1}%`, background: total ? "var(--color-purple)" : "rgba(255,255,255,0.08)" }} />
        <span style={{ width: `${w2}%`, background: total ? "var(--color-orange)" : "rgba(255,255,255,0.05)" }} />
      </div>

      <div className="flex items-center justify-between hairline" style={{ marginTop: 12, paddingTop: 10 }}>
        <span className="eyebrow" style={{ letterSpacing: "0.08em" }}>
          {m.bet_count} bet{m.bet_count === 1 ? "" : "s"} · pot {fmt(total)}
        </span>
        <span style={{ fontSize: 11, color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {m.status === "open" ? "Tap to bet →" : m.scheduled_label ?? ""}
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
