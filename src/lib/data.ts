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

// Assigns each room's display number in order — the one bit of bookkeeping
// that's the same mechanical step for every property, unlike the actual room
// list and equipment below, which is written out per property so two
// different villas don't show the exact same rooms, brands and due dates.
function withNumbers(rooms: Omit<Room, "number">[]): Room[] {
  return rooms.map((r, i) => ({ ...r, number: String(i + 1).padStart(2, "0") }));
}

function villaMykonosRooms(): Room[] {
  return withNumbers([
    { id: "vm-living-room", name: "Living Room", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 3, equipment: [
      { name: "Samsung Frame TV", model: "QE65LS03B · Installed 2024", status: "Good" },
      { name: "Daikin A/C", model: "FTXM50R · Installed 2022, service due", status: "Due soon" },
      { name: "Dimplex Electric Fireplace", model: "Opti-myst · Installed 2023", status: "Good" },
    ] },
    { id: "vm-bedroom-1", name: "Bedroom 1", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2023", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2024", status: "Good" },
    ] },
    { id: "vm-bedroom-2", name: "Bedroom 2", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "LG A/C", model: "S12ET · Installed 2022", status: "Good" },
      { name: "Ceiling Fan", model: "Westinghouse · Installed 2021", status: "Good" },
    ] },
    { id: "vm-bedroom-3", name: "Bedroom 3", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Daikin A/C", model: "FTXS25 · Installed 2023", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2024", status: "Good" },
    ] },
    { id: "vm-kitchen", name: "Kitchen", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 3, equipment: [
      { name: "Bosch Oven", model: "Serie 8 · Installed 2022", status: "Good" },
      { name: "BWT Water Filter", model: "Under-sink · Installed 2023, filter change due", status: "Due soon" },
      { name: "Bosch Dishwasher", model: "Serie 6 · Installed 2022", status: "Good" },
    ] },
    { id: "vm-guest-house", name: "Guest House", category: "Indoor", subtitle: "Secondary building", equipmentCount: 2, equipment: [
      { name: "LG A/C", model: "S12ET · Installed 2024", status: "Good" },
      { name: "Ariston Water Heater", model: "80L · Installed 2021, anode check due", status: "Due soon" },
    ] },
    { id: "vm-pool-area", name: "Pool Area", category: "Outdoor", subtitle: "Outdoor · Poolside", equipmentCount: 2, equipment: [
      { name: "Zodiac Pool Heat Pump", model: "Z300 · Installed 2022", status: "Good" },
      { name: "AutoPilot Salt Chlorinator", model: "RC52 · Installed 2023", status: "Good" },
    ] },
    { id: "vm-pool-bar", name: "Pool Bar", category: "Outdoor", subtitle: "Outdoor · Poolside", equipmentCount: 2, equipment: [
      { name: "Dometic Outdoor Fridge", model: "N30S · Installed 2023", status: "Good" },
      { name: "Somfy Bar Lighting", model: "io · Installed 2023", status: "Good" },
    ] },
    { id: "vm-garden", name: "Garden", category: "Outdoor", subtitle: "Outdoor · Grounds", equipmentCount: 2, equipment: [
      { name: "Hunter Irrigation System", model: "Pro-C · Installed 2021, controller service due", status: "Due soon" },
      { name: "Somfy Garden Lighting", model: "io · Installed 2022", status: "Good" },
    ] },
    { id: "vm-pump-room", name: "Pump Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 2, equipment: [
      { name: "Pentair Pool Filter Pump", model: "Whisperflo · Installed 2021, inspection due", status: "Due soon" },
      { name: "Grundfos Booster Pump", model: "CM5 · Installed 2022", status: "Good" },
    ] },
    { id: "vm-boiler-room", name: "Boiler Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 2, equipment: [
      { name: "Vaillant Gas Boiler", model: "ecoTEC · Installed 2021", status: "Good" },
      { name: "Reflex Pressure Tank", model: "NG25 · Installed 2021", status: "Good" },
    ] },
    { id: "vm-electrical-panel-1", name: "Electrical Panel 1", category: "Technical", subtitle: "Technical · Main distribution", equipmentCount: 1, equipment: [
      { name: "Schneider Distribution Board", model: "Resi9 · Installed 2021", status: "Good" },
    ] },
    { id: "vm-electrical-panel-2", name: "Electrical Panel 2", category: "Technical", subtitle: "Technical · Pool circuit", equipmentCount: 1, equipment: [
      { name: "Schneider Pool Equipment Board", model: "Resi9 · Installed 2022", status: "Good" },
    ] },
  ]);
}

