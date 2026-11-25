import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { HotelTemplate } from "../data/library";
import { DESTINATIONS } from "../data/library";
import { hotelStore } from "../lib/libraryStore";
import { usd } from "../lib/packageLogic";
import FormModal, { Field } from "./FormModal";

const blank = (): HotelTemplate => ({
  id: crypto.randomUUID(), name: "", stars: 4, address: "", destination: "Hanoi",
  rooms: [{ name: "Deluxe", price: 0 }, { name: "EXTRA BED", price: 0 }],
});

export default function AccommodationManagement() {
  const items = hotelStore.useAll();
  const [q, setQ] = useState("");
  const [dest, setDest] = useState("");
  const [stars, setStars] = useState("");
  const [editing, setEditing] = useState<HotelTemplate | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((h) => (!dest || h.destination === dest) && (!stars || h.stars === Number(stars)) && (!s || `${h.name} ${h.address}`.toLowerCase().includes(s)));
  }, [items, q, dest, stars]);

  const remove = (h: HotelTemplate) => {
    if (window.confirm(`Xoá khách sạn "${h.name}"?\nCác tour package đã chọn khách sạn này vẫn giữ bản sao, không bị ảnh hưởng.`)) hotelStore.remove(h.id);
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold">Accommodation Management</h2>
          <p className="text-gray-500">Thư viện khách sạn và giá phòng · {rows.length} / {items.length} khách sạn</p>
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên hoặc địa chỉ…" className="w-60 rounded border border-line py-2 pl-8 pr-2 outline-none focus:border-brand" />
        </div>
        <select aria-label="Lọc điểm đến" value={dest} onChange={(e) => setDest(e.target.value)} className="rounded border border-line px-2 py-2"><option value="">Mọi điểm đến</option>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select>
        <select aria-label="Lọc số sao" value={stars} onChange={(e) => setStars(e.target.value)} className="rounded border border-line px-2 py-2"><option value="">Mọi hạng sao</option>{[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s}★</option>)}</select>
        <button onClick={() => setEditing(blank())} className="flex items-center gap-1.5 rounded bg-brand px-3 py-2 text-[12px] font-bold text-white hover:bg-brand-dark"><Plus size={14} /> NEW HOTEL</button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[860px] text-left">
          <thead className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <tr className="border-b border-line"><th className="px-4 py-2.5">#</th><th className="px-2">Name</th><th className="px-2">Destination</th><th className="px-2">Address</th><th className="px-2">Rooms &amp; services (USD)</th><th className="px-2" /></tr>
          </thead>
          <tbody>
            {rows.map((h, i) => (
              <tr key={h.id} className="border-b border-line align-top last:border-0 hover:bg-blue-50/40">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-2 py-3">
                  <button onClick={() => setEditing(h)} className="text-left font-semibold text-brand hover:underline">{h.name}</button>
                  <div className="text-amber-500">{"★".repeat(h.stars)}</div>
                </td>
                <td className="px-2 py-3"><span className="rounded bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase text-white">{h.destination}</span></td>
                <td className="max-w-[260px] px-2 py-3 text-gray-600">{h.address || "—"}</td>
                <td className="px-2 py-3">{h.rooms.map((r, k) => <div key={k}>{r.name}: <b>{usd(r.price)}</b></div>)}</td>
                <td className="whitespace-nowrap px-2 py-3 text-right">
                  <button aria-label="Sửa" onClick={() => setEditing(h)} className="rounded p-1.5 text-gray-500 hover:bg-panel"><Pencil size={15} /></button>
                  <button aria-label="Xoá" onClick={() => remove(h)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Không có khách sạn nào.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <HotelForm key={editing.id} initial={editing} isNew={!items.some((x) => x.id === editing.id)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function HotelForm({ initial, isNew, onClose }: { initial: HotelTemplate; isNew: boolean; onClose: () => void }) {
  const [h, setH] = useState(initial);
  const [err, setErr] = useState("");
  const set = <K extends keyof HotelTemplate>(k: K, v: HotelTemplate[K]) => setH((x) => ({ ...x, [k]: v }));
  const setRoom = (i: number, p: Partial<HotelTemplate["rooms"][number]>) => set("rooms", h.rooms.map((r, j) => (j === i ? { ...r, ...p } : r)));

  const submit = () => {
    if (!h.name.trim()) return setErr("Vui lòng nhập tên khách sạn");
    hotelStore.upsert({ ...h, name: h.name.trim(), rooms: h.rooms.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), price: Number(r.price) || 0 })) });
    onClose();
  };

  return (
    <FormModal title={isNew ? "Thêm khách sạn" : "Sửa khách sạn"} onSubmit={submit} onClose={onClose} wide>
      <div className="grid gap-4 sm:grid-cols-[1fr_120px_160px]">
        <Field label="Tên khách sạn" required error={err}><input autoFocus className="field" value={h.name} onChange={(e) => { set("name", e.target.value); setErr(""); }} /></Field>
        <Field label="Số sao"><select className="field" value={h.stars} onChange={(e) => set("stars", Number(e.target.value))}>{[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s}★</option>)}</select></Field>
        <Field label="Điểm đến"><select className="field" value={h.destination} onChange={(e) => set("destination", e.target.value)}>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select></Field>
      </div>
      <Field label="Địa chỉ"><input className="field" value={h.address} onChange={(e) => set("address", e.target.value)} /></Field>

      <div>
        <span className="label">Loại phòng &amp; dịch vụ (USD)</span>
        <table className="w-full">
          <tbody>
            {h.rooms.map((r, i) => (
              <tr key={i}>
                <td className="pb-2 pr-2"><input aria-label="Tên phòng" className="field" value={r.name} onChange={(e) => setRoom(i, { name: e.target.value })} placeholder="Deluxe" /></td>
                <td className="w-36 pb-2 pr-2"><input aria-label="Giá" type="number" min={0} step="0.5" className="field text-right" value={r.price} onChange={(e) => setRoom(i, { price: Number(e.target.value) })} /></td>
                <td className="w-8 pb-2"><button type="button" aria-label="Xoá dòng" onClick={() => set("rooms", h.rooms.filter((_, j) => j !== i))} className="rounded p-1.5 text-gray-400 hover:text-red-600"><X size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={() => set("rooms", [...h.rooms, { name: "", price: 0 }])} className="flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"><Plus size={13} /> Thêm loại phòng</button>
        <p className="mt-2 text-[11px] text-gray-500">Phòng không chứa chữ "extra" là phòng chính (tự điền theo số khách); dòng có chữ "extra" (vd EXTRA BED) tính theo giường lẻ.</p>
      </div>
    </FormModal>
  );
}
