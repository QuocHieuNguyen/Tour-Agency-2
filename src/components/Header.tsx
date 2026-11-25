import { Bell, Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center gap-4 bg-navy px-5 py-3 text-white">
      <Menu size={20} className="md:hidden" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold">TMS – The Smart Way to Run Your Travel Business</h1>
        <p className="truncate text-xs text-white/70">Design, quote, sell, operate &amp; monitor tours – all in one platform</p>
      </div>
      <button aria-label="Notifications" className="relative rounded-full bg-white/10 p-2 hover:bg-white/20">
        <Bell size={18} />
      </button>
      <div className="grid size-9 place-items-center rounded-full bg-white/20 text-sm font-semibold">A</div>
    </header>
  );
}