function villaMykonosLog(): MaintenanceLogEntry[] {
  return [
    { id: "vm-log-1", date: "12 Sep 2026", title: "Pool heat pump annual service", room: "Pool Area", supplier: "Vitalis Pools", notes: "Heat exchanger descaled, refrigerant charge checked, running efficiently." },
    { id: "vm-log-2", date: "30 Aug 2026", title: "Daikin A/C system service", room: "Living Room", supplier: "Daikin Service Mykonos", notes: "Filters cleaned, refrigerant topped up, remote control reprogrammed." },
    { id: "vm-log-3", date: "18 Aug 2026", title: "Booster pump inspection", room: "Pump Room", supplier: "Sideris Water Systems", notes: "Pump pressure tested, seals checked, no leaks found." },
    { id: "vm-log-4", date: "3 Aug 2026", title: "Distribution board safety check", room: "Electrical Panel 1", supplier: "Mykonos Electrical Support", notes: "RCD trip tested, all circuits labelled and verified." },
    { id: "vm-log-5", date: "15 Jul 2026", title: "Garden irrigation summer tune-up", room: "Garden", supplier: "Vitalis Pools", notes: "Sprinkler zones tested, controller programmed for peak season." },
    { id: "vm-log-6", date: "28 Jun 2026", title: "Water heater anode replacement", room: "Guest House", supplier: "Sideris Water Systems", notes: "Sacrificial anode replaced, tank flushed, temperature verified." },
  ];
}

function villaFanariRooms(): Room[] {
  return withNumbers([
    { id: "vf-living-room", name: "Living Room", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 3, equipment: [
      { name: "LG OLED TV", model: "C3 · Installed 2023", status: "Good" },
      { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2021, service due", status: "Due soon" },
      { name: "Jotul Wood Stove", model: "F 305 · Installed 2020", status: "Good" },
    ] },
    { id: "vf-bedroom-1", name: "Bedroom 1", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Daikin A/C", model: "FTXS25 · Installed 2022", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2023", status: "Good" },
    ] },
    { id: "vf-bedroom-2", name: "Bedroom 2", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Daikin A/C", model: "FTXS25 · Installed 2022", status: "Good" },
      { name: "Ceiling Fan", model: "Westinghouse · Installed 2021", status: "Good" },
    ] },
    { id: "vf-kitchen", name: "Kitchen", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 3, equipment: [
      { name: "Siemens Oven", model: "iQ700 · Installed 2021", status: "Good" },
      { name: "BWT Water Filter", model: "Under-sink · Installed 2022", status: "Good" },
      { name: "Siemens Dishwasher", model: "iQ500 · Installed 2021, service due", status: "Due soon" },
    ] },
    { id: "vf-terrace", name: "Terrace", category: "Outdoor", subtitle: "Outdoor · Sea view", equipmentCount: 2, equipment: [
      { name: "Somfy Outdoor Lighting", model: "io · Installed 2022", status: "Good" },
      { name: "Retractable Awning", model: "Motorised · Installed 2021, motor inspection due", status: "Due soon" },
    ] },
    { id: "vf-pool-area", name: "Pool Area", category: "Outdoor", subtitle: "Outdoor · Poolside", equipmentCount: 2, equipment: [
      { name: "AstralPool Heat Pump", model: "Evoline · Installed 2020, efficiency check due", status: "Due soon" },
      { name: "Hayward Salt Chlorinator", model: "AquaRite · Installed 2022", status: "Good" },
    ] },
    { id: "vf-garden", name: "Garden", category: "Outdoor", subtitle: "Outdoor · Grounds", equipmentCount: 2, equipment: [
      { name: "Hunter Irrigation System", model: "Pro-C · Installed 2022", status: "Good" },
      { name: "Somfy Garden Lighting", model: "io · Installed 2022", status: "Good" },
    ] },
    { id: "vf-pump-room", name: "Pump Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 2, equipment: [
      { name: "Pentair Pool Filter Pump", model: "Whisperflo · Installed 2020", status: "Good" },
      { name: "Water Pre-Filter", model: "Main supply · Installed 2023", status: "Good" },
    ] },
    { id: "vf-boiler-room", name: "Boiler Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 1, equipment: [
      { name: "Ariston Electric Water Heater", model: "80L · Installed 2022", status: "Good" },
    ] },
    { id: "vf-electrical-panel-1", name: "Electrical Panel 1", category: "Technical", subtitle: "Technical · Main distribution", equipmentCount: 1, equipment: [
      { name: "Schneider Distribution Board", model: "Resi9 · Installed 2020, inspection overdue", status: "Due soon" },
    ] },
    { id: "vf-electrical-panel-2", name: "Electrical Panel 2", category: "Technical", subtitle: "Technical · Pool circuit", equipmentCount: 1, equipment: [
      { name: "Schneider Pool Equipment Board", model: "Resi9 · Installed 2022", status: "Good" },
    ] },
  ]);
}

