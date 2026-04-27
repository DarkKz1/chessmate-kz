"use client";

import { useEffect, useState } from "react";
import { loadPlayer } from "@/lib/chess/player-store";
import { clearPersona } from "@/lib/chess/demo-persona";

export function SiteFooter() {
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const p = loadPlayer();
    setHasData(p.games > 0);
  }, []);

  const reset = () => {
    if (!confirm("clear your data and start fresh?")) return;
    clearPersona();
    window.location.reload();
  };

  return (
    <footer className="px-6 pb-8 pt-2 md:px-12">
      <div className="flex items-end justify-between border-t-2 border-ink/15 pt-4">
        <div className="flex items-baseline gap-4">
          <span className="font-typewriter text-[9px] uppercase tracking-[0.22em] text-ink-light">
            mimic · vol. 01
          </span>
          {hasData && (
            <button
              type="button"
              onClick={reset}
              className="font-typewriter text-[9px] uppercase tracking-[0.22em] text-ink-light underline decoration-dashed underline-offset-4 hover:text-red-ink"
            >
              start fresh
            </button>
          )}
        </div>
        <span className="font-hand text-[18px] leading-none text-ink-soft">
          — diyar, astana hub
        </span>
      </div>
    </footer>
  );
}
