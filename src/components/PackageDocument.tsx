import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ImagePlus, X } from "lucide-react";
import type { ItineraryDay, TourPackage } from "../types";
import { addDays, computePrices, dateLong, dateShort, durationOf, usd } from "../lib/packageLogic";
import { fmtDate } from "../lib/format";
import { fileToJpegDataUrl } from "../lib/image";

interface Props {
  pkg: TourPackage;
  set: <K extends keyof TourPackage>(key: K, value: TourPackage[K]) => void;
  setDays: (days: ItineraryDay[]) => void;
}

/** "Trang Word": đây cũng là phần được in ra PDF (id="package-doc") */
export default function PackageDocument({ pkg, set, setDays }: Props) {
  const start = addDays(pkg.travelDate, 0);
  const end = addDays(pkg.travelDate, Math.max(0, pkg.days.length - 1));
  const price = computePrices(pkg);

  const onCover = async (file?: File) => {
    if (!file) return;
    try { set("coverImage", await fileToJpegDataUrl(file)); } catch { window.alert("Không đọc được ảnh này."); }
  };

  return (
    <article id="package-doc" className="mx-auto my-6 w-[794px] max-w-full bg-white px-14 py-12 font-serif text-[13px] leading-relaxed text-black shadow-lg">
      <AutoText value={pkg.title} onChange={(v) => set("title", v)} placeholder="Tên tour" className="text-center text-[30px] font-bold uppercase leading-tight" />
      <AutoText value={pkg.subtitle} onChange={(v) => set("subtitle", v)} placeholder="Lộ trình (tự điền từ itinerary)" className="text-center text-[16px]" />

      {pkg.coverImage ? (
        <div className="group relative mt-4">
          <img src={pkg.coverImage} alt="Ảnh bìa tour" className="max-h-[300px] w-full rounded-lg object-cover" />
          <button onClick={() => set("coverImage", "")} aria-label="Xoá ảnh bìa" className="no-print absolute right-2 top-2 hidden rounded-full bg-black/60 p-1.5 text-white group-hover:block"><X size={14} /></button>
        </div>
      ) : (
        <label className="no-print mt-4 flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 font-sans text-gray-500 hover:bg-gray-50">
          <ImagePlus size={18} /> Thêm ảnh bìa
          <input type="file" accept="image/*" hidden onChange={(e) => void onCover(e.target.files?.[0])} />
        </label>
      )}

      <p className="mt-3 text-center text-[11px] text-gray-600">
        Tour Code: <b>{pkg.code}</b> / Tour Type:{" "}
        <select value={pkg.tourType} onChange={(e) => set("tourType", e.target.value as TourPackage["tourType"])} className="doc-input !w-auto cursor-pointer font-bold">
          <option>GROUP TOUR (SIC)</option><option>PRIVATE TOUR (PVT)</option>
        </select>
      </p>

      <H>INFORMATION</H>
      <table className="doc-table">
        <tbody>
          <tr>
            <th>Guest Name:</th><td><AutoText value={pkg.guestName} onChange={(v) => set("guestName", v)} /></td>
            <th>Nationality:</th><td><AutoText value={pkg.nationality} onChange={(v) => set("nationality", v)} /></td>
          </tr>
          <tr>
            <th>Number of Guests:</th>
            <td><input type="number" min={1} value={pkg.numGuests} onChange={(e) => set("numGuests", Math.max(1, Number(e.target.value) || 1))} className="doc-input w-20" /></td>
            <th>Contact:</th><td><AutoText value={pkg.contact} onChange={(v) => set("contact", v)} /></td>
          </tr>
          <tr>
            <th>Travel Date:</th>
            <td>
              {start ? <div>{dateLong(start)}</div> : <div className="no-print text-gray-400">Chưa chọn ngày</div>}
              {end && pkg.days.length > 1 && <div>{dateLong(end)}</div>}
              <input type="date" value={pkg.travelDate} onChange={(e) => set("travelDate", e.target.value)} className="no-print mt-1 rounded border border-gray-300 px-1 font-sans text-[12px]" aria-label="Ngày khởi hành" />
            </td>
            <th>Duration:</th><td>{durationOf(pkg.days.length)}</td>
          </tr>
        </tbody>
      </table>

      <H>BRIEF ITINERARY</H>
      {pkg.days.length === 0 ? (
        <Empty>Chưa có ngày nào. Bấm <b>ITINERARIES</b> ở thanh dưới để thêm từ danh sách có sẵn.</Empty>
      ) : (
        <table className="doc-table doc-grid">
          <thead><tr><th className="w-24 text-center">DAY</th><th>DESCRIPTION</th><th className="w-28 text-center">OVERNIGHT</th></tr></thead>
          <tbody>
            {pkg.days.map((d, i) => (
              <tr key={d.id}>
                <td className="text-center">DAY {i + 1} <span className="text-[10px] italic">({dateShort(addDays(pkg.travelDate, i))})</span></td>
                <td><AutoText value={d.title} onChange={(v) => setDays(pkg.days.map((x) => (x.id === d.id ? { ...x, title: v } : x)))} /></td>
                <td className="text-center uppercase">{d.overnight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pkg.nights.length > 0 && (
        <>
          <H>ACCOMMODATIONS</H>
          <table className="doc-table doc-grid">
            <thead><tr><th className="w-24 text-center">NIGHT</th><th>HOTEL</th><th className="w-44">ROOMS</th></tr></thead>
            <tbody>
              {pkg.nights.map((n, i) => (
                <tr key={n.id}>
                  <td className="text-center">Night {i + 1} <span className="text-[10px] italic">({dateShort(addDays(pkg.travelDate, i))})</span></td>
                  <td>
                    {n.hotelId || n.hotelName ? (
                      <>
                        <b>{n.hotelName}</b> <span className="text-amber-500">{"★".repeat(n.stars)}</span>
                        <div className="text-[11px] text-gray-600">{n.address}</div>
                      </>
                    ) : <span className="no-print italic text-gray-400">Chưa chọn khách sạn</span>}
                  </td>
                  <td>{n.rooms.map((r) => <div key={r.id}>{r.qty} × {r.name}</div>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <H>PRICES</H>
      {pkg.days.length === 0 ? <Empty>Giá được tính tự động khi có itinerary.</Empty> : (
        <>
          <table className="doc-table doc-grid">
            <thead><tr><th className="w-20 text-center">DAY</th><th>TITLE</th><th className="w-10 text-center">MEALS</th><th>INCLUSIONS</th><th className="w-24 text-right">ADULT</th></tr></thead>
            <tbody>
              {pkg.days.map((d, i) => (
                <tr key={d.id}>
                  <td className="text-center">DAY {i + 1}</td>
                  <td className="text-[11px]">{d.title}</td>
                  <td className="text-center">{d.meals}</td>
                  <td className="text-[11px]">{d.inclusions.map((x) => <div key={x}>✓ {x}</div>)}</td>
                  <td className="text-right">{usd(Number(d.adultPrice) || 0)}</td>
                </tr>
              ))}
              <tr className="bg-amber-50 font-bold"><td colSpan={4} className="text-right">LAND TOUR / PAX</td><td className="text-right">{usd(price.landPerPax)}</td></tr>
            </tbody>
          </table>

          <table className="doc-table doc-grid mt-4">
            <thead><tr><th colSpan={2}>PRICE SUMMARY — PER PAX</th></tr></thead>
            <tbody>
              <tr><td>Land tour</td><td className="w-32 text-right">{usd(price.landPerPax)}</td></tr>
              <tr><td>Accommodation ({usd(price.accTotal)} ÷ {price.adults} pax)</td><td className="text-right">{usd(price.accPerPax)}</td></tr>
              {price.markup > 0 && <tr><td>Service fee ({pkg.markupPct}%)</td><td className="text-right">{usd(price.markup)}</td></tr>}
              <tr className="bg-amber-50 font-bold"><td>TOTAL PER PAX</td><td className="text-right">{usd(price.totalPerPax)}</td></tr>
              <tr className="font-bold"><td>TOTAL FOR {price.adults} PAX</td><td className="text-right">{usd(price.groupTotal)}</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-[11px] italic text-gray-600">Valid until {pkg.validDate ? fmtDate(pkg.validDate) : "—"}. Prices in USD.</p>
        </>
      )}

      <H>NOTES</H>
      <AutoText value={pkg.note} onChange={(v) => set("note", v)} placeholder="Ghi chú / điều khoản…" />
    </article>
  );
}

function H({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 mt-7 text-[15px] font-bold tracking-wide">{children}</h2>;
}
function Empty({ children }: { children: ReactNode }) {
  return <p className="no-print rounded border border-dashed border-gray-300 px-3 py-4 text-center font-sans text-gray-500">{children}</p>;
}

function AutoText({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea ref={ref} rows={1} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`doc-input resize-none overflow-hidden ${className}`} />
  );
}