function villaFanariLog(): MaintenanceLogEntry[] {
  return [
    { id: "vf-log-1", date: "9 Sep 2026", title: "Pool heat pump efficiency check", room: "Pool Area", supplier: "Vitalis Pools", notes: "Performance tested against baseline, minor refrigerant top-up performed." },
    { id: "vf-log-2", date: "25 Aug 2026", title: "Dishwasher service", room: "Kitchen", supplier: "Sideris Water Systems", notes: "Spray arms cleaned, drain pump inspected, filter replaced." },
    { id: "vf-log-3", date: "10 Aug 2026", title: "A/C seasonal service", room: "Living Room", supplier: "Daikin Service Mykonos", notes: "Coils cleaned, refrigerant level confirmed within spec." },
    { id: "vf-log-4", date: "29 Jul 2026", title: "Awning motor inspection", room: "Terrace", supplier: "Mykonos Electrical Support", notes: "Motor gearbox lubricated, remote sync tested." },
    { id: "vf-log-5", date: "6 Jul 2026", title: "Distribution board inspection", room: "Electrical Panel 1", supplier: "Mykonos Electrical Support", notes: "Flagged for replacement within 12 months, temporary certification issued." },
    { id: "vf-log-6", date: "19 Jun 2026", title: "Pool filter pump service", room: "Pump Room", supplier: "Vitalis Pools", notes: "Impeller cleaned, seal replaced, pressure back to normal." },
  ];
}

function villaEliaRooms(): Room[] {
  return withNumbers([
    { id: "ve-living-room", name: "Living Room", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 3, equipment: [
      { name: "Sony Bravia TV", model: "XR-65 · Installed 2024", status: "Good" },
      { name: "Daikin A/C", model: "FTXM50R · Installed 2023", status: "Good" },
      { name: "Planika Gas Fireplace", model: "Automatic · Installed 2022", status: "Good" },
    ] },
    { id: "ve-bedroom-1", name: "Bedroom 1", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2023", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2024", status: "Good" },
    ] },
    { id: "ve-bedroom-2", name: "Bedroom 2", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2023", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2024", status: "Good" },
    ] },
    { id: "ve-bedroom-3", name: "Bedroom 3", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Daikin A/C", model: "FTXS25 · Installed 2023, filter clean due", status: "Due soon" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2024", status: "Good" },
    ] },
    { id: "ve-kitchen", name: "Kitchen", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 2, equipment: [
      { name: "Miele Oven", model: "H7264BP · Installed 2023", status: "Good" },
      { name: "BWT Water Filter", model: "Under-sink · Installed 2024", status: "Good" },
    ] },
    { id: "ve-pool-area", name: "Pool Area", category: "Outdoor", subtitle: "Outdoor · Poolside", equipmentCount: 2, equipment: [
      { name: "Zodiac Pool Heat Pump", model: "Z500 · Installed 2023", status: "Good" },
      { name: "AutoPilot Salt Chlorinator", model: "RC52 · Installed 2023", status: "Good" },
    ] },
    { id: "ve-pool-bar", name: "Pool Bar", category: "Outdoor", subtitle: "Outdoor · Poolside", equipmentCount: 2, equipment: [
      { name: "Dometic Outdoor Fridge", model: "N30S · Installed 2023", status: "Good" },
      { name: "Ice Maker", model: "Scotsman · Installed 2023, descale due", status: "Due soon" },
    ] },
    { id: "ve-beach-storage", name: "Beach Storage", category: "Outdoor", subtitle: "Outdoor · Path to beach", equipmentCount: 2, equipment: [
      { name: "Kayak Rack", model: "Freestanding · Installed 2022", status: "Good" },
      { name: "Outdoor Shower", model: "Mixer valve · Installed 2022, valve leaking", status: "Due soon" },
    ] },
    { id: "ve-garden", name: "Garden", category: "Outdoor", subtitle: "Outdoor · Grounds", equipmentCount: 2, equipment: [
      { name: "Hunter Irrigation System", model: "Pro-C · Installed 2023", status: "Good" },
      { name: "Somfy Garden Lighting", model: "io · Installed 2023", status: "Good" },
    ] },
    { id: "ve-pump-room", name: "Pump Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 2, equipment: [
      { name: "Pentair Pool Filter Pump", model: "Whisperflo · Installed 2023", status: "Good" },
      { name: "Grundfos Booster Pump", model: "CM5 · Installed 2023", status: "Good" },
    ] },
    { id: "ve-boiler-room", name: "Boiler Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 1, equipment: [
      { name: "Vaillant Gas Boiler", model: "ecoTEC · Installed 2023", status: "Good" },
    ] },
    { id: "ve-electrical-panel-1", name: "Electrical Panel 1", category: "Technical", subtitle: "Technical · Main distribution", equipmentCount: 1, equipment: [
      { name: "Schneider Distribution Board", model: "Resi9 · Installed 2023", status: "Good" },
    ] },
  ]);
}

