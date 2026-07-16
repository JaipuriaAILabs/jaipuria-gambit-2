import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="wrap rise" style={{ paddingTop: 52, paddingBottom: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div
          className="glass"
          style={{
            width: 72,
            height: 72,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            marginBottom: 18,
            borderColor: "rgba(155,109,255,0.3)",
          }}
        >
          ♞
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>office chess championship · 16–17 jul</div>
        <h1 className="h-hero" style={{ fontSize: 40, marginBottom: 12 }}>
          The Jaipuria<br />
          <span style={{ color: "var(--color-purple)" }}>Gambit</span>
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: 14.5, maxWidth: 380, margin: "0 auto", lineHeight: 1.55 }}>
          The office tournament, with skin in the game. Bet fake J-Coins on every
          match, read the crowd, climb the board. No real money — just bragging rights.
        </p>
      </div>

      <div className="checker" style={{ marginBottom: 22 }} />

      <LoginForm />

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--color-faint)", marginTop: 18, fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}>
        20 PLAYERS · 19 MATCHES · ONE CHAMPION
      </p>
    </div>
  );
}
