"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, ChevronRight, Sparkles, Fan, Sun, X, ImageIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { EquipmentItem } from "@/lib/data";

const EQUIP_ICONS = [Sparkles, Fan, Sun];

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const { properties, selectedPropertyId, setEquipmentPhoto } = useStore();
  const property = properties.find((p) => p.id === selectedPropertyId);
  const room = property?.rooms.find((r) => r.id === params.id);
  const [tab, setTab] = useState<"Equipment" | "Documents" | "Maintenance" | "Photos">("Equipment");
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  if (!room) return notFound();

  function handleEquipmentPhoto(e: React.ChangeEvent<HTMLInputElement>, equipmentName: string) {
    const file = e.target.files?.[0];
    if (!file || !property || !room) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEquipmentPhoto(property.id, room.id, equipmentName, reader.result);
        setSelectedEquipment((prev) => (prev && prev.name === equipmentName ? { ...prev, photoUrl: reader.result as string } : prev));
      }
    };
    reader.readAsDataURL(file);
  }

  const tabs = [
    { key: "Equipment" as const, count: room.equipmentCount },
    { key: "Documents" as const, count: room.documentsCount },
    { key: "Maintenance" as const, count: room.maintenanceCount },
    { key: "Photos" as const, count: room.photosCount },
  ];

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/rooms" className="w-9 h-9 rounded-full border border-line flex items-center justify-center"><ArrowLeft size={15} /></Link>
          <div>
            <p className="text-[10px] tracking-widest text-subtext font-semibold">ROOM {room.number}</p>
            <h1 className="text-2xl font-bold text-fg">{room.name}</h1>
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
          <Plus size={14} /> Add equipment
        </button>
      </div>

      <div className="rounded-2xl border border-line p-6 mb-5" style={{ background: "linear-gradient(160deg, var(--primary-wash), transparent)" }}>
        <p className="flex items-center gap-1.5 text-[11.5px] text-primary font-semibold mb-8">
          <Sparkles size={13} /> {room.equipmentCount} equipment records
        </p>
        <p className="text-xl font-bold text-fg">{room.name}</p>
        <p className="text-[12px] text-subtext mt-0.5">{room.subtitle}</p>
      </div>

      <div className="flex items-center gap-5 border-b border-line mb-4">
        {tabs.map(({ key, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`pb-2.5 text-[13px] ${tab === key ? "text-fg font-semibold border-b-2 border-primary" : "text-subtext"}`}>
            {key} ({count})
          </button>
        ))}
      </div>

      {tab === "Equipment" ? (
        <div className="flex flex-col gap-2.5">
          {room.equipment.map((eq, i) => {
            const Icon = EQUIP_ICONS[i % EQUIP_ICONS.length];
            return (
              <button key={eq.name} onClick={() => setSelectedEquipment(eq)}
                className="flex items-center gap-3 rounded-2xl border border-line p-3.5 text-left hover:border-primary/40">
                {eq.photoUrl ? (
                  <div className="w-9 h-9 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${eq.photoUrl})` }} />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-primary" /></div>
                )}
                <div className="flex-1"><p className="text-[13.5px] font-semibold text-fg">{eq.name}</p><p className="text-[11.5px] text-subtext">{eq.model}</p></div>
                <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${eq.status === "Good" ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" : "bg-[var(--warn-bg)] text-[var(--warn-fg)]"}`}>{eq.status}</span>
                <ChevronRight size={14} className="text-subtext" />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[12.5px] text-subtext py-8 text-center">No {tab.toLowerCase()} recorded for this demo yet.</p>
      )}

      {selectedEquipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setSelectedEquipment(null)}>
          <div className="bg-card border border-line rounded-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="h-40 relative flex items-center justify-center"
              style={selectedEquipment.photoUrl
                ? { backgroundImage: `url(${selectedEquipment.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: "linear-gradient(135deg, var(--surface), var(--card))" }}>
              {!selectedEquipment.photoUrl && <Sparkles size={28} className="text-primary/40" />}
              <button onClick={() => setSelectedEquipment(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                <X size={14} className="text-white" />
              </button>
              <label className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/50 px-2.5 py-1.5 rounded-full cursor-pointer">
                <ImageIcon size={12} /> {selectedEquipment.photoUrl ? "Change photo" : "Add photo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleEquipmentPhoto(e, selectedEquipment.name)} />
              </label>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[15px] font-bold text-fg">{selectedEquipment.name}</p>
                <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${selectedEquipment.status === "Good" ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" : "bg-[var(--warn-bg)] text-[var(--warn-fg)]"}`}>{selectedEquipment.status}</span>
              </div>
              <p className="text-[12.5px] text-subtext mb-4">{selectedEquipment.model}</p>
              <div className="rounded-xl border border-line divide-y divide-line text-[12.5px]">
                <div className="flex items-center justify-between p-3"><span className="text-subtext">Room</span><span className="text-fg font-semibold">{room.name}</span></div>
                <div className="flex items-center justify-between p-3"><span className="text-subtext">Property</span><span className="text-fg font-semibold">{property?.name}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
