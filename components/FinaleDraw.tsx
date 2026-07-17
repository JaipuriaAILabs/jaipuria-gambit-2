"use client";

import { useActionState, useState } from "react";
import { adminFinaleDraw, type FormState } from "@/app/actions";

type Finalist = { id: number; name: string };

export function FinaleDraw({ finalists }: { finalists: Finalist[] }) {
  const [byeId, setByeId] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(adminFinaleDraw, {});
  const others = finalists.filter((f) => f.id !== byeId);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (byeId == null) {
          e.preventDefault();
          setHint("Tap the finalist who drew the bye first.");
        } else {
          setHint(null);
        }
      }}
      className="glass"
      style={{ padding: 16, marginBottom: 18, borderColor: "rgba(245,196,81,0.3)" }}
    >
      <input type="hidden" name="byeId" value={byeId ?? ""} />
      <div className="eyebrow" style={{ marginBottom: 4 }}>finale · lucky draw</div>
      <div className="h-sec" style={{ fontSize: 15, marginBottom: 10 }}>
        Who drew the free pass to the final?
      </div>
      <div className="flex" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {finalists.map((f) => {
          const on = byeId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className="btn btn-ghost"
              style={{
                flex: 1,
                minWidth: 100,
                fontSize: 13,
                borderColor: on ? "var(--color-gold)" : undefined,
                background: on ? "rgba(245,196,81,0.12)" : undefined,
                color: on ? "var(--color-gold)" : undefined,
              }}
              onClick={() => setByeId(f.id)}
            >
              {f.name}
            </button>
          );
        })}
      </div>
      {byeId != null && others.length === 2 && (
        <div style={{ fontSize: 12.5, color: "var(--color-muted)", marginBottom: 10 }}>
          → {finalists.find((f) => f.id === byeId)?.name} skips to the final ·{" "}
          <b>{others[0].name} vs {others[1].name}</b> play the semifinal (betting opens immediately).
        </div>
      )}
      {(hint || state.error) && (
        <div style={{ fontSize: 12.5, color: "var(--color-red)", marginBottom: 8 }}>{hint ?? state.error}</div>
      )}
      <button className="btn btn-gold btn-block" type="submit" disabled={pending}>
        {pending ? "Recording…" : "Confirm draw → open semifinal betting"}
      </button>
    </form>
  );
}
