"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ACCOUNTS, SEED_PROPERTIES, SEED_CLIENTS, SEED_SUPPLIERS, SEED_VERSION, Property, ClientRecord, Supplier, Plan, Role, Room } from "./data";

export type Session = { email: string; role: Role; name: string };

type Store = {
  ready: boolean;
  session: Session | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  properties: Property[];
  clients: ClientRecord[];
  suppliers: Supplier[];

  addProperty: (p: { name: string; area: string; location: string }) => Property;
  addRoom: (propertyId: string, r: { name: string; category: Room["category"] }) => void;
  assignProperty: (propertyId: string, clientEmail: string) => void;
  setPropertyPhoto: (propertyId: string, photoUrl: string) => void;
  setEquipmentPhoto: (propertyId: string, roomId: string, equipmentName: string, photoUrl: string) => void;
  reportEquipmentIssue: (propertyId: string, roomId: string, equipmentName: string, note: string) => void;
  clearEquipmentIssue: (propertyId: string, roomId: string, equipmentName: string) => void;

  addClient: (c: { name: string; email: string; plan: Plan }) => void;
  updateClient: (email: string, updates: Partial<Omit<ClientRecord, "email">>) => void;

  addSupplier: (s: Omit<Supplier, "id" | "records">) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;

  selectedClientEmail: string | null;
  setSelectedClientEmail: (email: string | null) => void;
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  selectClientAndProperty: (clientEmail: string | null, propertyId: string | null) => void;
};

const StoreContext = createContext<Store | null>(null);

const LS_SESSION = "rs_session";
const LS_PROPERTIES = "rs_properties";
const LS_CLIENTS = "rs_clients";
const LS_SUPPLIERS = "rs_suppliers";
const LS_SELECTED = "rs_selected";
const LS_SEED_VERSION = "rs_seed_version";