function villaEliaLog(): MaintenanceLogEntry[] {
  return [
    { id: "ve-log-1", date: "14 Sep 2026", title: "Pool bar ice maker descale", room: "Pool Bar", supplier: "Vitalis Pools", notes: "Descaling cycle run, water filter replaced, ice quality restored." },
    { id: "ve-log-2", date: "2 Sep 2026", title: "Outdoor shower valve repair", room: "Beach Storage", supplier: "Sideris Water Systems", notes: "Mixing valve replaced, pressure tested, no further leaks." },
    { id: "ve-log-3", date: "20 Aug 2026", title: "A/C filter service", room: "Bedroom 3", supplier: "Daikin Service Mykonos", notes: "Filters cleaned, unit tested, running quietly within spec." },
    { id: "ve-log-4", date: "5 Aug 2026", title: "Electrical panel inspection", room: "Electrical Panel 1", supplier: "Mykonos Electrical Support", notes: "All circuits tested, no faults found, certificate renewed." },
    { id: "ve-log-5", date: "22 Jul 2026", title: "Garden irrigation check", room: "Garden", supplier: "Vitalis Pools", notes: "Sprinkler heads adjusted for late-summer watering schedule." },
    { id: "ve-log-6", date: "10 Jul 2026", title: "Boiler annual service", room: "Boiler Room", supplier: "Sideris Water Systems", notes: "Boiler serviced, safety valve tested, running efficiently." },
  ];
}

