"use client";

import { useActionState } from "react";
import { claimIdentity, type FormState } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(claimIdentity, {});
  return (
    <form action={action} className="glass" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <label className="eyebrow" htmlFor="name">Your name</label>
      <input
        id="name"
        name="name"
        className="input"
        placeholder="e.g. Rahul Sharma"
        autoComplete="off"
        maxLength={40}
        required
      />
      <label className="eyebrow" htmlFor="pin" style={{ marginTop: 4 }}>Secret PIN (4–8 digits)</label>
      <input
        id="pin"
        name="pin"
        className="input num"
        type="password"
        inputMode="numeric"
        pattern="\d*"
        placeholder="••••"
        maxLength={8}
        required
      />
      <p style={{ fontSize: 12, color: "var(--color-faint)", margin: "2px 0 4px" }}>
        New name → new account with 1,000 Gambits. Existing name → same PIN logs you back in.
      </p>
      {state.error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-red)",
            background: "rgba(244,91,105,0.08)",
            border: "1px solid rgba(244,91,105,0.3)",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          {state.error}
        </div>
      )}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending} style={{ marginTop: 4 }}>
        {pending ? "Entering…" : "Enter the parlour ♟"}
      </button>
    </form>
  );
}
