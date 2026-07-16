import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="wrap rise" style={{ paddingTop: 48, paddingBottom: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>♞</div>
        <h1 className="h-hero" style={{ fontSize: 34, marginBottom: 8 }}>
          The Jaipuria <span style={{ color: "var(--color-purple)" }}>Gambit</span>
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: 15, maxWidth: 380, margin: "0 auto", lineHeight: 1.5 }}>
          The office chess tournament, with skin in the game. Bet fake Gambits on every match,
          read the crowd, and climb the board. No real money — just bragging rights.
        </p>
      </div>
      <LoginForm />
      <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--color-faint)", marginTop: 18, fontFamily: "var(--font-mono)" }}>
        20 players · 19 matches · one champion
      </p>
    </div>
  );
}