function penthouseKolonakiRooms(): Room[] {
  return withNumbers([
    { id: "pk-living-room", name: "Living Room", category: "Indoor", subtitle: "Penthouse · Main floor", equipmentCount: 3, equipment: [
      { name: "LG OLED TV", model: "C4 · Installed 2024", status: "Good" },
      { name: "Daikin A/C", model: "FTXM50R · Installed 2022", status: "Good" },
      { name: "Sonos Sound System", model: "Arc + Sub · Installed 2023", status: "Good" },
    ] },
    { id: "pk-master-bedroom", name: "Master Bedroom", category: "Indoor", subtitle: "Penthouse · Main floor", equipmentCount: 2, equipment: [
      { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2022", status: "Good" },
      { name: "Somfy Electric Blinds", model: "io · Installed 2023, motor recalibration due", status: "Due soon" },
    ] },
    { id: "pk-bedroom-2", name: "Bedroom 2", category: "Indoor", subtitle: "Penthouse · Main floor", equipmentCount: 2, equipment: [
      { name: "Daikin A/C", model: "FTXS25 · Installed 2022", status: "Good" },
      { name: "Ceiling Fan", model: "Westinghouse · Installed 2021", status: "Good" },
    ] },
    { id: "pk-kitchen", name: "Kitchen", category: "Indoor", subtitle: "Penthouse · Main floor", equipmentCount: 3, equipment: [
      { name: "Siemens Oven", model: "iQ700 · Installed 2022", status: "Good" },
      { name: "Siemens Dishwasher", model: "iQ500 · Installed 2022", status: "Good" },
      { name: "BWT Water Filter", model: "Under-sink · Installed 2023, filter change due", status: "Due soon" },
    ] },
    { id: "pk-terrace", name: "Terrace", category: "Outdoor", subtitle: "Penthouse · Rooftop", equipmentCount: 2, equipment: [
      { name: "Somfy Outdoor Lighting", model: "io · Installed 2023", status: "Good" },
      { name: "Retractable Pergola", model: "Motorised · Installed 2022", status: "Good" },
    ] },
    { id: "pk-home-office", name: "Home Office", category: "Indoor", subtitle: "Penthouse · Main floor", equipmentCount: 2, equipment: [
      { name: "Daikin Split A/C Unit", model: "FTXS20 · Installed 2022", status: "Good" },
      { name: "APC UPS Backup Unit", model: "Smart-UPS 1500 · Installed 2023, battery test due", status: "Due soon" },
    ] },
    { id: "pk-electrical-panel", name: "Electrical Panel", category: "Technical", subtitle: "Technical · Main distribution", equipmentCount: 1, equipment: [
      { name: "Schneider Distribution Board", model: "Resi9 · Installed 2021", status: "Good" },
    ] },
    { id: "pk-utility-closet", name: "Utility Closet", category: "Technical", subtitle: "Technical · Service riser", equipmentCount: 2, equipment: [
      { name: "Ariston Water Heater", model: "50L · Installed 2022", status: "Good" },
      { name: "Building Water Meter", model: "Smart meter · Installed 2021", status: "Good" },
    ] },
  ]);
}

function penthouseKolonakiLog(): MaintenanceLogEntry[] {
  return [
    { id: "pk-log-1", date: "8 Sep 2026", title: "UPS battery test", room: "Home Office", supplier: "Kolonaki Home Care", notes: "Battery capacity tested at 92%, firmware updated." },
    { id: "pk-log-2", date: "27 Aug 2026", title: "Electric blinds recalibration", room: "Master Bedroom", supplier: "Kolonaki Home Care", notes: "Motor limits reset, remote paired, smooth operation confirmed." },
    { id: "pk-log-3", date: "14 Aug 2026", title: "A/C seasonal service", room: "Living Room", supplier: "Kolonaki Home Care", notes: "Filters cleaned, refrigerant checked, unit running within spec." },
    { id: "pk-log-4", date: "30 Jul 2026", title: "Water filter replacement", room: "Kitchen", supplier: "Kolonaki Home Care", notes: "Under-sink filter cartridge replaced, water quality tested." },
    { id: "pk-log-5", date: "12 Jul 2026", title: "Pergola motor service", room: "Terrace", supplier: "Kolonaki Home Care", notes: "Motor gearbox lubricated, remote sync verified." },
    { id: "pk-log-6", date: "25 Jun 2026", title: "Distribution board inspection", room: "Electrical Panel", supplier: "Kolonaki Home Care", notes: "All circuits tested, panel labelling refreshed." },
  ];
}

function rivieraHouseRooms(): Room[] {
  return withNumbers([
    { id: "rh-living-room", name: "Living Room", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 3, equipment: [
      { name: "Samsung QLED TV", model: "QN90 · Installed 2023", status: "Good" },
      { name: "Daikin A/C", model: "FTXM50R · Installed 2021, service due", status: "Due soon" },
      { name: "Fireplace Insert", model: "Stovax · Installed 2020", status: "Good" },
    ] },
    { id: "rh-bedroom-1", name: "Bedroom 1", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2022", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2022", status: "Good" },
    ] },
    { id: "rh-bedroom-2", name: "Bedroom 2", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Daikin A/C", model: "FTXS25 · Installed 2022", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2022", status: "Good" },
    ] },
    { id: "rh-bedroom-3", name: "Bedroom 3", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "LG A/C", model: "S12ET · Installed 2021", status: "Good" },
      { name: "Ceiling Fan", model: "Westinghouse · Installed 2020", status: "Good" },
    ] },
    { id: "rh-kitchen", name: "Kitchen", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 2, equipment: [
      { name: "Bosch Oven", model: "Serie 8 · Installed 2021", status: "Good" },
      { name: "Bosch Dishwasher", model: "Serie 6 · Installed 2021, service due", status: "Due soon" },
    ] },
    { id: "rh-pool-area", name: "Pool Area", category: "Outdoor", subtitle: "Outdoor · Poolside", equipmentCount: 2, equipment: [
      { name: "Hayward Pool Heat Pump", model: "HeatPro · Installed 2021", status: "Good" },
      { name: "Hayward Salt Chlorinator", model: "AquaRite · Installed 2021", status: "Good" },
    ] },
    { id: "rh-garden", name: "Garden", category: "Outdoor", subtitle: "Outdoor · Grounds", equipmentCount: 2, equipment: [
      { name: "Hunter Irrigation System", model: "Pro-C · Installed 2020, controller reprogram due", status: "Due soon" },
      { name: "Somfy Garden Lighting", model: "io · Installed 2021", status: "Good" },
    ] },
    { id: "rh-boiler-room", name: "Boiler Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 2, equipment: [
      { name: "Vaillant Gas Boiler", model: "ecoTEC · Installed 2020", status: "Good" },
      { name: "Reflex Pressure Tank", model: "NG25 · Installed 2020", status: "Good" },
    ] },
    { id: "rh-pump-room", name: "Pump Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 1, equipment: [
      { name: "Pentair Pool Filter Pump", model: "Whisperflo · Installed 2021", status: "Good" },
    ] },
    { id: "rh-electrical-panel-1", name: "Electrical Panel 1", category: "Technical", subtitle: "Technical · Main distribution", equipmentCount: 1, equipment: [
      { name: "Schneider Distribution Board", model: "Resi9 · Installed 2020", status: "Good" },
    ] },
    { id: "rh-parking-storage", name: "Parking & Storage", category: "Outdoor", subtitle: "Outdoor · Driveway", equipmentCount: 2, equipment: [
      { name: "Wallbox EV Charger", model: "Pulsar Plus · Installed 2023", status: "Good" },
      { name: "Ring Outdoor Camera System", model: "4-camera kit · Installed 2022, firmware update due", status: "Due soon" },
    ] },
  ]);
}

