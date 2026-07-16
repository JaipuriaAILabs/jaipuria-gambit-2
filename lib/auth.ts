import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import sql, { n } from "./db";

const COOKIE = "gambit_session";
const SECRET: string =
  process.env.SESSION_SECRET ??
  (() => {
    throw new Error("SESSION_SECRET is not set — refusing to run with a forgeable secret.");
  })();

// ---------- PIN hashing (scrypt, built-in crypto) ----------
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pin, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(pin, Buffer.from(saltHex, "hex"), 32);
  const target = Buffer.from(hashHex, "hex");
  return hash.length === target.length && crypto.timingSafeEqual(hash, target);
}

// ---------- Signed session cookie (stateless) ----------
function sign(userId: number): string {
  const mac = crypto.createHmac("sha256", SECRET).update(String(userId)).digest("hex");
  return `${userId}.${mac}`;
}

function verify(token: string | undefined): number | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const id = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(id).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const num = Number(id);
  return Number.isInteger(num) ? num : null;
}

export async function setSession(userId: number) {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export type SessionUser = {
  id: number;
  name: string;
  balance: number;
  is_admin: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const id = verify(jar.get(COOKIE)?.value);
  if (id == null) return null;
  const rows = await sql`select id, name, balance, is_admin from gambit.users where id = ${id}`;
  if (!rows[0]) return null;
  return {
    id: n(rows[0].id),
    name: rows[0].name as string,
    balance: n(rows[0].balance),
    is_admin: rows[0].is_admin as boolean,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (!u.is_admin) redirect("/");
  return u;
}
