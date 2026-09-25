"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, CheckCircle2, AlertTriangle, BedDouble, Home, ChefHat, Waves, Cog, Building2, ArrowLeftRight, Martini, Trees, Flame, Zap, X, Wrench, ImageIcon, Camera } from "lucide-react";
import { useStore } from "@/lib/store";
import PropertyPicker from "@/components/PropertyPicker";
import { Room, roomAttentionCount, roomPhotoCount, activeProperties } from "@/lib/data";
import { uploadPhoto } from "@/lib/image";

const ICON_BY_NAME: [string, typeof Home][] = [
  ["Living Room", Home], ["Bedroom", BedDouble], ["Kitchen", ChefHat], ["Guest House", Building2],
  ["Pool Bar", Martini], ["Pool", Waves], ["Garden", Trees],
  ["Boiler", Flame], ["Electrical", Zap],
];
const TINT_BY_INDEX = ["#2F5FE014", "#B39DDB14", "var(--warn-bg)", "var(--primary-wash)", "var(--ok-bg)", "#B39DDB14"];

function roomIcon(name: string) {
  return ICON_BY_NAME.find(([key]) => name.includes(key))?.[1] ?? Cog;
}

const TABS = ["All Rooms", "Indoor", "Outdoor", "Technical", "Pools"] as const;

const CATEGORIES: Room["category"][] = ["Indoor", "Outdoor", "Technical"];

