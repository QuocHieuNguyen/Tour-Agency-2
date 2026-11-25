import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, ChevronDown, DollarSign, Download, FileCode2, FileText, Printer, Route, Save, X } from "lucide-react";
import type { AccOption, ItineraryDay, PackageStatus, TourPackage } from "../types";
import { packageStore } from "../lib/packageStore";
import { routeOf, syncOptions } from "../lib/packageLogic";
import { exportPackageMarkdown } from "../lib/exportMarkdown";
import PackageDocument from "./PackageDocument";
import PackageBuilder, { type BuilderTab } from "./PackageBuilder";

const TABS: { id: BuilderTab; label: string; icon: typeof Route; color: string }[] = [
  { id: "itin", label: "ITINERARIES", icon: Route, color: "bg-brand" },
  { id: "acc", label: "ACCOMMODATIONS", icon: Building2, color: "bg-amber-600" },
  { id: "price", label: "PRICES", icon: DollarSign, color: "bg-emerald-600" },
];
const DRAWER_TITLE: Record<BuilderTab, string> = {
  itin: "1 · Itineraries", acc: "2 · Accommodations", price: "3 · Get Prices",
};

export default function TourPackageEditor({ pkg, onClose }: { pkg: TourPackage; onClose: () => void }) {
  const [draft, setDraft] = useState<TourPackage>(pkg);
  const [base, setBase] = useState<TourPackage>(pkg);
  const [tab, setTab] = useState<BuilderTab | null>(pkg.days.length === 0 ? "itin" : null);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  const set = <K extends keyof TourPackage>(key: K, value: TourPackage[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // đổi ngày → tự đồng bộ số đêm + lộ trình
  const setDays = (days: ItineraryDay[]) =>
    setDraft((d) => {
      const oldRoute = routeOf(d.days);
      return {
        ...d, days, options: syncOptions(days, d.options),
        subtitle: !d.subtitle || d.subtitle === oldRoute ? routeOf(days) : d.subtitle,
      };
    });
  const setOptions = (options: AccOption[]) => setDraft((d) => ({ ...d, options: syncOptions(d.days, options) }));

  const save = () => {
    const saved = packageStore.update(draft);
    setBase(saved);
    setDraft(saved);
  };
  const requestClose = () => {
    if (dirty && !window.confirm("Có thay đổi chưa lưu. Đóng và bỏ thay đổi?")) return;
    onClose();
  };

  useEffect(() => { rootRef.current?.focus(); }, []);

  const exportWord = async () => {
    setExportOpen(false);
    setBusy(true);
    try {
      const { exportPackageDocx } = await import("../lib/exportDocx");
      await exportPackageDocx(draft);
    } catch (e) {
      window.alert(`Không xuất được Word: ${e instanceof Error ? e.message : "lỗi không rõ"}`);
    } finally {
      setBusy(false);
    }
  };
  const exportMd = () => {
    setExportOpen(false);
    exportPackageMarkdown(draft);
  };
  const exportPdf = () => {
    setExportOpen(false);
    const prev = document.title;
    document.title = `${draft.code.replace("/", "-")} ${draft.title}`; // tên file PDF mặc định
    window.print(); // CSS @media print chỉ in #package-doc; chọn "Save as PDF"
    document.title = prev;
  };

  return createPortal(
    <div
      ref={rootRef}
      id="package-overlay"
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); requestClose(); } }}
      className="fixed inset-0 z-[60] overflow-y-auto bg-gray-200 pb-24 outline-none"
    >
      <button onClick={requestClose} aria-label="Đóng" className="no-print fixed left-3 top-3 z-10 rounded-full bg-white p-2 shadow hover:bg-gray-50"><X size={18} /></button>

      <div className={`transition-[padding] ${tab ? "lg:pl-[480px]" : ""}`}>
        <PackageDocument pkg={draft} set={set} setDays={setDays} />
      </div>

      {/* drawer dữ liệu có sẵn */}
      {tab && (
        <aside className="no-print fixed bottom-14 left-0 top-0 z-20 flex w-full max-w-[480px] flex-col border-r border-line bg-white shadow-xl">
          <div className="flex items-center border-b border-line px-4 py-3">
            <h3 className="font-bold">{DRAWER_TITLE[tab]}</h3>
            <button onClick={() => setTab(null)} aria-label="Đóng bảng" className="ml-auto rounded p-1 hover:bg-panel"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4"><PackageBuilder tab={tab} pkg={draft} set={set} setDays={setDays} setOptions={setOptions} /></div>
        </aside>
      )}

      {/* thanh dưới */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center gap-2 border-t border-line bg-gray-100 px-3 py-2">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button key={id} onClick={() => setTab(tab === id ? null : id)} aria-pressed={tab === id}
            className={`flex items-center gap-1.5 rounded px-3 py-2 text-[11px] font-bold text-white ${color} ${tab === id ? "ring-2 ring-black/30" : "opacity-90 hover:opacity-100"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[12px] text-gray-600">Valid
            <input type="date" value={draft.validDate} onChange={(e) => set("validDate", e.target.value)} className="rounded border border-gray-300 px-1.5 py-1" />
          </label>
          <select aria-label="Status" value={draft.status} onChange={(e) => set("status", e.target.value as PackageStatus)} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-[12px] font-semibold">
            <option>Unverified</option><option>Verified</option><option>Revised</option>
          </select>
          <div className="relative">
            <button onClick={() => setExportOpen((o) => !o)} disabled={busy} className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-2 text-[11px] font-bold hover:bg-gray-50 disabled:opacity-60">
              <Download size={14} /> {busy ? "ĐANG XUẤT…" : "EXPORT"} <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <div className="absolute bottom-full right-0 mb-1 w-48 overflow-hidden rounded border border-line bg-white shadow-lg">
                <button onClick={exportWord} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-panel"><FileText size={14} /> Word (.docx)</button>
                <button onClick={exportMd} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-panel"><FileCode2 size={14} /> Markdown (.md)</button>
                <button onClick={exportPdf} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-panel"><Printer size={14} /> PDF (in / lưu PDF)</button>
              </div>
            )}
          </div>
          <button onClick={save} disabled={!dirty} className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Save size={14} /> {dirty ? "SAVE" : "SAVED"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
