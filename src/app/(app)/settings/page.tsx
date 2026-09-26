"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Plan, activeProperties } from "@/lib/data";
import { ShieldCheck, Wrench, Users } from "lucide-react";

function ChangePasswordForm() {
  const { changePassword } = useStore();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    setSubmitting(true);
    const result = await changePassword(password);
    setSubmitting(false);
    if (!result.ok) return setError(result.error ?? "Failed to change password.");

    setSuccess(true);
    setPassword("");
    setConfirm("");
    setTimeout(() => { setOpen(false); setSuccess(false); }, 1500);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[12.5px] font-semibold text-primary"
      >
        Change password
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-xs">
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg border border-line px-2.5 py-1.5 text-[12.5px]"
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="rounded-lg border border-line px-2.5 py-1.5 text-[12.5px]"
      />
      {error && <p className="text-[11.5px] text-[var(--attention-fg)]">{error}</p>}
      {success && <p className="text-[11.5px] text-primary">Password changed.</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={submitting}
          className="text-[12.5px] font-semibold text-primary disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null); setPassword(""); setConfirm(""); }}
          className="text-[12.5px] text-subtext"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const PLANS: Plan[] = ["Start", "Care", "Plus", "Pro"];

// Permissions copy per role, applied to whoever /api/staff actually returns —
// keeps this list from drifting out of sync with who can really sign in.
const ROLE_INFO: Record<string, { permissions: string; icon: typeof ShieldCheck }> = {
  admin: { permissions: "Full access — all clients, properties, suppliers and settings.", icon: ShieldCheck },
  support: { permissions: "Full access — all clients and properties, equipment and maintenance focus.", icon: Wrench },
};

type StaffMember = { email: string; name: string; role: string };

export default function SettingsPage() {
  const { session, logout, clients, properties, updateClient, notificationsEnabled, setNotificationsEnabled, getAccessToken } = useStore();
  const isAdmin = session?.role === "admin";
  const [staff, setStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/staff", { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { staff: StaffMember[] }) => setStaff(data.staff))
      .catch((err) => console.error("Failed to load staff accounts", err));
  }, [isAdmin, getAccessToken]);

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
        <p className="text-[11.5px] text-subtext mb-4">Role: <span className="text-fg font-semibold capitalize">{session?.role}</span></p>
        <ChangePasswordForm />
      </div>

      {isAdmin && (
        <>
          <div className="rounded-2xl border border-line p-5 mb-4">
            <p className="text-[10px] tracking-widest text-subtext font-semibold mb-3">STAFF ACCOUNTS & PERMISSIONS</p>
            <div className="flex flex-col gap-3">
              {staff.map((s) => {
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
                const count = activeProperties(properties).filter((p) => p.clientEmail === c.email).length;
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
