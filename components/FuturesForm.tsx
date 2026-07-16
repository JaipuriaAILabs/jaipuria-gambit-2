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
  const [amount, setAmount] = useState<number>(5000);
  const [placed, setPlaced] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(placeFutures, {});

  // If the selected player got knocked out (list refreshed), snap to a live one.
  useEffect(() => {
    if (!players.some((p) => p.player_id === pid)) setPid(players[0]?.player_id ?? 0);
  }, [players, pid]);

  useEffect(() => {
    if (state.ok) {
      setPlaced(true);
      router.refresh();
      const t = setTimeout(() => setPlaced(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const sel = players.find((p) => p.player_id === pid);
  const invalidReason = !pid
    ? "Pick a player."
    : !Number.isFinite(amount) || amount < MIN_BET
      ? `Minimum stake is ${MIN_BET} J-Coins.`
      : amount > balance
        ? `You only have ${fmt(balance)} J-Coins.`
        : null;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (invalidReason) {
          e.preventDefault();
          setHint(invalidReason);
        } else {
          setHint(null);
        }
      }}
      className="glass"
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
    >
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
          <span style={{ fontSize: 11.5, color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
            balance <span style={{ color: "var(--color-gold)" }}>{fmt(balance)}</span>
          </span>
        </div>
        <input
          id="famount"
          name="amount"
          className="input num"
          type="number"
          inputMode="numeric"
          min={MIN_BET}
          step={1}
          value={Number.isFinite(amount) ? amount : ""}
          onChange={(e) => {
            const v = e.target.value;
            setAmount(v === "" ? NaN : Math.floor(Number(v)));
            setHint(null);
          }}
        />
        <div className="flex" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {[1000, 5000, 10000].filter((c) => c <= balance).map((c) => (
            <button key={c} type="button" className="chip" onClick={() => setAmount(c)}>{fmt(c)}</button>
          ))}
        </div>
      </div>
      {sel && sel.odds && (
        <div style={{ fontSize: 12.5, color: "var(--color-muted)" }}>
          Current odds on {sel.name}: <span className="odds" style={{ color: "var(--color-gold)" }}>{oddsLabel(sel.odds)}</span> — they climb as others pile in and rivals get knocked out.
        </div>
      )}
      {(hint || state.error) && <div style={{ fontSize: 13, color: "var(--color-red)" }}>{hint ?? state.error}</div>}
      {placed && !state.error && !hint && (
        <div style={{ fontSize: 13, color: "var(--color-green)", fontFamily: "var(--font-mono)" }}>
          ✓ Futures bet placed{sel ? ` on ${sel.name}` : ""}.
        </div>
      )}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
        {pending ? "Placing…" : "Bet on the champion ♛"}
      </button>
    </form>
  );
}
