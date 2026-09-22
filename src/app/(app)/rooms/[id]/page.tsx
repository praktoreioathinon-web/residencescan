"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, ChevronRight, Sparkles, Fan, Sun, X, ImageIcon, Camera, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { EquipmentItem, genericEquipmentTerm } from "@/lib/data";
import { compressImageToWebp } from "@/lib/image";

const EQUIP_ICONS = [Sparkles, Fan, Sun];
const TAB_KEYS = ["Equipment", "Documents", "Maintenance", "Photos"] as const;

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { session, properties, selectedPropertyId, setEquipmentPhoto, reportEquipmentIssue, clearEquipmentIssue, addEquipment } = useStore();
  const property = properties.find((p) => p.id === selectedPropertyId);
  const room = property?.rooms.find((r) => r.id === params.id);
  const [tab, setTab] = useState<(typeof TAB_KEYS)[number]>("Equipment");
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipName, setNewEquipName] = useState("");
  const [newEquipModel, setNewEquipModel] = useState("");
  const canEdit = session?.role !== "client";

  // Suggest generic equipment types (TV, Pump, A/C, ...) seen anywhere across every
  // property, not specific brands/models — and not ones this room already has.
  const equipmentSuggestions = Array.from(new Set(
    properties.flatMap((p) => p.rooms.flatMap((r) => r.equipment.map((e) => genericEquipmentTerm(e.name))))
  )).filter((term) => !room?.equipment?.some((e) => genericEquipmentTerm(e.name) === term)).sort();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && (TAB_KEYS as readonly string[]).includes(tabParam)) setTab(tabParam as (typeof TAB_KEYS)[number]);
    const eqName = searchParams.get("eq");
    if (eqName && room) {
      const match = room.equipment.find((e) => e.name === eqName);
      if (match) setSelectedEquipment(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, room?.id]);

  if (!room) return notFound();

  function handleEquipmentPhoto(e: React.ChangeEvent<HTMLInputElement>, equipmentName: string) {
    const file = e.target.files?.[0];
    if (!file || !property || !room) return;
    compressImageToWebp(file).then((dataUrl) => {
      setEquipmentPhoto(property.id, room.id, equipmentName, dataUrl);
      setSelectedEquipment((prev) => (prev && prev.name === equipmentName ? { ...prev, photoUrl: dataUrl } : prev));
    });
  }

  function submitIssue(equipmentName: string) {
    if (!property || !room || !reportText.trim()) return;
    reportEquipmentIssue(property.id, room.id, equipmentName, reportText.trim());
    setSelectedEquipment((prev) => (prev && prev.name === equipmentName ? { ...prev, issueNote: reportText.trim(), issueReportedAt: "just now" } : prev));
    setReportOpen(false);
    setReportText("");
  }

  function resolveIssue(equipmentName: string) {
    if (!property || !room) return;
    clearEquipmentIssue(property.id, room.id, equipmentName);
    setSelectedEquipment((prev) => (prev && prev.name === equipmentName ? { ...prev, issueNote: undefined, issueReportedAt: undefined } : prev));
  }

  function openEquipment(eq: EquipmentItem) {
    setSelectedEquipment(eq);
    setReportOpen(false);
    setReportText("");
  }

  function submitAddEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !room || !newEquipName.trim()) return;
    addEquipment(property.id, room.id, { name: newEquipName.trim(), model: newEquipModel.trim() });
    setShowAddEquipment(false);
    setNewEquipName("");
    setNewEquipModel("");
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
        {canEdit && (
          <button onClick={() => setShowAddEquipment(true)} className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
            <Plus size={14} /> Add equipment
          </button>
        )}
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
              <button key={eq.name} onClick={() => openEquipment(eq)}
                className="flex items-center gap-3 rounded-2xl border border-line p-3.5 text-left hover:border-primary/40">
                {eq.photoUrl ? (
                  <div className="w-9 h-9 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${eq.photoUrl})` }} />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-primary" /></div>
                )}
                <div className="flex-1"><p className="text-[13.5px] font-semibold text-fg">{eq.name}</p><p className="text-[11.5px] text-subtext">{eq.model}</p></div>
                <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${eq.issueNote ? "bg-[var(--attention-wash)] text-[var(--attention-fg)]" : eq.status === "Good" ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" : "bg-[var(--warn-bg)] text-[var(--warn-fg)]"}`}>
                  {eq.issueNote ? "Issue reported" : eq.status}
                </span>
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
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                <label title={selectedEquipment.photoUrl ? "Change photo" : "Upload photo"}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/50 px-2.5 py-1.5 rounded-full cursor-pointer">
                  <ImageIcon size={12} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleEquipmentPhoto(e, selectedEquipment.name)} />
                </label>
                <label title="Take photo"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/50 px-2.5 py-1.5 rounded-full cursor-pointer">
                  <Camera size={12} />
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleEquipmentPhoto(e, selectedEquipment.name)} />
                </label>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[15px] font-bold text-fg">{selectedEquipment.name}</p>
                <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${selectedEquipment.issueNote ? "bg-[var(--attention-wash)] text-[var(--attention-fg)]" : selectedEquipment.status === "Good" ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" : "bg-[var(--warn-bg)] text-[var(--warn-fg)]"}`}>
                  {selectedEquipment.issueNote ? "Issue reported" : selectedEquipment.status}
                </span>
              </div>
              <p className="text-[12.5px] text-subtext mb-4">{selectedEquipment.model}</p>
              <div className="rounded-xl border border-line divide-y divide-line text-[12.5px] mb-4">
                <div className="flex items-center justify-between p-3"><span className="text-subtext">Room</span><span className="text-fg font-semibold">{room.name}</span></div>
                <div className="flex items-center justify-between p-3"><span className="text-subtext">Property</span><span className="text-fg font-semibold">{property?.name}</span></div>
              </div>

              {selectedEquipment.issueNote ? (
                <div className="rounded-xl p-3.5" style={{ background: "var(--attention-wash)" }}>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--attention-fg)]"><AlertTriangle size={12} /> Reported {selectedEquipment.issueReportedAt}</p>
                  <p className="text-[12.5px] text-fg mt-1.5">{selectedEquipment.issueNote}</p>
                  {canEdit && (
                    <button onClick={() => resolveIssue(selectedEquipment.name)}
                      className="flex items-center gap-1.5 text-[12px] text-[var(--ok-fg)] font-semibold mt-2.5">
                      <CheckCircle2 size={13} /> Mark resolved
                    </button>
                  )}
                </div>
              ) : !canEdit && (
                reportOpen ? (
                  <div className="rounded-xl border border-line p-3.5">
                    <textarea autoFocus value={reportText} onChange={(e) => setReportText(e.target.value)}
                      placeholder="Describe the issue (e.g. not turning on, making noise)…"
                      className="w-full rounded-lg border border-line px-3 py-2 text-[12.5px] outline-none focus:border-primary/50" style={{ height: 70 }} />
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => submitIssue(selectedEquipment.name)} disabled={!reportText.trim()}
                        className="bg-primary text-primary-fg text-[12px] font-semibold px-3.5 py-2 rounded-full disabled:opacity-40">Submit report</button>
                      <button onClick={() => { setReportOpen(false); setReportText(""); }} className="text-[12px] text-subtext px-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReportOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 border border-dashed border-line rounded-xl py-2.5 text-[12.5px] text-[var(--attention-fg)] font-semibold">
                    <AlertTriangle size={13} /> Report an issue
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showAddEquipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowAddEquipment(false)}>
          <form onSubmit={submitAddEquipment} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">Add equipment</p>
              <button type="button" onClick={() => setShowAddEquipment(false)}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <input required autoFocus placeholder="Equipment name (e.g. Living Room TV)" value={newEquipName} onChange={(e) => setNewEquipName(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <input placeholder="Model / notes (optional)" value={newEquipModel} onChange={(e) => setNewEquipModel(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              {equipmentSuggestions.length > 0 && (
                <div>
                  <p className="text-[10.5px] text-subtext mb-1.5">Common equipment in other rooms:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {equipmentSuggestions.map((term) => (
                      <button key={term} type="button" onClick={() => setNewEquipName(term)}
                        className="text-[11.5px] font-medium px-2.5 py-1 rounded-full border border-line text-subtext hover:border-primary/40 hover:text-fg">
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">Create equipment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
