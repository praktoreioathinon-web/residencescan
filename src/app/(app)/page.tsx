"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Grid2x2, Cog, Waves, Store, Camera, Scan, ChevronRight, ImageIcon, ShieldCheck, AlertTriangle, CheckCircle2, Building2, Users, MapPin, Wrench, X, Archive, ArchiveRestore } from "lucide-react";
import { dueSoonEquipment, healthScore, systemsOnline, maintenanceCurrent, photoCoveragePct, activeProperties, Property, ClientRecord } from "@/lib/data";
import { useStore } from "@/lib/store";
import { uploadPhoto } from "@/lib/image";

const QUICK_ACCESS = [
  { href: "/rooms", label: "All Rooms", sub: "rooms", icon: Grid2x2 },
  { href: "/rooms?tab=Technical", label: "Machinery", sub: "systems", icon: Cog },
  { href: "/rooms?tab=Pools", label: "Pools", sub: "systems", icon: Waves },
  { href: "/suppliers", label: "Suppliers", sub: "contacts", icon: Store },
  { href: "/maintenance", label: "Maintenance", sub: "upcoming", icon: Camera },
  { href: "/xray", label: "X-Ray", sub: "All systems", icon: Scan },
];

function HealthRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      <circle cx={44} cy={44} r={r} fill="none" stroke="var(--line)" strokeWidth={7} />
      <circle
        cx={44} cy={44} r={r} fill="none" stroke="var(--primary)" strokeWidth={7} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
        transform="rotate(-90 44 44)"
      />
      <text x={44} y={49} textAnchor="middle" fontSize={20} fontWeight={700} fill="#F4F8FA">{pct}%</text>
    </svg>
  );
}

