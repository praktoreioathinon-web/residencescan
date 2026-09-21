"use client";

import { useState } from "react";
import { ArrowLeft, ImageIcon, Droplet, Zap, Waves, Fan, ShieldCheck, Wifi, Lightbulb } from "lucide-react";
import Link from "next/link";
import { xrayCategories, xrayRooms } from "@/lib/data";
import { useStore } from "@/lib/store";

const CAT_ICONS: Record<string, any> = { Water: Droplet, Electrical: Zap, Pool: Waves, HVAC: Fan, Security: ShieldCheck, Network: Wifi, Lighting: Lightbulb };

export default function XRayPage() {
  const [active, setActive] = useState("Water");
  const { session, properties, selectedClientEmail, selectedPropertyId } = useStore();
  const clientEmail = session?.role === "client" ? session.email : selectedClientEmail;
  const property = properties.find((p) => p.clientEmail === clientEmail && p.id === selectedPropertyId)
    ?? properties.find((p) => p.clientEmail === clientEmail);

  if (!property) {
    return (
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-fg mb-1">X-Ray</h1>
        <p className="text-[12.5px] text-subtext mb-5">Choose a property first from the Rooms tab.</p>
        <Link href="/rooms" className="inline-block bg-primary text-primary-fg text-[12.5px] font-semibold px-4 py-2 rounded-full">Go to Rooms</Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full border border-line flex items-center justify-center"><ArrowLeft size={15} /></Link>
          <div>
            <p className="text-[10px] tracking-widest text-subtext font-semibold">DIGITAL PROPERTY RECORD</p>
            <h1 className="text-2xl font-bold text-fg">{property.name} X-Ray</h1>
          </div>
        </div>
        <button className="flex items-center gap-1.5 border border-line text-[12.5px] font-semibold px-4 py-2 rounded-full text-fg">
          <ImageIcon size={14} /> View real photo
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {xrayCategories.map((c) => {
          const Icon = CAT_ICONS[c];
          const isActive = active === c;
          return (
            <button key={c} onClick={() => setActive(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border ${isActive ? "bg-primary/15 border-primary/40 text-primary" : "border-line text-subtext"}`}>
              <Icon size={13} /> {c}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-2xl border border-line relative overflow-hidden"
        style={{
          height: 420,
          backgroundImage: "linear-gradient(#FFFFFF08 1px, transparent 1px), linear-gradient(90deg, #FFFFFF08 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundColor: "#050C11",
        }}
      >
        <svg viewBox="0 0 800 560" className="w-full h-full">
          {xrayRooms.map((r) => {
            const pts = r.points.split(" ").map((p) => p.split(",").map(Number));
            const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
            const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
            return (
              <g key={r.name}>
                <polygon points={r.points} fill="#55D6C70A" stroke="#55D6C766" strokeWidth={1.5} />
                <text x={cx} y={cy} textAnchor="middle" fontSize={13} fill="#F4F8FA99" fontWeight={600}>{r.name}</text>
                <circle cx={pts[1][0] - 12} cy={pts[0][1] + 8} r={11} fill="#55D6C7" />
                <text x={pts[1][0] - 12} y={pts[0][1] + 12} textAnchor="middle" fontSize={10} fontWeight={700} fill="#04100F">{r.count}</text>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[11px] text-subtext">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6ED3AA]" /> Online</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ED917C]" /> Attention</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Equipment record</span>
        </div>
      </div>
    </div>
  );
}
