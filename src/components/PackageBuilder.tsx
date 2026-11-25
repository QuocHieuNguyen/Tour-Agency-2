import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { ItineraryDay, NightStay, TourPackage } from "../types";
import { DESTINATIONS, HOTEL_LIBRARY, ITINERARY_LIBRARY } from "../data/library";
import { addDays, computePrices, dateShort, dayFromTemplate, stayFromHotel, usd } from "../lib/packageLogic";

export type BuilderTab = "itin" | "acc" | "price";

interface Props {
  tab: BuilderTab;
  pkg: TourPackage;
  set: <K extends keyof TourPackage>(key: K, value: TourPackage[K]) => void;
  setDays: (days: ItineraryDay[]) => void;
  setNights: (nights: NightStay[]) => void;
}

export default function PackageBuilder({ tab, ...rest }: Props) {
  return tab === "itin" ? <ItineraryPanel {...rest} /> : tab === "acc" ? <AccommodationPanel {...rest} /> : <PricePanel {...rest} />;
}

const TYPE_BADGE: Record<string, string> = {
  "Private Transfer": "bg-emerald-600", "Private Tour (PVT)": "bg-indigo-600", "Group Tour (SIC)": "bg-green-600",
};
const num = "w-20 rounded border border-gray-300 px-1.5 py-1 text-right";
const move = <T,>(arr: T[], i: number, dir: -1 | 1) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
};

