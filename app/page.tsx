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
      <div
        className="h-sec num"
        style={{ fontSize: 17, color: accent ?? "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 12 }}>
        <h2 className="h-sec" style={{ fontSize: 18 }}>{title}</h2>
        {hint && <span className="eyebrow">{hint}</span>}
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))" }}>
        {children}
      </div>
    </section>
  );
}

export default async function Lobby() {
  const user = await requireUser();
  const matches = await getMatches();
  const activity = await getActivity(30);
  const stats = await getStats();

  const open = matches.filter((m) => m.status === "open");
  const live = matches.filter((m) => m.status === "locked");
  const upcoming = matches.filter((m) => m.status === "pending");
  const done = matches.filter((m) => m.status === "settled");
  const firstName = user.name.split(" ")[0];

  return (
    <div className="wrap-wide rise" style={{ paddingTop: 16 }}>
      <AutoRefresh />

      {/* Hero */}
      <div style={{ position: "relative", marginBottom: 16, paddingRight: 60 }}>
        <span className="watermark" aria-hidden>♞</span>
        <div className="eyebrow" style={{ marginBottom: 6 }}>office chess · 16–17 jul</div>
        <h1 className="h-hero" style={{ fontSize: 30 }}>
          Place your bets,<br />
          <span style={{ color: "var(--color-purple)" }}>{firstName}.</span>
        </h1>
        <div className="flex" style={{ gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <span className="pill">R1 · today 2:30</span>
          <span className="pill">R2 · today 4:00</span>
          <span className="pill">R3 · today 4:40</span>
          <span className="pill">semis + final · tomorrow</span>
        </div>
      </div>

      <div className="checker" style={{ marginBottom: 16 }} />

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, 1fr)" }}>
        <Stat label="Gambits in play" value={`${fmt(stats.inPlay)}`} accent="var(--color-gold)" />
        <Stat label="Punters" value={`${stats.players}`} />
        <Stat label="Hottest pot" value={stats.hottest ? `${stats.hottest.label} · ${fmt(stats.hottest.pool)}` : "—"} accent="var(--color-orange)" />
        <Stat label="Crowd favourite" value={stats.peoplesChampion ? stats.peoplesChampion.name : "wide open"} accent="var(--color-purple)" />
      </div>

      <div style={{ marginTop: 12 }}>
        <ActivityTicker items={activity} />
      </div>

      <Link href="/futures" style={{ textDecoration: "none" }}>
        <div
          className="glass card-hover"
          style={{
            marginTop: 14,
            padding: "15px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderColor: "rgba(245,196,81,0.22)",
          }}
        >
          <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
            <span style={{ fontSize: 22 }}>♛</span>
            <div style={{ minWidth: 0 }}>
              <div className="h-sec" style={{ fontSize: 15 }}>Who lifts the trophy?</div>
              <div style={{ fontSize: 12.5, color: "var(--color-muted)" }}>Back the champion early — biggest payouts in the house.</div>
            </div>
          </div>
          <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-mono)", fontSize: 13, whiteSpace: "nowrap" }}>futures →</span>
        </div>
      </Link>

      {open.length > 0 && (
        <Section title="Open for betting" hint={`${open.length} markets`}>
          {open.map((m) => <MatchCard key={m.id} m={m} />)}
        </Section>
      )}
      {live.length > 0 && (
        <Section title="In play" hint="markets locked">
          {live.map((m) => <MatchCard key={m.id} m={m} />)}
        </Section>
      )}
      {upcoming.length > 0 && (
        <Section title="Coming up" hint="bracket fills in as results land">
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
