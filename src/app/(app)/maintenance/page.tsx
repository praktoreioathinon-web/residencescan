"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Wrench, Activity, CheckCircle2, X, CalendarClock, CalendarCheck, Ban } from "lucide-react";
import { dueSoonEquipment, activeProperties, formatDate, todayISO } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function MaintenancePage() {
  const router = useRouter();
  const {
    session, properties, suppliers, selectedClientEmail, selectedPropertyId,
    addMaintenanceLogEntry, addScheduledMaintenance, completeScheduledMaintenance, removeScheduledMaintenance,
  } = useStore();
  const canEdit = session?.role !== "client";
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedDate, setSchedDate] = useState(todayISO());
  const [schedRoom, setSchedRoom] = useState("");
  const [schedEquipment, setSchedEquipment] = useState("");
  const [schedSupplier, setSchedSupplier] = useState("");
  const [schedNotes, setSchedNotes] = useState("");
  const clientEmail = session?.role === "client" ? session.email : selectedClientEmail;
  const property = properties.find((p) => p.clientEmail === clientEmail && p.id === selectedPropertyId)
    ?? activeProperties(properties).find((p) => p.clientEmail === clientEmail);

  if (!property) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">Maintenance</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a property first from the Rooms tab.</p>
        <Link href="/rooms" className="inline-block bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">Go to Rooms</Link>
      </div>
    );
  }

  const upcoming = dueSoonEquipment(property);
  const scheduled = [...(property.scheduledMaintenance ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const schedRoomEquipment = property.rooms.find((r) => r.name === schedRoom)?.equipment ?? [];

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !title.trim() || !room || !supplier) return;
    addMaintenanceLogEntry(property.id, { title: title.trim(), room, supplier, notes: notes.trim() });
    setShowAdd(false);
    setTitle("");
    setRoom("");
    setSupplier("");
    setNotes("");
  }

  function closeSchedule() {
    setShowSchedule(false);
    setSchedTitle("");
    setSchedDate(todayISO());
    setSchedRoom("");
    setSchedEquipment("");
    setSchedSupplier("");
    setSchedNotes("");
  }

  function submitSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !schedTitle.trim() || !schedDate || !schedRoom || !schedSupplier) return;
    addScheduledMaintenance(property.id, {
      title: schedTitle.trim(), date: schedDate, room: schedRoom,
      equipment: schedEquipment || undefined, supplier: schedSupplier, notes: schedNotes.trim(),
    });
    closeSchedule();
  }

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-widest text-subtext font-semibold">{property.name.toUpperCase()}</p>
          <h1 className="text-2xl font-bold text-fg">Maintenance</h1>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSchedule(true)} className="flex items-center gap-1.5 border border-line text-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
              <CalendarClock size={14} /> Schedule maintenance
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
              <Plus size={14} /> Add maintenance
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 rounded-2xl border border-line divide-x divide-line mb-6">
        <div className="p-4 flex items-center gap-3"><Wrench size={16} className="text-primary" /><div><p className="text-xl font-bold text-fg leading-none">{upcoming.length}</p><p className="text-[11px] text-subtext mt-1">Upcoming</p></div></div>
        <div className="p-4 flex items-center gap-3"><Activity size={16} className="text-[var(--warn-fg)]" /><div><p className="text-xl font-bold text-fg leading-none">{upcoming.filter((u) => u.equipment.issueNote).length}</p><p className="text-[11px] text-subtext mt-1">Reported issues</p></div></div>
        <div className="p-4 flex items-center gap-3"><CalendarClock size={16} className="text-primary" /><div><p className="text-xl font-bold text-fg leading-none">{scheduled.length}</p><p className="text-[11px] text-subtext mt-1">Scheduled</p></div></div>
        <div className="p-4 flex items-center gap-3"><CheckCircle2 size={16} className="text-[var(--ok-fg)]" /><div><p className="text-xl font-bold text-fg leading-none">{property.maintenanceLog.length}</p><p className="text-[11px] text-subtext mt-1">Completed</p></div></div>
      </div>

      <p className="text-[10px] tracking-widest text-subtext font-semibold mb-2">UPCOMING</p>
      {upcoming.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center mb-6">
          <p className="text-[12.5px] text-subtext">Nothing due — every piece of equipment on record is in good shape.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-6">
          {upcoming.map(({ room, equipment }) => (
            <button key={`${room.id}-${equipment.name}`}
              onClick={() => router.push(`/rooms/${room.id}?eq=${encodeURIComponent(equipment.name)}`)}
              className="flex items-center gap-3 rounded-2xl border border-line p-3.5 text-left hover:border-primary/40">
              <div className="w-9 h-9 rounded-lg bg-[var(--warn-bg)] flex items-center justify-center flex-shrink-0"><Wrench size={16} className="text-[var(--warn-fg)]" /></div>
              <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-fg truncate">{equipment.name}</p><p className="text-[11.5px] text-subtext truncate">{room.name} · {equipment.model}</p></div>
              <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-[var(--warn-bg)] text-[var(--warn-fg)] flex-shrink-0">
                {equipment.issueNote ? "Issue reported" : "Due soon"}
              </span>
              <ChevronRight size={14} className="text-subtext flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] tracking-widest text-subtext font-semibold mb-2">SCHEDULED</p>
      {scheduled.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center mb-6">
          <p className="text-[12.5px] text-subtext">No future maintenance scheduled yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-6">
          {scheduled.map((s) => (
            <div key={s.id} className="rounded-2xl border border-line p-3.5">
              <p className="text-[11px] text-subtext mb-1">{formatDate(s.date)} · {s.room}{s.equipment ? ` · ${s.equipment}` : ""} · {s.supplier}</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13.5px] font-semibold text-fg">{s.title}</p>
                {canEdit && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => completeScheduledMaintenance(property.id, s.id)} title="Mark done" className="flex items-center gap-1 text-[11.5px] font-semibold text-[var(--ok-fg)]">
                      <CalendarCheck size={13} /> Mark done
                    </button>
                    <button onClick={() => { if (confirm(`Cancel scheduled "${s.title}"?`)) removeScheduledMaintenance(property.id, s.id); }} title="Cancel" className="flex items-center gap-1 text-[11.5px] font-semibold text-[var(--attention-fg)]">
                      <Ban size={13} /> Cancel
                    </button>
                  </div>
                )}
              </div>
              {s.notes && <p className="text-[11.5px] text-subtext mt-1">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] tracking-widest text-subtext font-semibold mb-2">COMPLETED HISTORY</p>
      {property.maintenanceLog.length === 0 ? (
        <div className="rounded-2xl border border-line p-6 text-center">
          <p className="text-[12.5px] text-subtext">No completed maintenance recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {property.maintenanceLog.map((m, i) => (
            <div key={m.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[var(--ok-bg)] text-[var(--ok-fg)] text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                {i < property.maintenanceLog.length - 1 && <div className="w-px flex-1 bg-line my-1" />}
              </div>
              <div className="rounded-2xl border border-line p-4 flex-1 mb-4">
                <p className="text-[11px] text-subtext mb-1">{m.date} · {m.room} · {m.supplier}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-fg">{m.title}</p>
                  <span className="flex items-center gap-1 text-[10.5px] font-semibold bg-[var(--ok-bg)] text-[var(--ok-fg)] px-2 py-1 rounded-full flex-shrink-0"><CheckCircle2 size={10} /> Completed</span>
                </div>
                <p className="text-[11.5px] text-subtext mt-1">{m.notes}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowAdd(false)}>
          <form onSubmit={submitAdd} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">Add maintenance</p>
              <button type="button" onClick={() => setShowAdd(false)}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <input required autoFocus placeholder="What was done (e.g. Pool filter cleaned)" value={title} onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <select required value={room} onChange={(e) => setRoom(e.target.value)} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
                <option value="">Choose a room…</option>
                {property.rooms.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <select required value={supplier} onChange={(e) => setSupplier(e.target.value)} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
                <option value="">Choose a supplier…</option>
                {suppliers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" style={{ height: 70 }} />
              <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">Log maintenance</button>
            </div>
          </form>
        </div>
      )}

      {showSchedule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={closeSchedule}>
          <form onSubmit={submitSchedule} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">Schedule maintenance</p>
              <button type="button" onClick={closeSchedule}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <input required autoFocus placeholder="What's needed (e.g. Pool filter replacement)" value={schedTitle} onChange={(e) => setSchedTitle(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <div>
                <label className="text-[10.5px] text-subtext mb-1 block">Date</label>
                <input required type="date" min={todayISO()} value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              </div>
              <select required value={schedRoom} onChange={(e) => { setSchedRoom(e.target.value); setSchedEquipment(""); }} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
                <option value="">Choose a room…</option>
                {property.rooms.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              {schedRoomEquipment.length > 0 && (
                <select value={schedEquipment} onChange={(e) => setSchedEquipment(e.target.value)} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
                  <option value="">Whole room (no specific equipment)</option>
                  {schedRoomEquipment.map((eq) => <option key={eq.name} value={eq.name}>{eq.name}</option>)}
                </select>
              )}
              <select required value={schedSupplier} onChange={(e) => setSchedSupplier(e.target.value)} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
                <option value="">Choose a supplier…</option>
                {suppliers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <textarea placeholder="Notes (optional)" value={schedNotes} onChange={(e) => setSchedNotes(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" style={{ height: 70 }} />
              <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">Schedule</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
