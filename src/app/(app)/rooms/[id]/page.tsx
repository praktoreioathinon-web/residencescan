"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, ChevronRight, Sparkles, Fan, Sun, X, ImageIcon, Camera, AlertTriangle, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { EquipmentItem, Room, genericEquipmentTerm, roomMaintenanceEntries, formatDate, todayISO } from "@/lib/data";
import { uploadPhoto } from "@/lib/image";

const EQUIP_ICONS = [Sparkles, Fan, Sun];
const TAB_KEYS = ["Equipment", "Documents", "Maintenance", "Photos"] as const;
const CATEGORIES: Room["category"][] = ["Indoor", "Outdoor", "Technical"];

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    session, properties, selectedPropertyId, setEquipmentPhoto, setRoomPhoto, addRoomPhoto, removeRoomPhoto, removeEquipmentPhoto,
    reportEquipmentIssue, clearEquipmentIssue, addEquipment, editRoom, removeRoom, editEquipment, removeEquipment, getAccessToken,
  } = useStore();
  const property = properties.find((p) => p.id === selectedPropertyId);
  const room = property?.rooms.find((r) => r.id === params.id);
  const [tab, setTab] = useState<(typeof TAB_KEYS)[number]>("Equipment");
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipName, setNewEquipName] = useState("");
  const [newEquipModel, setNewEquipModel] = useState("");
  const [newEquipPhoto, setNewEquipPhoto] = useState<string | undefined>(undefined);
  const [newEquipInstalledDate, setNewEquipInstalledDate] = useState(todayISO());
  const [newEquipNextMaintenance, setNewEquipNextMaintenance] = useState("");
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomCategory, setEditRoomCategory] = useState<Room["category"]>("Indoor");
  const [editingEquipment, setEditingEquipment] = useState(false);
  const [editEquipName, setEditEquipName] = useState("");
  const [editEquipModel, setEditEquipModel] = useState("");
  const [editEquipInstalledDate, setEditEquipInstalledDate] = useState("");
  const [editEquipNextMaintenance, setEditEquipNextMaintenance] = useState("");
  const canEdit = session?.role !== "client";
  const deletingRef = useRef(false);

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

  if (!room) return deletingRef.current ? null : notFound();

  function handleRoomPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !property || !room) return;
    uploadPhoto(file, getAccessToken()).then((dataUrl) => setRoomPhoto(property.id, room.id, dataUrl)).catch((err) => alert(`Couldn't process that photo: ${err.message}`));
  }

  function handleAddRoomPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !property || !room) return;
    uploadPhoto(file, getAccessToken()).then((dataUrl) => addRoomPhoto(property.id, room.id, dataUrl)).catch((err) => alert(`Couldn't process that photo: ${err.message}`));
  }

  function openEditRoom() {
    if (!room) return;
    setEditRoomName(room.name);
    setEditRoomCategory(room.category);
    setShowEditRoom(true);
  }

  function submitEditRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !room || !editRoomName.trim()) return;
    editRoom(property.id, room.id, { name: editRoomName.trim(), category: editRoomCategory });
    setShowEditRoom(false);
  }

  function deleteRoom() {
    if (!property || !room) return;
    if (!confirm(`Delete "${room.name}" and all ${room.equipment.length} equipment records in it? This can't be undone.`)) return;
    deletingRef.current = true;
    removeRoom(property.id, room.id);
    router.push("/rooms");
  }

  function removePhoto(photoUrl: string, fromEquipment?: string) {
    if (!property || !room) return;
    if (fromEquipment) {
      removeEquipmentPhoto(property.id, room.id, fromEquipment);
      setSelectedEquipment((prev) => (prev && prev.name === fromEquipment ? { ...prev, photoUrl: undefined } : prev));
    } else {
      removeRoomPhoto(property.id, room.id, photoUrl);
    }
  }

  function handleEquipmentPhoto(e: React.ChangeEvent<HTMLInputElement>, equipmentName: string) {
    const file = e.target.files?.[0];
    if (!file || !property || !room) return;
    uploadPhoto(file, getAccessToken()).then((dataUrl) => {
      setEquipmentPhoto(property.id, room.id, equipmentName, dataUrl);
      setSelectedEquipment((prev) => (prev && prev.name === equipmentName ? { ...prev, photoUrl: dataUrl } : prev));
    }).catch((err) => alert(`Couldn't process that photo: ${err.message}`));
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
    setEditingEquipment(false);
  }

  function openEditEquipment() {
    if (!selectedEquipment) return;
    setEditEquipName(selectedEquipment.name);
    setEditEquipModel(selectedEquipment.model);
    setEditEquipInstalledDate(selectedEquipment.installedDate ?? "");
    setEditEquipNextMaintenance(selectedEquipment.nextMaintenanceDate ?? "");
    setEditingEquipment(true);
  }

  function submitEditEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !room || !selectedEquipment || !editEquipName.trim()) return;
    const updates = {
      name: editEquipName.trim(), model: editEquipModel.trim(),
      installedDate: editEquipInstalledDate || undefined, nextMaintenanceDate: editEquipNextMaintenance || undefined,
    };
    editEquipment(property.id, room.id, selectedEquipment.name, updates);
    setSelectedEquipment({ ...selectedEquipment, ...updates });
    setEditingEquipment(false);
  }

  function deleteEquipment() {
    if (!property || !room || !selectedEquipment) return;
    if (!confirm(`Delete "${selectedEquipment.name}"? This can't be undone.`)) return;
    removeEquipment(property.id, room.id, selectedEquipment.name);
    setSelectedEquipment(null);
  }

  function submitAddEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !room || !newEquipName.trim()) return;
    addEquipment(property.id, room.id, {
      name: newEquipName.trim(), model: newEquipModel.trim(), photoUrl: newEquipPhoto,
      installedDate: newEquipInstalledDate || undefined, nextMaintenanceDate: newEquipNextMaintenance || undefined,
    });
    setShowAddEquipment(false);
    setNewEquipName("");
    setNewEquipModel("");
    setNewEquipPhoto(undefined);
    setNewEquipInstalledDate(todayISO());
    setNewEquipNextMaintenance("");
  }

  function handleNewEquipPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhoto(file, getAccessToken()).then(setNewEquipPhoto).catch((err) => alert(`Couldn't process that photo: ${err.message}`));
  }

  function closeAddEquipment() {
    setShowAddEquipment(false);
    setNewEquipPhoto(undefined);
  }

  const maintenanceEntries = property ? roomMaintenanceEntries(property, room) : [];
  const photoItems: { label: string; photoUrl: string; fromEquipment?: string }[] = [
    ...(room.photoUrl ? [{ label: room.name, photoUrl: room.photoUrl }] : []),
    ...(room.photos ?? []).map((url, i) => ({ label: `${room.name} photo ${i + 1}`, photoUrl: url })),
    ...room.equipment.filter((e) => e.photoUrl).map((e) => ({ label: e.name, photoUrl: e.photoUrl as string, fromEquipment: e.name })),
  ];

  const tabs = [
    { key: "Equipment" as const, count: room.equipment.length },
    { key: "Documents" as const, count: 0 },
    { key: "Maintenance" as const, count: maintenanceEntries.length },
    { key: "Photos" as const, count: photoItems.length },
  ];

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/rooms" className="w-9 h-9 rounded-full border border-line flex items-center justify-center"><ArrowLeft size={15} /></Link>
          <div>
            <p className="text-[10px] tracking-widest text-subtext font-semibold">ROOM {room.number}</p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-fg">{room.name}</h1>
              {canEdit && (
                <>
                  <button onClick={openEditRoom} title="Edit room" className="w-6 h-6 rounded-full border border-line flex items-center justify-center flex-shrink-0">
                    <Pencil size={11} className="text-subtext" />
                  </button>
                  <button onClick={deleteRoom} title="Delete room" className="w-6 h-6 rounded-full border border-line flex items-center justify-center flex-shrink-0">
                    <Trash2 size={11} className="text-[var(--attention-fg)]" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowAddEquipment(true)} className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
            <Plus size={14} /> Add equipment
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-line p-6 mb-5"
        style={room.photoUrl
          ? { backgroundImage: `linear-gradient(160deg, rgba(7,16,23,0.75), rgba(7,16,23,0.35)), url(${room.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(160deg, var(--primary-wash), transparent)" }}>
        <p className={`flex items-center gap-1.5 text-[11.5px] font-semibold mb-8 ${room.photoUrl ? "text-white" : "text-primary"}`}>
          <Sparkles size={13} /> {room.equipmentCount} equipment records
        </p>
        <p className={`text-xl font-bold ${room.photoUrl ? "text-white" : "text-fg"}`}>{room.name}</p>
        <p className={`text-[12px] mt-0.5 ${room.photoUrl ? "text-white/70" : "text-subtext"}`}>{room.subtitle}</p>
        {canEdit && (
          <div className="flex items-center gap-2 mt-3">
            <label className={`flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full w-fit cursor-pointer ${room.photoUrl ? "text-white bg-white/10" : "text-fg border border-line"}`}>
              <ImageIcon size={13} /> {room.photoUrl ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleRoomPhoto} />
            </label>
            <label className={`flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full w-fit cursor-pointer ${room.photoUrl ? "text-white bg-white/10" : "text-fg border border-line"}`}>
              <Camera size={13} /> Take photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleRoomPhoto} />
            </label>
          </div>
        )}
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
      ) : tab === "Maintenance" ? (
        maintenanceEntries.length === 0 ? (
          <p className="text-[12.5px] text-subtext py-8 text-center">No maintenance recorded for this room yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {maintenanceEntries.map((m) => (
              <div key={m.id} className="rounded-2xl border border-line p-3.5">
                <p className="text-[11px] text-subtext mb-1">{m.date} · {m.supplier}</p>
                <p className="text-[13.5px] font-semibold text-fg">{m.title}</p>
                <p className="text-[11.5px] text-subtext mt-1">{m.notes}</p>
              </div>
            ))}
          </div>
        )
      ) : tab === "Photos" ? (
        <div>
          {canEdit && (
            <div className="flex items-center gap-2 mb-3.5">
              <label className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full border border-line text-fg cursor-pointer hover:border-primary/40">
                <ImageIcon size={13} /> Add photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAddRoomPhoto} />
              </label>
              <label className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full border border-line text-fg cursor-pointer hover:border-primary/40">
                <Camera size={13} /> Take photo
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAddRoomPhoto} />
              </label>
            </div>
          )}
          {photoItems.length === 0 ? (
            <p className="text-[12.5px] text-subtext py-8 text-center">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {photoItems.map((p, i) => (
                <div key={i} title={p.label} className="relative rounded-xl overflow-hidden bg-cover bg-center" style={{ aspectRatio: "1 / 1", backgroundImage: `url(${p.photoUrl})` }}>
                  {canEdit && (
                    <button onClick={() => removePhoto(p.photoUrl, p.fromEquipment)} title="Remove photo"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                      <X size={12} className="text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[12.5px] text-subtext py-8 text-center">No documents uploaded yet.</p>
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
              {editingEquipment ? (
                <form onSubmit={submitEditEquipment} className="mb-4">
                  <div className="flex flex-col gap-2 mb-2">
                    <input required autoFocus value={editEquipName} onChange={(e) => setEditEquipName(e.target.value)}
                      placeholder="Equipment name"
                      className="rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-primary/50" />
                    <input value={editEquipModel} onChange={(e) => setEditEquipModel(e.target.value)}
                      placeholder="Model / notes"
                      className="rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-primary/50" />
                    <div>
                      <label className="text-[10.5px] text-subtext mb-1 block">Installed date</label>
                      <input type="date" value={editEquipInstalledDate} onChange={(e) => setEditEquipInstalledDate(e.target.value)}
                        className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-subtext mb-1 block">Next maintenance date (leave blank if not needed)</label>
                      <input type="date" value={editEquipNextMaintenance} onChange={(e) => setEditEquipNextMaintenance(e.target.value)}
                        className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-primary/50" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" className="text-[12.5px] font-semibold text-primary">Save</button>
                    <button type="button" onClick={() => setEditingEquipment(false)} className="text-[12.5px] text-subtext">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[15px] font-bold text-fg">{selectedEquipment.name}</p>
                      {canEdit && (
                        <>
                          <button onClick={openEditEquipment} title="Edit equipment" className="w-[22px] h-[22px] rounded-full border border-line flex items-center justify-center flex-shrink-0">
                            <Pencil size={10} className="text-subtext" />
                          </button>
                          <button onClick={deleteEquipment} title="Delete equipment" className="w-[22px] h-[22px] rounded-full border border-line flex items-center justify-center flex-shrink-0">
                            <Trash2 size={10} className="text-[var(--attention-fg)]" />
                          </button>
                        </>
                      )}
                    </div>
                    <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${selectedEquipment.issueNote ? "bg-[var(--attention-wash)] text-[var(--attention-fg)]" : selectedEquipment.status === "Good" ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" : "bg-[var(--warn-bg)] text-[var(--warn-fg)]"}`}>
                      {selectedEquipment.issueNote ? "Issue reported" : selectedEquipment.status}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-subtext mb-4">{selectedEquipment.model}</p>
                </>
              )}
              <div className="rounded-xl border border-line divide-y divide-line text-[12.5px] mb-4">
                <div className="flex items-center justify-between p-3"><span className="text-subtext">Room</span><span className="text-fg font-semibold">{room.name}</span></div>
                <div className="flex items-center justify-between p-3"><span className="text-subtext">Property</span><span className="text-fg font-semibold">{property?.name}</span></div>
                {selectedEquipment.installedDate && (
                  <div className="flex items-center justify-between p-3"><span className="text-subtext">Installed</span><span className="text-fg font-semibold">{formatDate(selectedEquipment.installedDate)}</span></div>
                )}
                <div className="flex items-center justify-between p-3">
                  <span className="text-subtext">Next maintenance</span>
                  <span className="text-fg font-semibold">{selectedEquipment.nextMaintenanceDate ? formatDate(selectedEquipment.nextMaintenanceDate) : "Not needed"}</span>
                </div>
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

      {showEditRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowEditRoom(false)}>
          <form onSubmit={submitEditRoom} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">Edit room</p>
              <button type="button" onClick={() => setShowEditRoom(false)}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <input required autoFocus placeholder="Room name" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <select value={editRoomCategory} onChange={(e) => setEditRoomCategory(e.target.value as Room["category"])}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">Save changes</button>
            </div>
          </form>
        </div>
      )}

      {showAddEquipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={closeAddEquipment}>
          <form onSubmit={submitAddEquipment} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">Add equipment</p>
              <button type="button" onClick={closeAddEquipment}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <input required autoFocus placeholder="Equipment name (e.g. Living Room TV)" value={newEquipName} onChange={(e) => setNewEquipName(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <input placeholder="Model / notes (optional)" value={newEquipModel} onChange={(e) => setNewEquipModel(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />

              <div>
                <label className="text-[10.5px] text-subtext mb-1 block">Installed date</label>
                <input type="date" value={newEquipInstalledDate} onChange={(e) => setNewEquipInstalledDate(e.target.value)}
                  className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10.5px] text-subtext mb-1 block">Next maintenance date (leave blank if this doesn't need maintenance, e.g. weights, furniture)</label>
                <input type="date" value={newEquipNextMaintenance} onChange={(e) => setNewEquipNextMaintenance(e.target.value)}
                  className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              </div>

              {newEquipPhoto && (
                <div className="relative h-28 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${newEquipPhoto})` }} />
                  <button type="button" onClick={() => setNewEquipPhoto(undefined)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 border border-line rounded-lg py-2 text-[12.5px] text-fg cursor-pointer hover:border-primary/40">
                  <ImageIcon size={13} /> Upload photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleNewEquipPhoto} />
                </label>
                <label className="flex-1 flex items-center justify-center gap-1.5 border border-line rounded-lg py-2 text-[12.5px] text-fg cursor-pointer hover:border-primary/40">
                  <Camera size={13} /> Take photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleNewEquipPhoto} />
                </label>
              </div>

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