export default function RoomsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, properties, selectedClientEmail, selectedPropertyId, setSelectedPropertyId, addRoom } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Rooms");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && (TABS as readonly string[]).includes(t)) setTab(t as (typeof TABS)[number]);
  }, [searchParams]);
  const [statModal, setStatModal] = useState<"equipment" | "attention" | "photos" | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCategory, setNewRoomCategory] = useState<Room["category"]>("Indoor");
  const [newRoomPhoto, setNewRoomPhoto] = useState<string | undefined>(undefined);
  const canEdit = session?.role !== "client";

  // Admin/support can jump straight to a specific property (e.g. one picked from
  // the "Unassigned properties" list in Clients) without first choosing a client —
  // an unassigned property has no client to choose in the first place.
  const directProperty = session?.role === "client" ? undefined : properties.find((p) => p.id === selectedPropertyId);
  const clientEmail = session?.role === "client" ? session.email : directProperty ? directProperty.clientEmail : selectedClientEmail;
  const myProperties = activeProperties(properties).filter((p) => p.clientEmail === clientEmail);
  const property = directProperty ?? myProperties.find((p) => p.id === selectedPropertyId);

  if (!property && !clientEmail) {
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
  const filtered = tab === "All Rooms" ? rooms
    : tab === "Pools" ? rooms.filter((r) => r.name.toLowerCase().includes("pool"))
    : rooms.filter((r) => r.category === tab);

  // Suggest room names seen on other properties that this one doesn't have yet,
  // keeping the category each name was originally seen with.
  const existingNames = new Set(rooms.map((r) => r.name));
  const roomSuggestions = Array.from(
    new Map(properties.flatMap((p) => p.rooms.map((r) => [r.name, r.category] as const))).entries()
  ).filter(([name]) => !existingNames.has(name));
  const allEquipment = rooms.flatMap((r) => r.equipment.map((eq) => ({ ...eq, room: r })));
  const totalEquipment = rooms.reduce((s, r) => s + r.equipmentCount, 0);
  const totalPhotos = rooms.reduce((s, r) => s + roomPhotoCount(r), 0);
  const attentionRooms = rooms.filter((r) => roomAttentionCount(r) > 0);
  const photoRooms = rooms.filter((r) => roomPhotoCount(r) > 0);

  function goToRoom(r: Room, extraQuery?: string) {
    setStatModal(null);
    router.push(`/rooms/${r.id}${extraQuery ?? ""}`);
  }

  function submitAddRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    addRoom(property!.id, { name: newRoomName.trim(), category: newRoomCategory, photoUrl: newRoomPhoto });
    setShowAddRoom(false);
    setNewRoomName("");
    setNewRoomCategory("Indoor");
    setNewRoomPhoto(undefined);
  }

  function handleNewRoomPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhoto(file).then(setNewRoomPhoto).catch((err) => alert(`Couldn't process that photo: ${err.message}`));
  }

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
          {canEdit && (
            <button onClick={() => setShowAddRoom(true)} className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
              <Plus size={14} /> Add room
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 rounded-2xl border border-line divide-x divide-line mb-5">
        <div className="p-4"><p className="text-xl font-bold text-fg">{rooms.length}</p><p className="text-[11px] text-subtext">Rooms</p></div>
        <button onClick={() => setStatModal("equipment")} className="p-4 text-left hover:bg-white/5">
          <p className="text-xl font-bold text-fg">{totalEquipment}</p><p className="text-[11px] text-subtext">Equipment</p>
        </button>
        <button onClick={() => setStatModal("attention")} className="p-4 text-left hover:bg-white/5">
          <p className="text-xl font-bold text-fg">{attentionRooms.length}</p><p className="text-[11px] text-subtext">Need attention</p>
        </button>
        <button onClick={() => setStatModal("photos")} className="p-4 text-left hover:bg-white/5">
          <p className="text-xl font-bold text-fg">{totalPhotos}</p><p className="text-[11px] text-subtext">Photos</p>
        </button>
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
          const Icon = roomIcon(r.name);
          return (
            <Link key={r.id} href={`/rooms/${r.id}`} className="rounded-2xl border border-line p-4 block"
              style={{ background: `linear-gradient(160deg, ${TINT_BY_INDEX[i % TINT_BY_INDEX.length]}, transparent)` }}>
              <div className="flex items-start justify-between mb-6">
                {r.photoUrl ? (
                  <div className="w-9 h-9 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${r.photoUrl})` }} />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center"><Icon size={16} className="text-fg" /></div>
                )}
                {roomAttentionCount(r) === 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-[var(--ok-bg)] text-[var(--ok-fg)] px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Current</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-[var(--warn-bg)] text-[var(--warn-fg)] px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> {roomAttentionCount(r)} attention</span>
                )}
              </div>
              <p className="text-[14px] font-bold text-fg">{r.name}</p>
              <p className="text-[11px] text-subtext mt-0.5">{r.equipmentCount} equipment records</p>
            </Link>
          );
        })}
      </div>

      {statModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setStatModal(null)}>
          <div className="bg-card border border-line rounded-2xl w-full max-w-md max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line flex-shrink-0">
              <p className="font-bold text-fg text-[15px]">
                {statModal === "equipment" ? `All equipment (${allEquipment.length})` : statModal === "attention" ? `Needs attention (${attentionRooms.length})` : `Photos (${totalPhotos})`}
              </p>
              <button onClick={() => setStatModal(null)}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="overflow-y-auto py-2">
              {statModal === "equipment" && allEquipment.map((eq) => (
                <button key={`${eq.room.id}-${eq.name}`} onClick={() => goToRoom(eq.room, `?eq=${encodeURIComponent(eq.name)}`)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-white/5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Wrench size={14} className="text-primary" /></div>
                  <div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-fg truncate">{eq.name}</p><p className="text-[11px] text-subtext truncate">{eq.room.name}</p></div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${eq.issueNote ? "bg-[var(--attention-wash)] text-[var(--attention-fg)]" : eq.status === "Good" ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" : "bg-[var(--warn-bg)] text-[var(--warn-fg)]"}`}>
                    {eq.issueNote ? "Issue reported" : eq.status}
                  </span>
                </button>
              ))}
              {statModal === "attention" && (attentionRooms.length === 0 ? (
                <p className="text-[12.5px] text-subtext p-4 text-center">Nothing needs attention right now.</p>
              ) : attentionRooms.map((r) => (
                <button key={r.id} onClick={() => goToRoom(r)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-white/5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--warn-bg)] flex items-center justify-center flex-shrink-0"><AlertTriangle size={14} className="text-[var(--warn-fg)]" /></div>
                  <div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-fg truncate">{r.name}</p><p className="text-[11px] text-subtext truncate">{r.category}</p></div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--warn-bg)] text-[var(--warn-fg)] flex-shrink-0">{roomAttentionCount(r)} item{roomAttentionCount(r) > 1 ? "s" : ""}</span>
                </button>
              )))}
              {statModal === "photos" && (photoRooms.length === 0 ? (
                <p className="text-[12.5px] text-subtext p-4 text-center">No photos uploaded yet.</p>
              ) : photoRooms.map((r) => (
                <button key={r.id} onClick={() => goToRoom(r, "?tab=Photos")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-white/5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><ImageIcon size={14} className="text-primary" /></div>
                  <div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-fg truncate">{r.name}</p><p className="text-[11px] text-subtext truncate">{r.category}</p></div>
                  <span className="text-[11px] text-subtext flex-shrink-0">{roomPhotoCount(r)} photo{roomPhotoCount(r) > 1 ? "s" : ""}</span>
                </button>
              )))}
            </div>
          </div>
        </div>
      )}

      {showAddRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => { setShowAddRoom(false); setNewRoomPhoto(undefined); }}>
          <form onSubmit={submitAddRoom} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">Add room</p>
              <button type="button" onClick={() => { setShowAddRoom(false); setNewRoomPhoto(undefined); }}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <input required autoFocus placeholder="Room name (e.g. Bedroom 3)" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <select value={newRoomCategory} onChange={(e) => setNewRoomCategory(e.target.value as Room["category"])}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              {newRoomPhoto && (
                <div className="relative h-28 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${newRoomPhoto})` }} />
                  <button type="button" onClick={() => setNewRoomPhoto(undefined)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 border border-line rounded-lg py-2 text-[12.5px] text-fg cursor-pointer hover:border-primary/40">
                  <ImageIcon size={13} /> Upload photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleNewRoomPhoto} />
                </label>
                <label className="flex-1 flex items-center justify-center gap-1.5 border border-line rounded-lg py-2 text-[12.5px] text-fg cursor-pointer hover:border-primary/40">
                  <Camera size={13} /> Take photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleNewRoomPhoto} />
                </label>
              </div>

              {roomSuggestions.length > 0 && (
                <div>
                  <p className="text-[10.5px] text-subtext mb-1.5">Used on other properties:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {roomSuggestions.map(([name, category]) => (
                      <button key={name} type="button" onClick={() => { setNewRoomName(name); setNewRoomCategory(category); }}
                        className="text-[11.5px] font-medium px-2.5 py-1 rounded-full border border-line text-subtext hover:border-primary/40 hover:text-fg">
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">Create room</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