function Bar({ label, value, max, pctLabel }: { label: string; value?: number; max?: number; pctLabel?: string }) {
  const pct = pctLabel ? parseInt(pctLabel) : Math.round(((value ?? 0) / (max ?? 1)) * 100);
  return (
    <div className="mb-3 last:mb-0" style={{ width: 180 }}>
      <div className="flex items-center justify-between text-[11.5px] mb-1">
        <span className="text-subtext">{label}</span>
        <span className="text-fg font-semibold">{pctLabel ?? `${value} / ${max}`}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const { session, properties, clients, selectedClientEmail, selectedPropertyId, setSelectedClientEmail, setSelectedPropertyId, selectClientAndProperty, setPropertyPhoto, assignProperty, setPropertyArchived } = useStore();
  const [showChangeClient, setShowChangeClient] = useState(false);
  const [changeClientTo, setChangeClientTo] = useState("");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>, propertyId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhoto(file).then((dataUrl) => setPropertyPhoto(propertyId, dataUrl)).catch((err) => alert(`Couldn't process that photo: ${err.message}`));
  }

  function submitChangeClient(e: React.FormEvent, propertyId: string) {
    e.preventDefault();
    if (!changeClientTo) return;
    assignProperty(propertyId, changeClientTo);
    selectClientAndProperty(changeClientTo, propertyId);
    setShowChangeClient(false);
    setChangeClientTo("");
  }

  // Admin/support can jump straight to a specific property (e.g. one picked from
  // the "Unassigned properties" list in Clients) without first choosing a client —
  // an unassigned property has no client to choose in the first place.
  const directProperty = session?.role === "client" ? undefined : properties.find((p) => p.id === selectedPropertyId);
  const clientEmail = session?.role === "client" ? session.email : directProperty ? directProperty.clientEmail : selectedClientEmail;
  const myProperties = activeProperties(properties).filter((p) => p.clientEmail === clientEmail);
  const property = directProperty
    ?? myProperties.find((p) => p.id === selectedPropertyId)
    ?? (session?.role === "client" ? myProperties[0] : undefined);
  const index = property ? myProperties.findIndex((p) => p.id === property.id) : -1;

  useEffect(() => {
    if (property && property.id !== selectedPropertyId) setSelectedPropertyId(property.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id]);

  if (!property && !clientEmail) {
    if (session?.role === "admin" || session?.role === "support") {
      return (
        <AllPropertiesOverview
          properties={activeProperties(properties)} clients={clients}
          onOpen={(p) => selectClientAndProperty(p.clientEmail, p.id)}
        />
      );
    }
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">Overview</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a client to see their property overview.</p>
        <Link href="/clients" className="inline-block bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">Go to Clients</Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">Overview</h1>
        <p className="text-[12.5px] text-subtext">This client has no properties yet.</p>
      </div>
    );
  }

  const totalRooms = property.rooms.length;
  const upcoming = dueSoonEquipment(property);
  const otherClients = clients.filter((c) => c.email !== property.clientEmail);
  const latestCompleted = property.maintenanceLog[0];

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-widest text-subtext font-semibold">{myProperties.length > 1 ? `${myProperties.length} PROPERTIES` : "MY RESIDENCE"}</p>
        {myProperties.length > 1 && <span className="text-[11px] text-subtext">{index + 1} / {myProperties.length}</span>}
      </div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-fg">{property.name}</h1>
          {property.archived && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--warn-bg)] text-[var(--warn-fg)] flex-shrink-0">Archived</span>
          )}
        </div>
        {(session?.role === "admin" || session?.role === "support") && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => { setChangeClientTo(""); setShowChangeClient(true); }}
              className="flex items-center gap-1.5 border border-line text-[12px] font-semibold px-3.5 py-1.5 rounded-full text-fg hover:border-primary/40">
              <Users size={13} /> Change client
            </button>
            <button
              onClick={() => {
                const archiving = !property.archived;
                setPropertyArchived(property.id, archiving);
                if (archiving) setSelectedClientEmail(null);
              }}
              className="flex items-center gap-1.5 border border-line text-[12px] font-semibold px-3.5 py-1.5 rounded-full text-fg hover:border-primary/40">
              {property.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />} {property.archived ? "Unarchive" : "Archive"}
            </button>
            <button onClick={() => setSelectedClientEmail(null)}
              className="flex items-center gap-1.5 border border-line text-[12px] font-semibold px-3.5 py-1.5 rounded-full text-fg hover:border-primary/40">
              <Building2 size={13} /> All properties
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden border border-line relative h-64 flex flex-col justify-between p-4"
        style={property.photoUrl
          ? { backgroundImage: `linear-gradient(to top, rgba(7,16,23,0.85), rgba(7,16,23,0.15)), url(${property.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg, #14242E, #0C1821)" }}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-white bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
            <ShieldCheck size={12} className="text-primary" /> Professionally recorded
          </span>
          <span className="text-[11px] text-white bg-black/40 px-2.5 py-1 rounded-full">Updated {property.updated}</span>
        </div>
        <div>
          <p className="text-[12px] text-white/60">{property.location}</p>
          <p className="text-xl font-bold text-white mt-0.5">{property.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <label className="flex items-center gap-1.5 text-[11.5px] text-white bg-white/10 px-3 py-1.5 rounded-full w-fit cursor-pointer">
              <ImageIcon size={13} /> {property.photoUrl ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(e, property.id)} />
            </label>
            <label className="flex items-center gap-1.5 text-[11.5px] text-white bg-white/10 px-3 py-1.5 rounded-full w-fit cursor-pointer">
              <Camera size={13} /> Take photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoChange(e, property.id)} />
            </label>
          </div>
        </div>
      </div>
      {myProperties.length > 1 && (
        <button onClick={() => { setSelectedPropertyId(null); router.push("/rooms"); }}
          className="w-full text-[11.5px] text-primary font-semibold flex items-center justify-center gap-1 mt-2.5">
          Switch property <ChevronRight size={11} />
        </button>
      )}

      <div className="rounded-2xl border border-line p-5 mt-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <HealthRing pct={healthScore(property)} />
          <div>
            <p className="text-[10px] tracking-widest text-subtext font-semibold">RESIDENCE HEALTH</p>
            <p className="text-[15px] font-bold text-fg mt-0.5">{upcoming.length} item{upcoming.length === 1 ? "" : "s"} need attention</p>
            <p className="text-[11.5px] text-subtext mt-0.5 max-w-xs">Based on {property.rooms.reduce((s, r) => s + r.equipmentCount, 0)} equipment records across {totalRooms} rooms.</p>
          </div>
        </div>
        <div className="border-l border-line pl-6">
          <Bar label="Systems online" value={systemsOnline(property)[0]} max={systemsOnline(property)[1]} />
          <Bar label="Maintenance current" value={maintenanceCurrent(property)[0]} max={maintenanceCurrent(property)[1]} />
          <Bar label="Photo coverage" pctLabel={`${photoCoveragePct(property)}%`} />
        </div>
      </div>

      <p className="text-[10px] tracking-widest text-subtext font-semibold mt-7 mb-1">EXPLORE</p>
      <h2 className="text-lg font-bold text-fg mb-3">Quick access</h2>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACCESS.map(({ href, label, sub, icon: Icon }) => (
          <Link key={label} href={href} className="flex items-center gap-3 rounded-2xl border border-line p-3.5 hover:border-primary/40">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-primary" /></div>
            <div className="flex-1"><p className="text-[13px] font-semibold text-fg">{label}</p><p className="text-[11px] text-subtext">{sub}</p></div>
            <ChevronRight size={14} className="text-subtext" />
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mt-7 mb-3">
        <div>
          <p className="text-[10px] tracking-widest text-subtext font-semibold">NEXT ACTIONS</p>
          <h2 className="text-lg font-bold text-fg">Upcoming maintenance</h2>
        </div>
        <Link href="/maintenance" className="text-[12px] text-primary font-semibold flex items-center gap-1">View all <ChevronRight size={12} /></Link>
      </div>
      {property.rooms.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center">
          <p className="text-[12.5px] text-subtext">No rooms added yet — maintenance will show up here once you add rooms and equipment.</p>
          <Link href="/rooms" className="inline-block text-[12px] text-primary font-semibold mt-2">Go to Rooms</Link>
        </div>
      ) : upcoming.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center">
          <p className="text-[12.5px] text-subtext">Nothing due — every piece of equipment on record is in good shape.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line divide-y divide-line">
          {upcoming.slice(0, 4).map(({ room, equipment }) => (
            <button key={`${room.id}-${equipment.name}`}
              onClick={() => router.push(`/rooms/${room.id}?eq=${encodeURIComponent(equipment.name)}`)}
              className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-white/5">
              <div className="w-8 h-8 rounded-lg bg-[var(--warn-bg)] flex items-center justify-center flex-shrink-0"><Wrench size={14} className="text-[var(--warn-fg)]" /></div>
              <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-fg truncate">{equipment.name}</p><p className="text-[11px] text-subtext truncate">{room.name} · {equipment.model}</p></div>
              <span className="text-[10.5px] font-semibold px-2 py-1 rounded-full bg-[var(--warn-bg)] text-[var(--warn-fg)] flex-shrink-0">
                {equipment.issueNote ? "Issue reported" : "Due soon"}
              </span>
              <ChevronRight size={14} className="text-subtext flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mt-5 mb-8">
        <div className="rounded-2xl border border-line p-4" style={{ background: "linear-gradient(160deg, var(--attention-wash), transparent)" }}>
          <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-[var(--attention-fg)] font-semibold"><AlertTriangle size={11} /> ATTENTION</div>
          {upcoming.length > 0 ? (
            <>
              <p className="text-[14px] font-bold text-fg mt-2">{upcoming.length} item{upcoming.length > 1 ? "s" : ""} need review</p>
              <p className="text-[11px] text-subtext mt-1 truncate">{upcoming.slice(0, 2).map((u) => u.equipment.name).join(", ")}{upcoming.length > 2 ? `, +${upcoming.length - 2} more` : ""}</p>
              <Link href="/rooms" className="text-[12px] text-[var(--attention-fg)] font-semibold flex items-center gap-1 mt-2.5">Review now <ChevronRight size={12} /></Link>
            </>
          ) : (
            <p className="text-[13px] text-subtext mt-2">Nothing needs attention right now.</p>
          )}
        </div>
        <div className="rounded-2xl border border-line p-4" style={{ background: "linear-gradient(160deg, var(--primary-wash), transparent)" }}>
          <div className="w-9 h-9 rounded-lg border border-line flex items-center justify-center mb-2"><Scan size={16} className="text-primary" /></div>
          <p className="text-[10px] tracking-widest text-primary font-semibold">PROPERTY X-RAY</p>
          <p className="text-[14px] font-bold text-fg mt-1">See beyond the surface.</p>
          <p className="text-[11px] text-subtext mt-1">Every hidden system, connection, document and service record in one place.</p>
          <Link href="/xray" className="text-[12px] text-primary font-semibold flex items-center gap-1 mt-2.5">Open X-Ray <ChevronRight size={12} /></Link>
        </div>
        <div className="rounded-2xl border border-line p-4">
          <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-subtext font-semibold"><CheckCircle2 size={11} className="text-primary" /> RECENT UPDATE</div>
          {latestCompleted ? (
            <>
              <p className="text-[13.5px] font-bold text-fg mt-2">{latestCompleted.title}</p>
              <p className="text-[11px] text-subtext mt-1">{latestCompleted.date} · {latestCompleted.room} · {latestCompleted.supplier}</p>
            </>
          ) : (
            <p className="text-[13px] text-subtext mt-2">No activity yet.</p>
          )}
        </div>
      </div>

      {showChangeClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowChangeClient(false)}>
          <form onSubmit={(e) => submitChangeClient(e, property.id)} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">Change client</p>
              <button type="button" onClick={() => setShowChangeClient(false)}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-[12px] text-subtext">Move <span className="text-fg font-semibold">{property.name}</span> to a different client. Its rooms, equipment and history stay with it.</p>
              {otherClients.length === 0 ? (
                <p className="text-[12.5px] text-subtext">There are no other clients yet — add one from the Clients tab first.</p>
              ) : (
                <>
                  <select required value={changeClientTo} onChange={(e) => setChangeClientTo(e.target.value)}
                    className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
                    <option value="">Choose a client…</option>
                    {otherClients.map((c) => <option key={c.email} value={c.email}>{c.name}</option>)}
                  </select>
                  <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">Move property</button>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AllPropertiesOverview({
  properties, clients, onOpen,
}: { properties: Property[]; clients: ClientRecord[]; onOpen: (p: Property) => void }) {
  const totalAttention = properties.reduce((s, p) => s + dueSoonEquipment(p).length, 0);
  const avgHealth = properties.length ? Math.round(properties.reduce((s, p) => s + healthScore(p), 0) / properties.length) : 0;
  const clientName = (email: string | null) => clients.find((c) => c.email === email)?.name ?? "Unassigned";

  return (
    <div className="px-8 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-fg mb-1">Overview</h1>
      <p className="text-[12.5px] text-subtext mb-5">All properties across every client.</p>

      <div className="grid grid-cols-4 rounded-2xl border border-line divide-x divide-line mb-6">
        <div className="p-4 flex items-center gap-3"><Building2 size={16} className="text-primary" /><div><p className="text-xl font-bold text-fg leading-none">{properties.length}</p><p className="text-[11px] text-subtext mt-1">Properties</p></div></div>
        <div className="p-4 flex items-center gap-3"><Users size={16} className="text-primary" /><div><p className="text-xl font-bold text-fg leading-none">{clients.length}</p><p className="text-[11px] text-subtext mt-1">Clients</p></div></div>
        <div className="p-4 flex items-center gap-3"><AlertTriangle size={16} className="text-[var(--warn-fg)]" /><div><p className="text-xl font-bold text-fg leading-none">{totalAttention}</p><p className="text-[11px] text-subtext mt-1">Need attention</p></div></div>
        <div className="p-4 flex items-center gap-3"><CheckCircle2 size={16} className="text-[var(--ok-fg)]" /><div><p className="text-xl font-bold text-fg leading-none">{avgHealth}%</p><p className="text-[11px] text-subtext mt-1">Avg. health</p></div></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {properties.map((p) => {
          const pAttention = dueSoonEquipment(p).length;
          return (
          <button key={p.id} onClick={() => onOpen(p)}
            className="relative rounded-2xl overflow-hidden border border-line h-40 flex flex-col justify-between p-4 text-left hover:border-primary/40"
            style={p.photoUrl
              ? { backgroundImage: `linear-gradient(to top, rgba(7,16,23,0.85), rgba(7,16,23,0.15)), url(${p.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: "linear-gradient(135deg, #14242E, #0C1821)" }}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-black/40 backdrop-blur flex items-center justify-center flex-shrink-0"><MapPin size={16} className="text-primary" /></div>
              {pAttention > 0 ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-white bg-black/40 backdrop-blur px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> {pAttention} attention</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-white bg-black/40 backdrop-blur px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Current</span>
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">{p.name}</p>
              <p className="text-[11px] text-white/70 mt-0.5">{p.area} · {clientName(p.clientEmail)}</p>
              <p className="text-[11px] text-primary font-semibold mt-1.5">{healthScore(p)}% health</p>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
