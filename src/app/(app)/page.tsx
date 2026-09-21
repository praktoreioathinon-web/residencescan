"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Grid2x2, Cog, Waves, Store, Camera, Scan, ChevronRight, ImageIcon, ShieldCheck, AlertTriangle, CheckCircle2, Building2, Users, MapPin } from "lucide-react";
import { maintenanceItems, Property, ClientRecord } from "@/lib/data";
import { useStore } from "@/lib/store";

const QUICK_ACCESS = [
  { href: "/rooms", label: "All Rooms", sub: "rooms", icon: Grid2x2 },
  { href: "/rooms", label: "Machinery", sub: "systems", icon: Cog },
  { href: "/rooms", label: "Pools", sub: "systems", icon: Waves },
  { href: "/suppliers", label: "Suppliers", sub: "contacts", icon: Store },
  { href: "/maintenance", label: "Maintenance", sub: "upcoming", icon: Camera },
  { href: "/xray", label: "X-Ray", sub: "All systems", icon: Scan },
];

const STATUS_STYLE: Record<string, string> = {
  "Due soon": "bg-[var(--warn-bg)] text-[var(--warn-fg)]",
  Scheduled: "bg-[var(--warn-bg)] text-[var(--warn-fg)]",
  Upcoming: "bg-[var(--warn-bg)] text-[var(--warn-fg)]",
};

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
  const { session, properties, clients, selectedClientEmail, selectedPropertyId, setSelectedClientEmail, setSelectedPropertyId, selectClientAndProperty, setPropertyPhoto } = useStore();

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>, propertyId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPropertyPhoto(propertyId, reader.result);
    };
    reader.readAsDataURL(file);
  }

  const clientEmail = session?.role === "client" ? session.email : selectedClientEmail;
  const myProperties = properties.filter((p) => p.clientEmail === clientEmail);
  const property = myProperties.find((p) => p.id === selectedPropertyId) ?? myProperties[0];
  const index = property ? myProperties.findIndex((p) => p.id === property.id) : -1;

  useEffect(() => {
    if (property && property.id !== selectedPropertyId) setSelectedPropertyId(property.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id]);

  if (!clientEmail) {
    if (session?.role === "admin" || session?.role === "support") {
      return (
        <AllPropertiesOverview
          properties={properties} clients={clients}
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

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-widest text-subtext font-semibold">{myProperties.length > 1 ? `${myProperties.length} PROPERTIES` : "MY RESIDENCE"}</p>
        {myProperties.length > 1 && <span className="text-[11px] text-subtext">{index + 1} / {myProperties.length}</span>}
      </div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold text-fg">{property.name}</h1>
        {(session?.role === "admin" || session?.role === "support") && (
          <button onClick={() => setSelectedClientEmail(null)}
            className="flex-shrink-0 flex items-center gap-1.5 border border-line text-[12px] font-semibold px-3.5 py-1.5 rounded-full text-fg hover:border-primary/40">
            <Building2 size={13} /> All properties
          </button>
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
          <label className="flex items-center gap-1.5 mt-2 text-[11.5px] text-white bg-white/10 px-3 py-1.5 rounded-full w-fit cursor-pointer">
            <ImageIcon size={13} /> {property.photoUrl ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(e, property.id)} />
          </label>
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
          <HealthRing pct={property.health} />
          <div>
            <p className="text-[10px] tracking-widest text-subtext font-semibold">RESIDENCE HEALTH</p>
            <p className="text-[15px] font-bold text-fg mt-0.5">{property.itemsNeedAttention} items need attention</p>
            <p className="text-[11.5px] text-subtext mt-0.5 max-w-xs">Based on {property.rooms.reduce((s, r) => s + r.equipmentCount, 0)} equipment records across {totalRooms} rooms.</p>
          </div>
        </div>
        <div className="border-l border-line pl-6">
          <Bar label="Systems online" value={property.systemsOnline[0]} max={property.systemsOnline[1]} />
          <Bar label="Maintenance current" value={property.maintenanceCurrent[0]} max={property.maintenanceCurrent[1]} />
          <Bar label="Documents complete" pctLabel={`${property.documentsCompletePct}%`} />
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
      <div className="rounded-2xl border border-line divide-y divide-line">
        {maintenanceItems.map((m) => (
          <div key={m.title} className="flex items-center gap-3 p-3.5">
            <div className="text-center w-9 flex-shrink-0">
              <p className="text-[13px] font-bold text-fg leading-none">{m.date}</p>
              <p className="text-[9px] text-subtext mt-0.5">{m.month}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Camera size={14} className="text-primary" /></div>
            <div className="flex-1"><p className="text-[13px] font-semibold text-fg">{m.title}</p><p className="text-[11px] text-subtext">{m.subtitle}</p></div>
            <span className={`text-[10.5px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[m.status]}`}>{m.status}</span>
            <ChevronRight size={14} className="text-subtext" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5 mb-8">
        <div className="rounded-2xl border border-line p-4" style={{ background: "linear-gradient(160deg, var(--attention-wash), transparent)" }}>
          <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-[var(--attention-fg)] font-semibold"><AlertTriangle size={11} /> ATTENTION</div>
          <p className="text-[14px] font-bold text-fg mt-2">{property.itemsNeedAttention} items need review</p>
          <p className="text-[11px] text-subtext mt-1">Water pre-filter replacement and pump-room pressure check.</p>
          <Link href="/rooms" className="text-[12px] text-[var(--attention-fg)] font-semibold flex items-center gap-1 mt-2.5">Review now <ChevronRight size={12} /></Link>
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
          <p className="text-[13.5px] font-bold text-fg mt-2">Pool pump record updated</p>
          <p className="text-[11px] text-subtext mt-1">Today, 10:24 · by S. Charitopoulos</p>
        </div>
      </div>
    </div>
  );
}

function AllPropertiesOverview({
  properties, clients, onOpen,
}: { properties: Property[]; clients: ClientRecord[]; onOpen: (p: Property) => void }) {
  const totalAttention = properties.reduce((s, p) => s + p.itemsNeedAttention, 0);
  const avgHealth = properties.length ? Math.round(properties.reduce((s, p) => s + p.health, 0) / properties.length) : 0;
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
        {properties.map((p) => (
          <button key={p.id} onClick={() => onOpen(p)}
            className="relative rounded-2xl overflow-hidden border border-line h-40 flex flex-col justify-between p-4 text-left hover:border-primary/40"
            style={p.photoUrl
              ? { backgroundImage: `linear-gradient(to top, rgba(7,16,23,0.85), rgba(7,16,23,0.15)), url(${p.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: "linear-gradient(135deg, #14242E, #0C1821)" }}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-black/40 backdrop-blur flex items-center justify-center flex-shrink-0"><MapPin size={16} className="text-primary" /></div>
              {p.itemsNeedAttention > 0 ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-white bg-black/40 backdrop-blur px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> {p.itemsNeedAttention} attention</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-white bg-black/40 backdrop-blur px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Current</span>
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">{p.name}</p>
              <p className="text-[11px] text-white/70 mt-0.5">{p.area} · {clientName(p.clientEmail)}</p>
              <p className="text-[11px] text-primary font-semibold mt-1.5">{p.health}% health</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