function rivieraHouseLog(): MaintenanceLogEntry[] {
  return [
    { id: "rh-log-1", date: "11 Sep 2026", title: "Pool heat pump service", room: "Pool Area", supplier: "Athens Riviera Pools", notes: "Heat exchanger cleaned, thermostat calibrated, running efficiently." },
    { id: "rh-log-2", date: "28 Aug 2026", title: "A/C annual service", room: "Living Room", supplier: "Glyfada Technical Services", notes: "Filters cleaned, refrigerant topped up, unit tested under load." },
    { id: "rh-log-3", date: "16 Aug 2026", title: "Dishwasher service", room: "Kitchen", supplier: "Glyfada Technical Services", notes: "Spray arms cleared, seals inspected, drain pump tested." },
    { id: "rh-log-4", date: "2 Aug 2026", title: "Security camera firmware update", room: "Parking & Storage", supplier: "Glyfada Technical Services", notes: "All cameras updated, night vision recalibrated, footage verified." },
    { id: "rh-log-5", date: "20 Jul 2026", title: "Irrigation controller reprogram", room: "Garden", supplier: "Athens Riviera Pools", notes: "Watering schedule adjusted for autumn, valves tested." },
    { id: "rh-log-6", date: "8 Jul 2026", title: "Boiler annual service", room: "Boiler Room", supplier: "Glyfada Technical Services", notes: "Boiler serviced, pressure tank checked, safety valve tested." },
  ];
}

function villaParosRooms(): Room[] {
  return withNumbers([
    { id: "vp-living-room", name: "Living Room", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 3, equipment: [
      { name: "LG OLED TV", model: "C3 · Installed 2023", status: "Good" },
      { name: "Daikin A/C", model: "FTXM50R · Installed 2022", status: "Good" },
      { name: "Wood Stove", model: "Jotul F 305 · Installed 2021", status: "Good" },
    ] },
    { id: "vp-bedroom-1", name: "Bedroom 1", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2022", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2023", status: "Good" },
    ] },
    { id: "vp-bedroom-2", name: "Bedroom 2", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Daikin A/C", model: "FTXS25 · Installed 2022, service due", status: "Due soon" },
      { name: "Ceiling Fan", model: "Westinghouse · Installed 2021", status: "Good" },
    ] },
    { id: "vp-kitchen", name: "Kitchen", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 2, equipment: [
      { name: "Siemens Oven", model: "iQ700 · Installed 2022", status: "Good" },
      { name: "BWT Water Filter", model: "Under-sink · Installed 2023", status: "Good" },
    ] },
    { id: "vp-terrace", name: "Terrace", category: "Outdoor", subtitle: "Outdoor · Sea view", equipmentCount: 2, equipment: [
      { name: "Somfy Outdoor Lighting", model: "io · Installed 2022", status: "Good" },
      { name: "Pergola Cover", model: "Retractable · Installed 2021", status: "Good" },
    ] },
    { id: "vp-pool-area", name: "Pool Area", category: "Outdoor", subtitle: "Outdoor · Poolside", equipmentCount: 2, equipment: [
      { name: "AstralPool Heat Pump", model: "Evoline · Installed 2022", status: "Good" },
      { name: "Hayward Salt Chlorinator", model: "AquaRite · Installed 2022", status: "Good" },
    ] },
    { id: "vp-garden", name: "Garden", category: "Outdoor", subtitle: "Outdoor · Grounds", equipmentCount: 2, equipment: [
      { name: "Hunter Irrigation System", model: "Pro-C · Installed 2022, service due", status: "Due soon" },
      { name: "Somfy Garden Lighting", model: "io · Installed 2022", status: "Good" },
    ] },
    { id: "vp-pump-room", name: "Pump Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 2, equipment: [
      { name: "Pentair Pool Filter Pump", model: "Whisperflo · Installed 2022", status: "Good" },
      { name: "Water Pre-Filter", model: "Main supply · Installed 2022, replacement due", status: "Due soon" },
    ] },
    { id: "vp-boiler-room", name: "Boiler Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 1, equipment: [
      { name: "Ariston Electric Water Heater", model: "80L · Installed 2022", status: "Good" },
    ] },
    { id: "vp-electrical-panel-1", name: "Electrical Panel 1", category: "Technical", subtitle: "Technical · Main distribution", equipmentCount: 1, equipment: [
      { name: "Schneider Distribution Board", model: "Resi9 · Installed 2021", status: "Good" },
    ] },
  ]);
}

function villaParosLog(): MaintenanceLogEntry[] {
  return [
    { id: "vp-log-1", date: "7 Sep 2026", title: "Water pre-filter inspection", room: "Pump Room", supplier: "Cyclades Villa Services", notes: "Pre-filter checked, replacement scheduled for next visit." },
    { id: "vp-log-2", date: "24 Aug 2026", title: "A/C service", room: "Bedroom 2", supplier: "Cyclades Villa Services", notes: "Filters cleaned, refrigerant checked, minor noise resolved." },
    { id: "vp-log-3", date: "9 Aug 2026", title: "Irrigation system service", room: "Garden", supplier: "Cyclades Villa Services", notes: "Sprinkler heads cleaned, controller reprogrammed for season." },
    { id: "vp-log-4", date: "26 Jul 2026", title: "Pool heat pump check", room: "Pool Area", supplier: "Cyclades Villa Services", notes: "Performance tested, refrigerant levels within spec." },
    { id: "vp-log-5", date: "12 Jul 2026", title: "Electrical panel inspection", room: "Electrical Panel 1", supplier: "Cyclades Villa Services", notes: "All circuits tested, no faults found." },
    { id: "vp-log-6", date: "29 Jun 2026", title: "Water heater service", room: "Boiler Room", supplier: "Cyclades Villa Services", notes: "Element checked, tank flushed, thermostat calibrated." },
  ];
}

