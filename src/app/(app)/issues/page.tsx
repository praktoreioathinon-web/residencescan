"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { activeProperties, reportedIssues } from "@/lib/data";

// Every problem a client has reported on a piece of equipment, across all
// properties, newest first — so reports don't sit unseen in a property nobody
// happens to open. Staff only; clients report from the equipment itself.
export default function IssuesPage() {
  const router = useRouter();
  const { session, properties, clients, clearEquipmentIssue, selectClientAndProperty } = useStore();
  const isStaff = session?.role === "admin" || session?.role === "support";
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (session && !isStaff) router.replace("/");
  }, [session, isStaff, router]);

  const all = useMemo(() => reportedIssues(activeProperties(properties)), [properties]);
  const propertiesWithIssues = useMemo(() => {
    const seen = new Map<string, string>();
    all.forEach((i) => seen.set(i.property.id, i.property.name));
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [all]);

  if (!isStaff) return null;

  // If the filtered property's last issue gets resolved, fall back to everything.
  const filter = propertiesWithIssues.some((p) => p.id === propertyFilter) ? propertyFilter : "all";
  const shown = filter === "all" ? all : all.filter((i) => i.property.id === filter);

  function clientName(email: string | null) {
    if (!email) return "Unassigned property";
    return clients.find((c) => c.email === email)?.name ?? email;
  }

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[11px] tracking-widest text-subtext font-semibold">ALL PROPERTIES</p>
          <h1 className="text-2xl font-bold text-fg">Reported issues</h1>
          <p className="text-[12.5px] text-subtext mt-1">
            {all.length === 0 ? "Problems clients report on their equipment appear here." : `${all.length} open · newest first`}
          </p>
        </div>
        {propertiesWithIssues.length > 1 && (
          <select value={filter} onChange={(e) => setPropertyFilter(e.target.value)} aria-label="Filter by property"
            className="rounded-lg border border-line px-3 py-2 text-[12.5px] touch:min-h-11">
            <option value="all">All properties ({all.length})</option>
            {propertiesWithIssues.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({all.filter((i) => i.property.id === p.id).length})</option>
            ))}
          </select>
        )}
      </div>

      {all.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center">
          <CheckCircle2 size={22} className="text-[var(--ok-fg)] mx-auto mb-2" />
          <p className="text-[13px] font-semibold text-fg">No open reports</p>
          <p className="text-[12.5px] text-subtext mt-1">Every reported problem has been resolved.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map(({ property, room, equipment }) => {
            const key = `${property.id}|${room.id}|${equipment.name}`;
            return (
              <div key={key} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-fg">{equipment.name}</p>
                    <p className="text-[12px] text-subtext">{room.name} · {property.name}</p>
                    <p className="text-[12px] text-subtext">{clientName(property.clientEmail)}</p>
                  </div>
                  <p className="flex items-center gap-1 text-[12px] font-semibold text-[var(--attention-fg)]">
                    <AlertTriangle size={12} /> Reported {equipment.issueReportedAt}
                  </p>
                </div>

                <p className="text-[13px] text-fg mt-3 rounded-xl p-3 whitespace-pre-wrap break-words" style={{ background: "var(--attention-wash)" }}>
                  {equipment.issueNote}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                  <button
                    onClick={() => {
                      selectClientAndProperty(property.clientEmail, property.id);
                      router.push(`/rooms/${room.id}?eq=${encodeURIComponent(equipment.name)}`);
                    }}
                    className="flex items-center gap-1 text-[12px] text-primary font-semibold touch:min-h-11">
                    Open equipment <ChevronRight size={12} />
                  </button>

                  {confirming === key ? (
                    <span className="flex items-center gap-3">
                      <button
                        onClick={() => { clearEquipmentIssue(property.id, room.id, equipment.name); setConfirming(null); }}
                        className="flex items-center gap-1.5 text-[12px] text-[var(--ok-fg)] font-semibold touch:min-h-11">
                        <CheckCircle2 size={13} /> Yes, resolved
                      </button>
                      <button onClick={() => setConfirming(null)} className="text-[12px] text-subtext touch:min-h-11 touch:px-2">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirming(key)}
                      className="flex items-center gap-1.5 text-[12px] text-[var(--ok-fg)] font-semibold touch:min-h-11">
                      <CheckCircle2 size={13} /> Mark resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
