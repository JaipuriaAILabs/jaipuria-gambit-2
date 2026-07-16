"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { placeBet, type FormState } from "@/app/actions";
import { MIN_BET } from "@/lib/parimutuel";
import { fmt } from "@/lib/format";

type Props = {
  matchId: string;
  p1Name: string;
  p2Name: string;
  poolP1: number;
  poolP2: number;
  balance: number;
  currentSide: "p1" | "p2" | null;
  currentAmount: number;
};

export function BetForm(props: Props) {
  const { matchId, p1Name, p2Name, poolP1, poolP2, balance, currentSide, currentAmount } = props;
  const router = useRouter();
  const [side, setSide] = useState<"p1" | "p2" | null>(currentSide);
  const [amount, setAmount] = useState<number>(currentAmount || 100);
  const [state, action, pending] = useActionState<FormState, FormData>(placeBet, {});

  const maxBet = balance + currentAmount; // current bet is already debited

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  const estimate = useMemo(() => {
    if (!side || !amount || amount < MIN_BET) return null;
    let sidePool = side === "p1" ? poolP1 : poolP2;
    let total = poolP1 + poolP2;
    if (currentSide === side) {
      sidePool -= currentAmount;
      total -= currentAmount;
    } else if (currentSide) {
      total -= currentAmount;
    }
    const sideAfter = sidePool + amount;
    const totalAfter = total + amount;
    const mult = sideAfter > 0 ? totalAfter / sideAfter : 1;
    return { payout: Math.floor(amount * mult), mult };
  }, [side, amount, poolP1, poolP2, currentSide, currentAmount]);

  const chips = [50, 100, 250, 500].filter((c) => c <= maxBet);
  const invalid = !side || amount < MIN_BET || amount > maxBet;

  const Choice = ({ s, name }: { s: "p1" | "p2"; name: string }) => {
    const on = side === s;
    return (
      <button
        type="button"
        onClick={() => setSide(s)}
        style={{
          flex: 1,
          padding: "12px 10px",
          borderRadius: 14,
          cursor: "pointer",
          textAlign: "left",
          border: on ? "1px solid var(--color-purple)" : "1px solid var(--color-line)",
          background: on ? "rgba(155,109,255,0.14)" : "rgba(255,255,255,0.03)",
          color: "var(--color-ink)",
          transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--color-faint)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
          {on ? "BACKING" : "BACK"}
        </div>
        <div className="h-sec" style={{ fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </div>
      </button>
    );
  };

  return (
    <form action={action} className="glass" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="side" value={side ?? ""} />

      <div className="flex" style={{ gap: 10 }}>
        <Choice s="p1" name={p1Name} />
        <Choice s="p2" name={p2Name} />
      </div>

      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <label className="eyebrow" htmlFor="amount">Stake (Gambits)</label>
          <span style={{ fontSize: 11.5, color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
            balance {fmt(balance)}
          </span>
        </div>
        <input
          id="amount"
          name="amount"
          className="input num"
          type="number"
          min={MIN_BET}
          max={maxBet}
          step={10}
          value={Number.isFinite(amount) ? amount : ""}
          onChange={(e) => setAmount(Math.floor(Number(e.target.value)))}
        />
        <div className="flex" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {chips.map((c) => (
            <button key={c} type="button" className="pill" style={{ cursor: "pointer" }} onClick={() => setAmount(c)}>
              {c}
            </button>
          ))}
          <button type="button" className="pill" style={{ cursor: "pointer" }} onClick={() => setAmount(maxBet)}>
            All in
          </button>
        </div>
      </div>

      {estimate && side && (
        <div
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            background: "rgba(53,210,154,0.07)",
            border: "1px solid rgba(53,210,154,0.22)",
            fontSize: 13,
          }}
        >
          If <b>{side === "p1" ? p1Name : p2Name}</b> wins you get about{" "}
          <span className="num" style={{ color: "var(--color-green)", fontWeight: 600 }}>
            {fmt(estimate.payout)}
          </span>{" "}
          <span style={{ color: "var(--color-faint)" }}>({estimate.mult.toFixed(2)}×)</span>
          <div style={{ color: "var(--color-faint)", fontSize: 11, marginTop: 2 }}>Odds move as more bets land.</div>
        </div>
      )}

      {state.error && (
        <div style={{ fontSize: 13, color: "var(--color-red)" }}>{state.error}</div>
      )}

      <button className="btn btn-gold btn-block" type="submit" disabled={pending || invalid}>
        {pending ? "Placing…" : currentSide ? "Update bet" : "Place bet 🪙"}
      </button>
    </form>
  );
}
