export type Role = "admin" | "client" | "support";

export type Account = { email: string; password: string; role: Role; name: string };

export const ACCOUNTS: Account[] = [
  { email: "admin@residencescan.com", password: "admin123", role: "admin", name: "Admin" },
  { email: "client@residencescan.com", password: "client123", role: "client", name: "Aegean Villas Ltd" },
  { email: "support@residencescan.com", password: "support123", role: "support", name: "Support Team" },
];

export type EquipmentItem = { name: string; model: string; status: "Good" | "Due soon" };

export type Room = {
  id: string;
  number: string;
  name: string;
  category: "Indoor" | "Outdoor" | "Technical";
  subtitle: string;
  equipmentCount: number;
  documentsCount: number;
  maintenanceCount: number;
  photosCount: number;
  badge: "current" | "attention";
  badgeCount?: number;
  equipment: EquipmentItem[];
};

function makeRooms(prefix: string): Room[] {
  return [
    {
      id: `${prefix}-living-room`, number: "01", name: "Living Room", category: "Indoor",
      subtitle: "Main residence · Ground floor", equipmentCount: 12, documentsCount: 8, maintenanceCount: 4, photosCount: 18,
      badge: "attention", badgeCount: 1,
      equipment: [
        { name: "Samsung Frame TV", model: "QE65LS03B · Installed 2024", status: "Good" },
        { name: "Daikin A/C", model: "FTXM50R · Service due 28 Sep", status: "Due soon" },
        { name: "Planika Fireplace", model: "Gas fireplace · Installed 2023", status: "Good" },
      ],
    },
    {
      id: `${prefix}-main-bedroom`, number: "02", name: "Main Bedroom", category: "Indoor",
      subtitle: "Main residence · First floor", equipmentCount: 9, documentsCount: 5, maintenanceCount: 2, photosCount: 11,
      badge: "current",
      equipment: [
        { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2023", status: "Good" },
        { name: "Smart Blinds", model: "Somfy io · Installed 2024", status: "Good" },
      ],
    },
    {
      id: `${prefix}-kitchen`, number: "03", name: "Kitchen", category: "Indoor",
      subtitle: "Main residence · Ground floor", equipmentCount: 14, documentsCount: 6, maintenanceCount: 5, photosCount: 9,
      badge: "attention", badgeCount: 1,
      equipment: [
        { name: "Miele Oven", model: "H7264BP · Installed 2022", status: "Good" },
        { name: "Water Filter", model: "BWT Under-sink · Filter due", status: "Due soon" },
      ],
    },
    {
      id: `${prefix}-pool-area`, number: "04", name: "Pool Area", category: "Outdoor",
      subtitle: "Outdoor · Poolside", equipmentCount: 11, documentsCount: 4, maintenanceCount: 6, photosCount: 22,
      badge: "current",
      equipment: [
        { name: "Pool Heat Pump", model: "Zodiac Z300 · Installed 2023", status: "Good" },
        { name: "Salt Chlorinator", model: "AutoPilot RC52 · Installed 2023", status: "Good" },
      ],
    },
    {
      id: `${prefix}-pump-room`, number: "05", name: "Pump Room", category: "Technical",
      subtitle: "Technical room · Basement", equipmentCount: 18, documentsCount: 10, maintenanceCount: 7, photosCount: 6,
      badge: "attention", badgeCount: 2,
      equipment: [
        { name: "Pool Filter Pump", model: "Pentair Whisperflo · Inspection due", status: "Due soon" },
        { name: "Water Pre-Filter", model: "Main supply · Replacement due", status: "Due soon" },
        { name: "Booster Pump", model: "Grundfos CM5 · Installed 2022", status: "Good" },
      ],
    },
    {
      id: `${prefix}-guest-house`, number: "06", name: "Guest House", category: "Indoor",
      subtitle: "Secondary building", equipmentCount: 8, documentsCount: 3, maintenanceCount: 2, photosCount: 14,
      badge: "current",
      equipment: [
        { name: "LG A/C", model: "S12ET · Installed 2024", status: "Good" },
        { name: "Water Heater", model: "Ariston 80L · Installed 2023", status: "Good" },
      ],
    },
  ];
}

export type Property = {
  id: string;
  name: string;
  area: string;
  location: string;
  clientEmail: string | null;
  health: number;
  itemsNeedAttention: number;
  systemsOnline: [number, number];
  maintenanceCurrent: [number, number];
  documentsCompletePct: number;
  updated: string;
  rooms: Room[];
  photoUrl?: string;
};

export const SEED_PROPERTIES: Property[] = [
  {
    id: "villa-mykonos", name: "Villa Mykonos", area: "Mykonos", location: "Agios Stefanos, Mykonos",
    clientEmail: "client@residencescan.com", health: 92, itemsNeedAttention: 2,
    systemsOnline: [24, 26], maintenanceCurrent: [18, 20], documentsCompletePct: 94, updated: "16 Sep 2026",
    rooms: makeRooms("vm"), photoUrl: "/properties/villa-mykonos.png",
  },
  {
    id: "villa-fanari", name: "Villa Fanari", area: "Mykonos", location: "Fanari, Mykonos",
    clientEmail: "client@residencescan.com", health: 88, itemsNeedAttention: 1,
    systemsOnline: [19, 20], maintenanceCurrent: [14, 15], documentsCompletePct: 90, updated: "12 Sep 2026",
    rooms: makeRooms("vf"), photoUrl: "/properties/villa-fanari.png",
  },
  {
    id: "villa-elia", name: "Villa Elia", area: "Mykonos", location: "Elia, Mykonos",
    clientEmail: "client@residencescan.com", health: 96, itemsNeedAttention: 0,
    systemsOnline: [22, 22], maintenanceCurrent: [16, 16], documentsCompletePct: 100, updated: "18 Sep 2026",
    rooms: makeRooms("ve"), photoUrl: "/properties/villa-elia.png",
  },
  {
    id: "penthouse-kolonaki", name: "Penthouse Kolonaki", area: "Athens", location: "Kolonaki, Athens",
    clientEmail: "client@residencescan.com", health: 81, itemsNeedAttention: 3,
    systemsOnline: [17, 20], maintenanceCurrent: [11, 14], documentsCompletePct: 85, updated: "10 Sep 2026",
    rooms: makeRooms("pk"), photoUrl: "/properties/penthouse-kolonaki.png",
  },
  {
    id: "riviera-house", name: "Riviera House", area: "Athens", location: "Glyfada, Athens",
    clientEmail: "client@residencescan.com", health: 90, itemsNeedAttention: 1,
    systemsOnline: [20, 21], maintenanceCurrent: [15, 16], documentsCompletePct: 92, updated: "14 Sep 2026",
    rooms: makeRooms("rh"), photoUrl: "/properties/riviera-house.png",
  },
  {
    id: "villa-paros", name: "Villa Paros", area: "Paros", location: "Naoussa, Paros",
    clientEmail: "nikos@example.com", health: 94, itemsNeedAttention: 0,
    systemsOnline: [18, 18], maintenanceCurrent: [12, 12], documentsCompletePct: 97, updated: "15 Sep 2026",
    rooms: makeRooms("vp"), photoUrl: "/properties/villa-paros.png",
  },
  {
    id: "villa-naxos", name: "Villa Naxos", area: "Naxos", location: "Agios Prokopios, Naxos",
    clientEmail: "nikos@example.com", health: 85, itemsNeedAttention: 1,
    systemsOnline: [16, 18], maintenanceCurrent: [10, 12], documentsCompletePct: 88, updated: "9 Sep 2026",
    rooms: makeRooms("vn"), photoUrl: "/properties/villa-naxos.png",
  },
];

export type Plan = "Start" | "Care" | "Plus" | "Pro";

export type ClientRecord = { email: string; name: string; plan: Plan };

export const SEED_CLIENTS: ClientRecord[] = [
  { email: "client@residencescan.com", name: "Aegean Villas Ltd", plan: "Pro" },
  { email: "nikos@example.com", name: "Nikos Papadakis", plan: "Care" },
];

export const maintenanceItems = [
  { date: "18", month: "SEP", title: "Pool filter inspection", subtitle: "Pool machinery", status: "Due soon" as const },
  { date: "20", month: "SEP", title: "Replace water pre-filter", subtitle: "Main water supply", status: "Scheduled" as const },
  { date: "28", month: "SEP", title: "Service Daikin A/C", subtitle: "Living Room", status: "Upcoming" as const },
  { date: "12", month: "OCT", title: "Generator annual service", subtitle: "Technical room", status: "Upcoming" as const },
];

export type Supplier = {
  id: string; initials: string; name: string; category: string; records: number;
  phone: string; email: string; address: string; notes: string;
};

export const SEED_SUPPLIERS: Supplier[] = [
  { id: "vitalis-pools", initials: "VP", name: "Vitalis Pools", category: "Pool maintenance", records: 12, phone: "+30 694 000 1122", email: "info@vitalispools.gr", address: "Ornos, Mykonos", notes: "Weekly pool service across all Mykonos properties. Response time under 24h." },
  { id: "daikin-service-mykonos", initials: "DS", name: "Daikin Service Mykonos", category: "Air conditioning", records: 6, phone: "+30 694 222 3344", email: "service@daikin-mykonos.gr", address: "Mykonos Town", notes: "Authorized Daikin technician. Handles annual servicing and warranty claims." },
  { id: "sideris-water-systems", initials: "SW", name: "Sideris Water Systems", category: "Water systems", records: 9, phone: "+30 694 555 6677", email: "sideris@watersystems.gr", address: "Ano Mera, Mykonos", notes: "Well pumps, pressure tanks, and filtration systems." },
  { id: "mykonos-electrical-support", initials: "ME", name: "Mykonos Electrical Support", category: "Electrical systems", records: 15, phone: "+30 694 888 9900", email: "support@mykonoselectrical.gr", address: "Tourlos, Mykonos", notes: "24/7 emergency electrical callout for all managed properties." },
];

export const xrayCategories = ["Water", "Electrical", "Pool", "HVAC", "Security", "Network", "Lighting"];

export const xrayRooms = [
  { name: "Living Room", count: 19, points: "20,320 260,220 380,260 260,420 40,420" },
  { name: "Kitchen", count: 14, points: "390,220 540,220 540,340 390,340" },
  { name: "Pool", count: 31, points: "550,220 700,220 700,320 550,320" },
  { name: "Pump Room", count: 18, points: "390,350 540,350 540,440 390,440" },
  { name: "Bedrooms", count: 31, points: "460,450 760,470 760,510 460,510" },
];
