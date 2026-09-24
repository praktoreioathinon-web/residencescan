"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronRight, X, Users, MapPin, Pencil, ArchiveRestore } from "lucide-react";
import { useStore } from "@/lib/store";
import { Plan, ClientRecord } from "@/lib/data";
import PropertyPicker from "@/components/PropertyPicker";

const PLANS: Plan[] = ["Start", "Care", "Plus", "Pro"];

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clients, properties, addProperty, assignProperty, setPropertyArchived, addClient, updateClient, selectedClientEmail, setSelectedClientEmail, setSelectedPropertyId, selectClientAndProperty } = useStore();

  const [showArchived, setShowArchived] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [location, setLocation] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState("");

  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPlan, setClientPlan] = useState<Plan>("Care");
  const [clientError, setClientError] = useState("");

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setShowAddProperty(true);
      setSelectedClientEmail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const unassigned = properties.filter((p) => p.clientEmail === null && !p.archived);
  const archivedProperties = properties.filter((p) => p.archived);
  const activeClient = clients.find((c) => c.email === selectedClientEmail);
  const activeClientProperties = activeClient ? properties.filter((p) => p.clientEmail === activeClient.email && !p.archived) : [];
  const activeClientArchived = activeClient ? properties.filter((p) => p.clientEmail === activeClient.email && p.archived) : [];

  function submitAddProperty(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !area.trim()) return;
    addProperty({ name: name.trim(), area: area.trim(), location: location.trim() || area.trim() });
    setName(""); setArea(""); setLocation("");
    setShowAddProperty(false);
    router.replace("/clients");
  }

  function confirmAssign(propertyId: string) {
    if (!assignTo) return;
    assignProperty(propertyId, assignTo);
    setAssigningId(null);
    setAssignTo("");
  }

  function openAddClient() {
    setClientName(""); setClientEmail(""); setClientPlan("Care"); setClientError("");
    setShowAddClient(true);
  }

  function openEditClient(c: ClientRecord) {
    setEditingClient(c);
    setClientName(c.name); setClientEmail(c.email); setClientPlan(c.plan); setClientError("");
  }

  function submitClient(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;
    if (editingClient) {
      updateClient(editingClient.email, { name: clientName.trim(), plan: clientPlan });
      setEditingClient(null);
    } else {
      const email = clientEmail.trim().toLowerCase();
      if (clients.some((c) => c.email === email)) {
        setClientError("A client with this email already exists.");
        return;
      }
      addClient({ name: clientName.trim(), email, plan: clientPlan });
      setShowAddClient(false);
    }
  }

  const showClientForm = showAddClient || editingClient;

  if (activeClient) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <button onClick={() => setSelectedClientEmail(null)} className="text-[12.5px] text-subtext mb-3">← All clients</button>
        <div className="flex items-center justify-between mb-1 gap-2">
          <h1 className="text-2xl font-bold text-fg">{activeClient.name}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={openAddClient} className="flex items-center gap-1.5 border border-line text-[12px] font-semibold px-3 py-1.5 rounded-full text-fg">
              <Plus size={12} /> New client
            </button>
            <button onClick={() => openEditClient(activeClient)} className="flex items-center gap-1.5 border border-line text-[12px] font-semibold px-3 py-1.5 rounded-full text-fg">
              <Pencil size={12} /> Edit client
            </button>
          </div>
        </div>
        <p className="text-[12.5px] text-subtext mb-5">{activeClientProperties.length} {activeClientProperties.length === 1 ? "property" : "properties"} · {activeClient.email} · {activeClient.plan} plan</p>
        <PropertyPicker
          properties={activeClientProperties}
          onSelect={(id) => { setSelectedPropertyId(id); router.push("/"); }}
        />

        {activeClientArchived.length > 0 && (
          <div className="mt-5">
            <button onClick={() => setShowArchived((v) => !v)} className="text-[12px] text-subtext font-semibold mb-2">
              {showArchived ? "Hide" : "Show"} {activeClientArchived.length} archived {activeClientArchived.length === 1 ? "property" : "properties"}
            </button>
            {showArchived && (
              <div className="flex flex-col gap-2.5">
                {activeClientArchived.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-4 opacity-70">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><MapPin size={15} className="text-subtext" /></div>
                    <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-fg truncate">{p.name}</p><p className="text-[11.5px] text-subtext truncate">{p.location}</p></div>
                    <button onClick={() => setPropertyArchived(p.id, false)} className="flex items-center gap-1.5 text-[12px] text-primary font-semibold flex-shrink-0">
                      <ArchiveRestore size={13} /> Unarchive
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {showClientForm && (
          <ClientFormModal
            title={editingClient ? "Edit client" : "New client"}
            clientName={clientName} setClientName={setClientName}
            clientEmail={clientEmail} setClientEmail={setClientEmail} emailLocked={!!editingClient}
            clientPlan={clientPlan} setClientPlan={setClientPlan} error={clientError}
            onSubmit={submitClient} onClose={() => { setShowAddClient(false); setEditingClient(null); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-fg">Clients</h1>
        <div className="flex items-center gap-2">
          <button onClick={openAddClient} className="flex items-center gap-1.5 border border-line text-[12.5px] font-semibold px-4 py-2 rounded-full text-fg">
            <Plus size={14} /> New client
          </button>
          <button onClick={() => setShowAddProperty(true)} className="flex items-center gap-1.5 bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">
            <Plus size={14} /> Add property
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mb-8">
        {clients.map((c) => {
          const count = properties.filter((p) => p.clientEmail === c.email && !p.archived).length;
          return (
            <div key={c.email} className="w-full flex items-center gap-3 rounded-2xl border border-line p-4">
              <button onClick={() => setSelectedClientEmail(c.email)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0"><Users size={15} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-fg truncate">{c.name}</p>
                  <p className="text-[11.5px] text-subtext truncate">{c.email} · {c.plan} plan</p>
                </div>
              </button>
              <span className="text-[11px] text-subtext flex-shrink-0">{count} {count === 1 ? "property" : "properties"}</span>
              <button onClick={() => openEditClient(c)} className="text-subtext hover:text-fg flex-shrink-0" title="Edit"><Pencil size={13} /></button>
              <button onClick={() => setSelectedClientEmail(c.email)} className="flex-shrink-0"><ChevronRight size={14} className="text-subtext" /></button>
            </div>
          );
        })}
      </div>

      {unassigned.length > 0 && (
        <>
          <p className="text-[10px] tracking-widest text-subtext font-semibold mb-2">UNASSIGNED PROPERTIES</p>
          <div className="flex flex-col gap-2.5">
            {unassigned.map((p) => (
              <div key={p.id} className="rounded-2xl border border-dashed border-line p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => { selectClientAndProperty(null, p.id); router.push("/"); }} className="flex items-center gap-3 flex-1 text-left min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><MapPin size={15} className="text-subtext" /></div>
                    <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-fg">{p.name}</p><p className="text-[11.5px] text-subtext">{p.location}</p></div>
                  </button>
                  {assigningId !== p.id && (
                    <button onClick={() => setAssigningId(p.id)} className="text-[12px] text-primary font-semibold flex-shrink-0">Assign to client</button>
                  )}
                </div>
                {assigningId === p.id && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
                    <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="flex-1 rounded-lg border border-line px-3 py-2 text-[12.5px]">
                      <option value="">Choose a client…</option>
                      {clients.map((c) => <option key={c.email} value={c.email}>{c.name}</option>)}
                    </select>
                    <button onClick={() => confirmAssign(p.id)} className="bg-primary text-primary-fg text-[12px] font-semibold px-3 py-2 rounded-lg">Confirm</button>
                    <button onClick={() => { setAssigningId(null); setAssignTo(""); }} className="text-[12px] text-subtext px-2">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {archivedProperties.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowArchived((v) => !v)} className="text-[12px] text-subtext font-semibold mb-2">
            {showArchived ? "Hide" : "Show"} {archivedProperties.length} archived {archivedProperties.length === 1 ? "property" : "properties"}
          </button>
          {showArchived && (
            <div className="flex flex-col gap-2.5">
              {archivedProperties.map((p) => {
                const owner = clients.find((c) => c.email === p.clientEmail)?.name ?? "Unassigned";
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-4 opacity-70">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><MapPin size={15} className="text-subtext" /></div>
                    <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-fg truncate">{p.name}</p><p className="text-[11.5px] text-subtext truncate">{p.location} · {owner}</p></div>
                    <button onClick={() => setPropertyArchived(p.id, false)} className="flex items-center gap-1.5 text-[12px] text-primary font-semibold flex-shrink-0">
                      <ArchiveRestore size={13} /> Unarchive
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showAddProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowAddProperty(false)}>
          <form onSubmit={submitAddProperty} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-fg text-[15px]">Add property</p>
              <button type="button" onClick={() => setShowAddProperty(false)}><X size={16} className="text-subtext" /></button>
            </div>
            <div className="flex flex-col gap-2.5">
              <input required placeholder="Property name (e.g. Villa Sunset)" value={name} onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <input required placeholder="Area (e.g. Mykonos)" value={area} onChange={(e) => setArea(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <input placeholder="Full location (optional)" value={location} onChange={(e) => setLocation(e.target.value)}
                className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
              <p className="text-[11px] text-subtext">The property is created unassigned — assign it to a client below afterwards.</p>
              <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">Create property</button>
            </div>
          </form>
        </div>
      )}

      {showClientForm && (
        <ClientFormModal
          title={editingClient ? "Edit client" : "New client"}
          clientName={clientName} setClientName={setClientName}
          clientEmail={clientEmail} setClientEmail={setClientEmail} emailLocked={!!editingClient}
          clientPlan={clientPlan} setClientPlan={setClientPlan} error={clientError}
          onSubmit={submitClient} onClose={() => { setShowAddClient(false); setEditingClient(null); }}
        />
      )}
    </div>
  );
}

function ClientFormModal({
  title, clientName, setClientName, clientEmail, setClientEmail, emailLocked, clientPlan, setClientPlan, error, onSubmit, onClose,
}: {
  title: string; clientName: string; setClientName: (v: string) => void;
  clientEmail: string; setClientEmail: (v: string) => void; emailLocked: boolean;
  clientPlan: Plan; setClientPlan: (v: Plan) => void; error: string;
  onSubmit: (e: React.FormEvent) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <form onSubmit={onSubmit} className="bg-card border border-line rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-fg text-[15px]">{title}</p>
          <button type="button" onClick={onClose}><X size={16} className="text-subtext" /></button>
        </div>
        <div className="flex flex-col gap-2.5">
          <input required placeholder="Client / company name" value={clientName} onChange={(e) => setClientName(e.target.value)}
            className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50" />
          <input required type="email" disabled={emailLocked} placeholder="Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
            className="rounded-lg border border-line px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/50 disabled:opacity-50" />
          <select value={clientPlan} onChange={(e) => setClientPlan(e.target.value as Plan)} className="rounded-lg border border-line px-3.5 py-2.5 text-[13px]">
            {PLANS.map((p) => <option key={p} value={p}>{p} plan</option>)}
          </select>
          {error && <p className="text-[12px] text-[var(--attention-fg)]">{error}</p>}
          <button type="submit" className="mt-1 bg-primary text-primary-fg text-[13px] font-semibold rounded-full py-2.5">{title === "New client" ? "Create client" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}
