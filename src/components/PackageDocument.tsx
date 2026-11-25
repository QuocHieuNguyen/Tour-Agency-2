import { Fragment, useLayoutEffect, useRef, type ReactNode } from "react";
import { ImagePlus, X } from "lucide-react";
import type { ItineraryDay, Terms, TourPackage } from "../types";
import {
  addDays, computePrices, dateLong, dateShort, durationOf, groupStays, isOptionComplete, mealsText, unitOf, usd,
} from "../lib/packageLogic";
import { fmtDate } from "../lib/format";
import { fileToJpegDataUrl } from "../lib/image";

interface Props {
  pkg: TourPackage;
  set: <K extends keyof TourPackage>(key: K, value: TourPackage[K]) => void;
  setDays: (days: ItineraryDay[]) => void;
}

/** "Trang Word" theo Tour_Itinerary_Template.docx. Cũng là phần được in ra PDF (id="package-doc"). */
export default function PackageDocument({ pkg, set, setDays }: Props) {
  const start = addDays(pkg.travelDate, 0);
  const end = addDays(pkg.travelDate, Math.max(0, pkg.days.length - 1));
  const hasNights = pkg.days.length > 1;
  const setDay = (id: string, patch: Partial<ItineraryDay>) => setDays(pkg.days.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const setTerm = <K extends keyof Terms>(key: K, value: Terms[K]) => set("terms", { ...pkg.terms, [key]: value });

  const onCover = async (file?: File) => {
    if (!file) return;
    try { set("coverImage", await fileToJpegDataUrl(file)); } catch { window.alert("Không đọc được ảnh này."); }
  };

  const priceOptions = hasNights ? pkg.options : pkg.options.slice(0, 1);
  const stayOptions = pkg.options.filter((o) => groupStays(o).length > 0);

  return (
    <article id="package-doc" className="mx-auto my-6 w-[794px] max-w-full bg-white px-14 py-12 font-serif text-[13px] leading-relaxed text-black shadow-lg">
      <AutoText value={pkg.title} onChange={(v) => set("title", v)} placeholder="[TOUR NAME]" className="text-center text-[30px] font-bold uppercase leading-tight" />
      <AutoText value={pkg.subtitle} onChange={(v) => set("subtitle", v)} placeholder="[Route] — tự điền từ itinerary" className="text-center text-[16px]" />

      {pkg.coverImage ? (
        <div className="group relative mt-4">
          <img src={pkg.coverImage} alt="Ảnh bìa tour" className="max-h-[300px] w-full rounded-lg object-cover" />
          <button onClick={() => set("coverImage", "")} aria-label="Xoá ảnh bìa" className="no-print absolute right-2 top-2 hidden rounded-full bg-black/60 p-1.5 text-white group-hover:block"><X size={14} /></button>
        </div>
      ) : (
        <label className="no-print mt-4 flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 font-sans text-gray-500 hover:bg-gray-50">
          <ImagePlus size={18} /> Thêm ảnh bìa (không bắt buộc)
          <input type="file" accept="image/*" hidden onChange={(e) => void onCover(e.target.files?.[0])} />
        </label>
      )}

      {/* ===== TOUR INFORMATION ===== */}
      <H>TOUR INFORMATION</H>
      <table className="doc-table doc-grid doc-kv">
        <colgroup><col style={{ width: 170 }} /><col /></colgroup>
        <tbody>
          <KV label="Tour Code">{pkg.code}</KV>
          <KV label="Tour Type">
            <select value={pkg.tourType} onChange={(e) => set("tourType", e.target.value as TourPackage["tourType"])} className="doc-input !w-auto cursor-pointer">
              <option>GROUP TOUR (SIC)</option><option>PRIVATE TOUR (PVT)</option>
            </select>
          </KV>
          <KV label="Guest Name"><AutoText value={pkg.guestName} onChange={(v) => set("guestName", v)} placeholder="Full name of lead guest" /></KV>
          <KV label="Nationality"><AutoText value={pkg.nationality} onChange={(v) => set("nationality", v)} placeholder="Nationality" /></KV>
          <KV label="Number of Guests">
            <span className="inline-flex flex-wrap items-center gap-1">
              <input type="number" min={1} aria-label="Số người lớn" value={pkg.numGuests} onChange={(e) => set("numGuests", Math.max(1, Number(e.target.value) || 1))} className="doc-input !w-14 text-center" /> adults +
              <input type="number" min={0} aria-label="Số trẻ em" value={pkg.numChildren} onChange={(e) => set("numChildren", Math.max(0, Number(e.target.value) || 0))} className="doc-input !w-14 text-center" /> children
            </span>
          </KV>
          <KV label="Contact"><AutoText value={pkg.contact} onChange={(v) => set("contact", v)} placeholder="Phone / Email" /></KV>
          <KV label="Travel Date">
            <span>{start ? `${dateLong(start)}  →  ${dateLong(end)}` : <span className="no-print text-gray-400">Chưa chọn ngày</span>}</span>
            <input type="date" value={pkg.travelDate} onChange={(e) => set("travelDate", e.target.value)} className="no-print ml-3 rounded border border-gray-300 px-1 font-sans text-[12px]" aria-label="Ngày khởi hành" />
          </KV>
          <KV label="Duration">{durationOf(pkg.days.length)}</KV>
        </tbody>
      </table>

      {/* ===== BRIEF ITINERARY ===== */}
      <H>BRIEF ITINERARY</H>
      {pkg.days.length === 0 ? (
        <Empty>Chưa có ngày nào. Bấm <b>ITINERARIES</b> ở thanh dưới để thêm từ thư viện.</Empty>
      ) : (
        <table className="doc-table doc-grid">
          <thead><tr><th className="w-32 text-center">DAY</th><th>DESCRIPTION</th><th className="w-28 text-center">OVERNIGHT</th></tr></thead>
          <tbody>
            {pkg.days.map((d, i) => (
              <tr key={d.id}>
                <td className="text-center">DAY {i + 1} ({dateShort(addDays(pkg.travelDate, i))})</td>
                <td><AutoText value={d.title} onChange={(v) => setDay(d.id, { title: v })} /></td>
                <td className="text-center">{d.overnight || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ===== PRICES ===== */}
      <H>PRICES</H>
      {pkg.days.length === 0 ? <Empty>Giá được tính khi có itinerary và khách sạn.</Empty> : (
        <>
          <table className="doc-table doc-grid">
            <thead><tr><th>Options</th><th className="w-44 text-right">PRICE / GUEST</th></tr></thead>
            <tbody>
              {priceOptions.map((o) => {
                const p = computePrices(pkg, o);
                const ok = isOptionComplete(o);
                return (
                  <Fragment key={o.id}>
                    {ok ? (
                      <tr><td>{hasNights ? `TOUR PACKAGE (${o.stars} STAR HOTEL)` : "TOUR PACKAGE"}</td><td className="text-right font-bold">{usd(p.totalPerPax)}</td></tr>
                    ) : (
                      <tr className="no-print text-gray-400"><td>TOUR PACKAGE ({o.stars} STAR HOTEL)</td><td className="text-right text-[11px] italic">chưa chọn đủ khách sạn</td></tr>
                    )}
                    {ok && pkg.vatPct > 0 && <tr><td>VAT PER PERSON</td><td className="text-right">{usd(p.vat)}</td></tr>}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] italic text-gray-600">Valid until {pkg.validDate ? fmtDate(pkg.validDate) : "—"}. Prices in USD.</p>
        </>
      )}

      {/* ===== ACCOMMODATIONS ===== */}
      {hasNights && (
        <>
          <H>ACCOMMODATIONS</H>
          <p className="text-[12px] italic">Accommodation is listed without availability. Please check with us for availability once you confirm this package. Similar options will be provided in case the listed one is sold out.</p>
          {stayOptions.length === 0 && <Empty>Chưa chọn khách sạn. Bấm <b>ACCOMMODATIONS</b> ở thanh dưới.</Empty>}
          {stayOptions.map((o) => (
            <div key={o.id} className="mt-4">
              <h3 className="mb-1 font-bold">{o.label}</h3>
              <table className="doc-table doc-grid">
                <thead><tr><th>LOCATION + NAME</th><th className="w-44">ROOMS / SERVICES</th><th className="w-28">QTY</th></tr></thead>
                <tbody>
                  {groupStays(o).map((g, i) => (
                    <tr key={i}>
                      <td>
                        <b className="uppercase">{g.destination}</b> ({g.nights} Night{g.nights > 1 ? "s" : ""})
                        <div className="font-bold">{g.hotelName} {g.stars}★</div>
                        <div className="text-[11px] text-gray-700">Address: {g.address}</div>
                      </td>
                      <td>{g.rooms.map((r) => <div key={r.id}>{r.name}</div>)}</td>
                      <td>{g.rooms.map((r) => <div key={r.id}>{r.qty} {unitOf(r.name)}</div>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}

      {/* ===== DETAILED ITINERARY ===== */}
      <H>DETAILED ITINERARY</H>
      {pkg.days.length === 0 && <Empty>Chi tiết từng ngày lấy từ thư viện Itinerary khi bạn thêm ngày.</Empty>}
      {pkg.days.map((d, i) => {
        const meals = mealsText(d.meals);
        return (
          <section key={d.id} className="mb-5">
            <h3 className="font-bold">DAY {i + 1} ({dateShort(addDays(pkg.travelDate, i))}) – {d.title}</h3>
            <div className={d.pickup || d.ends ? "" : "no-print"}>
              Pickup: <input value={d.pickup} placeholder="--:--" onChange={(e) => setDay(d.id, { pickup: e.target.value })} className="doc-input !w-16" /> |
              Ends: <input value={d.ends} placeholder="--:--" onChange={(e) => setDay(d.id, { ends: e.target.value })} className="doc-input !w-16" />
            </div>
            <AutoText value={d.description} onChange={(v) => setDay(d.id, { description: v })} placeholder="Mô tả chi tiết ngày này…" />
            <div className={d.suggestion ? "" : "no-print"}>
              <span className="italic">Suggestion: </span>
              <AutoText value={d.suggestion} onChange={(v) => setDay(d.id, { suggestion: v })} placeholder="Gợi ý tự khám phá (nếu có)" />
            </div>
            {d.overnight && <p>Overnight in {d.overnight}.</p>}
            <p><b>Inclusions:</b> {d.inclusions.join(", ") || "—"}{meals && <> | <b>Meals:</b> {meals}</>}</p>
          </section>
        );
      })}

      {/* ===== ĐIỀU KHOẢN ===== */}
      <H>INCLUSIONS</H><BulletList items={pkg.terms.inclusions} onChange={(v) => setTerm("inclusions", v)} />
      <H>EXCLUSIONS</H><BulletList items={pkg.terms.exclusions} onChange={(v) => setTerm("exclusions", v)} />
      <H>RATES AND CONDITIONS</H><BulletList items={pkg.terms.rates} onChange={(v) => setTerm("rates", v)} />
      <H>PAYMENT TERMS</H><BulletList items={pkg.terms.payment} onChange={(v) => setTerm("payment", v)} />
      <H>CANCELLATION POLICY</H>
      <p className="font-bold">For FIT (1–9 pax):</p>
      <BulletList items={pkg.terms.cancelFit} onChange={(v) => setTerm("cancelFit", v)} />
      <p className="mt-2 font-bold">For GIT (10+ pax):</p>
      <BulletList items={pkg.terms.cancelGit} onChange={(v) => setTerm("cancelGit", v)} />
      <div className="mt-2"><AutoText value={pkg.terms.cancelNote} onChange={(v) => setTerm("cancelNote", v)} /></div>

      <H>NOTES</H>
      <AutoText value={pkg.note} onChange={(v) => set("note", v)} placeholder="Ghi chú thêm (nội bộ hoặc cho khách)…" />

      <p className="mt-8 text-center italic">Should you have any further inquiries, please feel free to contact us at any time!</p>
    </article>
  );
}

function H({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 mt-7 break-after-avoid text-[15px] font-bold tracking-wide">{children}</h2>;
}
function Empty({ children }: { children: ReactNode }) {
  return <p className="no-print rounded border border-dashed border-gray-300 px-3 py-4 text-center font-sans text-gray-500">{children}</p>;
}
function KV({ label, children }: { label: string; children: ReactNode }) {
  return <tr><th className="bg-gray-100">{label}</th><td>{children}</td></tr>;
}

function BulletList({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <ul className="space-y-0.5">
        {items.map((t, i) => (
          <li key={i} className="group flex items-start gap-2">
            <span aria-hidden>•</span>
            <div className="min-w-0 flex-1"><AutoText value={t} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} /></div>
            <button aria-label="Xoá dòng" onClick={() => onChange(items.filter((_, j) => j !== i))} className="no-print mt-1 text-gray-400 opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"><X size={12} /></button>
          </li>
        ))}
      </ul>
      <button onClick={() => onChange([...items, ""])} className="no-print mt-1 font-sans text-[11px] font-semibold text-brand hover:underline">+ Thêm dòng</button>
    </div>
  );
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
    <textarea ref={ref} rows={1} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`doc-input block resize-none overflow-hidden ${className}`} />
  );
}
