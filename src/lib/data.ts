// Bump this whenever SEED_PROPERTIES/SEED_CLIENTS/SEED_SUPPLIERS change in a way
// that should reach browsers with older cached data (e.g. new seed photos).
export const SEED_VERSION = 6;

export type Role = "admin" | "client" | "support";

export type Account = { email: string; password: string; role: Role; name: string };

export const ACCOUNTS: Account[] = [
  { email: "admin@residencescan.com", password: "admin123", role: "admin", name: "Admin" },
  { email: "client@residencescan.com", password: "client123", role: "client", name: "Aegean Villas Ltd" },
  { email: "support@residencescan.com", password: "support123", role: "support", name: "Support Team" },
];

export type EquipmentItem = {
  name: string; model: string; status: "Good" | "Due soon"; photoUrl?: string;
  issueNote?: string; issueReportedAt?: string;
};

// Reduces a specific equipment name (e.g. "Samsung Frame TV", "Daikin A/C") down to
// its generic kind ("TV", "A/C") for suggesting equipment types elsewhere without
// suggesting someone else's brand/model. Just takes the last word — good enough for
// names in this app, which are consistently "[Brand] [Type]" or "[Descriptor] [Type]".
export function genericEquipmentTerm(name: string): string {
  const words = name.trim().split(/\s+/);
  return words[words.length - 1];
}

export type Room = {
  id: string;
  number: string;
  name: string;
  category: "Indoor" | "Outdoor" | "Technical";
  subtitle: string;
  equipmentCount: number;
  equipment: EquipmentItem[];
  photoUrl?: string;
};

// Real per-room "needs attention" count — equipment that's due soon or has a
// reported issue — instead of a badge seeded once and never recomputed.
export function roomAttentionCount(room: Room): number {
  return room.equipment.filter((e) => e.status === "Due soon" || e.issueNote).length;
}

// Real photo count for a room: its own cover photo plus every piece of
// equipment that has one — there is no separate "photos" data model, this
// counts the photos that actually exist.
export function roomPhotoCount(room: Room): number {
  return (room.photoUrl ? 1 : 0) + room.equipment.filter((e) => e.photoUrl).length;
}

// Completed maintenance history for one room, pulled from the property's real
// maintenance log instead of a static per-room count.
export function roomMaintenanceEntries(property: Property, room: Room): MaintenanceLogEntry[] {
  return property.maintenanceLog.filter((m) => m.room === room.name);
}

