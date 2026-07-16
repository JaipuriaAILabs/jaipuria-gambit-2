// Pure display helpers — safe in both server and client components.

export const CURRENCY = "J-Coins";

export function fmt(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("en-IN");
}

export function oddsLabel(mult: number | null): string {
  if (mult == null) return "—";
  return `${mult.toFixed(2)}×`;
}

export function initials(name: string): string {
  // Array.from keeps emoji/astral characters intact (no split surrogate pairs).
  const parts = name.trim().split(/\s+/);
  const first = Array.from(parts[0] ?? "?")[0] ?? "?";
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}

// Deterministic avatar hue from a name.
export function avatarStyle(name: string): { background: string; color: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return {
    background: `linear-gradient(140deg, hsl(${h} 55% 32%), hsl(${(h + 40) % 360} 60% 22%))`,
    color: `hsl(${h} 70% 86%)`,
  };
}

// Chess-flavoured rank title by wallet size (calibrated to the 100k start).
export function rankTitle(balance: number): string {
  if (balance >= 300000) return "Grandmaster";
  if (balance >= 200000) return "Int'l Master";
  if (balance >= 140000) return "FIDE Master";
  if (balance >= 100000) return "Candidate Master";
  if (balance >= 50000) return "Club Player";
  if (balance >= 10000) return "Pawn Pusher";
  if (balance > 0) return "On tilt";
  return "Blundered it all";
}

export function rankBadge(index: number): string {
  return ["👑", "🥈", "🥉"][index] ?? "";
}

// Round-name from the numeric round.
export function roundName(round: number): string {
  return (
    { 1: "Round 1", 2: "Round 2", 3: "Round 3", 4: "Semifinal", 5: "Final" }[round] ??
    `Round ${round}`
  );
}

export const CHESS_GLYPHS = ["♜", "♞", "♝", "♛", "♚", "♟"];
