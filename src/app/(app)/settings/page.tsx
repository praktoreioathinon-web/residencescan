"use client";

import { useStore } from "@/lib/store";
import { ACCOUNTS, Plan } from "@/lib/data";
import { ShieldCheck, Wrench, Users } from "lucide-react";

const PLANS: Plan[] = ["Start", "Care", "Plus", "Pro"];

// Permissions copy per role, applied to whoever is actually in ACCOUNTS —
// keeps this list from drifting out of sync with the real accounts.
const ROLE_INFO: Record<string, { permissions: string; icon: typeof ShieldCheck }> = {
  admin: { permissions: "Full access — all clients, properties, suppliers and settings.", icon: ShieldCheck },
  support: { permissions: "Full access — all clients and properties, equipment and maintenance focus.", icon: Wrench },
};

const STAFF = ACCOUNTS.filter((a) => a.role !== "client");

export default function SettingsPage() {
  const { session, logout, clients, properties, updateClient, notificationsEnabled, setNotificationsEnabled } = useStore();
  const isAdmin = session?.role === "admin";

  return (
    <div className="px-8 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-fg mb-5">Settings</h1>

      <div className="rounded-2xl border border-line p-5 mb-4">
        <p className="text-[10px] tracking-widest text-subtext font-semibold mb-3">ACCOUNT</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-primary/20 text-primary text-[13px] font-bold flex items-center justify-center">
            {session?.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-fg">{session?.name}</p>
            <p className="text-[12px] text-subtext">{session?.email}</p>
          </div>
        </div>
        <p className="text-[11.5px] text-subtext">Role: <span className="text-fg font-semibold capitalize">{session?.role}</span></p>
      </div>

      {isAdmin && (
        <>
          <div className="rounded-2xl border border-line p-5 mb-4">
            <p className="text-[10px] tracking-widest text-subtext font-semibold mb-3">STAFF ACCOUNTS & PERMISSIONS</p>
            <div className="flex flex-col gap-3">
              {STAFF.map((s) => {
                const info = ROLE_INFO[s.role];
                return (
                  <div key={s.email} className="flex items-start gap-3 border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><info.icon size={14} className="text-primary" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-fg">{s.name}</p>
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase">{s.role}</span>
                      </div>
                      <p className="text-[11px] text-subtext">{s.email}</p>
                      <p className="text-[11.5px] text-subtext mt-1">{info.permissions}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-line p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={13} className="text-primary" />
              <p className="text-[10px] tracking-widest text-subtext font-semibold">CLIENT ACCOUNTS & SUBSCRIPTIONS</p>
            </div>
            <div className="flex flex-col gap-3">
              {clients.map((c) => {
                const count = properties.filter((p) => p.clientEmail === c.email).length;
                return (
                  <div key={c.email} className="flex items-center gap-3 border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-fg truncate">{c.name}</p>
                      <p className="text-[11px] text-subtext truncate">{c.email} · {count} {count === 1 ? "property" : "properties"} · Permissions: own properties only</p>
                    </div>
                    <select
                      value={c.plan}
                      onChange={(e) => updateClient(c.email, { plan: e.target.value as Plan })}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] flex-shrink-0"
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="rounded-2xl border border-line p-5 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-widest text-subtext font-semibold mb-2">NOTIFICATIONS</p>
            <p className="text-[12.5px] text-subtext">Show attention alerts in the notification bell.</p>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            aria-pressed={notificationsEnabled}
            className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${notificationsEnabled ? "bg-primary" : "bg-line"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notificationsEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <button onClick={logout} className="text-[12.5px] text-[var(--attention-fg)] font-semibold">Sign out</button>
    </div>
  );
}
