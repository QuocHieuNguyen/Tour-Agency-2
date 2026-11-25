import {
  Building2, BookOpen, Users, UserSquare2, Ticket, FileText, Network, LineChart,
  GraduationCap, Factory, MapPin, Package, TriangleAlert, LayoutDashboard, Hotel, type LucideIcon,
} from "lucide-react";

interface Item { id: string; label: string; icon: LucideIcon; enabled?: boolean }

const ITEMS: Item[] = [
  { id: "company", label: "Company Management", icon: Building2 },
  { id: "booking", label: "Booking Management", icon: BookOpen },
  { id: "leads", label: "Leads management", icon: Users, enabled: true },
  { id: "agent-leads", label: "Agent Lead Management", icon: FileText },
  { id: "ticket", label: "Ticket", icon: Ticket },
  { id: "b2b", label: "B2B Agent Management", icon: UserSquare2 },
  { id: "bni", label: "BNI Members", icon: Network },
  { id: "report", label: "Báo cáo B2B Agent", icon: LineChart },
  { id: "academy", label: "Academy", icon: GraduationCap },
  { id: "vendors", label: "Vendors Management", icon: Factory },
  { id: "itinerary", label: "Itinerary Management", icon: MapPin, enabled: true },
  { id: "accommodation", label: "Accommodation Management", icon: Hotel, enabled: true },
  { id: "packages", label: "Tour Packages", icon: Package },
  { id: "violations", label: "Vi phạm nhân viên", icon: TriangleAlert },
  { id: "dashboard", label: "System Dashboard", icon: LayoutDashboard },
];

export default function Sidebar({ active, onNavigate }: { active: string; onNavigate: (id: string) => void }) {
  return (
    <aside className="hidden w-[250px] shrink-0 flex-col border-r border-line bg-white md:flex">
      <div className="border-b border-line px-5 py-4">
        <div className="text-xl font-bold tracking-tight text-emerald-700">Indochina</div>
        <div className="text-[10px] font-semibold tracking-[0.25em] text-gray-600">TRAVEL EXPERT</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main">
        <p className="px-2 pb-2 text-[11px] font-semibold text-gray-400">MY COMPANY</p>
        {ITEMS.map(({ id, label, icon: Icon, enabled }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              disabled={!enabled}
              onClick={() => enabled && onNavigate(id)}
              aria-current={isActive ? "page" : undefined}
              title={enabled ? undefined : "Chưa build"}
              className={[
                "mb-0.5 flex w-full items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-left text-[13px] font-medium",
                isActive ? "border-brand bg-panel text-ink" : "border-transparent text-gray-600",
                enabled ? "hover:bg-panel" : "cursor-not-allowed opacity-60",
              ].join(" ")}
            >
              <Icon size={17} className={isActive ? "text-brand" : "text-gray-400"} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
