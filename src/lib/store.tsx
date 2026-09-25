"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Property, ClientRecord, Supplier, Plan, Role, Room } from "./data";

export type Session = { email: string; role: Role; name: string };

// A save that failed to reach the database — still showing on screen from the
// optimistic update, but not actually durable yet. Surfaced so the person
// editing it knows to retry before walking away, instead of the failure just
// living silently in the console.
export type SaveError = { id: string; description: string };

type Store = {
  ready: boolean;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAccessToken: () => string | null;

  properties: Property[];
  clients: ClientRecord[];
  suppliers: Supplier[];

  saveErrors: SaveError[];
  retrySave: (id: string) => Promise<void>;
  retryAllSaves: () => Promise<void>;

  addProperty: (p: { name: string; area: string; location: string }) => void;
  addRoom: (propertyId: string, r: { name: string; category: Room["category"]; photoUrl?: string }) => void;
  addEquipment: (propertyId: string, roomId: string, e: { name: string; model: string; photoUrl?: string }) => void;
  addMaintenanceLogEntry: (propertyId: string, e: { title: string; room: string; supplier: string; notes: string }) => void;
  assignProperty: (propertyId: string, clientEmail: string) => void;
  setPropertyArchived: (propertyId: string, archived: boolean) => void;
  setPropertyPhoto: (propertyId: string, photoUrl: string) => void;
  setRoomPhoto: (propertyId: string, roomId: string, photoUrl: string) => void;
  setEquipmentPhoto: (propertyId: string, roomId: string, equipmentName: string, photoUrl: string) => void;
  reportEquipmentIssue: (propertyId: string, roomId: string, equipmentName: string, note: string) => void;
  clearEquipmentIssue: (propertyId: string, roomId: string, equipmentName: string) => void;

  addClient: (c: { name: string; email: string; plan: Plan }) => void;
  updateClient: (email: string, updates: Partial<Omit<ClientRecord, "email">>) => void;

  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  selectedClientEmail: string | null;
  setSelectedClientEmail: (email: string | null) => void;
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  selectClientAndProperty: (clientEmail: string | null, propertyId: string | null) => void;
};

const StoreContext = createContext<Store | null>(null);

// "What's currently selected" and notification preference are per-device UI
// state — not shared data — so they stay in localStorage. Everything else
// (properties, rooms, equipment, clients, suppliers) lives in the database
// via the /api routes, authenticated on every request.
const LS_TOKENS = "rs_tokens";
const LS_SELECTED = "rs_selected";
const LS_NOTIFICATIONS = "rs_notifications_enabled";

