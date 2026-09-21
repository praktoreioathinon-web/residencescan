import { Search, Bell, Zap } from "lucide-react";

export default function TopBar() {
  return (
    <div className="flex items-center gap-4 px-8 py-4 border-b border-line">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Zap size={16} className="text-primary" />
      </div>
      <div>
        <p className="text-[14px] font-bold text-fg leading-none">ResidenceScan</p>
        <p className="text-[9px] tracking-wider text-subtext mt-1">YOUR PROPERTY. FULLY KNOWN.</p>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
          <input
            placeholder="Search rooms, equipment, documents..."
            className="w-full bg-card border border-line rounded-lg pl-9 pr-14 py-2 text-[12.5px] outline-none placeholder:text-subtext"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-subtext border border-line rounded px-1.5 py-0.5">⌘K</span>
        </div>
      </div>

      <div className="relative w-8 h-8 rounded-full border border-line flex items-center justify-center">
        <Bell size={14} className="text-subtext" />
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#ED917C]" />
      </div>
      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">SC</div>
    </div>
  );
}
