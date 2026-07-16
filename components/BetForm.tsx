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
  const [amount, setAmount] = useState<number>(currentAmount || 5000);
  const [placed, setPlaced] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(placeBet, {});

  const maxBet = balance + currentAmount; // current bet is already debited

  useEffect(() => {
    if (state.ok) {
      setPlaced(true);
      router.refresh();
      const t = setTimeout(() => setPlaced(false), 2500);
      return () => clearTimeout(t);
    }
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

  const chips = [1000, 5000, 10000, 25000].filter((c) => c <= maxBet);
  const invalidReason = !side
    ? "Pick a player to back first."
    : !Number.isFinite(amount) || amount < MIN_BET
      ? `Minimum stake is ${MIN_BET} J-Coins.`
      : amount > maxBet
        ? `Max you can stake here is ${fmt(maxBet)}.`
        : null;

  const Choice = ({ s, name }: { s: "p1" | "p2"; name: string }) => {
    const on = side === s;
    const c = s === "p1" ? "155,109,255" : "239,127,26";
    return (
      <button
        type="button"
        onClick={() => setSide(s)}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "12px 12px",
          borderRadius: 13,
          cursor: "pointer",
          textAlign: "left",
          border: on ? `1px solid rgba(${c},0.65)` : "1px solid var(--color-line)",
          background: on ? `rgba(${c},0.13)` : "rgba(255,255,255,0.03)",
          color: "var(--color-ink)",
          transition: "all 0.14s ease",
          boxShadow: on ? `0 0 0 3px rgba(${c},0.12)` : "none",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.16em",
            marginBottom: 5,
            color: on ? `rgb(${c})` : "var(--color-faint)",
          }}
        >
          {on ? "● BACKING" : "BACK"}
        </div>
        <div className="h-sec" style={{ fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </div>
      </button>
    );
  };

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
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 13 }}
    >
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="side" value={side ?? ""} />

      <div className="flex" style={{ gap: 10 }}>
        <Choice s="p1" name={p1Name} />
        <Choice s="p2" name={p2Name} />
      </div>

      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
          <label className="eyebrow" htmlFor="amount">Stake</label>
          <span style={{ fontSize: 11.5, color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
            balance <span style={{ color: "var(--color-gold)" }}>{fmt(balance)}</span>
          </span>
        </div>
        <input
          id="amount"
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
        <div className="flex" style={{ gap: 8, marginTop: 9, flexWrap: "wrap" }}>
          {chips.map((c) => (
            <button key={c} type="button" className="chip" onClick={() => setAmount(c)}>
              {fmt(c)}
            </button>
          ))}
          {maxBet >= MIN_BET && (
            <button type="button" className="chip chip-gold" onClick={() => setAmount(maxBet)}>
              ALL IN · {fmt(maxBet)}
            </button>
          )}
        </div>
      </div>

      {estimate && side && (
        <div
          style={{
            borderRadius: 12,
            padding: "10px 13px",
            background: "rgba(53,210,154,0.06)",
            border: "1px solid rgba(53,210,154,0.22)",
            fontSize: 13.5,
          }}
        >
          If <b className={side === "p1" ? "side-p1" : "side-p2"}>{side === "p1" ? p1Name : p2Name}</b> wins, you
          collect ~{" "}
          <span className="num" style={{ color: "var(--color-green)", fontWeight: 700 }}>
            {fmt(estimate.payout)}
          </span>{" "}
          <span className="num" style={{ color: "var(--color-faint)", fontSize: 12 }}>({estimate.mult.toFixed(2)}×)</span>
          <div style={{ color: "var(--color-faint)", fontSize: 11, marginTop: 3 }}>Odds shift as more bets land.</div>
        </div>
      )}

      {(hint || state.error) && (
        <div style={{ fontSize: 13, color: "var(--color-red)" }}>{hint ?? state.error}</div>
      )}
      {placed && !state.error && !hint && (
        <div style={{ fontSize: 13, color: "var(--color-green)", fontFamily: "var(--font-mono)" }}>✓ Bet placed — you&apos;re in.</div>
      )}

      <button className="btn btn-gold btn-block" type="submit" disabled={pending}>
        {pending ? "Placing…" : currentSide ? "Update bet" : "Place bet"}
      </button>
    </form>
  );
}
