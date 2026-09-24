"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { useStore } from "@/lib/store";
import { roomAttentionCount, activeProperties } from "@/lib/data";

const TABS = ["All Rooms", "Indoor", "Outdoor", "Technical"] as const;

export default function XRayPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Rooms");
  const { session, properties, selectedClientEmail, selectedPropertyId } = useStore();
  const clientEmail = session?.role === "client" ? session.email : selectedClientEmail;
  const property = properties.find((p) => p.clientEmail === clientEmail && p.id === selectedPropertyId)
    ?? activeProperties(properties).find((p) => p.clientEmail === clientEmail);

  if (!property) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">X-Ray</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a property first from the Rooms tab.</p>
        <Link href="/rooms" className="inline-block bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">Go to Rooms</Link>
      </div>
    );
  }

  const rooms = property.rooms;
  const filtered = tab === "All Rooms" ? rooms : rooms.filter((r) => r.category === tab);
  const totalEquipment = rooms.reduce((s, r) => s + r.equipmentCount, 0);
  const totalAttention = rooms.reduce((s, r) => s + roomAttentionCount(r), 0);

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="w-9 h-9 rounded-full border border-line flex items-center justify-center flex-shrink-0"><ArrowLeft size={15} /></Link>
        <div>
          <p className="text-[10px] tracking-widest text-subtext font-semibold">DIGITAL PROPERTY RECORD</p>
          <h1 className="text-2xl font-bold text-fg">{property.name} X-Ray</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-line divide-x divide-line mb-5">
        <div className="p-4"><p className="text-xl font-bold text-fg">{rooms.length}</p><p className="text-[11px] text-subtext">Rooms</p></div>
        <div className="p-4"><p className="text-xl font-bold text-fg">{totalEquipment}</p><p className="text-[11px] text-subtext">Equipment</p></div>
        <div className="p-4"><p className="text-xl font-bold text-fg">{totalAttention}</p><p className="text-[11px] text-subtext">Need attention</p></div>
      </div>

      <div className="flex items-center gap-5 border-b border-line mb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 text-[13px] ${tab === t ? "text-fg font-semibold border-b-2 border-primary" : "text-subtext"}`}>
            {t}
          </button>
        ))}
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center">
          <p className="text-[12.5px] text-subtext">No rooms recorded yet — add rooms and equipment from the Rooms tab to see them here.</p>
          <Link href="/rooms" className="inline-block text-[12px] text-primary font-semibold mt-2">Go to Rooms</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((r) => {
            const attention = roomAttentionCount(r);
            return (
              <Link key={r.id} href={`/rooms/${r.id}`} className="rounded-2xl border border-line p-4 hover:border-primary/40"
                style={r.photoUrl
                  ? { backgroundImage: `linear-gradient(160deg, rgba(7,16,23,0.75), rgba(7,16,23,0.35)), url(${r.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : undefined}>
                <div className="flex items-center justify-between mb-6">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.photoUrl ? "text-white bg-black/40" : "text-subtext border border-line"}`}>{r.category}</span>
                  {attention === 0 ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-[var(--ok-bg)] text-[var(--ok-fg)] px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Online</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-[var(--warn-bg)] text-[var(--warn-fg)] px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> {attention} attention</span>
                  )}
                </div>
                <p className={`text-[14px] font-bold ${r.photoUrl ? "text-white" : "text-fg"}`}>{r.name}</p>
                <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${r.photoUrl ? "text-white/70" : "text-subtext"}`}><Wrench size={11} /> {r.equipmentCount} equipment records</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
