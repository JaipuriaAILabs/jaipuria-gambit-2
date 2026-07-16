import { requireAdmin } from "@/lib/auth";
import { getMatches, getFutures } from "@/lib/queries";
import { adminToggleFutures } from "@/app/actions";
import { AdminMatchRow } from "@/components/AdminMatchRow";
import { roundName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const matches = await getMatches();
  const futures = await getFutures();

  const active = matches.filter((m) => m.status === "open" || m.status === "locked");
  const pending = matches.filter((m) => m.status === "pending");
  const settled = matches.filter((m) => m.status === "settled");

  const Row = (m: (typeof matches)[number]) => (
    <AdminMatchRow
      key={m.id}
      id={m.id}
      status={m.status}
      p1Id={m.p1_player_id}
      p2Id={m.p2_player_id}
      p1Name={m.p1_name}
      p2Name={m.p2_name}
      poolP1={m.pool_p1}
      poolP2={m.pool_p2}
      winnerName={m.winner_name}
      gameUrl={m.game_url}
    />
  );

  return (
    <div className="wrap rise" style={{ paddingTop: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <h1 className="h-hero" style={{ fontSize: 24 }}>♚ Control room</h1>
        <p style={{ color: "var(--color-muted)", fontSize: 13.5, marginTop: 4 }}>
          Lock a market when a game starts. Declare the winner when it's called — payouts and the
          bracket advance automatically. Settlement can&apos;t be undone.
        </p>
      </div>

      <div className="glass" style={{ padding: 14, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="h-sec" style={{ fontSize: 14 }}>Champion futures</div>
          <div className="eyebrow">{futures.futuresOpen ? "Currently OPEN" : "Currently CLOSED"}</div>
        </div>
        <form action={adminToggleFutures}>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} type="submit">
            {futures.futuresOpen ? "Close futures" : "Open futures"}
          </button>
        </form>
      </div>

      {active.length > 0 && (
        <>
          <h2 className="eyebrow" style={{ margin: "0 0 10px" }}>Active markets</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr", marginBottom: 22 }}>{active.map(Row)}</div>
        </>
      )}

      {pending.length > 0 && (
        <>
          <h2 className="eyebrow" style={{ margin: "0 0 10px" }}>Waiting on the bracket</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr", marginBottom: 22 }}>{pending.map(Row)}</div>
        </>
      )}

      {settled.length > 0 && (
        <>
          <h2 className="eyebrow" style={{ margin: "0 0 10px" }}>Settled</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr" }}>{settled.map(Row)}</div>
        </>
      )}
    </div>
  );
}
