"use client";

import Link from "next/link";
import { ArrowLeftRight, Building2, CheckCircle2, Download, MapPin, ShieldCheck, Wrench, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import PropertyPicker from "@/components/PropertyPicker";
import { healthScore, activeProperties } from "@/lib/data";

export default function ReportsPage() {
  const { session, properties, clients, selectedClientEmail, selectedPropertyId, setSelectedPropertyId } = useStore();

  // Admin/support can jump straight to a specific property (e.g. one picked from
  // the "Unassigned properties" list in Clients) without first choosing a client —
  // an unassigned property has no client to choose in the first place.
  const directProperty = session?.role === "client" ? undefined : properties.find((p) => p.id === selectedPropertyId);
  const clientEmail = session?.role === "client" ? session.email : directProperty ? directProperty.clientEmail : selectedClientEmail;
  const myProperties = activeProperties(properties).filter((p) => p.clientEmail === clientEmail);
  const property = directProperty ?? myProperties.find((p) => p.id === selectedPropertyId);
  const client = clients.find((c) => c.email === clientEmail);

  if (!property && !clientEmail) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">Reports</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a client first to see their property report.</p>
        <Link href="/clients" className="inline-block bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">Go to Clients</Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">Reports</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a property to generate its report.</p>
        <PropertyPicker properties={myProperties} onSelect={setSelectedPropertyId} />
      </div>
    );
  }

  const totalEquipment = property.rooms.reduce((s, r) => s + r.equipmentCount, 0);
  const generatedOn = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="no-print flex items-center justify-between mb-5 gap-3">
        <div>
          <p className="text-[10px] tracking-widest text-subtext font-semibold">{property.area.toUpperCase()}</p>
          <h1 className="text-2xl font-bold text-fg">{property.name} — Report</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {myProperties.length > 1 && (
            <button onClick={() => setSelectedPropertyId(null)} className="flex items-center gap-1.5 border border-line text-[12.5px] font-semibold px-4 py-2 rounded-full text-fg">
              <ArrowLeftRight size={13} /> Switch property
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
            <Download size={14} /> Export to PDF
          </button>
        </div>
      </div>
      <p className="no-print text-[11.5px] text-subtext -mt-3 mb-5">Uses your browser's print dialog — choose &ldquo;Save as PDF&rdquo; as the destination.</p>

      <div className="rounded-2xl border border-line p-6 mb-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Zap size={17} className="text-primary" /></div>
            <div>
              <p className="text-[14px] font-bold text-fg leading-none">ResidenceScan</p>
              <p className="text-[9px] tracking-wider text-subtext mt-1">PROPERTY MAINTENANCE REPORT</p>
            </div>
          </div>
          <p className="text-[11.5px] text-subtext">Generated {generatedOn}</p>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-widest text-subtext font-semibold">PROPERTY</p>
            <h2 className="text-xl font-bold text-fg mt-0.5">{property.name}</h2>
            <p className="flex items-center gap-1 text-[12.5px] text-subtext mt-1"><MapPin size={12} /> {property.location}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-subtext font-semibold">PREPARED FOR</p>
            <p className="text-[14px] font-semibold text-fg mt-0.5">{client?.name ?? "—"}</p>
            <p className="text-[12.5px] text-subtext">{client?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 rounded-xl border border-line divide-x divide-line mt-5">
          <div className="p-3.5 text-center"><p className="text-lg font-bold text-fg">{healthScore(property)}%</p><p className="text-[10.5px] text-subtext">Health score</p></div>
          <div className="p-3.5 text-center"><p className="text-lg font-bold text-fg">{property.rooms.length}</p><p className="text-[10.5px] text-subtext">Rooms</p></div>
          <div className="p-3.5 text-center"><p className="text-lg font-bold text-fg">{totalEquipment}</p><p className="text-[10.5px] text-subtext">Equipment records</p></div>
          <div className="p-3.5 text-center"><p className="text-lg font-bold text-fg">{property.maintenanceLog.length}</p><p className="text-[10.5px] text-subtext">Completed services</p></div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <ShieldCheck size={14} className="text-primary" />
        <p className="text-[10px] tracking-widest text-subtext font-semibold">MAINTENANCE HISTORY — WORK COMPLETED</p>
      </div>
      <div className="rounded-2xl border border-line divide-y divide-line mb-6">
        {property.maintenanceLog.length === 0 ? (
          <p className="text-[12.5px] text-subtext p-5 text-center">No completed maintenance recorded yet for this property.</p>
        ) : property.maintenanceLog.map((m) => (
          <div key={m.id} className="flex items-start gap-3 p-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--ok-bg)] flex items-center justify-center flex-shrink-0"><Wrench size={14} className="text-[var(--ok-fg)]" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[13.5px] font-semibold text-fg">{m.title}</p>
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-[var(--ok-bg)] text-[var(--ok-fg)] px-2 py-0.5 rounded-full flex-shrink-0"><CheckCircle2 size={10} /> Completed</span>
              </div>
              <p className="text-[11.5px] text-subtext mt-0.5">{m.date} · {m.room} · {m.supplier}</p>
              <p className="text-[12px] text-subtext mt-1.5">{m.notes}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <Building2 size={14} className="text-primary" />
        <p className="text-[10px] tracking-widest text-subtext font-semibold">ROOMS & AREAS COVERED</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {property.rooms.map((r) => (
          <div key={r.id} className="rounded-xl border border-line p-3">
            <p className="text-[12.5px] font-semibold text-fg">{r.name}</p>
            <p className="text-[10.5px] text-subtext mt-0.5">{r.category} · {r.equipmentCount} equipment</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-subtext text-center mt-8 mb-2">This report reflects the property's digital record as of {generatedOn} and is provided by ResidenceScan.</p>
    </div>
  );
}
