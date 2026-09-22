"use client";

import { useState } from "react";
import { Plus, ChevronRight, X, Phone, Mail, MapPin, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { Supplier } from "@/lib/data";

const BLANK = { name: "", category: "", phone: "", email: "", address: "", notes: "" };

export default function SuppliersPage() {
  const { session, suppliers, addSupplier, updateSupplier } = useStore();
  const canEdit = session?.role !== "client";
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);

  const open = suppliers.find((s) => s.id === openId);

  function startEdit(s: Supplier) {
    setEditing(s);
    setForm({ name: s.name, category: s.category, phone: s.phone, email: s.email, address: s.address, notes: s.notes });
    setOpenId(null);
  }

  function startAdd() {
    setForm(BLANK);
    setAdding(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return;
    const initials = form.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    if (editing) {
      updateSupplier(editing.id, { ...form });
      setEditing(null);
    } else {
      addSupplier({ ...form, initials });
      setAdding(false);
    }
  }

  const showForm = editing || adding;

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-fg">Suppliers & Technicians</h1>
        {canEdit && (
          <button onClick={startAdd} className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
            <Plus size={14} /> Add supplier
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {suppliers.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-line p-4">
            <button onClick={() => setOpenId(s.id)} className="flex items-center gap-3 flex-1 text-left min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-[12px] font-bold flex items-center justify-center flex-shrink-0">{s.initials}</div>
              <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-fg truncate">{s.name}</p><p className="text-[11.5px] text-subtext truncate">{s.category}</p></div>
            </button>
            {canEdit && <button onClick={() => startEdit(s)} className="text-subtext hover:text-fg flex-shrink-0" title="Edit"><Pencil size={13} /></button>}
            <ChevronRight size={14} className="text-subtext flex-shrink-0" />
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setOpenId(null)}>
          <div className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary text-[13px] font-bold flex items-center justify-center">{open.initials}</div>
                <div><p className="font-bold text-fg text-[15px]">{open.name}</p><p className="text-[11.5px] text-subtext">{open.category}</p></div>
              </div>
              <button onClick={() => setOpenId(null)}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2 text-[13px] text-fg mt-4">
              <p className="flex items-center gap-2"><Phone size={13} className="text-subtext" /> {open.phone}</p>
              <p className="flex items-center gap-2"><Mail size={13} className="text-subtext" /> {open.email}</p>
              <p className="flex items-center gap-2"><MapPin size={13} className="text-subtext" /> {open.address}</p>
            </div>
            <p className="text-[12px] text-subtext mt-3 leading-relaxed">{open.notes}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
              <p className="text-[11px] text-subtext">{open.records} linked equipment records</p>
              {canEdit && <button onClick={() => startEdit(open)} className="text-[12px] text-primary font-semibold flex items-center gap-1"><Pencil size={12} /> Edit</button>}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => { setEditing(null); setAdding(false); }}>
          <form onSubmit={submit} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">{editing ? "Edit supplier" : "Add supplier"}</p>
              <button type="button" onClick={() => { setEditing(null); setAdding(false); }}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <input required placeholder="Category (e.g. Pool maintenance)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" style={{ height: 60 }} />
              <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">{editing ? "Save changes" : "Create supplier"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
