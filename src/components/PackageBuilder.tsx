import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { AccOption, ItineraryDay, NightStay, TourPackage } from "../types";
import { DESTINATIONS } from "../data/library";
import { hotelStore, itineraryStore } from "../lib/libraryStore";
import { addDays, computePrices, dateShort, dayFromTemplate, isOptionComplete, newOption, stayFromHotel, usd } from "../lib/packageLogic";

export type BuilderTab = "itin" | "acc" | "price";

interface Props {
  tab: BuilderTab;
  pkg: TourPackage;
  set: <K extends keyof TourPackage>(key: K, value: TourPackage[K]) => void;
  setDays: (days: ItineraryDay[]) => void;
  setOptions: (options: AccOption[]) => void;
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

/** textarea chỉ ghi vào state khi rời ô (tránh mất dấu xuống dòng khi vừa gõ) */
function CommitTextarea({ value, onCommit, rows = 3 }: { value: string; onCommit: (v: string) => void; rows?: number }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return <textarea rows={rows} className="w-full rounded border border-gray-300 px-1.5 py-1" value={local} onChange={(e) => setLocal(e.target.value)} onBlur={() => local !== value && onCommit(local)} />;
}

/* ============ 1. ITINERARIES ============ */
function ItineraryPanel({ pkg, setDays }: Props) {
  const library = itineraryStore.useAll();
  const [q, setQ] = useState("");
  const list = library.filter((t) => t.title.toLowerCase().includes(q.trim().toLowerCase()));
  const patch = (id: string, p: Partial<ItineraryDay>) => setDays(pkg.days.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <div className="space-y-5">
      <Block title="Ngày trong tour này">
        {pkg.days.length === 0 && <p className="text-gray-500">Chưa có ngày nào — chọn từ thư viện bên dưới.</p>}
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
                  <select className="rounded border border-gray-300 px-1.5 py-1" value={d.overnight} onChange={(e) => patch(d.id, { overnight: e.target.value })}>
                    <option value="">Departure</option>
                    {DESTINATIONS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1.5">USD / pax
                  <input type="number" min={0} step="0.5" className={num} value={d.adultPrice} onChange={(e) => patch(d.id, { adultPrice: Number(e.target.value) })} />
                </label>
              </div>
              <div className="mt-2 pl-16 text-[12px]">
                <span className="mb-1 block text-gray-500">Inclusions (mỗi dòng 1 mục)</span>
                <CommitTextarea rows={2} value={d.inclusions.join("\n")} onCommit={(v) => patch(d.id, { inclusions: v.split("\n").map((x) => x.trim()).filter(Boolean) })} />
              </div>
            </li>
          ))}
        </ol>
      </Block>

      <Block title="Thêm từ thư viện Itinerary">
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
          {list.length === 0 && <li className="py-4 text-center text-gray-500">Thư viện không có mục nào khớp. Thêm mới ở trang <b>Itinerary Management</b>.</li>}
        </ul>
      </Block>
    </div>
  );
}

