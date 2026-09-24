"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import { useStore } from "@/lib/store";

// Surfaces background saves that failed to reach the database. Without this,
// a change that fails mid-edit (wifi drop at a villa, a Supabase hiccup)
// looks saved on screen but silently isn't — this is what lets someone
// actually notice and retry before walking away.
export default function SaveStatusBanner() {
  const { saveErrors, retrySave, retryAllSaves } = useStore();
  const [expanded, setExpanded] = useState(false);

  if (saveErrors.length === 0) return null;

  return (
    <div className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md">
      <div className="rounded-2xl border border-[var(--attention-fg)]/40 bg-card shadow-lg overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <AlertTriangle size={15} className="text-[var(--attention-fg)] flex-shrink-0" />
          <p className="flex-1 text-[12.5px] font-semibold text-fg">
            {saveErrors.length} change{saveErrors.length > 1 ? "s" : ""} not saved yet
          </p>
          <button onClick={retryAllSaves} className="flex items-center gap-1 text-[12px] font-semibold text-primary flex-shrink-0">
            <RotateCw size={12} /> Retry
          </button>
          {saveErrors.length > 1 && (
            <button onClick={() => setExpanded((v) => !v)} className="text-subtext flex-shrink-0" aria-label={expanded ? "Collapse" : "Expand"}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
        {expanded && (
          <div className="border-t border-line divide-y divide-line max-h-48 overflow-y-auto">
            {saveErrors.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5 px-4 py-2">
                <p className="flex-1 min-w-0 text-[11.5px] text-subtext truncate">{e.description}</p>
                <button onClick={() => retrySave(e.id)} className="text-[11px] font-semibold text-primary flex-shrink-0">Retry</button>
              </div>
            ))}
          </div>
        )}
        <p className="px-4 pb-3 text-[11px] text-subtext">Check your connection — these are still safe on this screen and will save once retried.</p>
      </div>
    </div>
  );
}
