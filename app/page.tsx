import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMatches, getActivity, getStats } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { ActivityTicker } from "@/components/ActivityTicker";
import { AutoRefresh } from "@/components/AutoRefresh";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass" style={{ padding: "12px 14px", minWidth: 0 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className="h-sec num" style={{ fontSize: 18, color: accent ?? "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 12 }}>
        <h2 className="h-sec" style={{ fontSize: 17 }}>{title}</h2>
        {hint && <span className="eyebrow">{hint}</span>}
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {children}
      </div>
    </section>
  );
}

export default async function Lobby() {
  await requireUser();
  const matches = await getMatches();
  const activity = await getActivity(30);
  const stats = await getStats();

  const open = matches.filter((m) => m.status === "open");
  const live = matches.filter((m) => m.status === "locked");
  const upcoming = matches.filter((m) => m.status === "pending");
  const done = matches.filter((m) => m.status === "settled");

  return (
    <div className="wrap-wide rise" style={{ paddingTop: 14 }}>
      <AutoRefresh />

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, 1fr)" }}>
        <Stat label="In play" value={`${fmt(stats.inPlay)} 🪙`} accent="var(--color-gold)" />
        <Stat label="Players" value={`${stats.players}`} />
        <Stat label="Hottest match" value={stats.hottest ? `${stats.hottest.label} · ${fmt(stats.hottest.pool)}` : "—"} accent="var(--color-orange)" />
        <Stat label="People's champ" value={stats.peoplesChampion ? stats.peoplesChampion.name : "wide open"} accent="var(--color-purple)" />
      </div>

      <div style={{ marginTop: 12 }}>
        <ActivityTicker items={activity} />
      </div>

      <Link href="/futures" style={{ textDecoration: "none" }}>
        <div
          className="glass card-hover"
          style={{ marginTop: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(120deg, rgba(155,109,255,0.14), rgba(239,127,26,0.08))" }}
        >
          <div>
            <div className="h-sec" style={{ fontSize: 15 }}>♛ Who lifts the trophy?</div>
            <div style={{ fontSize: 12.5, color: "var(--color-muted)" }}>Back the champion early for the biggest payouts.</div>
          </div>
          <span style={{ color: "var(--color-purple)", fontFamily: "var(--font-mono)", fontSize: 13 }}>Futures →</span>
        </div>
      </Link>

      {open.length > 0 && (
        <Section title="Open for betting" hint={`${open.length} live`}>
          {open.map((m) => <MatchCard key={m.id} m={m} />)}
        </Section>
      )}
      {live.length > 0 && (
        <Section title="In play" hint="locked">
          {live.map((m) => <MatchCard key={m.id} m={m} />)}
        </Section>
      )}
      {upcoming.length > 0 && (
        <Section title="Coming up" hint="bracket fills in as matches finish">
          {upcoming.map((m) => <MatchCard key={m.id} m={m} />)}
        </Section>
      )}
      {done.length > 0 && (
        <Section title="Results">
          {done.map((m) => <MatchCard key={m.id} m={m} />)}
        </Section>
      )}
    </div>
  );
}
