"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Grid2x2, Scan, Camera, Store, Users, Settings, Plus, ChevronRight, LogOut, Menu, X, Zap, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { dueSoonEquipment } from "@/lib/data";

const BASE_NAV = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/rooms", label: "Rooms", icon: Grid2x2 },
  { href: "/xray", label: "X-Ray", icon: Scan },
  { href: "/maintenance", label: "Maintenance", icon: Camera },
  { href: "/suppliers", label: "Suppliers", icon: Store },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout, properties, selectedPropertyId } = useStore();
  const [open, setOpen] = useState(false);

  const nav = [
    ...BASE_NAV,
    ...(session?.role === "admin" || session?.role === "support" ? [{ href: "/clients", label: "Clients", icon: Users }] : []),
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const maintenanceBadge = selectedProperty ? dueSoonEquipment(selectedProperty).length : 0;

  return (
    <>
      {!open && (
        <div className="no-print md:hidden fixed top-0 inset-x-0 h-14 z-30 bg-bg border-b border-line flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Zap size={14} className="text-primary" /></div>
            <p className="font-bold text-fg text-[13px] leading-none">ResidenceScan</p>
          </div>
          <button onClick={() => setOpen(true)} aria-label="Menu"><Menu size={20} className="text-fg" /></button>
        </div>
      )}

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      <div className={`no-print fixed md:static top-0 left-0 h-screen w-72 md:w-60 z-50 flex-shrink-0 flex flex-col border-r border-line bg-bg px-4 py-6 transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} md:sticky md:top-0`}>
        <div className="flex items-center justify-between mb-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Zap size={14} className="text-primary" /></div>
            <p className="font-bold text-fg text-[13px] leading-none">ResidenceScan</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} className="text-subtext" /></button>
        </div>

        <p className="text-[10px] font-semibold tracking-widest text-subtext px-2 mb-2">PROPERTY</p>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            const badge = href === "/maintenance" ? maintenanceBadge : 0;
            return (
              <Link
                key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] ${active ? "bg-primary/10 text-primary font-semibold" : "text-subtext hover:text-fg"}`}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="w-4.5 h-4.5 flex items-center justify-center rounded-full bg-[var(--attention-fg)] text-[9px] font-bold text-[#2A0E0A] px-1.5 py-0.5">{badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          {selectedProperty && (session?.role === "admin" || session?.role === "support") && (
            <Link href="/clients" onClick={() => setOpen(false)} className="rounded-2xl border border-line p-3">
              <p className="text-[9.5px] tracking-widest text-subtext font-semibold">VIEWING</p>
              <p className="text-[12.5px] font-semibold text-fg mt-0.5 truncate">{selectedProperty.name}</p>
              <p className="text-[11px] text-primary mt-1 flex items-center gap-1">Switch property <ChevronRight size={11} /></p>
            </Link>
          )}
          <div className="rounded-2xl border border-line p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Scan size={15} className="text-primary" />
            </div>
            <p className="text-[13px] font-semibold text-fg">Property Scan</p>
            <p className="text-[11px] text-subtext mt-2">Last updated</p>
            <p className="text-[11px] text-subtext">{selectedProperty?.updated ?? "—"}</p>
            <Link href="/xray" onClick={() => setOpen(false)} className="flex items-center gap-1 text-[12px] text-primary font-semibold mt-2.5">
              View X-Ray <ChevronRight size={12} />
            </Link>
          </div>
          {session?.role !== "client" && (
            <Link href="/clients?add=1" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-2.5 text-[12.5px] text-subtext hover:text-fg">
              <Plus size={13} /> Add property
            </Link>
          )}

          <div className="flex items-center gap-2.5 border-t border-line pt-3 mt-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-[10.5px] font-bold flex items-center justify-center flex-shrink-0">
              {session?.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-fg truncate">{session?.name}</p>
              <p className="text-[10px] text-subtext capitalize">{session?.role}</p>
            </div>
            <button onClick={() => { logout(); router.replace("/login"); }} title="Sign out">
              <LogOut size={14} className="text-subtext" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
