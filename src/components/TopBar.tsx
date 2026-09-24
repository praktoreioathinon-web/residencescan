"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Zap, AlertTriangle, Building2, DoorOpen, Wrench, Store, LogOut, Settings, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useStore } from "@/lib/store";
import { Property, Room, EquipmentItem, roomAttentionCount, activeProperties } from "@/lib/data";

export default function TopBar() {
  const router = useRouter();
  const { session, properties, suppliers, selectedClientEmail, logout, selectClientAndProperty, notificationsEnabled } = useStore();

  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<"search" | "notif" | "account" | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        if (openPanel === "search") setOpenPanel(null);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        if (openPanel === "notif" || openPanel === "account") setOpenPanel(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [openPanel]);

  // Admin/support with no client picked yet can search across every property;
  // everyone else (or once a client is in view) searches within their own scope.
  const clientEmailCtx = session?.role === "client" ? session.email : selectedClientEmail;
  const searchScope = clientEmailCtx ? activeProperties(properties).filter((p) => p.clientEmail === clientEmailCtx) : activeProperties(properties);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const matchedProperties: Property[] = [];
    const matchedRooms: { property: Property; room: Room }[] = [];
    const matchedEquipment: { property: Property; room: Room; equipment: EquipmentItem }[] = [];
    for (const p of searchScope) {
      if (p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)) {
        matchedProperties.push(p);
      }
      for (const r of p.rooms) {
        if (r.name.toLowerCase().includes(q)) matchedRooms.push({ property: p, room: r });
        for (const eq of r.equipment) {
          if (eq.name.toLowerCase().includes(q)) matchedEquipment.push({ property: p, room: r, equipment: eq });
        }
      }
    }
    const matchedSuppliers = suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    return {
      properties: matchedProperties.slice(0, 4),
      rooms: matchedRooms.slice(0, 5),
      equipment: matchedEquipment.slice(0, 5),
      suppliers: matchedSuppliers.slice(0, 4),
    };
  }, [query, searchScope, suppliers]);

  const hasResults = !!results && (results.properties.length + results.rooms.length + results.equipment.length + results.suppliers.length > 0);

  function closeSearch() {
    setQuery("");
    setOpenPanel(null);
    setMobileSearchOpen(false);
  }

  function goToProperty(p: Property) {
    selectClientAndProperty(p.clientEmail, p.id);
    router.push("/");
    closeSearch();
  }

  function goToRoom(p: Property, r: Room) {
    selectClientAndProperty(p.clientEmail, p.id);
    router.push(`/rooms/${r.id}`);
    closeSearch();
  }

  function goToEquipment(p: Property, r: Room, eq: EquipmentItem) {
    selectClientAndProperty(p.clientEmail, p.id);
    router.push(`/rooms/${r.id}?eq=${encodeURIComponent(eq.name)}`);
    closeSearch();
  }

  function goToSuppliers() {
    router.push("/suppliers");
    closeSearch();
  }

  // Notifications: every room with equipment that's due soon or has a reported
  // issue, across whatever this account can see — off entirely when the user
  // has turned notifications off in Settings.
  const notifications = useMemo(() => {
    if (!notificationsEnabled) return [];
    const scope = session?.role === "client" ? activeProperties(properties).filter((p) => p.clientEmail === session.email) : activeProperties(properties);
    const items: { property: Property; room: Room }[] = [];
    for (const p of scope) {
      for (const r of p.rooms) {
        if (roomAttentionCount(r) > 0) items.push({ property: p, room: r });
      }
    }
    return items;
  }, [properties, session, notificationsEnabled]);

  const initials = (session?.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="no-print flex items-center gap-4 px-4 md:px-8 py-4 border-b border-line relative">
      <div className="hidden md:flex w-8 h-8 rounded-lg bg-primary/10 items-center justify-center flex-shrink-0">
        <Zap size={16} className="text-primary" />
      </div>
      <div className="hidden md:block">
        <p className="text-[14px] font-bold text-fg leading-none">ResidenceScan</p>
        <p className="text-[9px] tracking-wider text-subtext mt-1">YOUR PROPERTY. FULLY KNOWN.</p>
      </div>

      <div className="flex-1 flex justify-center">
        <div ref={searchRef} className="relative w-full max-w-md hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpenPanel("search")}
            placeholder="Search rooms, equipment, documents..."
            className="w-full bg-card border border-line rounded-lg pl-9 pr-3 lg:pr-14 py-2 text-[12.5px] outline-none placeholder:text-subtext focus:border-primary/50"
          />
          {!query && <span className="hidden lg:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-subtext border border-line rounded px-1.5 py-0.5">⌘K</span>}
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtext hover:text-fg">
              <X size={13} />
            </button>
          )}

          {openPanel === "search" && query.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-line rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              {!hasResults ? (
                <p className="text-[12.5px] text-subtext p-4 text-center">No matches for &ldquo;{query}&rdquo;.</p>
              ) : (
                <div className="py-2">
                  {results!.properties.length > 0 && (
                    <SearchGroup label="Properties">
                      {results!.properties.map((p) => (
                        <SearchRow key={p.id} icon={Building2} title={p.name} subtitle={p.area} onClick={() => goToProperty(p)} />
                      ))}
                    </SearchGroup>
                  )}
                  {results!.rooms.length > 0 && (
                    <SearchGroup label="Rooms">
                      {results!.rooms.map(({ property, room }) => (
                        <SearchRow key={room.id} icon={DoorOpen} title={room.name} subtitle={property.name} onClick={() => goToRoom(property, room)} />
                      ))}
                    </SearchGroup>
                  )}
                  {results!.equipment.length > 0 && (
                    <SearchGroup label="Equipment">
                      {results!.equipment.map(({ property, room, equipment }) => (
                        <SearchRow key={`${room.id}-${equipment.name}`} icon={Wrench} title={equipment.name} subtitle={`${property.name} · ${room.name}`} onClick={() => goToEquipment(property, room, equipment)} />
                      ))}
                    </SearchGroup>
                  )}
                  {results!.suppliers.length > 0 && (
                    <SearchGroup label="Suppliers">
                      {results!.suppliers.map((s) => (
                        <SearchRow key={s.id} icon={Store} title={s.name} subtitle={s.category} onClick={goToSuppliers} />
                      ))}
                    </SearchGroup>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <button onClick={() => setMobileSearchOpen(true)} className="sm:hidden w-8 h-8 rounded-full border border-line flex items-center justify-center flex-shrink-0" aria-label="Search">
          <Search size={14} className="text-subtext" />
        </button>
      </div>

      <div ref={menuRef} className="flex items-center gap-4">
        <div className="relative">
          <button onClick={() => setOpenPanel(openPanel === "notif" ? null : "notif")}
            className="relative w-8 h-8 rounded-full border border-line flex items-center justify-center flex-shrink-0">
            <Bell size={14} className="text-subtext" />
            {notifications.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--attention-fg)]" />
            )}
          </button>
          {openPanel === "notif" && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-line rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <p className="text-[11px] tracking-widest text-subtext font-semibold px-4 pt-3.5 pb-2">NEEDS ATTENTION ({notifications.length})</p>
              {!notificationsEnabled ? (
                <p className="text-[12.5px] text-subtext p-4 pt-0 pb-4 text-center">Notifications are turned off in Settings.</p>
              ) : notifications.length === 0 ? (
                <p className="text-[12.5px] text-subtext p-4 pt-0 pb-4 text-center">All caught up — nothing needs attention.</p>
              ) : (
                <div className="pb-2">
                  {notifications.map(({ property, room }) => {
                    const count = roomAttentionCount(room);
                    return (
                      <button key={room.id} onClick={() => { goToRoom(property, room); setOpenPanel(null); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-white/5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--warn-bg)] flex items-center justify-center flex-shrink-0"><AlertTriangle size={14} className="text-[var(--warn-fg)]" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-fg truncate">{room.name}</p>
                          <p className="text-[11px] text-subtext truncate">{property.name} · {count} item{count > 1 ? "s" : ""}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setOpenPanel(openPanel === "account" ? null : "account")}
            className="w-8 h-8 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {initials || "?"}
          </button>
          {openPanel === "account" && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-line rounded-xl shadow-lg z-50 py-2">
              <div className="px-4 py-2 border-b border-line mb-1">
                <p className="text-[12.5px] font-semibold text-fg truncate">{session?.name}</p>
                <p className="text-[11px] text-subtext truncate">{session?.email}</p>
                <p className="text-[10px] text-primary capitalize mt-0.5">{session?.role}</p>
              </div>
              <button onClick={() => { router.push("/settings"); setOpenPanel(null); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[12.5px] text-fg hover:bg-white/5">
                <Settings size={14} className="text-subtext" /> Settings
              </button>
              <button onClick={() => { logout(); router.replace("/login"); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[12.5px] text-fg hover:bg-white/5">
                <LogOut size={14} className="text-subtext" /> Sign out
              </button>
            </div>
          )}
        </div>

        <ThemeToggle />
      </div>

      {mobileSearchOpen && (
        <div className="sm:hidden fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 px-4" onClick={closeSearch}>
          <div className="w-full bg-card border border-line rounded-xl p-3" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rooms, equipment, documents..."
                className="w-full bg-bg border border-line rounded-lg pl-9 pr-8 py-2.5 text-[13px] outline-none placeholder:text-subtext"
              />
              <button onClick={closeSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtext hover:text-fg">
                <X size={14} />
              </button>
            </div>
            {query.trim() && (
              <div className="mt-2 max-h-96 overflow-y-auto">
                {!hasResults ? (
                  <p className="text-[12.5px] text-subtext p-4 text-center">No matches for &ldquo;{query}&rdquo;.</p>
                ) : (
                  <>
                    {results!.properties.length > 0 && (
                      <SearchGroup label="Properties">
                        {results!.properties.map((p) => (
                          <SearchRow key={p.id} icon={Building2} title={p.name} subtitle={p.area} onClick={() => goToProperty(p)} />
                        ))}
                      </SearchGroup>
                    )}
                    {results!.rooms.length > 0 && (
                      <SearchGroup label="Rooms">
                        {results!.rooms.map(({ property, room }) => (
                          <SearchRow key={room.id} icon={DoorOpen} title={room.name} subtitle={property.name} onClick={() => goToRoom(property, room)} />
                        ))}
                      </SearchGroup>
                    )}
                    {results!.equipment.length > 0 && (
                      <SearchGroup label="Equipment">
                        {results!.equipment.map(({ property, room, equipment }) => (
                          <SearchRow key={`${room.id}-${equipment.name}`} icon={Wrench} title={equipment.name} subtitle={`${property.name} · ${room.name}`} onClick={() => goToEquipment(property, room, equipment)} />
                        ))}
                      </SearchGroup>
                    )}
                    {results!.suppliers.length > 0 && (
                      <SearchGroup label="Suppliers">
                        {results!.suppliers.map((s) => (
                          <SearchRow key={s.id} icon={Store} title={s.name} subtitle={s.category} onClick={goToSuppliers} />
                        ))}
                      </SearchGroup>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="text-[10px] tracking-widest text-subtext font-semibold px-4 pt-2 pb-1">{label.toUpperCase()}</p>
      {children}
    </div>
  );
}

function SearchRow({ icon: Icon, title, subtitle, onClick }: { icon: typeof Search; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-white/5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon size={14} className="text-primary" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-fg truncate">{title}</p>
        <p className="text-[11px] text-subtext truncate">{subtitle}</p>
      </div>
    </button>
  );
}
