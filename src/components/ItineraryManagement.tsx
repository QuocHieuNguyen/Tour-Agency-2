import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { DayTourType, ItineraryDay } from "../types";
import { DESTINATIONS } from "../data/library";
import { itineraryStore } from "../lib/libraryStore";
import { usd } from "../lib/packageLogic";
import FormModal, { Field } from "./FormModal";

const TYPES: DayTourType[] = ["Private Transfer", "Private Tour (PVT)", "Group Tour (SIC)"];
const BADGE: Record<DayTourType, string> = {
  "Private Transfer": "bg-emerald-600", "Private Tour (PVT)": "bg-indigo-600", "Group Tour (SIC)": "bg-green-600",
};

const blank = (): ItineraryDay => ({
  id: crypto.randomUUID(), title: "", tourType: "Private Transfer", overnight: "", meals: "", inclusions: [],
  adultPrice: 0, pickup: "", ends: "", description: "", suggestion: "",
});

export default function ItineraryManagement() {
  const items = itineraryStore.useAll();
  const [q, setQ] = useState("");
  const [type, setType] = useState<DayTourType | "">("");
  const [editing, setEditing] = useState<ItineraryDay | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((t) => (!type || t.tourType === type) && (!s || t.title.toLowerCase().includes(s)));
  }, [items, q, type]);

  const remove = (t: ItineraryDay) => {
    if (window.confirm(`Xoá itinerary "${t.title}"?\nCác tour package đã dùng nó vẫn giữ bản sao, không bị ảnh hưởng.`)) itineraryStore.remove(t.id);
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold">Itinerary Management</h2>
          <p className="text-gray-500">Thư viện lịch trình dùng để điền nhanh vào tour package · {rows.length} / {items.length} mục</p>
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên…" className="w-64 rounded border border-line py-2 pl-8 pr-2 outline-none focus:border-brand" />
        </div>
        <select aria-label="Lọc loại tour" value={type} onChange={(e) => setType(e.target.value as DayTourType | "")} className="rounded border border-line px-2 py-2">
          <option value="">Tất cả loại</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button onClick={() => setEditing(blank())} className="flex items-center gap-1.5 rounded bg-brand px-3 py-2 text-[12px] font-bold text-white hover:bg-brand-dark"><Plus size={14} /> NEW ITINERARY</button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[900px] text-left">
          <thead className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <tr className="border-b border-line"><th className="px-4 py-2.5">#</th><th className="px-2">Title</th><th className="px-2">Type</th><th className="px-2">Overnight</th><th className="px-2">Meals</th><th className="px-2">Inclusions</th><th className="px-2 text-right">USD / pax</th><th className="px-2" /></tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={t.id} className="border-b border-line align-top last:border-0 hover:bg-blue-50/40">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="max-w-[360px] px-2 py-3">
                  <button onClick={() => setEditing(t)} className="text-left font-semibold text-brand hover:underline">{t.title}</button>
                  {t.description && <div className="mt-1 line-clamp-2 text-[12px] text-gray-500">{t.description}</div>}
                </td>
                <td className="px-2 py-3"><span className={`rounded px-2 py-1 text-[11px] font-semibold text-white ${BADGE[t.tourType]}`}>{t.tourType}</span></td>
                <td className="px-2 py-3">{t.overnight || "—"}</td>
                <td className="px-2 py-3">{t.meals || "—"}</td>
                <td className="px-2 py-3 text-gray-600">{t.inclusions.length} mục</td>
                <td className="px-2 py-3 text-right font-semibold">{usd(t.adultPrice)}</td>
                <td className="whitespace-nowrap px-2 py-3 text-right">
                  <button aria-label="Sửa" onClick={() => setEditing(t)} className="rounded p-1.5 text-gray-500 hover:bg-panel"><Pencil size={15} /></button>
                  <button aria-label="Xoá" onClick={() => remove(t)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">Không có itinerary nào.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <ItineraryForm key={editing.id} initial={editing} isNew={!items.some((x) => x.id === editing.id)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ItineraryForm({ initial, isNew, onClose }: { initial: ItineraryDay; isNew: boolean; onClose: () => void }) {
  const [d, setD] = useState(initial);
  const [incl, setIncl] = useState(initial.inclusions.join("\n"));
  const [err, setErr] = useState("");
  const set = <K extends keyof ItineraryDay>(k: K, v: ItineraryDay[K]) => setD((x) => ({ ...x, [k]: v }));

  const submit = () => {
    if (!d.title.trim()) return setErr("Vui lòng nhập tiêu đề");
    itineraryStore.upsert({ ...d, title: d.title.trim(), inclusions: incl.split("\n").map((x) => x.trim()).filter(Boolean), adultPrice: Number(d.adultPrice) || 0 });
    onClose();
  };

  return (
    <FormModal title={isNew ? "Thêm itinerary" : "Sửa itinerary"} onSubmit={submit} onClose={onClose} wide>
      <Field label="Tiêu đề" required error={err}><input autoFocus className="field" value={d.title} onChange={(e) => { set("title", e.target.value); setErr(""); }} placeholder="VD: HANOI - NINH BINH - HOA LU - TRANG AN - HANOI (L) - SIC" /></Field>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Loại"><select className="field" value={d.tourType} onChange={(e) => set("tourType", e.target.value as DayTourType)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Overnight"><select className="field" value={d.overnight} onChange={(e) => set("overnight", e.target.value)}><option value="">Departure (không ngủ)</option>{DESTINATIONS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Meals (B / L / D)"><input className="field" value={d.meals} onChange={(e) => set("meals", e.target.value.toUpperCase())} placeholder="L" /></Field>
        <Field label="Giá USD / người lớn"><input type="number" min={0} step="0.5" className="field" value={d.adultPrice} onChange={(e) => set("adultPrice", Number(e.target.value))} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pickup"><input className="field" value={d.pickup} onChange={(e) => set("pickup", e.target.value)} placeholder="07:30" /></Field>
        <Field label="Ends"><input className="field" value={d.ends} onChange={(e) => set("ends", e.target.value)} placeholder="17:30" /></Field>
      </div>
      <Field label="Mô tả chi tiết (hiện ở DETAILED ITINERARY, mỗi dòng là 1 đoạn)"><textarea rows={6} className="field" value={d.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <Field label="Suggestion (gợi ý tự khám phá, nếu có)"><textarea rows={2} className="field" value={d.suggestion} onChange={(e) => set("suggestion", e.target.value)} /></Field>
      <Field label="Inclusions (mỗi dòng 1 mục)"><textarea rows={4} className="field" value={incl} onChange={(e) => setIncl(e.target.value)} placeholder={"Shuttle bus\nLocal guide\nEntrance fees"} /></Field>
    </FormModal>
  );
}
