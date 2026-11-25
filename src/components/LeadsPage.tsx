import { useMemo, useState } from "react";
import { BarChart3, Plus, ChevronDown, ChevronUp, Filter, RefreshCw, Search, Phone, AlertTriangle, Package } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FOLLOW_LEVELS, type FollowLevel, type Lead } from "../types";
import { usePackages } from "../lib/packageStore";
import { daysFromToday, elapsed, fmtDate, fmtDateTime } from "../lib/format";

const RANGES = [
  { id: "all", label: "All", days: Infinity },
  { id: "24h", label: "24H", days: 1 },
  { id: "week", label: "This Week", days: 7 },
  { id: "month", label: "This Month", days: 30 },
  { id: "3m", label: "Last 3 Months", days: 90 },
] as const;

const LEVEL_COLOR: Record<FollowLevel, string> = {
  Request: "#64748b", Quote: "#3b82f6", Revise: "#6366f1",
  "Deal giá": "#0ea5e9", Booked: "#16a34a", Close: "#6b7280",
};

interface Props {
  leads: Lead[];
  loading: boolean;
  onRefresh: () => void;
  onOpen: (lead: Lead) => void;
  onNew: () => void;
}

export default function LeadsPage({ leads, loading, onRefresh, onOpen, onNew }: Props) {
  const allPackages = usePackages();
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("all");
  const [level, setLevel] = useState<FollowLevel | "all">("all");
  const [query, setQuery] = useState("");
  const [showStats, setShowStats] = useState(false);

  const inRange = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)!.days;
    return leads.filter((l) => days === Infinity || Date.now() - new Date(l.updatedAt).getTime() <= days * 86_400_000);
  }, [leads, range]);

  const counts = useMemo(
    () => FOLLOW_LEVELS.map((name) => ({ name, value: inRange.filter((l) => l.followLevel === name).length })),
    [inRange],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inRange
      .filter((l) => level === "all" || l.followLevel === level)
      .filter((l) => !q || [l.code, l.customer, l.phone, l.email, l.details].some((v) => v.toLowerCase().includes(q)));
  }, [inRange, level, query]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      {/* time range tabs */}
      <div className="flex flex-wrap gap-1 border-b border-line px-5 pt-3">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`border-b-2 px-3 py-2 text-[13px] font-semibold ${range === r.id ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-ink"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-5">
        {/* stats */}
        <section className="rounded-lg border border-line">
          <button onClick={() => setShowStats((s) => !s)} className="flex w-full items-center gap-2 px-4 py-3 font-semibold">
            <BarChart3 size={16} className="text-brand" /> Stats Summary
            {showStats ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
          </button>
          {showStats && (
            <div className="h-56 px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={counts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Leads" fill="#2f4fd8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* follow-level pills */}
        <div className="flex flex-wrap gap-2">
          <Pill active={level === "all"} onClick={() => setLevel("all")} label="ALL" value={inRange.length} color="#111827" />
          {counts.map((c) => (
            <Pill key={c.name} active={level === c.name} onClick={() => setLevel(c.name)} label={c.name.toUpperCase()} value={c.value} color={LEVEL_COLOR[c.name]} />
          ))}
        </div>

        {/* list */}
        <section className="rounded-lg border border-line">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div>
              <h2 className="font-semibold">Lead Management</h2>
              <p className="text-gray-500">{rows.length} / {leads.length} Lead</p>
            </div>
            <div className="relative ml-auto">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã, khách, SĐT, nội dung…" className="w-64 rounded border border-line py-2 pl-8 pr-2 outline-none focus:border-brand" />
            </div>
            <button onClick={onRefresh} aria-label="Refresh" className="rounded border border-line p-2 hover:bg-panel">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onNew} className="flex items-center gap-1.5 rounded bg-brand px-3 py-2 text-[12px] font-bold text-white hover:bg-brand-dark">
              <Plus size={14} /> NEW LEAD
            </button>
            <button className="flex items-center gap-1.5 rounded border border-line px-3 py-2 text-[12px] font-semibold hover:bg-panel">
              <Filter size={14} /> FILTER
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-2 py-2.5">Lead code</th>
                  <th className="px-2 py-2.5">Details</th>
                  <th className="px-2 py-2.5">Phone/Email</th>
                  <th className="px-2 py-2.5">Travel date</th>
                  <th className="px-2 py-2.5">Tour packages</th>
                  <th className="px-2 py-2.5">Follow level</th>
                  <th className="px-2 py-2.5">Sales / Care</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l, i) => {
                  const d = daysFromToday(l.travelDate);
                  return (
                    <tr
                      key={l.id}
                      tabIndex={0}
                      onClick={() => onOpen(l)}
                      onKeyDown={(e) => e.key === "Enter" && onOpen(l)}
                      className="cursor-pointer border-b border-line align-top hover:bg-blue-50/50 focus:bg-blue-50/50 focus:outline-none"
                    >
                      <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-2 py-3">
                        <span className="rounded border border-brand px-2 py-0.5 font-semibold text-brand">{l.code}</span>
                        <div className="mt-1.5 text-gray-500">{l.paxs} pax · {l.campaign || "No Campaign"}</div>
                        <div className="mt-1 text-[11px] text-gray-400">{l.createdBy} · {fmtDateTime(l.createdAt)} · {elapsed(l.createdAt)}</div>
                      </td>
                      <td className="max-w-[220px] px-2 py-3">
                        <div className="mb-1 font-medium">{l.customer || "---"}</div>
                        <div className="whitespace-pre-line rounded bg-gray-100 px-2 py-1.5 text-gray-700">{l.details.replace(/\n/g, "  ")}</div>
                      </td>
                      <td className="px-2 py-3 text-gray-600">
                        <div>{l.phone || "---"}</div>
                        <div>{l.email || "---"}</div>
                      </td>
                      <td className="px-2 py-3">
                        {l.travelDate ? (
                          <div className="inline-block rounded border border-line px-3 py-1.5 text-center">
                            <div className={`font-semibold ${d !== null && d < 0 ? "text-red-600" : "text-ink"}`}>{fmtDate(l.travelDate)}</div>
                            <div className="text-[11px] italic text-gray-500">({d} ngày)</div>
                          </div>
                        ) : "---"}
                      </td>
                      <td className="px-2 py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[12px] font-semibold text-emerald-700">
                          <Package size={12} /> {allPackages.filter((p) => p.leadId === l.id).length} Tour Packages
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="rounded px-2 py-1 text-[12px] font-semibold text-white" style={{ background: LEVEL_COLOR[l.followLevel] }}>{l.followLevel}</span>
                        <div className="mt-1.5 text-[12px] text-gray-500">CSKH: {l.cskhRealDemand || "---"}</div>
                        <div className="text-[12px] text-gray-500">SALE: {l.saleRealDemand || "---"}</div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="font-semibold">{l.sales || "---"}</div>
                        <div className="flex items-center gap-1 text-gray-500">
                          {l.customerCare || <AlertTriangle size={13} className="text-amber-500" aria-label="Chưa có CSKH" />}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400"><Phone size={11} /> {l.called ? "Called" : "Not called"}</div>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">Không có lead nào khớp bộ lọc.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Pill({ label, value, color, active, onClick }: { label: string; value: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] font-bold ${active ? "border-brand ring-2 ring-brand/20" : "border-line hover:bg-panel"}`}
    >
      <span className="size-2.5 rounded-sm" style={{ background: color }} />
      {label}
      <span className="font-semibold text-gray-600">{value}</span>
    </button>
  );
}
