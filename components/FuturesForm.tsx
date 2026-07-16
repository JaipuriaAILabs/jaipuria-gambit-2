"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { placeFutures, type FormState } from "@/app/actions";
import { MIN_BET } from "@/lib/parimutuel";
import { oddsLabel, fmt } from "@/lib/format";

type P = { player_id: number; name: string; odds: number | null };

export function FuturesForm({ players, balance }: { players: P[]; balance: number }) {
  const router = useRouter();
  const [pid, setPid] = useState<number>(players[0]?.player_id ?? 0);
  const [amount, setAmount] = useState<number>(100);
  const [state, action, pending] = useActionState<FormState, FormData>(placeFutures, {});

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  const sel = players.find((p) => p.player_id === pid);
  const invalid = !pid || amount < MIN_BET || amount > balance;

  return (
    <form action={action} className="glass" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="hidden" name="playerId" value={pid} />
      <div>
        <label className="eyebrow" htmlFor="pl">Back a champion</label>
        <select
          id="pl"
          className="input"
          value={pid}
          onChange={(e) => setPid(Number(e.target.value))}
          style={{ marginTop: 6, appearance: "none" }}
        >
          {players.map((p) => (
            <option key={p.player_id} value={p.player_id}>
              {p.name} — {oddsLabel(p.odds)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <label className="eyebrow" htmlFor="famount">Stake</label>
          <span style={{ fontSize: 11.5, color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>balance {fmt(balance)}</span>
        </div>
        <input
          id="famount"
          name="amount"
          className="input num"
          type="number"
          min={MIN_BET}
          max={balance}
          step={10}
          value={Number.isFinite(amount) ? amount : ""}
          onChange={(e) => setAmount(Math.floor(Number(e.target.value)))}
        />
        <div className="flex" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {[50, 100, 250].filter((c) => c <= balance).map((c) => (
            <button key={c} type="button" className="pill" style={{ cursor: "pointer" }} onClick={() => setAmount(c)}>{c}</button>
          ))}
        </div>
      </div>
      {sel && sel.odds && (
        <div style={{ fontSize: 12.5, color: "var(--color-muted)" }}>
          Current odds on {sel.name}: <span className="odds" style={{ color: "var(--color-gold)" }}>{oddsLabel(sel.odds)}</span> — but they climb as others pile in and as rivals get knocked out.
        </div>
      )}
      {state.error && <div style={{ fontSize: 13, color: "var(--color-red)" }}>{state.error}</div>}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending || invalid}>
        {pending ? "Placing…" : "Bet on the champion ♛"}
      </button>
    </form>
  );
}
