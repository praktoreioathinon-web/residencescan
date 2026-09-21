"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle2, AlertTriangle, BedDouble, Home, ChefHat, Waves, Cog, Building2, ArrowLeftRight } from "lucide-react";
import { useStore } from "@/lib/store";
import PropertyPicker from "@/components/PropertyPicker";

const ICON_BY_INDEX = [Home, BedDouble, ChefHat, Waves, Cog, Building2];
const TINT_BY_INDEX = ["#2F5FE014", "#B39DDB14", "#EEB06E14", "#55D6C714", "#6ED3AA14", "#B39DDB14"];

const TABS = ["All Rooms", "Indoor", "Outdoor", "Technical"] as const;

export default function RoomsPage() {
  const { session, properties, selectedClientEmail, selectedPropertyId, setSelectedPropertyId } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Rooms");

  const clientEmail = session?.role === "client" ? session.email : selectedClientEmail;
  const myProperties = properties.filter((p) => p.clientEmail === clientEmail);
  const property = myProperties.find((p) => p.id === selectedPropertyId);

  if (!clientEmail) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">Rooms & Areas</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a client first to browse their properties.</p>
        <Link href="/clients" className="inline-block bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">Go to Clients</Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">Rooms & Areas</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a property to view its rooms.</p>
        <PropertyPicker properties={myProperties} onSelect={setSelectedPropertyId} />
      </div>
    );
  }

  const rooms = property.rooms;
  const filtered = tab === "All Rooms" ? rooms : rooms.filter((r) => r.category === tab);
  const totalEquipment = rooms.reduce((s, r) => s + r.equipmentCount, 0);
  const totalDocs = rooms.reduce((s, r) => s + r.documentsCount, 0);
  const needAttention = rooms.filter((r) => r.badge === "attention").length;

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-widest text-subtext font-semibold">{property.area.toUpperCase()}</p>
          <h1 className="text-2xl font-bold text-fg">{property.name} — Rooms & Areas</h1>
        </div>
        <div className="flex items-center gap-2">
          {myProperties.length > 1 && (
            <button onClick={() => setSelectedPropertyId(null)} className="flex items-center gap-1.5 border border-line text-[12.5px] font-semibold px-4 py-2 rounded-full text-fg">
              <ArrowLeftRight size={13} /> Switch property
            </button>
          )}
          <button className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
            <Plus size={14} /> Add room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 rounded-2xl border border-line divide-x divide-line mb-5">
        {[[String(rooms.length), "Rooms"], [String(totalEquipment), "Equipment"], [String(needAttention), "Need attention"], [String(totalDocs), "Documents"]].map(([n, l]) => (
          <div key={l} className="p-4">
            <p className="text-xl font-bold text-fg">{n}</p>
            <p className="text-[11px] text-subtext">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-5 border-b border-line mb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 text-[13px] ${tab === t ? "text-fg font-semibold border-b-2 border-primary" : "text-subtext"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filtered.map((r, i) => {
          const Icon = ICON_BY_INDEX[i % ICON_BY_INDEX.length];
          return (
            <Link key={r.id} href={`/rooms/${r.id}`} className="rounded-2xl border border-line p-4 block"
              style={{ background: `linear-gradient(160deg, ${TINT_BY_INDEX[i % TINT_BY_INDEX.length]}, transparent)` }}>
              <div className="flex items-start justify-between mb-6">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center"><Icon size={16} className="text-fg" /></div>
                {r.badge === "current" ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-[#6ED3AA1F] text-[#6ED3AA] px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Current</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-[#EEB06E1F] text-[#EEB06E] px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> {r.badgeCount} attention</span>
                )}
              </div>
              <p className="text-[14px] font-bold text-fg">{r.name}</p>
              <p className="text-[11px] text-subtext mt-0.5">{r.equipmentCount} equipment records</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