function randomId(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedClientEmail, setSelectedClientEmailState] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [saveErrors, setSaveErrors] = useState<SaveError[]>([]);
  const retryFns = useRef(new Map<string, () => Promise<void>>());
  const tokens = useRef<{ accessToken: string; refreshToken: string } | null>(null);

  const getAccessToken = useCallback(() => tokens.current?.accessToken ?? null, []);

  const persistTokens = useCallback((next: { accessToken: string; refreshToken: string } | null) => {
    tokens.current = next;
    try {
      if (next) localStorage.setItem(LS_TOKENS, JSON.stringify(next));
      else localStorage.removeItem(LS_TOKENS);
    } catch {}
  }, []);

  function clearSession() {
    setSession(null);
    persistTokens(null);
    setSelectedClientEmailState(null);
    setSelectedPropertyIdState(null);
    try { localStorage.removeItem(LS_SELECTED); } catch {}
  }

  // Every request to our own API goes through this: attaches the access
  // token, and if it comes back 401 (the token expired — they're short-lived
  // by design), tries one silent refresh and retries once before giving up
  // and signing the person out. Without this, a token expiring mid-visit at
  // a villa would look exactly like every other save failure, when it's
  // really "you need to sign in again."
  const authedFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    async function attempt(): Promise<Response> {
      const headers = new Headers(init?.headers);
      if (tokens.current) headers.set("Authorization", `Bearer ${tokens.current.accessToken}`);
      return fetch(url, { ...init, headers });
    }

    let res = await attempt();
    if (res.status === 401 && tokens.current) {
      const refreshed = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.current.refreshToken }),
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

      if (refreshed) {
        persistTokens({ accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken });
        res = await attempt();
      } else {
        clearSession();
      }
    }
    return res;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistTokens]);

  // Every mutation below applies its change to local state immediately (the
  // UI never waits on the network) and saves it in the background through
  // this one path. A failure shows up in `saveErrors` — keyed so a second
  // edit to the same thing before the first save lands just replaces the
  // pending retry with the newer (superset) data — and clears itself the
  // moment a retry succeeds.
  const runSave = useCallback((id: string, description: string, exec: () => Promise<Response>) => {
    async function attempt() {
      try {
        const res = await exec();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        retryFns.current.delete(id);
        setSaveErrors((prev) => prev.filter((e) => e.id !== id));
      } catch (err) {
        console.error(`Save failed: ${description}`, err);
        retryFns.current.set(id, attempt);
        setSaveErrors((prev) => (prev.some((e) => e.id === id) ? prev : [...prev, { id, description }]));
        throw err;
      }
    }
    attempt().catch(() => {});
  }, []);

  // Both return a promise so the UI can show "retrying" while one is in
  // flight — a retry that fails the exact same way every time (e.g. a photo
  // too large for the server to accept) previously looked identical to the
  // button doing nothing at all.
  const retrySave = useCallback(async (id: string) => {
    await retryFns.current.get(id)?.().catch(() => {});
  }, []);

  const retryAllSaves = useCallback(async () => {
    await Promise.all(Array.from(retryFns.current.values()).map((fn) => fn().catch(() => {})));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const sel = localStorage.getItem(LS_SELECTED);
        if (sel) {
          const parsed = JSON.parse(sel);
          setSelectedClientEmailState(parsed.clientEmail ?? null);
          setSelectedPropertyIdState(parsed.propertyId ?? null);
        }
        const notif = localStorage.getItem(LS_NOTIFICATIONS);
        if (notif) setNotificationsEnabledState(notif === "true");

        const storedTokens = localStorage.getItem(LS_TOKENS);
        if (!storedTokens) { setReady(true); return; }
        tokens.current = JSON.parse(storedTokens);
      } catch {}

      try {
        const res = await authedFetch("/api/state");
        if (!res.ok) throw new Error(`GET /api/state failed: ${res.status}`);
        const data = await res.json() as { properties: Property[]; clients: ClientRecord[]; suppliers: Supplier[] };
        if (cancelled) return;
        setProperties(data.properties);
        setClients(data.clients);
        setSuppliers(data.suppliers);
        // Tokens were valid (or got refreshed) — we're signed in. The actual
        // name/role came from login and was never needed again until now.
        const raw = localStorage.getItem("rs_session_user");
        if (raw) setSession(JSON.parse(raw));
      } catch (err) {
        console.error("Failed to load data from the database", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    boot();

    // A save that failed while offline (or mid wifi drop at a villa) retries
    // itself the moment the connection comes back, instead of waiting for
    // someone to notice and press retry.
    window.addEventListener("online", retryAllSaves);
    return () => { cancelled = true; window.removeEventListener("online", retryAllSaves); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistSelected = useCallback((clientEmail: string | null, propertyId: string | null) => {
    try { localStorage.setItem(LS_SELECTED, JSON.stringify({ clientEmail, propertyId })); } catch {}
  }, []);

  function patchProperty(next: Property, description: string) {
    setProperties((prev) => prev.map((p) => (p.id === next.id ? next : p)));
    runSave(`property-${next.id}`, description, () =>
      authedFetch(`/api/properties/${next.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) })
    );
  }

  function patchClient(email: string, updates: Partial<Omit<ClientRecord, "email">>) {
    setClients((prev) => prev.map((c) => (c.email === email ? { ...c, ...updates } : c)));
    runSave(`client-${email}`, `Update ${email}`, () =>
      authedFetch(`/api/clients/${encodeURIComponent(email)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) })
    );
  }

  function patchSupplier(id: string, updates: Partial<Supplier>) {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    runSave(`supplier-${id}`, `Update supplier`, () =>
      authedFetch(`/api/suppliers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) })
    );
  }

  async function login(email: string, password: string): Promise<boolean> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { accessToken: string; refreshToken: string; user: Session };

    persistTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setSession(data.user);
    try { localStorage.setItem("rs_session_user", JSON.stringify(data.user)); } catch {}

    if (data.user.role === "client") {
      setSelectedClientEmailState(data.user.email);
      persistSelected(data.user.email, null);
    }

    const stateRes = await authedFetch("/api/state");
    if (stateRes.ok) {
      const stateData = await stateRes.json() as { properties: Property[]; clients: ClientRecord[]; suppliers: Supplier[] };
      setProperties(stateData.properties);
      setClients(stateData.clients);
      setSuppliers(stateData.suppliers);
    }
    return true;
  }

  function logout() {
    clearSession();
    try { localStorage.removeItem("rs_session_user"); } catch {}
  }

  function addProperty(p: { name: string; area: string; location: string }) {
    const property: Property = {
      id: randomId(p.name), name: p.name, area: p.area, location: p.location, clientEmail: null,
      updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      rooms: [],
      maintenanceLog: [],
    };
    setProperties((prev) => [...prev, property]);
    // The id is generated here (not by the server) so a retry after a lost
    // response — the write actually succeeded, only the confirmation didn't
    // arrive — re-sends the exact same row instead of creating a duplicate.
    runSave(`property-${property.id}`, `New property "${p.name}"`, () =>
      authedFetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(property) })
    );
  }

  function addRoom(propertyId: string, r: { name: string; category: Room["category"]; photoUrl?: string }) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    const slug = r.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const newRoom: Room = {
      id: `${p.id}-${slug}-${Math.random().toString(36).slice(2, 6)}`,
      number: String(p.rooms.length + 1).padStart(2, "0"),
      name: r.name, category: r.category, subtitle: "Added manually",
      equipmentCount: 0, equipment: [], photoUrl: r.photoUrl,
    };
    patchProperty({ ...p, rooms: [...p.rooms, newRoom] }, `${p.name} — add room "${r.name}"`);
  }

  function addEquipment(propertyId: string, roomId: string, e: { name: string; model: string; photoUrl?: string }) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    const room = p.rooms.find((r) => r.id === roomId);
    const rooms = p.rooms.map((r) => {
      if (r.id !== roomId) return r;
      const equipment = [...r.equipment, { name: e.name, model: e.model || "Installed just now", status: "Good" as const, photoUrl: e.photoUrl }];
      return { ...r, equipment, equipmentCount: equipment.length };
    });
    patchProperty({ ...p, rooms }, `${p.name} — add equipment "${e.name}"${room ? ` (${room.name})` : ""}`);
  }

  function addMaintenanceLogEntry(propertyId: string, e: { title: string; room: string; supplier: string; notes: string }) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const entry = { id: `${propertyId}-log-${Math.random().toString(36).slice(2, 8)}`, date, ...e };
    patchProperty({ ...p, maintenanceLog: [entry, ...p.maintenanceLog] }, `${p.name} — log "${e.title}"`);
  }

  function assignProperty(propertyId: string, clientEmail: string) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    patchProperty({ ...p, clientEmail }, `${p.name} — change client`);
  }

  function setPropertyArchived(propertyId: string, archived: boolean) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    patchProperty({ ...p, archived }, `${p.name} — ${archived ? "archive" : "unarchive"}`);
  }

  function setPropertyPhoto(propertyId: string, photoUrl: string) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    patchProperty({ ...p, photoUrl }, `${p.name} — property photo`);
  }

  function setRoomPhoto(propertyId: string, roomId: string, photoUrl: string) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    const room = p.rooms.find((r) => r.id === roomId);
    patchProperty(
      { ...p, rooms: p.rooms.map((r) => (r.id === roomId ? { ...r, photoUrl } : r)) },
      `${p.name} — ${room?.name ?? "room"} photo`
    );
  }

  function setEquipmentPhoto(propertyId: string, roomId: string, equipmentName: string, photoUrl: string) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    patchProperty(
      {
        ...p,
        rooms: p.rooms.map((r) => (r.id !== roomId ? r : { ...r, equipment: r.equipment.map((e) => (e.name === equipmentName ? { ...e, photoUrl } : e)) })),
      },
      `${p.name} — ${equipmentName} photo`
    );
  }

  function reportEquipmentIssue(propertyId: string, roomId: string, equipmentName: string, note: string) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    const reportedAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    patchProperty(
      {
        ...p,
        rooms: p.rooms.map((r) => (r.id !== roomId ? r : { ...r, equipment: r.equipment.map((e) => (e.name === equipmentName ? { ...e, issueNote: note, issueReportedAt: reportedAt } : e)) })),
      },
      `${p.name} — report issue on ${equipmentName}`
    );
  }

  function clearEquipmentIssue(propertyId: string, roomId: string, equipmentName: string) {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return;
    patchProperty(
      {
        ...p,
        rooms: p.rooms.map((r) => (r.id !== roomId ? r : { ...r, equipment: r.equipment.map((e) => (e.name === equipmentName ? { ...e, issueNote: undefined, issueReportedAt: undefined } : e)) })),
      },
      `${p.name} — resolve issue on ${equipmentName}`
    );
  }

  function addClient(c: { name: string; email: string; plan: Plan }) {
    const client: ClientRecord = { name: c.name, email: c.email.trim().toLowerCase(), plan: c.plan };
    setClients((prev) => [...prev, client]);
    runSave(`client-${client.email}`, `New client "${c.name}"`, () =>
      authedFetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(client) })
    );
  }

  function updateClient(email: string, updates: Partial<Omit<ClientRecord, "email">>) {
    patchClient(email, updates);
  }

  function addSupplier(s: Omit<Supplier, "id">) {
    const supplier: Supplier = { ...s, id: randomId(s.name) };
    setSuppliers((prev) => [...prev, supplier]);
    runSave(`supplier-${supplier.id}`, `New supplier "${s.name}"`, () =>
      authedFetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(supplier) })
    );
  }

  function updateSupplier(id: string, updates: Partial<Supplier>) {
    patchSupplier(id, updates);
  }

  function setNotificationsEnabled(enabled: boolean) {
    setNotificationsEnabledState(enabled);
    try { localStorage.setItem(LS_NOTIFICATIONS, String(enabled)); } catch {}
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
        ready, session, login, logout, getAccessToken,
        properties, clients, suppliers,
        saveErrors, retrySave, retryAllSaves,
        addProperty, addRoom, addEquipment, addMaintenanceLogEntry, assignProperty, setPropertyArchived, setPropertyPhoto, setRoomPhoto, setEquipmentPhoto,
        reportEquipmentIssue, clearEquipmentIssue,
        addClient, updateClient,
        addSupplier, updateSupplier,
        notificationsEnabled, setNotificationsEnabled,
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