function villaNaxosRooms(): Room[] {
  return withNumbers([
    { id: "vn-living-room", name: "Living Room", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 3, equipment: [
      { name: "Samsung Frame TV", model: "QE65LS03B · Installed 2022", status: "Good" },
      { name: "Daikin A/C", model: "FTXM50R · Installed 2021, service due", status: "Due soon" },
      { name: "Fireplace", model: "Wood-burning · Installed 2020", status: "Good" },
    ] },
    { id: "vn-bedroom-1", name: "Bedroom 1", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Mitsubishi A/C", model: "MSZ-LN35 · Installed 2022", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2022", status: "Good" },
    ] },
    { id: "vn-bedroom-2", name: "Bedroom 2", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "LG A/C", model: "S12ET · Installed 2021", status: "Good" },
      { name: "Ceiling Fan", model: "Westinghouse · Installed 2020", status: "Good" },
    ] },
    { id: "vn-bedroom-3", name: "Bedroom 3", category: "Indoor", subtitle: "Main residence · First floor", equipmentCount: 2, equipment: [
      { name: "Daikin A/C", model: "FTXS25 · Installed 2021", status: "Good" },
      { name: "Somfy Smart Blinds", model: "io · Installed 2022", status: "Good" },
    ] },
    { id: "vn-kitchen", name: "Kitchen", category: "Indoor", subtitle: "Main residence · Ground floor", equipmentCount: 2, equipment: [
      { name: "Bosch Oven", model: "Serie 8 · Installed 2021", status: "Good" },
      { name: "BWT Water Filter", model: "Under-sink · Installed 2022, filter change due", status: "Due soon" },
    ] },
    { id: "vn-guest-house", name: "Guest House", category: "Indoor", subtitle: "Secondary building", equipmentCount: 2, equipment: [
      { name: "LG A/C", model: "S12ET · Installed 2022", status: "Good" },
      { name: "Ariston Water Heater", model: "80L · Installed 2021", status: "Good" },
    ] },
    { id: "vn-pool-area", name: "Pool Area", category: "Outdoor", subtitle: "Outdoor · Poolside", equipmentCount: 2, equipment: [
      { name: "Zodiac Pool Heat Pump", model: "Z300 · Installed 2021, efficiency check due", status: "Due soon" },
      { name: "AutoPilot Salt Chlorinator", model: "RC52 · Installed 2021", status: "Good" },
    ] },
    { id: "vn-garden", name: "Garden", category: "Outdoor", subtitle: "Outdoor · Grounds", equipmentCount: 2, equipment: [
      { name: "Hunter Irrigation System", model: "Pro-C · Installed 2021", status: "Good" },
      { name: "Somfy Garden Lighting", model: "io · Installed 2021", status: "Good" },
    ] },
    { id: "vn-pump-room", name: "Pump Room", category: "Technical", subtitle: "Technical room · Basement", equipmentCount: 2, equipment: [
      { name: "Pentair Pool Filter Pump", model: "Whisperflo · Installed 2021", status: "Good" },
      { name: "Grundfos Booster Pump", model: "CM5 · Installed 2021", status: "Good" },
    ] },
    { id: "vn-electrical-panel-1", name: "Electrical Panel 1", category: "Technical", subtitle: "Technical · Main distribution", equipmentCount: 1, equipment: [
      { name: "Schneider Distribution Board", model: "Resi9 · Installed 2020, inspection overdue", status: "Due soon" },
    ] },
    { id: "vn-electrical-panel-2", name: "Electrical Panel 2", category: "Technical", subtitle: "Technical · Guest house circuit", equipmentCount: 1, equipment: [
      { name: "Schneider Guest House Board", model: "Resi9 · Installed 2021", status: "Good" },
    ] },
  ]);
}

