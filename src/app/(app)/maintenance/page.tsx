"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Wrench, Activity, CheckCircle2 } from "lucide-react";
import { dueSoonEquipment } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function MaintenancePage() {
  const router = useRouter();
  const { session, properties, selectedClientEmail, selectedPropertyId } = useStore();
  const canEdit = session?.role !== "client";
  const clientEmail = session?.role === "client" ? session.email : selectedClientEmail;
  const property = properties.find((p) => p.clientEmail === clientEmail && p.id === selectedPropertyId)
    ?? properties.find((p) => p.clientEmail === clientEmail);

  if (!property) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">Maintenance</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a property first from the Rooms tab.</p>
        <Link href="/rooms" className="inline-block bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">Go to Rooms</Link>
      </div>
    );
  }

  const upcoming = dueSoonEquipment(property);

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-widest text-subtext font-semibold">{property.name.toUpperCase()}</p>
          <h1 className="text-2xl font-bold text-fg">Maintenance</h1>
        </div>
        {canEdit && (
          <button className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
            <Plus size={14} /> Add maintenance
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-line divide-x divide-line mb-6">
        <div className="p-4 flex items-center gap-3"><Wrench size={16} className="text-primary" /><div><p className="text-xl font-bold text-fg leading-none">{upcoming.length}</p><p className="text-[11px] text-subtext mt-1">Upcoming</p></div></div>
        <div className="p-4 flex items-center gap-3"><Activity size={16} className="text-[var(--warn-fg)]" /><div><p className="text-xl font-bold text-fg leading-none">{upcoming.filter((u) => u.equipment.issueNote).length}</p><p className="text-[11px] text-subtext mt-1">Reported issues</p></div></div>
        <div className="p-4 flex items-center gap-3"><CheckCircle2 size={16} className="text-[var(--ok-fg)]" /><div><p className="text-xl font-bold text-fg leading-none">{property.maintenanceLog.length}</p><p className="text-[11px] text-subtext mt-1">Completed</p></div></div>
      </div>

      <p className="text-[10px] tracking-widest text-subtext font-semibold mb-2">UPCOMING</p>
      {upcoming.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center mb-6">
          <p className="text-[12.5px] text-subtext">Nothing due — every piece of equipment on record is in good shape.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-6">
          {upcoming.map(({ room, equipment }) => (
            <button key={`${room.id}-${equipment.name}`}
              onClick={() => router.push(`/rooms/${room.id}?eq=${encodeURIComponent(equipment.name)}`)}
              className="flex items-center gap-3 rounded-2xl border border-line p-3.5 text-left hover:border-primary/40">
              <div className="w-9 h-9 rounded-lg bg-[var(--warn-bg)] flex items-center justify-center flex-shrink-0"><Wrench size={16} className="text-[var(--warn-fg)]" /></div>
              <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-fg truncate">{equipment.name}</p><p className="text-[11.5px] text-subtext truncate">{room.name} · {equipment.model}</p></div>
              <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-[var(--warn-bg)] text-[var(--warn-fg)] flex-shrink-0">
                {equipment.issueNote ? "Issue reported" : "Due soon"}
              </span>
              <ChevronRight size={14} className="text-subtext flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] tracking-widest text-subtext font-semibold mb-2">COMPLETED HISTORY</p>
      {property.maintenanceLog.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center">
          <p className="text-[12.5px] text-subtext">No completed maintenance recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {property.maintenanceLog.map((m, i) => (
            <div key={m.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[var(--ok-bg)] text-[var(--ok-fg)] text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                {i < property.maintenanceLog.length - 1 && <div className="w-px flex-1 bg-line my-1" />}
              </div>
              <div className="rounded-2xl border border-line p-4 flex-1 mb-4">
                <p className="text-[11px] text-subtext mb-1">{m.date} · {m.room} · {m.supplier}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-fg">{m.title}</p>
                  <span className="flex items-center gap-1 text-[10.5px] font-semibold bg-[var(--ok-bg)] text-[var(--ok-fg)] px-2 py-1 rounded-full flex-shrink-0"><CheckCircle2 size={10} /> Completed</span>
                </div>
                <p className="text-[11.5px] text-subtext mt-1">{m.notes}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
