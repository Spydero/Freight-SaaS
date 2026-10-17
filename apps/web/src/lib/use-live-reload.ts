"use client";

import { useEffect, useRef } from "react";

/** Refetch on focus + interval so Client tabs pick up Ops status changes without a manual refresh. */
export function useLiveReload(load: () => void | Promise<void>, deps: unknown[] = [], intervalMs = 4000) {
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    void Promise.resolve(loadRef.current()).catch(console.error);

    const run = () => {
      void Promise.resolve(loadRef.current()).catch(console.error);
    };
    const onFocus = () => run();
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(run, intervalMs);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit deps
  }, deps);
}