/* ============ 1. ITINERARIES ============ */
function ItineraryPanel({ pkg, setDays }: Props) {
  const [q, setQ] = useState("");
  const list = ITINERARY_LIBRARY.filter((t) => t.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-5">
      <Block title="Ngày trong tour này">
        {pkg.days.length === 0 && <p className="text-gray-500">Chưa có ngày nào — chọn từ danh sách bên dưới.</p>}
        <ol className="space-y-2">
          {pkg.days.map((d, i) => (
            <li key={d.id} className="rounded border border-line p-2">
              <div className="flex items-start gap-2">
                <div className="w-14 shrink-0 text-[12px] font-bold">DAY {i + 1}<div className="font-normal text-gray-500">{dateShort(addDays(pkg.travelDate, i))}</div></div>
                <div className="min-w-0 flex-1 text-[12px] font-semibold">{d.title}</div>
                <IconBtn label="Lên" onClick={() => setDays(move(pkg.days, i, -1))}><ArrowUp size={14} /></IconBtn>
                <IconBtn label="Xuống" onClick={() => setDays(move(pkg.days, i, 1))}><ArrowDown size={14} /></IconBtn>
                <IconBtn label="Xoá ngày" danger onClick={() => setDays(pkg.days.filter((x) => x.id !== d.id))}><Trash2 size={14} /></IconBtn>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 pl-16 text-[12px]">
                <label className="flex items-center gap-1.5">Overnight
                  <select className="rounded border border-gray-300 px-1.5 py-1" value={d.overnight} onChange={(e) => setDays(pkg.days.map((x) => (x.id === d.id ? { ...x, overnight: e.target.value } : x)))}>
                    <option value="">Departure</option>
                    {DESTINATIONS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1.5">USD / pax
                  <input type="number" min={0} step="0.5" className={num} value={d.adultPrice} onChange={(e) => setDays(pkg.days.map((x) => (x.id === d.id ? { ...x, adultPrice: Number(e.target.value) } : x)))} />
                </label>
              </div>
            </li>
          ))}
        </ol>
      </Block>

      <Block title="Thêm từ danh sách itinerary có sẵn">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên…" className="w-full rounded border border-gray-300 py-2 pl-8 pr-2 outline-none focus:border-brand" />
        </div>
        <ul className="space-y-1.5">
          {list.map((t) => (
            <li key={t.id} className="flex items-start gap-2 rounded border border-line p-2">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold">{t.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  <span className={`rounded px-1.5 py-0.5 font-semibold text-white ${TYPE_BADGE[t.tourType]}`}>{t.tourType}</span>
                  <span>Overnight: {t.overnight || "—"}</span><span>{usd(t.adultPrice)}</span>
                </div>
              </div>
              <button onClick={() => setDays([...pkg.days, dayFromTemplate(t)])} className="flex shrink-0 items-center gap-1 rounded bg-brand px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-brand-dark"><Plus size={12} /> ADD</button>
            </li>
          ))}
          {list.length === 0 && <li className="py-4 text-center text-gray-500">Không có itinerary nào khớp.</li>}
        </ul>
      </Block>
    </div>
  );
}

/* ============ 2. ACCOMMODATIONS ============ */
function AccommodationPanel({ pkg, set, setNights }: Props) {
  const patch = (id: string, fn: (n: NightStay) => NightStay) => setNights(pkg.nights.map((n) => (n.id === id ? fn(n) : n)));
  const hotelsFor = (dest: string) => {
    const match = HOTEL_LIBRARY.filter((h) => h.destination === dest);
    return match.length ? match : HOTEL_LIBRARY;
  };
  const pick = (n: NightStay, hotelId: string) => {
    const h = HOTEL_LIBRARY.find((x) => x.id === hotelId);
    patch(n.id, (cur) => (h ? stayFromHotel(h, cur.destination, pkg.numGuests, cur.id) : { ...cur, hotelId: "", hotelName: "", stars: 0, address: "", rooms: [] }));
  };
  const copyToDestination = (src: NightStay) =>
    setNights(pkg.nights.map((n) => (n.destination === src.destination ? { ...src, id: n.id, rooms: src.rooms.map((r) => ({ ...r, id: crypto.randomUUID() })) } : n)));
  const resetRooms = () =>
    setNights(pkg.nights.map((n) => {
      const h = HOTEL_LIBRARY.find((x) => x.id === n.hotelId);
      return h ? stayFromHotel(h, n.destination, pkg.numGuests, n.id) : n;
    }));

  if (pkg.nights.length === 0) return <p className="text-gray-500">Cần có ít nhất 2 ngày trong itinerary thì mới có đêm nghỉ.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded bg-panel p-3">
        <label className="flex items-center gap-2 font-semibold">Số khách
          <input type="number" min={1} className={num} value={pkg.numGuests} onChange={(e) => set("numGuests", Math.max(1, Number(e.target.value) || 1))} />
        </label>
        <button onClick={resetRooms} className="ml-auto flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-[11px] font-bold hover:bg-gray-50">
          <RefreshCw size={12} /> ĐIỀN LẠI PHÒNG THEO SỐ KHÁCH
        </button>
        <p className="w-full text-[11px] text-gray-500">Quy tắc điền nhanh: khách ÷ 2 phòng, khách lẻ thêm 1 extra bed (5 khách = 2 phòng + 1 extra bed).</p>
      </div>

      {pkg.nights.map((n, i) => (
        <div key={n.id} className="rounded border border-line p-3">
          <div className="mb-2 flex items-center gap-2">
            <b>Night {i + 1}</b><span className="text-gray-500">{dateShort(addDays(pkg.travelDate, i))}</span>
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">{n.destination || "—"}</span>
            {n.hotelId && (
              <button onClick={() => copyToDestination(n)} className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"><Copy size={12} /> Áp cho mọi đêm tại {n.destination}</button>
            )}
          </div>
          <select aria-label={`Khách sạn đêm ${i + 1}`} className="field !border-gray-300" value={n.hotelId} onChange={(e) => pick(n, e.target.value)}>
            <option value="">— Chọn khách sạn —</option>
            {hotelsFor(n.destination).map((h) => <option key={h.id} value={h.id}>{h.name} {"★".repeat(h.stars)} — {h.destination}</option>)}
          </select>
          {n.hotelId && <p className="mt-1 text-[11px] text-gray-500">{n.address}</p>}

          {n.rooms.length > 0 && (
            <table className="mt-2 w-full text-[12px]">
              <thead className="text-left text-[11px] text-gray-500"><tr><th>Phòng</th><th className="w-24 text-right">USD</th><th className="w-16 text-right">Q.ty</th><th className="w-8" /></tr></thead>
              <tbody>
                {n.rooms.map((r) => (
                  <tr key={r.id}>
                    <td><input className="w-full rounded border border-gray-300 px-1.5 py-1" value={r.name} onChange={(e) => patch(n.id, (c) => ({ ...c, rooms: c.rooms.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)) }))} /></td>
                    <td><input type="number" min={0} step="0.5" className="w-full rounded border border-gray-300 px-1.5 py-1 text-right" value={r.price} onChange={(e) => patch(n.id, (c) => ({ ...c, rooms: c.rooms.map((x) => (x.id === r.id ? { ...x, price: Number(e.target.value) } : x)) }))} /></td>
                    <td><input type="number" min={0} className="w-full rounded border border-gray-300 px-1.5 py-1 text-right" value={r.qty} onChange={(e) => patch(n.id, (c) => ({ ...c, rooms: c.rooms.map((x) => (x.id === r.id ? { ...x, qty: Number(e.target.value) } : x)) }))} /></td>
                    <td><IconBtn label="Xoá phòng" danger onClick={() => patch(n.id, (c) => ({ ...c, rooms: c.rooms.filter((x) => x.id !== r.id) }))}><Trash2 size={13} /></IconBtn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {n.hotelId && (
            <button onClick={() => patch(n.id, (c) => ({ ...c, rooms: [...c.rooms, { id: crypto.randomUUID(), name: "Room", price: 0, qty: 1, note: "" }] }))} className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"><Plus size={12} /> Thêm loại phòng</button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============ 3. GET PRICE ============ */
function PricePanel({ pkg, set }: Props) {
  const p = computePrices(pkg);
  const row = (label: string, value: string, strong = false) => (
    <div className={`flex justify-between py-1.5 ${strong ? "font-bold" : ""}`}><span>{label}</span><span>{value}</span></div>
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded bg-panel p-3">
        <label className="flex items-center gap-2 font-semibold">Số khách
          <input type="number" min={1} className={num} value={pkg.numGuests} onChange={(e) => set("numGuests", Math.max(1, Number(e.target.value) || 1))} />
        </label>
        <label className="flex items-center gap-2 font-semibold">Phí dịch vụ (%)
          <input type="number" min={0} step="0.5" className={num} value={pkg.markupPct} onChange={(e) => set("markupPct", Math.max(0, Number(e.target.value) || 0))} />
        </label>
      </div>
      <Block title="Giá land tour theo từng ngày (sửa giá ở bước Itineraries)">
        {pkg.days.length === 0 && <p className="text-gray-500">Chưa có itinerary.</p>}
        <ul className="divide-y divide-line text-[12px]">
          {pkg.days.map((d, i) => <li key={d.id} className="flex gap-2 py-1.5"><span className="w-12 shrink-0 font-semibold">DAY {i + 1}</span><span className="min-w-0 flex-1 truncate" title={d.title}>{d.title}</span><span>{usd(Number(d.adultPrice) || 0)}</span></li>)}
        </ul>
      </Block>
      <Block title="Tổng kết">
        <div className="divide-y divide-line">
          {row("Land tour / pax", usd(p.landPerPax))}
          {row(`Accommodation (${usd(p.accTotal)} ÷ ${p.adults} pax)`, usd(p.accPerPax))}
          {p.markup > 0 && row(`Phí dịch vụ ${pkg.markupPct}%`, usd(p.markup))}
          {row("TOTAL / PAX", usd(p.totalPerPax), true)}
          {row(`TOTAL ${p.adults} PAX`, usd(p.groupTotal), true)}
        </div>
        <p className="mt-2 text-[11px] text-gray-500">Chỉ tính người lớn (chưa có giá trẻ em). Tiền phòng chia đều cho số khách.</p>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return <section><h4 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-gray-500">{title}</h4>{children}</section>;
}
function IconBtn({ children, label, onClick, danger }: { children: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return <button aria-label={label} title={label} onClick={onClick} className={`rounded p-1 text-gray-500 hover:bg-panel ${danger ? "hover:text-red-600" : ""}`}>{children}</button>;
}
