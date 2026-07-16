import "server-only";
import sql, { n } from "./db";
import { impliedOdds } from "./parimutuel";

export type MatchRow = {
  id: string;
  round: number;
  ord: number;
  status: "pending" | "open" | "locked" | "settled";
  scheduled_label: string | null;
  p1_ref: string;
  p2_ref: string;
  p1_player_id: number | null;
  p2_player_id: number | null;
  p1_name: string | null;
  p2_name: string | null;
  winner_player_id: number | null;
  winner_name: string | null;
  pool_p1: number;
  pool_p2: number;
  bet_count: number;
  odds_p1: number | null;
  odds_p2: number | null;
};

function mapMatch(r: Record<string, unknown>): MatchRow {
  const pool_p1 = n(r.pool_p1);
  const pool_p2 = n(r.pool_p2);
  const total = pool_p1 + pool_p2;
  return {
    id: r.id as string,
    round: n(r.round),
    ord: n(r.ord),
    status: r.status as MatchRow["status"],
    scheduled_label: (r.scheduled_label as string) ?? null,
    p1_ref: r.p1_ref as string,
    p2_ref: r.p2_ref as string,
    p1_player_id: r.p1_player_id == null ? null : n(r.p1_player_id),
    p2_player_id: r.p2_player_id == null ? null : n(r.p2_player_id),
    p1_name: (r.p1_name as string) ?? null,
    p2_name: (r.p2_name as string) ?? null,
    winner_player_id: r.winner_player_id == null ? null : n(r.winner_player_id),
    winner_name: (r.winner_name as string) ?? null,
    pool_p1,
    pool_p2,
    bet_count: n(r.bet_count),
    odds_p1: impliedOdds(pool_p1, total),
    odds_p2: impliedOdds(pool_p2, total),
  };
}

const MATCH_SELECT = sql`
  select m.id, m.round, m.ord, m.status, m.scheduled_label, m.p1_ref, m.p2_ref,
         m.p1_player_id, m.p2_player_id, m.winner_player_id,
         p1.name as p1_name, p2.name as p2_name, w.name as winner_name,
         coalesce((select sum(amount) from gambit.bets b where b.match_id=m.id and b.side='p1'),0) as pool_p1,
         coalesce((select sum(amount) from gambit.bets b where b.match_id=m.id and b.side='p2'),0) as pool_p2,
         (select count(*) from gambit.bets b where b.match_id=m.id) as bet_count
  from gambit.matches m
  left join gambit.players p1 on p1.id=m.p1_player_id
  left join gambit.players p2 on p2.id=m.p2_player_id
  left join gambit.players w  on w.id=m.winner_player_id
`;

export async function getMatches(): Promise<MatchRow[]> {
  const rows = await sql`${MATCH_SELECT} order by m.ord`;
  return rows.map((r) => mapMatch(r as Record<string, unknown>));
}

export async function getMatch(id: string): Promise<MatchRow | null> {
  const rows = await sql`${MATCH_SELECT} where m.id=${id}`;
  return rows[0] ? mapMatch(rows[0] as Record<string, unknown>) : null;
}

export type RecentBet = { name: string; side: string; amount: number; created_at: string };
export async function getMatchBets(id: string): Promise<RecentBet[]> {
  const rows = await sql`
    select u.name, b.side, b.amount, b.created_at
    from gambit.bets b join gambit.users u on u.id=b.user_id
    where b.match_id=${id} order by b.created_at desc limit 14`;
  return rows.map((r) => ({
    name: r.name as string,
    side: r.side as string,
    amount: n(r.amount),
    created_at: String(r.created_at),
  }));
}

export type LeaderRow = { id: number; name: string; balance: number; is_admin: boolean };
export async function getLeaderboard(): Promise<LeaderRow[]> {
  const rows = await sql`
    select id, name, balance, is_admin from gambit.users order by balance desc, id asc`;
  return rows.map((r) => ({
    id: n(r.id),
    name: r.name as string,
    balance: n(r.balance),
    is_admin: r.is_admin as boolean,
  }));
}

export type ActivityRow = { id: number; kind: string; text: string; created_at: string };
export async function getActivity(limit = 40): Promise<ActivityRow[]> {
  const rows = await sql`
    select id, kind, text, created_at from gambit.activity
    order by created_at desc limit ${limit}`;
  return rows.map((r) => ({
    id: n(r.id),
    kind: r.kind as string,
    text: r.text as string,
    created_at: String(r.created_at),
  }));
}

