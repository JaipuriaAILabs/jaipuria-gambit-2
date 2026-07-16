"use client";

import { useState } from "react";
import { adminSettle, adminSetStatus } from "@/app/actions";
import { fmt } from "@/lib/format";

type Props = {
  id: string;
  status: "pending" | "open" | "locked" | "settled";
  p1Id: number | null;
  p2Id: number | null;
  p1Name: string | null;
  p2Name: string | null;
  poolP1: number;
  poolP2: number;
  winnerName: string | null;
};

export function AdminMatchRow(p: Props) {
  const [armed, setArmed] = useState<number | null>(null);
  const bothSet = p.p1Id != null && p.p2Id != null;
  const armedName = armed === p.p1Id ? p.p1Name : p.p2Name;

  return (
    <div className="glass" style={{ padding: 14 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span className="eyebrow">{p.id}</span>
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-faint)" }}>
          pot {fmt(p.poolP1 + p.poolP2)}
        </span>
      </div>
      <div style={{ fontSize: 14, marginBottom: 10 }}>
        {p.p1Name ?? "TBD"} <span style={{ color: "var(--color-faint)" }}>({fmt(p.poolP1)})</span>
        <span style={{ color: "var(--color-faint)" }}> vs </span>
        {p.p2Name ?? "TBD"} <span style={{ color: "var(--color-faint)" }}>({fmt(p.poolP2)})</span>
      </div>

      {p.status === "settled" ? (
        <div style={{ color: "var(--color-green)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
          ✓ Settled — {p.winnerName} won
        </div>
      ) : !bothSet ? (
        <div style={{ color: "var(--color-faint)", fontSize: 12.5 }}>Waiting for the bracket to fill in.</div>
      ) : (
        <div className="flex flex-col" style={{ gap: 10 }}>
          <div className="flex" style={{ gap: 8 }}>
            {p.status === "open" ? (
              <form action={adminSetStatus}>
                <input type="hidden" name="matchId" value={p.id} />
                <input type="hidden" name="status" value="locked" />
                <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }} type="submit">Lock betting</button>
              </form>
            ) : (
              <form action={adminSetStatus}>
                <input type="hidden" name="matchId" value={p.id} />
                <input type="hidden" name="status" value="open" />
                <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }} type="submit">Reopen betting</button>
              </form>
            )}
          </div>

          <form action={adminSettle}>
            <input type="hidden" name="matchId" value={p.id} />
            <input type="hidden" name="winnerId" value={armed ?? ""} />
            {armed == null ? (
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Declare winner</div>
                <div className="flex" style={{ gap: 8 }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, fontSize: 13 }} onClick={() => setArmed(p.p1Id)}>
                    {p.p1Name}
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, fontSize: 13 }} onClick={() => setArmed(p.p2Id)}>
                    {p.p2Name}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 8 }}>
                <button type="submit" className="btn btn-danger btn-block" style={{ fontSize: 13 }}>
                  Confirm: {armedName} won → pay out now
                </button>
                <button type="button" className="btn btn-ghost btn-block" style={{ fontSize: 12, padding: "6px" }} onClick={() => setArmed(null)}>
                  cancel
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