function villaNaxosLog(): MaintenanceLogEntry[] {
  return [
    { id: "vn-log-1", date: "5 Sep 2026", title: "Pool heat pump efficiency check", room: "Pool Area", supplier: "Cyclades Villa Services", notes: "Performance tested, minor refrigerant top-up performed." },
    { id: "vn-log-2", date: "22 Aug 2026", title: "Water filter replacement", room: "Kitchen", supplier: "Cyclades Villa Services", notes: "Under-sink cartridge replaced, water quality tested." },
    { id: "vn-log-3", date: "8 Aug 2026", title: "A/C service", room: "Living Room", supplier: "Cyclades Villa Services", notes: "Filters cleaned, refrigerant topped up, running within spec." },
    { id: "vn-log-4", date: "25 Jul 2026", title: "Electrical panel inspection", room: "Electrical Panel 1", supplier: "Cyclades Villa Services", notes: "Flagged for upgrade, temporary certification issued." },
    { id: "vn-log-5", date: "11 Jul 2026", title: "Booster pump service", room: "Pump Room", supplier: "Cyclades Villa Services", notes: "Pump tested, seals checked, pressure normal." },
    { id: "vn-log-6", date: "28 Jun 2026", title: "Guest house water heater check", room: "Guest House", supplier: "Cyclades Villa Services", notes: "Tank flushed, thermostat calibrated, no issues found." },
  ];
}

export type MaintenanceLogEntry = {
  id: string;
  date: string;
  title: string;
  room: string;
  supplier: string;
  notes: string;
};

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
    rooms: villaMykonosRooms(), photoUrl: "/properties/villa-mykonos.png",
    maintenanceLog: villaMykonosLog(),
  },
  {
    id: "villa-fanari", name: "Villa Fanari", area: "Mykonos", location: "Fanari, Mykonos",
    clientEmail: "client@residencescan.com", updated: "12 Sep 2026",
    rooms: villaFanariRooms(), photoUrl: "/properties/villa-fanari.png",
    maintenanceLog: villaFanariLog(),
  },
  {
    id: "villa-elia", name: "Villa Elia", area: "Mykonos", location: "Elia, Mykonos",
    clientEmail: "client@residencescan.com", updated: "18 Sep 2026",
    rooms: villaEliaRooms(), photoUrl: "/properties/villa-elia.png",
    maintenanceLog: villaEliaLog(),
  },
  {
    id: "penthouse-kolonaki", name: "Penthouse Kolonaki", area: "Athens", location: "Kolonaki, Athens",
    clientEmail: "client@residencescan.com", updated: "10 Sep 2026",
    rooms: penthouseKolonakiRooms(), photoUrl: "/properties/penthouse-kolonaki.png",
    maintenanceLog: penthouseKolonakiLog(),
  },
  {
    id: "riviera-house", name: "Riviera House", area: "Athens", location: "Glyfada, Athens",
    clientEmail: "client@residencescan.com", updated: "14 Sep 2026",
    rooms: rivieraHouseRooms(), photoUrl: "/properties/riviera-house.png",
    maintenanceLog: rivieraHouseLog(),
  },
  {
    id: "villa-paros", name: "Villa Paros", area: "Paros", location: "Naoussa, Paros",
    clientEmail: "nikos@example.com", updated: "15 Sep 2026",
    rooms: villaParosRooms(), photoUrl: "/properties/villa-paros.png",
    maintenanceLog: villaParosLog(),
  },
  {
    id: "villa-naxos", name: "Villa Naxos", area: "Naxos", location: "Agios Prokopios, Naxos",
    clientEmail: "nikos@example.com", updated: "9 Sep 2026",
    rooms: villaNaxosRooms(), photoUrl: "/properties/villa-naxos.png",
    maintenanceLog: villaNaxosLog(),
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
  { id: "kolonaki-home-care", initials: "KH", name: "Kolonaki Home Care", category: "General maintenance", phone: "+30 210 722 3344", email: "info@kolonakihomecare.gr", address: "Kolonaki, Athens", notes: "Full-service apartment maintenance — A/C, electrical and plumbing — for properties in central Athens." },
  { id: "athens-riviera-pools", initials: "AR", name: "Athens Riviera Pools", category: "Pool maintenance", phone: "+30 210 894 5566", email: "service@rivierapools.gr", address: "Glyfada, Athens", notes: "Pool servicing across the Athens Riviera coastline, from Glyfada to Vouliagmeni." },
  { id: "glyfada-technical-services", initials: "GT", name: "Glyfada Technical Services", category: "General maintenance", phone: "+30 210 894 7788", email: "office@glyfadatechnical.gr", address: "Glyfada, Athens", notes: "A/C, electrical and general maintenance for coastal Athens properties." },
  { id: "cyclades-villa-services", initials: "CV", name: "Cyclades Villa Services", category: "General maintenance", phone: "+30 694 333 4455", email: "info@cycladesvillaservices.gr", address: "Naoussa, Paros", notes: "Pool, garden and technical maintenance across Paros and Naxos." },
];

// Real link between a supplier and completed work: every maintenance log entry
// across every property whose supplier name matches this one.
export function supplierRecordCount(supplier: Supplier, properties: Property[]): number {
  return properties.reduce((s, p) => s + p.maintenanceLog.filter((m) => m.supplier === supplier.name).length, 0);
}