export type FuturesPlayer = {
  player_id: number;
  name: string;
  eliminated: boolean;
  pool: number;
  backers: number;
  odds: number | null;
};
export async function getFutures(): Promise<{
  players: FuturesPlayer[];
  totalPool: number;
  futuresOpen: boolean;
}> {
  const [state] = await sql`select futures_open from gambit.app_state where id=1`;
  const rows = await sql`
    select p.id as player_id, p.name, p.eliminated,
           coalesce(sum(f.amount),0) as pool,
           count(f.id) as backers
    from gambit.players p
    left join gambit.futures_bets f on f.player_id=p.id
    group by p.id, p.name, p.eliminated
    order by p.eliminated asc, pool desc, p.name asc`;
  const totalPool = rows.reduce((s, r) => s + n(r.pool), 0);
  const players = rows.map((r) => {
    const pool = n(r.pool);
    return {
      player_id: n(r.player_id),
      name: r.name as string,
      eliminated: r.eliminated as boolean,
      pool,
      backers: n(r.backers),
      odds: impliedOdds(pool, totalPool),
    };
  });
  return { players, totalPool, futuresOpen: (state?.futures_open as boolean) ?? false };
}

export type MyMatchBet = {
  match_id: string;
  status: string;
  side: string;
  amount: number;
  payout: number;
  bet_status: string;
  p1_name: string | null;
  p2_name: string | null;
  backed_name: string | null;
  winner_name: string | null;
};
export type MyFuturesBet = {
  player_name: string;
  amount: number;
  payout: number;
  bet_status: string;
  eliminated: boolean;
};
export async function getUserBets(userId: number): Promise<{
  match: MyMatchBet[];
  futures: MyFuturesBet[];
}> {
  const match = await sql`
    select b.match_id, m.status, b.side, b.amount, b.payout, b.status as bet_status,
           p1.name as p1_name, p2.name as p2_name, w.name as winner_name,
           case when b.side='p1' then p1.name else p2.name end as backed_name
    from gambit.bets b
    join gambit.matches m on m.id=b.match_id
    left join gambit.players p1 on p1.id=m.p1_player_id
    left join gambit.players p2 on p2.id=m.p2_player_id
    left join gambit.players w  on w.id=m.winner_player_id
    where b.user_id=${userId} order by m.ord`;
  const futures = await sql`
    select p.name as player_name, f.amount, f.payout, f.status as bet_status, p.eliminated
    from gambit.futures_bets f join gambit.players p on p.id=f.player_id
    where f.user_id=${userId} order by f.created_at desc`;
  return {
    match: match.map((r) => ({
      match_id: r.match_id as string,
      status: r.status as string,
      side: r.side as string,
      amount: n(r.amount),
      payout: n(r.payout),
      bet_status: r.bet_status as string,
      p1_name: (r.p1_name as string) ?? null,
      p2_name: (r.p2_name as string) ?? null,
      backed_name: (r.backed_name as string) ?? null,
      winner_name: (r.winner_name as string) ?? null,
    })),
    futures: futures.map((r) => ({
      player_name: r.player_name as string,
      amount: n(r.amount),
      payout: n(r.payout),
      bet_status: r.bet_status as string,
      eliminated: r.eliminated as boolean,
    })),
  };
}

export async function getUserMatchBet(userId: number, matchId: string) {
  const rows = await sql`
    select side, amount from gambit.bets where user_id=${userId} and match_id=${matchId}`;
  return rows[0] ? { side: rows[0].side as string, amount: n(rows[0].amount) } : null;
}

export type Stats = {
  inPlay: number;
  players: number;
  hottest: { id: string; label: string; pool: number } | null;
  peoplesChampion: { name: string; backers: number } | null;
};
export async function getStats(): Promise<Stats> {
  // Serial, not Promise.all: concurrent queries on the pooler stall from serverless.
  const [live] = await sql`select coalesce(sum(amount),0) as v from gambit.bets where status='open'`;
  const [fut] = await sql`select coalesce(sum(amount),0) as v from gambit.futures_bets where status='open'`;
  const [ucount] = await sql`select count(*) as v from gambit.users`;
  const hottestRows = await sql`
      select m.id,
        coalesce((select sum(amount) from gambit.bets b where b.match_id=m.id),0) as pool
      from gambit.matches m where m.status in ('open','locked')
      order by pool desc limit 1`;
  const champRows = await sql`
      select p.name, count(f.id) as backers
      from gambit.players p join gambit.futures_bets f on f.player_id=p.id
      where p.eliminated=false
      group by p.name order by backers desc, sum(f.amount) desc limit 1`;
  const hottest =
    hottestRows[0] && n(hottestRows[0].pool) > 0
      ? { id: hottestRows[0].id as string, label: hottestRows[0].id as string, pool: n(hottestRows[0].pool) }
      : null;
  const peoplesChampion = champRows[0]
    ? { name: champRows[0].name as string, backers: n(champRows[0].backers) }
    : null;
  return {
    inPlay: n(live.v) + n(fut.v),
    players: n(ucount.v),
    hottest,
    peoplesChampion,
  };
}
