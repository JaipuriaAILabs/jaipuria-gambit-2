"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap" style={{ paddingTop: 80, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>♚</div>
      <h1 className="h-hero" style={{ fontSize: 24, marginBottom: 8 }}>Blunder on our side.</h1>
      <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 20 }}>
        Nothing happened to your Gambits. Try that again.
      </p>
      <button className="btn btn-primary" onClick={() => reset()}>Retry</button>
    </div>
  );
}
