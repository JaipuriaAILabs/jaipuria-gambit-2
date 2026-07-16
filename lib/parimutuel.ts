// Pure pari-mutuel math. No DB, no side effects — easy to reason about and test.

export type BetLike = { id: number; user_id: number; side: string; amount: number };
export type PayoutResult = {
  id: number;
  user_id: number;
  amount: number;
  payout: number; // total credited back to wallet (stake + winnings)
  status: "won" | "lost" | "refunded";
};

/**
 * Implied decimal odds (payout multiple on a winning stake) for one side of a pool.
 * Returns null when nothing is staked on that side yet.
 */
export function impliedOdds(sidePool: number, totalPool: number): number | null {
  if (sidePool <= 0) return null;
  return totalPool / sidePool; // >= 1.0
}

/**
 * Settle a two-way match pool.
 * - Winners split the ENTIRE pool in proportion to their stake (>= their stake back).
 * - If nobody backed the winner, everyone is refunded (fairness, no house).
 */
export function computeMatchPayouts(bets: BetLike[], winSide: "p1" | "p2") {
  const total = bets.reduce((s, b) => s + b.amount, 0);
  const winStake = bets.filter((b) => b.side === winSide).reduce((s, b) => s + b.amount, 0);

  if (total === 0) {
    return { total, winStake, refundAll: false, results: [] as PayoutResult[] };
  }
  if (winStake === 0) {
    return {
      total,
      winStake,
      refundAll: true,
      results: bets.map((b) => ({
        id: b.id,
        user_id: b.user_id,
        amount: b.amount,
        payout: b.amount,
        status: "refunded" as const,
      })),
    };
  }
  const results: PayoutResult[] = bets.map((b) => {
    if (b.side === winSide) {
      return {
        id: b.id,
        user_id: b.user_id,
        amount: b.amount,
        payout: Math.floor((b.amount * total) / winStake),
        status: "won" as const,
      };
    }
    return { id: b.id, user_id: b.user_id, amount: b.amount, payout: 0, status: "lost" as const };
  });
  return { total, winStake, refundAll: false, results };
}

/**
 * Settle the champion futures pool once the tournament winner is known.
 * `bets` = ALL futures bets ever placed (losers' money stays in the pool as dead money).
 */
export function computeFuturesPayouts(bets: BetLike[], championPlayerId: number) {
  const total = bets.reduce((s, b) => s + b.amount, 0);
  const winStake = bets
    .filter((b) => b.side === String(championPlayerId))
    .reduce((s, b) => s + b.amount, 0);

  if (total === 0) return { total, winStake, refundAll: false, results: [] as PayoutResult[] };
  if (winStake === 0) {
    return {
      total,
      winStake,
      refundAll: true,
      results: bets.map((b) => ({
        id: b.id,
        user_id: b.user_id,
        amount: b.amount,
        payout: b.amount,
        status: "refunded" as const,
      })),
    };
  }
  const results: PayoutResult[] = bets.map((b) => {
    if (b.side === String(championPlayerId)) {
      return {
        id: b.id,
        user_id: b.user_id,
        amount: b.amount,
        payout: Math.floor((b.amount * total) / winStake),
        status: "won" as const,
      };
    }
    return { id: b.id, user_id: b.user_id, amount: b.amount, payout: 0, status: "lost" as const };
  });
  return { total, winStake, refundAll: false, results };
}

export const STARTING_BALANCE = 100000;
export const MIN_BET = 100;
