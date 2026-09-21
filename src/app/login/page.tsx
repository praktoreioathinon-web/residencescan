"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { session, ready, login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && session) router.replace("/");
  }, [ready, session, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!login(email, password)) {
      setError("Invalid email or password.");
      return;
    }
    router.replace("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Zap size={18} className="text-primary" /></div>
          <div>
            <p className="font-bold text-fg text-[15px] leading-none">ResidenceScan</p>
            <p className="text-[9px] tracking-wider text-subtext mt-1">YOUR PROPERTY. FULLY KNOWN.</p>
          </div>
        </div>

        <h1 className="text-xl font-bold text-fg mb-1">Sign in</h1>
        <p className="text-[12.5px] text-subtext mb-5">Access your property records.</p>

        <form onSubmit={submit} className="flex flex-col gap-2.5">
          <input
            type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-line px-3.5 py-2.5 text-[13.5px] outline-none focus:border-primary/50"
          />
          <input
            type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-line px-3.5 py-2.5 text-[13.5px] outline-none focus:border-primary/50"
          />
          {error && <p className="text-[12px] text-[#ED917C]">{error}</p>}
          <button type="submit" className="mt-2 bg-primary text-primary-fg text-[13.5px] font-semibold rounded-full py-2.5">
            Sign in
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-line text-[11.5px] text-subtext leading-relaxed">
          <p className="font-semibold text-fg mb-1.5">Demo accounts</p>
          <p>admin@residencescan.com / admin123</p>
          <p>client@residencescan.com / client123</p>
          <p>support@residencescan.com / support123</p>
        </div>
      </div>
    </div>
  );
}