/* ============ 2. ACCOMMODATIONS ============ */
function AccommodationPanel({ pkg, set, setOptions }: Props) {
  const hotels = hotelStore.useAll();
  const [idx, setIdx] = useState(0);
  const opt = pkg.options[Math.min(idx, pkg.options.length - 1)];

  const patchOpt = (fn: (o: AccOption) => AccOption) => setOptions(pkg.options.map((o) => (o.id === opt.id ? fn(o) : o)));
  const patchNight = (id: string, fn: (n: NightStay) => NightStay) => patchOpt((o) => ({ ...o, nights: o.nights.map((n) => (n.id === id ? fn(n) : n)) }));

  const hotelsFor = (dest: string) => {
    const byDest = hotels.filter((h) => h.destination === dest);
    const strict = byDest.filter((h) => h.stars === opt.stars);
    return strict.length ? strict : byDest.length ? byDest : hotels;
  };
  const pick = (n: NightStay, hotelId: string) => {
    const h = hotels.find((x) => x.id === hotelId);
    patchNight(n.id, (cur) => (h ? stayFromHotel(h, cur.destination, pkg.numGuests, cur.id) : { ...cur, hotelId: "", hotelName: "", stars: 0, address: "", rooms: [] }));
  };
  const copyToDestination = (src: NightStay) =>
    patchOpt((o) => ({ ...o, nights: o.nights.map((n) => (n.destination === src.destination ? { ...src, id: n.id, rooms: src.rooms.map((r) => ({ ...r, id: crypto.randomUUID() })) } : n)) }));
  const resetRooms = () =>
    patchOpt((o) => ({ ...o, nights: o.nights.map((n) => { const h = hotels.find((x) => x.id === n.hotelId); return h ? stayFromHotel(h, n.destination, pkg.numGuests, n.id) : n; }) }));

  return (
    <div className="space-y-4">
      {/* chọn / quản lý phương án */}
      <div className="rounded bg-panel p-3">
        <div className="flex flex-wrap items-center gap-2">
          {pkg.options.map((o, i) => (
            <button key={o.id} onClick={() => setIdx(i)} aria-pressed={o === opt}
              className={`rounded px-3 py-1.5 text-[12px] font-bold ${o === opt ? "bg-brand text-white" : "border border-gray-300 bg-white hover:bg-gray-50"}`}>
              {o.label || "(không tên)"} {isOptionComplete(o) && o.nights.length > 0 ? "✓" : ""}
            </button>
          ))}
          <button onClick={() => { setOptions([...pkg.options, newOption("OPTION", 4, pkg.days)]); setIdx(pkg.options.length); }} className="flex items-center gap-1 rounded border border-dashed border-gray-400 px-2 py-1.5 text-[11px] font-bold hover:bg-white"><Plus size={12} /> OPTION</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5">Tên <input className="w-40 rounded border border-gray-300 px-1.5 py-1" value={opt.label} onChange={(e) => patchOpt((o) => ({ ...o, label: e.target.value }))} /></label>
          <label className="flex items-center gap-1.5">Sao
            <select className="rounded border border-gray-300 px-1.5 py-1" value={opt.stars} onChange={(e) => patchOpt((o) => ({ ...o, stars: Number(e.target.value) }))}>
              {[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s}★</option>)}
            </select>
          </label>
          {pkg.options.length > 1 && (
            <button onClick={() => { if (window.confirm(`Xoá phương án "${opt.label}"?`)) { setOptions(pkg.options.filter((o) => o.id !== opt.id)); setIdx(0); } }} className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline"><Trash2 size={12} /> Xoá phương án</button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 font-semibold">Số khách
            <input type="number" min={1} className={num} value={pkg.numGuests} onChange={(e) => set("numGuests", Math.max(1, Number(e.target.value) || 1))} />
          </label>
          <button onClick={resetRooms} className="ml-auto flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-[11px] font-bold hover:bg-gray-50"><RefreshCw size={12} /> ĐIỀN LẠI PHÒNG THEO SỐ KHÁCH</button>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">Điền nhanh: khách ÷ 2 phòng, lẻ thêm 1 extra bed (5 khách = 2 phòng + 1 extra bed).</p>
      </div>

      {opt.nights.length === 0 && <p className="text-gray-500">Cần ít nhất 2 ngày trong itinerary thì mới có đêm nghỉ.</p>}

      {opt.nights.map((n, i) => (
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
            {n.hotelId && !hotelsFor(n.destination).some((h) => h.id === n.hotelId) && <option value={n.hotelId}>{n.hotelName} (không còn trong thư viện)</option>}
            {hotelsFor(n.destination).map((h) => <option key={h.id} value={h.id}>{h.name} {h.stars}★ — {h.destination}</option>)}
          </select>
          {n.hotelId && <p className="mt-1 text-[11px] text-gray-500">{n.address}</p>}

          {n.rooms.length > 0 && (
            <table className="mt-2 w-full text-[12px]">
              <thead className="text-left text-[11px] text-gray-500"><tr><th>Phòng</th><th className="w-24 text-right">USD</th><th className="w-16 text-right">Q.ty</th><th className="w-8" /></tr></thead>
              <tbody>
                {n.rooms.map((r) => {
                  const edit = (p: Partial<typeof r>) => patchNight(n.id, (c) => ({ ...c, rooms: c.rooms.map((x) => (x.id === r.id ? { ...x, ...p } : x)) }));
                  return (
                    <tr key={r.id}>
                      <td><input className="w-full rounded border border-gray-300 px-1.5 py-1" value={r.name} onChange={(e) => edit({ name: e.target.value })} /></td>
                      <td><input type="number" min={0} step="0.5" className="w-full rounded border border-gray-300 px-1.5 py-1 text-right" value={r.price} onChange={(e) => edit({ price: Number(e.target.value) })} /></td>
                      <td><input type="number" min={0} className="w-full rounded border border-gray-300 px-1.5 py-1 text-right" value={r.qty} onChange={(e) => edit({ qty: Number(e.target.value) })} /></td>
                      <td><IconBtn label="Xoá phòng" danger onClick={() => patchNight(n.id, (c) => ({ ...c, rooms: c.rooms.filter((x) => x.id !== r.id) }))}><Trash2 size={13} /></IconBtn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {n.hotelId && (
            <button onClick={() => patchNight(n.id, (c) => ({ ...c, rooms: [...c.rooms, { id: crypto.randomUUID(), name: "Room", price: 0, qty: 1, note: "" }] }))} className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"><Plus size={12} /> Thêm loại phòng</button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============ 3. GET PRICE ============ */
function PricePanel({ pkg, set }: Props) {
  const row = (label: string, value: string, strong = false) => (
    <div className={`flex justify-between gap-3 py-1.5 ${strong ? "font-bold" : ""}`}><span>{label}</span><span className="shrink-0">{value}</span></div>
  );
  const land = computePrices(pkg);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded bg-panel p-3">
        <label className="flex items-center gap-2 font-semibold">Người lớn
          <input type="number" min={1} className={num} value={pkg.numGuests} onChange={(e) => set("numGuests", Math.max(1, Number(e.target.value) || 1))} />
        </label>
        <label className="flex items-center gap-2 font-semibold">Phí dịch vụ (%)
          <input type="number" min={0} step="0.5" className={num} value={pkg.markupPct} onChange={(e) => set("markupPct", Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <label className="flex items-center gap-2 font-semibold">VAT (%)
          <input type="number" min={0} step="0.5" className={num} value={pkg.vatPct} onChange={(e) => set("vatPct", Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <p className="w-full text-[11px] text-gray-500">VAT = 0 thì dòng "VAT PER PERSON" không hiện trong tài liệu.</p>
      </div>

      <Block title="Giá land tour theo từng ngày (sửa ở bước Itineraries)">
        {pkg.days.length === 0 && <p className="text-gray-500">Chưa có itinerary.</p>}
        <ul className="divide-y divide-line text-[12px]">
          {pkg.days.map((d, i) => <li key={d.id} className="flex gap-2 py-1.5"><span className="w-12 shrink-0 font-semibold">DAY {i + 1}</span><span className="min-w-0 flex-1 truncate" title={d.title}>{d.title}</span><span>{usd(Number(d.adultPrice) || 0)}</span></li>)}
        </ul>
        {row("Land tour / pax", usd(land.landPerPax), true)}
      </Block>

      {pkg.options.map((o) => {
        const p = computePrices(pkg, o);
        return (
          <Block key={o.id} title={`${o.label} — ${o.stars}★`}>
            {!isOptionComplete(o) && <p className="mb-1 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700">Chưa chọn đủ khách sạn cho phương án này, giá chưa đầy đủ.</p>}
            <div className="divide-y divide-line">
              {row(`Accommodation (${usd(p.accTotal)} ÷ ${p.adults} pax)`, usd(p.accPerPax))}
              {p.markup > 0 && row(`Phí dịch vụ ${pkg.markupPct}%`, usd(p.markup))}
              {row("TOTAL / PAX", usd(p.totalPerPax), true)}
              {pkg.vatPct > 0 && row(`VAT ${pkg.vatPct}% / pax`, usd(p.vat))}
              {row(`TOTAL ${p.adults} PAX`, usd(p.groupTotal), true)}
            </div>
          </Block>
        );
      })}
      <p className="text-[11px] text-gray-500">Chỉ tính người lớn (chưa có giá trẻ em). Tiền phòng chia đều cho số khách.</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return <section><h4 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-gray-500">{title}</h4>{children}</section>;
}
function IconBtn({ children, label, onClick, danger }: { children: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return <button aria-label={label} title={label} onClick={onClick} className={`rounded p-1 text-gray-500 hover:bg-panel ${danger ? "hover:text-red-600" : ""}`}>{children}</button>;
}