// Brings a browser's cached properties up to date with newer seed data (e.g. added
// photos) without discarding anything the user changed locally: any field the user
// customized (photo upload, client assignment, etc.) is kept as-is, seed-only fields
// are filled in when missing, and properties the user added themselves pass through.
function mergeSeedProperties(cached: Property[]): Property[] {
  const byId = new Map(cached.map((p) => [p.id, p]));
  const merged = SEED_PROPERTIES.map((seed) => {
    const existing = byId.get(seed.id);
    if (!existing) return seed;
    byId.delete(seed.id);
    // Room/equipment structure always comes from the current seed (it's reference
    // data, not user-editable), but any equipment photo the user uploaded is
    // carried over onto the matching room+equipment if it still exists.
    const rooms = seed.rooms.map((seedRoom) => {
      const existingRoom = existing.rooms?.find((r) => r.id === seedRoom.id);
      if (!existingRoom) return seedRoom;
      const equipment = seedRoom.equipment.map((seedEq) => {
        const existingEq = existingRoom.equipment.find((e) => e.name === seedEq.name);
        if (!existingEq) return seedEq;
        return {
          ...seedEq,
          ...(existingEq.photoUrl ? { photoUrl: existingEq.photoUrl } : {}),
          ...(existingEq.issueNote ? { issueNote: existingEq.issueNote, issueReportedAt: existingEq.issueReportedAt } : {}),
        };
      });
      return { ...seedRoom, equipment };
    });
    return { ...seed, ...existing, rooms, maintenanceLog: seed.maintenanceLog, photoUrl: existing.photoUrl ?? seed.photoUrl };
  });
  return [...merged, ...Array.from(byId.values())];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [properties, setProperties] = useState<Property[]>(SEED_PROPERTIES);
  const [clients, setClients] = useState<ClientRecord[]>(SEED_CLIENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [selectedClientEmail, setSelectedClientEmailState] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_SESSION);
      if (s) setSession(JSON.parse(s));

      const storedVersion = Number(localStorage.getItem(LS_SEED_VERSION) ?? "0");
      const isStale = storedVersion < SEED_VERSION;

      const p = localStorage.getItem(LS_PROPERTIES);
      if (p) {
        const cached = JSON.parse(p) as Property[];
        const next = isStale ? mergeSeedProperties(cached) : cached;
        setProperties(next);
        if (isStale) localStorage.setItem(LS_PROPERTIES, JSON.stringify(next));
      }
      if (isStale) localStorage.setItem(LS_SEED_VERSION, String(SEED_VERSION));

      const c = localStorage.getItem(LS_CLIENTS);
      if (c) setClients(JSON.parse(c));
      const sup = localStorage.getItem(LS_SUPPLIERS);
      if (sup) setSuppliers(JSON.parse(sup));
      const sel = localStorage.getItem(LS_SELECTED);
      if (sel) {
        const parsed = JSON.parse(sel);
        setSelectedClientEmailState(parsed.clientEmail ?? null);
        setSelectedPropertyIdState(parsed.propertyId ?? null);
      }
    } catch {}
    setReady(true);
  }, []);

  const persistProperties = useCallback((next: Property[]) => {
    setProperties(next);
    try { localStorage.setItem(LS_PROPERTIES, JSON.stringify(next)); } catch {}
  }, []);

  const persistClients = useCallback((next: ClientRecord[]) => {
    setClients(next);
    try { localStorage.setItem(LS_CLIENTS, JSON.stringify(next)); } catch {}
  }, []);

  const persistSuppliers = useCallback((next: Supplier[]) => {
    setSuppliers(next);
    try { localStorage.setItem(LS_SUPPLIERS, JSON.stringify(next)); } catch {}
  }, []);

  const persistSelected = useCallback((clientEmail: string | null, propertyId: string | null) => {
    try { localStorage.setItem(LS_SELECTED, JSON.stringify({ clientEmail, propertyId })); } catch {}
  }, []);

  function login(email: string, password: string) {
    const account = ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
    if (!account) return false;
    const s: Session = { email: account.email, role: account.role, name: account.name };
    setSession(s);
    try { localStorage.setItem(LS_SESSION, JSON.stringify(s)); } catch {}
    if (account.role === "client") {
      setSelectedClientEmailState(account.email);
      persistSelected(account.email, null);
    }
    return true;
  }

  function logout() {
    setSession(null);
    setSelectedClientEmailState(null);
    setSelectedPropertyIdState(null);
    try {
      localStorage.removeItem(LS_SESSION);
      localStorage.removeItem(LS_SELECTED);
    } catch {}
  }

  function addProperty(p: { name: string; area: string; location: string }): Property {
    const id = p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    const next: Property = {
      id, name: p.name, area: p.area, location: p.location, clientEmail: null,
      health: 100, itemsNeedAttention: 0, systemsOnline: [0, 0], maintenanceCurrent: [0, 0], documentsCompletePct: 0,
      updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      rooms: [],
      maintenanceLog: [],
    };
    persistProperties([...properties, next]);
    return next;
  }

  function addRoom(propertyId: string, r: { name: string; category: Room["category"] }) {
    persistProperties(properties.map((p) => {
      if (p.id !== propertyId) return p;
      const slug = r.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const newRoom: Room = {
        id: `${p.id}-${slug}-${Math.random().toString(36).slice(2, 6)}`,
        number: String(p.rooms.length + 1).padStart(2, "0"),
        name: r.name, category: r.category, subtitle: "Added manually",
        equipmentCount: 0, documentsCount: 0, maintenanceCount: 0, photosCount: 0,
        badge: "current", equipment: [],
      };
      return { ...p, rooms: [...p.rooms, newRoom] };
    }));
  }

  function assignProperty(propertyId: string, clientEmail: string) {
    persistProperties(properties.map((p) => (p.id === propertyId ? { ...p, clientEmail } : p)));
  }

  function setPropertyPhoto(propertyId: string, photoUrl: string) {
    persistProperties(properties.map((p) => (p.id === propertyId ? { ...p, photoUrl } : p)));
  }

  function setEquipmentPhoto(propertyId: string, roomId: string, equipmentName: string, photoUrl: string) {
    persistProperties(properties.map((p) => {
      if (p.id !== propertyId) return p;
      return {
        ...p,
        rooms: p.rooms.map((r) => {
          if (r.id !== roomId) return r;
          return { ...r, equipment: r.equipment.map((e) => (e.name === equipmentName ? { ...e, photoUrl } : e)) };
        }),
      };
    }));
  }

  function reportEquipmentIssue(propertyId: string, roomId: string, equipmentName: string, note: string) {
    const reportedAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    persistProperties(properties.map((p) => {
      if (p.id !== propertyId) return p;
      return {
        ...p,
        rooms: p.rooms.map((r) => {
          if (r.id !== roomId) return r;
          return { ...r, equipment: r.equipment.map((e) => (e.name === equipmentName ? { ...e, issueNote: note, issueReportedAt: reportedAt } : e)) };
        }),
      };
    }));
  }

  function clearEquipmentIssue(propertyId: string, roomId: string, equipmentName: string) {
    persistProperties(properties.map((p) => {
      if (p.id !== propertyId) return p;
      return {
        ...p,
        rooms: p.rooms.map((r) => {
          if (r.id !== roomId) return r;
          return { ...r, equipment: r.equipment.map((e) => (e.name === equipmentName ? { ...e, issueNote: undefined, issueReportedAt: undefined } : e)) };
        }),
      };
    }));
  }

  function addClient(c: { name: string; email: string; plan: Plan }) {
    persistClients([...clients, { name: c.name, email: c.email.trim().toLowerCase(), plan: c.plan }]);
  }

  function updateClient(email: string, updates: Partial<Omit<ClientRecord, "email">>) {
    persistClients(clients.map((c) => (c.email === email ? { ...c, ...updates } : c)));
  }

  function addSupplier(s: Omit<Supplier, "id" | "records">) {
    const id = s.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    persistSuppliers([...suppliers, { ...s, id, records: 0 }]);
  }

  function updateSupplier(id: string, updates: Partial<Supplier>) {
    persistSuppliers(suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function setSelectedClientEmail(email: string | null) {
    setSelectedClientEmailState(email);
    setSelectedPropertyIdState(null);
    persistSelected(email, null);
  }

  function setSelectedPropertyId(id: string | null) {
    setSelectedPropertyIdState(id);
    persistSelected(selectedClientEmail, id);
  }

  // Sets both together atomically. Calling setSelectedClientEmail then
  // setSelectedPropertyId back-to-back persists the wrong pair to localStorage,
  // since the second call reads selectedClientEmail from the still-stale closure
  // of the current render, not the value the first call just set.
  function selectClientAndProperty(clientEmail: string | null, propertyId: string | null) {
    setSelectedClientEmailState(clientEmail);
    setSelectedPropertyIdState(propertyId);
    persistSelected(clientEmail, propertyId);
  }

  return (
    <StoreContext.Provider
      value={{
        ready, session, login, logout,
        properties, clients, suppliers,
        addProperty, addRoom, assignProperty, setPropertyPhoto, setEquipmentPhoto,
        reportEquipmentIssue, clearEquipmentIssue,
        addClient, updateClient,
        addSupplier, updateSupplier,
        selectedClientEmail, setSelectedClientEmail,
        selectedPropertyId, setSelectedPropertyId,
        selectClientAndProperty,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
