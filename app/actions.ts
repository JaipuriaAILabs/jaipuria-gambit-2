"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sql, { n } from "@/lib/db";
import { getSessionUser, setSession, clearSession, hashPin, verifyPin } from "@/lib/auth";
import {
  computeMatchPayouts,
  computeFuturesPayouts,
  MIN_BET,
} from "@/lib/parimutuel";

export type FormState = { error?: string; ok?: boolean };

function revalidateEverywhere(matchId?: string) {
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/futures");
  revalidatePath("/me");
  revalidatePath("/admin");
  if (matchId) revalidatePath(`/match/${matchId}`);
}

// ---------------- Auth: claim-your-name + PIN ----------------
export async function claimIdentity(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const pin = String(formData.get("pin") ?? "").trim();

  if (name.length < 2 || name.length > 40) return { error: "Enter your name (2–40 characters)." };
  if (!/^\d{4,8}$/.test(pin)) return { error: "PIN must be 4–8 digits." };

  const nameLower = name.toLowerCase();
  let userId: number;
  try {
    const existing = await sql`
      select id, pin_hash, failed_attempts, locked_until from gambit.users where name_lower=${nameLower}`;
    if (existing[0]) {
      // Brute-force guard: 5 wrong PINs locks the name for 15 minutes.
      const lockedUntil = existing[0].locked_until ? new Date(String(existing[0].locked_until)) : null;
      if (lockedUntil && lockedUntil > new Date()) {
        return { error: "Too many wrong PINs — this name is locked for a bit. Try later." };
      }
      if (!verifyPin(pin, existing[0].pin_hash as string)) {
        const attempts = n(existing[0].failed_attempts) + 1;
        if (attempts >= 5) {
          await sql`update gambit.users set failed_attempts=0, locked_until=now() + interval '15 minutes' where id=${n(existing[0].id)}`;
        } else {
          await sql`update gambit.users set failed_attempts=${attempts} where id=${n(existing[0].id)}`;
        }
        return { error: "That name is already claimed — wrong PIN." };
      }
      await sql`update gambit.users set failed_attempts=0, locked_until=null where id=${n(existing[0].id)}`;
      userId = n(existing[0].id);
    } else {
      // on conflict guards the two-people-same-name-simultaneously race
      const inserted = await sql`
        insert into gambit.users (name, name_lower, pin_hash)
        values (${name}, ${nameLower}, ${hashPin(pin)})
        on conflict (name_lower) do nothing returning id`;
      if (!inserted[0]) return { error: "That name just got claimed — try again." };
      userId = n(inserted[0].id);
      await sql`insert into gambit.activity (kind, text)
                values ('join', ${`${name} joined the table with 1,000 Gambits 🎲`})`;
    }
  } catch {
    return { error: "Hiccup at the table — try again." };
  }

  await setSession(userId);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

// ---------------- Place / edit a match bet ----------------
export async function placeBet(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Log in first." };

  const matchId = String(formData.get("matchId") ?? "");
  const side = String(formData.get("side") ?? "");
  const amount = Math.floor(Number(formData.get("amount")));

  if (side !== "p1" && side !== "p2") return { error: "Pick a player to back." };
  if (!Number.isFinite(amount) || amount < MIN_BET) return { error: `Minimum bet is ${MIN_BET} Gambits.` };

  try {
    await sql.begin(async (tx) => {
      const [m] = await tx`
        select m.status, m.p1_player_id, m.p2_player_id, p1.name as p1n, p2.name as p2n
        from gambit.matches m
        left join gambit.players p1 on p1.id=m.p1_player_id
        left join gambit.players p2 on p2.id=m.p2_player_id
        where m.id=${matchId} for update of m`;
      if (!m) throw new Error("Match not found.");
      if (m.status !== "open") throw new Error("Betting is closed on this match.");
      if (side === "p1" && m.p1_player_id == null) throw new Error("That player isn't set yet.");
      if (side === "p2" && m.p2_player_id == null) throw new Error("That player isn't set yet.");

      const [existing] = await tx`
        select amount from gambit.bets where user_id=${user.id} and match_id=${matchId} for update`;
      const old = existing ? n(existing.amount) : 0;
      const delta = amount - old;

      const [u] = await tx`select balance from gambit.users where id=${user.id} for update`;
      if (n(u.balance) - delta < 0) throw new Error("Not enough Gambits for that.");

      await tx`update gambit.users set balance = balance - ${delta} where id=${user.id}`;
      await tx`
        insert into gambit.bets (user_id, match_id, side, amount)
        values (${user.id}, ${matchId}, ${side}, ${amount})
        on conflict (user_id, match_id)
        do update set side=excluded.side, amount=excluded.amount, created_at=now(), status='open'`;

      const backed = side === "p1" ? (m.p1n as string) : (m.p2n as string);
      const verb = old === 0 ? "backed" : "moved onto";
      await tx`insert into gambit.activity (kind, text)
               values ('bet', ${`${user.name} ${verb} ${backed} for ${amount.toLocaleString("en-IN")} 🎯`})`;
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidateEverywhere(matchId);
  return { ok: true };
}

// ---------------- Place a champion futures bet ----------------
export async function placeFutures(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Log in first." };

  const playerId = Math.floor(Number(formData.get("playerId")));
  const amount = Math.floor(Number(formData.get("amount")));
  if (!Number.isInteger(playerId)) return { error: "Pick a player." };
  if (!Number.isFinite(amount) || amount < MIN_BET) return { error: `Minimum bet is ${MIN_BET} Gambits.` };

  try {
    await sql.begin(async (tx) => {
      const [state] = await tx`select futures_open from gambit.app_state where id=1 for update`;
      if (!state?.futures_open) throw new Error("Futures betting is closed.");
      // FOR UPDATE: don't accept a bet racing a settlement that eliminates this player.
      const [p] = await tx`select name, eliminated from gambit.players where id=${playerId} for update`;
      if (!p) throw new Error("Player not found.");
      if (p.eliminated) throw new Error(`${p.name} is already out.`);
      // No sniping: can't back a player while their match is being played.
      const [inPlay] = await tx`
        select id from gambit.matches
        where status='locked' and (p1_player_id=${playerId} or p2_player_id=${playerId}) limit 1`;
      if (inPlay) throw new Error(`${p.name} is mid-game right now — futures reopen when it's called.`);

      const [u] = await tx`select balance from gambit.users where id=${user.id} for update`;
      if (n(u.balance) - amount < 0) throw new Error("Not enough Gambits for that.");

      await tx`update gambit.users set balance = balance - ${amount} where id=${user.id}`;
      await tx`insert into gambit.futures_bets (user_id, player_id, amount)
               values (${user.id}, ${playerId}, ${amount})`;
      await tx`insert into gambit.activity (kind, text)
               values ('futures', ${`${user.name} bet ${amount.toLocaleString("en-IN")} on ${p.name} to win it all 🏆`})`;
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidateEverywhere();
  return { ok: true };
}

// ---------------- Admin: lock / reopen a market ----------------
export async function adminSetStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await getSessionUser();
  if (!admin?.is_admin) return { error: "Not authorised." };
  const matchId = String(formData.get("matchId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "open" && status !== "locked") return { error: "Bad status." };
  try {
    await sql`update gambit.matches set status=${status} where id=${matchId} and status in ('open','locked')`;
    // The final going live is the futures cutoff — no piling onto the visible winner.
    if (matchId === "M19" && status === "locked") {
      await sql`update gambit.app_state set futures_open=false where id=1`;
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateEverywhere(matchId);
  return { ok: true };
}

export async function adminToggleFutures() {
  const admin = await getSessionUser();
  if (!admin?.is_admin) throw new Error("Not authorised.");
  await sql`update gambit.app_state set futures_open = not futures_open where id=1`;
  revalidateEverywhere();
}

// ---------------- Admin: attach a live-game link (chess.com etc.) ----------------
export async function adminSetGameUrl(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await getSessionUser();
  if (!admin?.is_admin) return { error: "Not authorised." };
  const matchId = String(formData.get("matchId") ?? "");
  const raw = String(formData.get("gameUrl") ?? "").trim();

  let url: string | null = null;
  if (raw) {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const u = new URL(candidate);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      url = u.toString();
    } catch {
      return { error: "That doesn't look like a valid link." };
    }
  }
  try {
    await sql`update gambit.matches set game_url=${url} where id=${matchId}`;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateEverywhere(matchId);
  return { ok: true };
}

// ---------------- Admin: settle a match (payouts + bracket advance) ----------------
export async function adminSettle(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await getSessionUser();
  if (!admin?.is_admin) return { error: "Not authorised." };
  const matchId = String(formData.get("matchId") ?? "");
  const winnerId = Math.floor(Number(formData.get("winnerId")));

  try {
  await sql.begin(async (tx) => {
    const [m] = await tx`select * from gambit.matches where id=${matchId} for update`;
    if (!m) throw new Error("Match not found.");
    if (m.status === "settled") throw new Error("Already settled.");
    if (m.status !== "locked") throw new Error("Lock betting first, then declare the winner.");
    if (m.p1_player_id == null || m.p2_player_id == null) throw new Error("Both players aren't set yet.");
    const p1 = n(m.p1_player_id);
    const p2 = n(m.p2_player_id);
    if (winnerId !== p1 && winnerId !== p2) throw new Error("Winner must be one of the two players.");

    const winSide: "p1" | "p2" = winnerId === p1 ? "p1" : "p2";
    const loserId = winSide === "p1" ? p2 : p1;

    const bets = (
      await tx`select id, user_id, side, amount from gambit.bets where match_id=${matchId} and status='open'`
    ).map((r) => ({ id: n(r.id), user_id: n(r.user_id), side: r.side as string, amount: n(r.amount) }));

    const { results, total } = computeMatchPayouts(bets, winSide);
    const winStake = bets.filter((b) => b.side === winSide).reduce((s, b) => s + b.amount, 0);
    const losePool = total - winStake;

    for (const r of results) {
      await tx`update gambit.bets set status=${r.status}, payout=${r.payout} where id=${r.id}`;
      if (r.payout > 0) await tx`update gambit.users set balance=balance+${r.payout} where id=${r.user_id}`;
    }

    await tx`update gambit.matches set status='settled', winner_player_id=${winnerId}, settled_at=now() where id=${matchId}`;
    await tx`update gambit.players set eliminated=true where id=${loserId}`;
    await tx`update gambit.futures_bets set status='lost', payout=0 where player_id=${loserId} and status='open'`;

    // Bracket auto-advance: fill the winner into any slot that referenced this match.
    await tx`update gambit.matches set p1_player_id=${winnerId} where p1_ref=${"winner:" + matchId}`;
    await tx`update gambit.matches set p2_player_id=${winnerId} where p2_ref=${"winner:" + matchId}`;
    await tx`update gambit.matches set status='open'
             where status='pending' and p1_player_id is not null and p2_player_id is not null`;

    const [wn] = await tx`select name from gambit.players where id=${winnerId}`;
    const [ln] = await tx`select name from gambit.players where id=${loserId}`;
    const mult = winStake > 0 ? total / winStake : 0;
    const upset = total > 0 && winStake > 0 && winStake < losePool;
    const tail = mult > 1 ? ` (backers paid ${mult.toFixed(2)}×)` : "";
    const text = upset
      ? `⚡ UPSET — ${wn?.name} stuns ${ln?.name}${tail}`
      : `${wn?.name} defeats ${ln?.name}${tail}`;
    await tx`insert into gambit.activity (kind, text) values (${upset ? "upset" : "match_settled"}, ${text})`;

    // Final: crown champion and settle the futures pool.
    if (matchId === "M19") {
      await tx`update gambit.app_state set champion_player_id=${winnerId}, futures_open=false where id=1`;
      const fbets = (
        await tx`select id, user_id, player_id, amount from gambit.futures_bets`
      ).map((r) => ({
        id: n(r.id),
        user_id: n(r.user_id),
        side: String(n(r.player_id)),
        amount: n(r.amount),
      }));
      const fr = computeFuturesPayouts(fbets, winnerId);
      for (const r of fr.results) {
        await tx`update gambit.futures_bets set status=${r.status}, payout=${r.payout} where id=${r.id}`;
        if (r.payout > 0) await tx`update gambit.users set balance=balance+${r.payout} where id=${r.user_id}`;
      }
      await tx`insert into gambit.activity (kind, text)
               values ('champion', ${`🏆 ${wn?.name} is the office chess champion!`})`;
    }
  });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidateEverywhere(matchId);
  return { ok: true };
}
