import "server-only";
import dns from "node:dns";
import postgres from "postgres";

// Serverless functions can black-hole on IPv6 to the pooler — prefer IPv4.
dns.setDefaultResultOrder("ipv4first");

// Single pooled client. On serverless we keep ONE connection (max:1) so a page
// firing several queries concurrently can't stall opening extra cross-region
// connections. Cached across hot reloads in dev.
const g = globalThis as unknown as { __gambitSql?: ReturnType<typeof postgres> };

const sql =
  g.__gambitSql ??
  postgres({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 6543),
    database: process.env.PGDATABASE ?? "postgres",
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: "require",
    prepare: false, // required for Supavisor transaction pooler
    max: 1,
    idle_timeout: 20,
    connect_timeout: 12,
  });

if (process.env.NODE_ENV !== "production") g.__gambitSql = sql;

export default sql;

/** bigint/int8 columns come back as string|BigInt — normalise to number. */
export const n = (v: unknown): number => (v == null ? 0 : Number(v));
