"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, ShieldCheck, MapPin } from "lucide-react";
import { Property } from "@/lib/data";

export default function PropertyPicker({ properties, onSelect }: { properties: Property[]; onSelect: (id: string) => void }) {
  const [index, setIndex] = useState(0);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, Property[]>();
    for (const p of properties) {
      if (!map.has(p.area)) map.set(p.area, []);
      map.get(p.area)!.push(p);
    }
    return Array.from(map.entries()).map(([area, props]) => ({ area, props }));
  }, [properties]);

  if (properties.length === 0) {
    return <p className="text-[12.5px] text-subtext py-6">No properties yet.</p>;
  }

  if (properties.length <= 3) {
    const p = properties[index];
    return (
      <div>
        <div className="rounded-2xl overflow-hidden border border-line relative h-64 flex flex-col justify-between p-4"
          style={p.photoUrl
            ? { backgroundImage: `linear-gradient(to top, rgba(7,16,23,0.85), rgba(7,16,23,0.15)), url(${p.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(135deg, #14242E, #0C1821)" }}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
              <ShieldCheck size={12} className="text-primary" /> Professionally recorded
            </span>
            <span className="text-[11px] bg-black/40 px-2.5 py-1 rounded-full">Updated {p.updated}</span>
          </div>
          <div>
            <p className="text-[12px] text-subtext">{p.location}</p>
            <p className="text-xl font-bold text-fg mt-0.5">{p.name}</p>
            <button onClick={() => onSelect(p.id)} className="flex items-center gap-1.5 mt-2 bg-primary text-primary-fg text-[11.5px] font-semibold px-3 py-1.5 rounded-full">
              <ImageIcon size={13} /> View property <ChevronRight size={12} />
            </button>
          </div>

          {properties.length > 1 && (
            <>
              <button onClick={() => setIndex((index - 1 + properties.length) % properties.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setIndex((index + 1) % properties.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                <ChevronRight size={15} />
              </button>
            </>
          )}
        </div>
        {properties.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2.5">
            {properties.map((_, i) => (
              <span key={i} className={`h-1 rounded-full ${i === index ? "w-4 bg-primary" : "w-1 bg-line"}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (expandedArea) {
    const group = groups.find((g) => g.area === expandedArea)!;
    return (
      <div>
        <button onClick={() => setExpandedArea(null)} className="flex items-center gap-1 text-[12.5px] text-subtext mb-3">
          <ChevronLeft size={14} /> All areas
        </button>
        <div className="flex flex-col gap-2.5">
          {group.props.map((p) => (
            <button key={p.id} onClick={() => onSelect(p.id)} className="w-full flex items-center gap-3 rounded-2xl border border-line p-4 text-left hover:border-primary/40">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><MapPin size={16} className="text-primary" /></div>
              <div className="flex-1"><p className="text-[13.5px] font-semibold text-fg">{p.name}</p><p className="text-[11.5px] text-subtext">{p.location}</p></div>
              <ChevronRight size={14} className="text-subtext" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {groups.map(({ area, props }) => (
        <button key={area} onClick={() => setExpandedArea(area)} className="w-full flex items-center gap-3 rounded-2xl border border-line p-4 text-left hover:border-primary/40">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><MapPin size={16} className="text-primary" /></div>
          <div className="flex-1"><p className="text-[13.5px] font-semibold text-fg">{area}</p><p className="text-[11.5px] text-subtext">{props.length} {props.length === 1 ? "property" : "properties"}</p></div>
          <ChevronRight size={14} className="text-subtext" />
        </button>
      ))}
    </div>
  );
}
