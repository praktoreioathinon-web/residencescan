"use client";

import Link from "next/link";
import { Plus, ChevronRight, Camera, Activity, CheckCircle2 } from "lucide-react";
import { maintenanceItems } from "@/lib/data";
import { useStore } from "@/lib/store";

const AREA: Record<string, string> = {
  "Pool filter inspection": "Pool machinery",
  "Replace water pre-filter": "Main water supply",
  "Service Daikin A/C": "Living Room",
  "Generator annual service": "Technical room",
};

export default function MaintenancePage() {
  const { session, properties, selectedClientEmail, selectedPropertyId } = useStore();
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

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-widest text-subtext font-semibold">{property.name.toUpperCase()}</p>
          <h1 className="text-2xl font-bold text-fg">Maintenance</h1>
        </div>
        <button className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
          <Plus size={14} /> Add maintenance
        </button>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-line divide-x divide-line mb-6">
        <div className="p-4 flex items-center gap-3"><Camera size={16} className="text-primary" /><div><p className="text-xl font-bold text-fg leading-none">3</p><p className="text-[11px] text-subtext mt-1">Upcoming</p></div></div>
        <div className="p-4 flex items-center gap-3"><Activity size={16} className="text-[#EEB06E]" /><div><p className="text-xl font-bold text-fg leading-none">{property.itemsNeedAttention}</p><p className="text-[11px] text-subtext mt-1">Need attention</p></div></div>
        <div className="p-4 flex items-center gap-3"><CheckCircle2 size={16} className="text-[#6ED3AA]" /><div><p className="text-xl font-bold text-fg leading-none">47</p><p className="text-[11px] text-subtext mt-1">Completed</p></div></div>
      </div>

      <div className="flex flex-col">
        {maintenanceItems.map((m, i) => (
          <div key={m.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
              {i < maintenanceItems.length - 1 && <div className="w-px flex-1 bg-line my-1" />}
            </div>
            <div className="rounded-2xl border border-line p-4 flex-1 mb-4">
              <p className="text-[11px] text-subtext mb-1">{m.date} {m.month} · {AREA[m.title]}</p>
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-bold text-fg">{m.title}</p>
                <button className="flex items-center gap-1 text-[12px] text-primary font-semibold flex-shrink-0">Open record <ChevronRight size={12} /></button>
              </div>
              <p className="text-[11.5px] text-subtext mt-1">Linked to the equipment record, manuals and full service history.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
