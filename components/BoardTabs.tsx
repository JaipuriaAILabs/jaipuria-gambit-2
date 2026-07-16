"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { fmt, rankTitle, roundName } from "@/lib/format";
import type { LeaderRow, PlayerBoardRow } from "@/lib/queries";

function BettorBoard({ rows, meId }: { rows: LeaderRow[]; meId: number }) {
  if (!rows.length)
    return <div className="glass" style={{ padding: 16, color: "var(--color-faint)", fontSize: 13.5 }}>Nobody at the table yet.</div>;
  return (
    <div className="glass" style={{ padding: 6 }}>
      {rows.map((r, i) => {
        const isMe = r.id === meId;
        return (
          <div
            key={r.id}
            className={`flex items-center justify-between ${i < 3 ? `rank-${i + 1}` : ""}`}
            style={{
              padding: "11px 12px",
              borderTop: i ? "1px solid var(--color-line)" : "none",
              background: isMe ? "rgba(155,109,255,0.09)" : "transparent",
              borderRadius: i === 0 ? "12px 12px 0 0" : i === rows.length - 1 ? "0 0 12px 12px" : 0,
            }}
          >
            <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
              <span className="num" style={{ width: 26, textAlign: "center", color: i < 3 ? "var(--color-gold)" : "var(--color-faint)", fontSize: 13, fontWeight: 700 }}>
                {["♔", "♕", "♖"][i] ?? i + 1}
              </span>
              <Avatar name={r.name} size={34} />
              <div style={{ minWidth: 0 }}>
                <div className="h-sec" style={{ fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.name}
                  {isMe && <span style={{ color: "var(--color-purple)", fontSize: 10.5, marginLeft: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>YOU</span>}
                </div>
                <div className="eyebrow" style={{ letterSpacing: "0.08em" }}>{rankTitle(r.balance)}</div>
              </div>
            </div>
            <div className="num" style={{ color: "var(--color-gold)", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>
              {fmt(r.balance)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlayerBoard({ rows }: { rows: PlayerBoardRow[] }) {
  return (
    <div className="glass" style={{ padding: 6 }}>
      {rows.map((p, i) => (
        <div
          key={p.player_id}
          className="flex items-center justify-between"
          style={{
            padding: "11px 12px",
            borderTop: i ? "1px solid var(--color-line)" : "none",
            opacity: p.eliminated && !p.is_champion ? 0.42 : 1,
          }}
        >
          <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
            <Avatar name={p.name} size={34} />
            <div style={{ minWidth: 0 }}>
              <div className="h-sec" style={{ fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.is_champion && <span style={{ color: "var(--color-gold)" }}>👑 </span>}
                <span style={{ textDecoration: p.eliminated && !p.is_champion ? "line-through" : "none" }}>{p.name}</span>
              </div>
              <div className="eyebrow" style={{ letterSpacing: "0.08em" }}>
                {p.is_champion
                  ? "CHAMPION"
                  : p.eliminated
                    ? "knocked out"
                    : p.played === 0
                      ? "yet to play"
                      : `alive · ${roundName(p.round_reached).toLowerCase()}`}
                {p.backing > 0 && <span style={{ color: "var(--color-gold)" }}> · {fmt(p.backing)} riding</span>}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <span className="num" style={{ fontSize: 15, fontWeight: 700, color: p.wins > 0 ? "var(--color-green)" : "var(--color-faint)" }}>
              {p.wins}W
            </span>
            <span className="num" style={{ fontSize: 12.5, color: "var(--color-faint)", marginLeft: 6 }}>
              {p.played}P
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BoardTabs({ bettors, players, meId }: { bettors: LeaderRow[]; players: PlayerBoardRow[]; meId: number }) {
  const [tab, setTab] = useState<"bettors" | "players">("bettors");
  return (
    <div>
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button type="button" className={`tab ${tab === "bettors" ? "tab-active" : ""}`} onClick={() => setTab("bettors")}>
          🪙 Punters
        </button>
        <button type="button" className={`tab ${tab === "players" ? "tab-active" : ""}`} onClick={() => setTab("players")}>
          ♟ Players
        </button>
      </div>
      {tab === "bettors" ? <BettorBoard rows={bettors} meId={meId} /> : <PlayerBoard rows={players} />}
    </div>
  );
}
