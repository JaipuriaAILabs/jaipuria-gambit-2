"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Polls the server component tree for near-live pools/odds/leaderboard. */
export function AutoRefresh({ ms = 6000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        router.refresh();
      }
    };
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [ms, router]);
  return null;
}