function makeRooms(prefix: string): Room[] {
  const rooms: Omit<Room, "number">[] = [
    // Indoor
    {
      id: `${prefix}-living-room`, name: "Living Room", category: "Indoor",
      subtitle: "Main residence · Ground floor", equipmentCount: 3,
      equipment: [
        { name: "Samsung Frame TV", model: "QE65LS03B · Installed 2024", status: "Good" },
        { name: "Daikin A/C", model: "FTXM50R · Service due 28 Sep", status: "Due soon" },
        { name: "Planika Fireplace", model: "Gas fireplace · Installed 2023", status: "Good" },
      ],
    },
    {
      id: `${prefix}-bedroom-1`, name: "Bedroom 1", category: "Indoor",
      subtitle: "Main residence · First floor", equipmentCount: 2,
      equipment: [
        { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2023", status: "Good" },
        { name: "Smart Blinds", model: "Somfy io · Installed 2024", status: "Good" },
      ],
    },
    {
      id: `${prefix}-bedroom-2`, name: "Bedroom 2", category: "Indoor",
      subtitle: "Main residence · First floor", equipmentCount: 2,
      equipment: [
        { name: "Daikin A/C", model: "FTXS25 · Installed 2023", status: "Good" },
        { name: "Smart Blinds", model: "Somfy io · Installed 2024", status: "Good" },
      ],
    },
    {
      id: `${prefix}-kitchen`, name: "Kitchen", category: "Indoor",
      subtitle: "Main residence · Ground floor", equipmentCount: 2,
      equipment: [
        { name: "Miele Oven", model: "H7264BP · Installed 2022", status: "Good" },
        { name: "Water Filter", model: "BWT Under-sink · Filter due", status: "Due soon" },
      ],
    },
    {
      id: `${prefix}-guest-house`, name: "Guest House", category: "Indoor",
      subtitle: "Secondary building", equipmentCount: 2,
      equipment: [
        { name: "LG A/C", model: "S12ET · Installed 2024", status: "Good" },
        { name: "Water Heater", model: "Ariston 80L · Installed 2023", status: "Good" },
      ],
    },
    // Outdoor
    {
      id: `${prefix}-pool-area`, name: "Pool Area", category: "Outdoor",
      subtitle: "Outdoor · Poolside", equipmentCount: 2,
      equipment: [
        { name: "Pool Heat Pump", model: "Zodiac Z300 · Installed 2023", status: "Good" },
        { name: "Salt Chlorinator", model: "AutoPilot RC52 · Installed 2023", status: "Good" },
      ],
    },
    {
      id: `${prefix}-pool-bar`, name: "Pool Bar", category: "Outdoor",
      subtitle: "Outdoor · Poolside", equipmentCount: 2,
      equipment: [
        { name: "Outdoor Fridge", model: "Dometic N30S · Installed 2023", status: "Good" },
        { name: "Bar Lighting", model: "Somfy io · Installed 2024", status: "Good" },
      ],
    },
    {
      id: `${prefix}-garden`, name: "Garden", category: "Outdoor",
      subtitle: "Outdoor · Grounds", equipmentCount: 2,
      equipment: [
        { name: "Irrigation System", model: "Hunter Pro-C · Service due", status: "Due soon" },
        { name: "Garden Lighting", model: "Somfy io · Installed 2023", status: "Good" },
      ],
    },
    // Technical
    {
      id: `${prefix}-pump-room`, name: "Pump Room", category: "Technical",
      subtitle: "Technical room · Basement", equipmentCount: 3,
      equipment: [
        { name: "Pool Filter Pump", model: "Pentair Whisperflo · Inspection due", status: "Due soon" },
        { name: "Water Pre-Filter", model: "Main supply · Replacement due", status: "Due soon" },
        { name: "Booster Pump", model: "Grundfos CM5 · Installed 2022", status: "Good" },
      ],
    },
    {
      id: `${prefix}-boiler-room`, name: "Boiler Room", category: "Technical",
      subtitle: "Technical room · Basement", equipmentCount: 2,
      equipment: [
        { name: "Gas Boiler", model: "Vaillant ecoTEC · Installed 2022", status: "Good" },
        { name: "Pressure Tank", model: "Reflex NG25 · Installed 2022", status: "Good" },
      ],
    },
    {
      id: `${prefix}-electrical-panel-1`, name: "Electrical Panel 1", category: "Technical",
      subtitle: "Technical · Main distribution", equipmentCount: 1,
      equipment: [
        { name: "Main Distribution Board", model: "Schneider Resi9 · Installed 2022", status: "Good" },
      ],
    },
    {
      id: `${prefix}-electrical-panel-2`, name: "Electrical Panel 2", category: "Technical",
      subtitle: "Technical · Pool circuit", equipmentCount: 1,
      equipment: [
        { name: "Pool Equipment Board", model: "Schneider Resi9 · Installed 2023", status: "Good" },
      ],
    },
    {
      id: `${prefix}-electrical-panel-3`, name: "Electrical Panel 3", category: "Technical",
      subtitle: "Technical · Guest house circuit", equipmentCount: 1,
      equipment: [
        { name: "Guest House Board", model: "Schneider Resi9 · Inspection due", status: "Due soon" },
      ],
    },
  ];
  return rooms.map((r, i) => ({ ...r, number: String(i + 1).padStart(2, "0") }));
}

export type MaintenanceLogEntry = {
  id: string;
  date: string;
  title: string;
  room: string;
  supplier: string;
  notes: string;
};

function makeMaintenanceLog(prefix: string): MaintenanceLogEntry[] {
  return [
    { id: `${prefix}-log-1`, date: "14 Sep 2026", title: "Pool filter cleaned & inspected", room: "Pool Area", supplier: "Vitalis Pools", notes: "Filter cartridge cleaned, pressure tested, no leaks found." },
    { id: `${prefix}-log-2`, date: "2 Sep 2026", title: "Daikin A/C annual service", room: "Living Room", supplier: "Daikin Service Mykonos", notes: "Refrigerant levels checked, filters replaced, unit running within spec." },
    { id: `${prefix}-log-3`, date: "20 Aug 2026", title: "Water pre-filter replaced", room: "Pump Room", supplier: "Sideris Water Systems", notes: "Main supply pre-filter cartridge replaced, water pressure restored to normal." },
    { id: `${prefix}-log-4`, date: "5 Aug 2026", title: "Electrical panel inspection", room: "Electrical Panel 1", supplier: "Mykonos Electrical Support", notes: "Circuit breakers tested, no faults found, panel labelling updated." },
    { id: `${prefix}-log-5`, date: "22 Jul 2026", title: "Garden irrigation system check", room: "Garden", supplier: "Vitalis Pools", notes: "Sprinkler heads adjusted, timer reprogrammed for the summer schedule." },
    { id: `${prefix}-log-6`, date: "10 Jul 2026", title: "Boiler annual service", room: "Boiler Room", supplier: "Sideris Water Systems", notes: "Boiler serviced, pressure tank checked, safety valve tested." },
  ];
}

export type Property = {
  id: string;
  name: string;
  area: string;
  location: string;
  clientEmail: string | null;
  updated: string;
  rooms: Room[];
  photoUrl?: string;
  maintenanceLog: MaintenanceLogEntry[];
};

// Real, property-specific "needs attention" items — equipment flagged Due soon or
// with a client-reported issue — used instead of generic copy that would otherwise
// read the same on every property regardless of what's actually going on there.
export function dueSoonEquipment(property: Property): { room: Room; equipment: EquipmentItem }[] {
  return property.rooms.flatMap((room) =>
    room.equipment
      .filter((e) => e.status === "Due soon" || e.issueNote)
      .map((equipment) => ({ room, equipment }))
  );
}

function equipmentTotals(property: Property) {
  const all = property.rooms.flatMap((r) => r.equipment);
  return {
    total: all.length,
    dueSoon: all.filter((e) => e.status === "Due soon").length,
    issues: all.filter((e) => e.issueNote).length,
    good: all.filter((e) => e.status === "Good" && !e.issueNote).length,
  };
}

// Overall health score derived from the real equipment records: the share that
// isn't currently due for service or flagged with an issue.
export function healthScore(property: Property): number {
  const { total, good } = equipmentTotals(property);
  return total === 0 ? 100 : Math.round((good / total) * 100);
}

// Equipment with no open issue report, out of the total — replaces a static
// seeded tuple that never reflected the property's real equipment.
export function systemsOnline(property: Property): [number, number] {
  const { total, issues } = equipmentTotals(property);
  return [total - issues, total];
}

// Equipment not currently due for service, out of the total.
export function maintenanceCurrent(property: Property): [number, number] {
  const { total, dueSoon } = equipmentTotals(property);
  return [total - dueSoon, total];
}

// Share of rooms + equipment that have an actual uploaded photo — the closest
// real signal to "how documented is this property" given there's no separate
// documents feature.
export function photoCoveragePct(property: Property): number {
  const roomSlots = property.rooms.length;
  const eqSlots = property.rooms.reduce((s, r) => s + r.equipment.length, 0);
  const total = roomSlots + eqSlots;
  if (total === 0) return 0;
  const withPhoto = property.rooms.filter((r) => r.photoUrl).length
    + property.rooms.reduce((s, r) => s + r.equipment.filter((e) => e.photoUrl).length, 0);
  return Math.round((withPhoto / total) * 100);
}

export const SEED_PROPERTIES: Property[] = [
  {
    id: "villa-mykonos", name: "Villa Mykonos", area: "Mykonos", location: "Agios Stefanos, Mykonos",
    clientEmail: "client@residencescan.com", updated: "16 Sep 2026",
    rooms: makeRooms("vm"), photoUrl: "/properties/villa-mykonos.png",
    maintenanceLog: makeMaintenanceLog("vm"),
  },
  {
    id: "villa-fanari", name: "Villa Fanari", area: "Mykonos", location: "Fanari, Mykonos",
    clientEmail: "client@residencescan.com", updated: "12 Sep 2026",
    rooms: makeRooms("vf"), photoUrl: "/properties/villa-fanari.png",
    maintenanceLog: makeMaintenanceLog("vf"),
  },
  {
    id: "villa-elia", name: "Villa Elia", area: "Mykonos", location: "Elia, Mykonos",
    clientEmail: "client@residencescan.com", updated: "18 Sep 2026",
    rooms: makeRooms("ve"), photoUrl: "/properties/villa-elia.png",
    maintenanceLog: makeMaintenanceLog("ve"),
  },
  {
    id: "penthouse-kolonaki", name: "Penthouse Kolonaki", area: "Athens", location: "Kolonaki, Athens",
    clientEmail: "client@residencescan.com", updated: "10 Sep 2026",
    rooms: makeRooms("pk"), photoUrl: "/properties/penthouse-kolonaki.png",
    maintenanceLog: makeMaintenanceLog("pk"),
  },
  {
    id: "riviera-house", name: "Riviera House", area: "Athens", location: "Glyfada, Athens",
    clientEmail: "client@residencescan.com", updated: "14 Sep 2026",
    rooms: makeRooms("rh"), photoUrl: "/properties/riviera-house.png",
    maintenanceLog: makeMaintenanceLog("rh"),
  },
  {
    id: "villa-paros", name: "Villa Paros", area: "Paros", location: "Naoussa, Paros",
    clientEmail: "nikos@example.com", updated: "15 Sep 2026",
    rooms: makeRooms("vp"), photoUrl: "/properties/villa-paros.png",
    maintenanceLog: makeMaintenanceLog("vp"),
  },
  {
    id: "villa-naxos", name: "Villa Naxos", area: "Naxos", location: "Agios Prokopios, Naxos",
    clientEmail: "nikos@example.com", updated: "9 Sep 2026",
    rooms: makeRooms("vn"), photoUrl: "/properties/villa-naxos.png",
    maintenanceLog: makeMaintenanceLog("vn"),
  },
];

export type Plan = "Start" | "Care" | "Plus" | "Pro";

export type ClientRecord = { email: string; name: string; plan: Plan };

export const SEED_CLIENTS: ClientRecord[] = [
  { email: "client@residencescan.com", name: "Aegean Villas Ltd", plan: "Pro" },
  { email: "nikos@example.com", name: "Nikos Papadakis", plan: "Care" },
];

export type Supplier = {
  id: string; initials: string; name: string; category: string;
  phone: string; email: string; address: string; notes: string;
};

export const SEED_SUPPLIERS: Supplier[] = [
  { id: "vitalis-pools", initials: "VP", name: "Vitalis Pools", category: "Pool maintenance", phone: "+30 694 000 1122", email: "info@vitalispools.gr", address: "Ornos, Mykonos", notes: "Weekly pool service across all Mykonos properties. Response time under 24h." },
  { id: "daikin-service-mykonos", initials: "DS", name: "Daikin Service Mykonos", category: "Air conditioning", phone: "+30 694 222 3344", email: "service@daikin-mykonos.gr", address: "Mykonos Town", notes: "Authorized Daikin technician. Handles annual servicing and warranty claims." },
  { id: "sideris-water-systems", initials: "SW", name: "Sideris Water Systems", category: "Water systems", phone: "+30 694 555 6677", email: "sideris@watersystems.gr", address: "Ano Mera, Mykonos", notes: "Well pumps, pressure tanks, and filtration systems." },
  { id: "mykonos-electrical-support", initials: "ME", name: "Mykonos Electrical Support", category: "Electrical systems", phone: "+30 694 888 9900", email: "support@mykonoselectrical.gr", address: "Tourlos, Mykonos", notes: "24/7 emergency electrical callout for all managed properties." },
];

// Real link between a supplier and completed work: every maintenance log entry
// across every property whose supplier name matches this one.
export function supplierRecordCount(supplier: Supplier, properties: Property[]): number {
  return properties.reduce((s, p) => s + p.maintenanceLog.filter((m) => m.supplier === supplier.name).length, 0);
}
