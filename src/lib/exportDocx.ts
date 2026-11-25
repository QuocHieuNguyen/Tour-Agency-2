import {
  AlignmentType, Document, ImageRun, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";
import type { TourPackage } from "../types";
import { addDays, computePrices, dateLong, dateShort, durationOf, groupStays, isOptionComplete, mealsText, unitOf, usd } from "./packageLogic";
import { fmtDate } from "./format";

const FONT = "Times New Roman";
const GREY = "D9D9D9";
const LIGHT = "F2F2F2";

interface PO { bold?: boolean; size?: number; center?: boolean; right?: boolean; italics?: boolean; after?: number; before?: number }
const p = (text: string, o: PO = {}) =>
  new Paragraph({
    alignment: o.center ? AlignmentType.CENTER : o.right ? AlignmentType.RIGHT : undefined,
    spacing: { after: o.after ?? 80, before: o.before ?? 0 },
    children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? 21, font: FONT })],
  });
const bullet = (text: string) =>
  new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 21, font: FONT })] });

const cell = (content: string | string[], o: { w?: number; fill?: string; bold?: boolean; center?: boolean; right?: boolean; span?: number } = {}) =>
  new TableCell({
    width: o.w ? { size: o.w, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: o.span,
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: (Array.isArray(content) ? content : [content]).map((t) => p(t, { size: 19, bold: o.bold, center: o.center, right: o.right, after: 0 })),
  });
const table = (rows: TableCell[][]) =>
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map((r) => new TableRow({ children: r })) });
const heading = (t: string) => p(t, { bold: true, size: 26, before: 300, after: 100 });
const lines = (t: string) => t.split("\n").filter((l) => l.trim());
const list = (items: string[]) => items.filter((t) => t.trim()).map(bullet);

async function coverImage(dataUrl: string): Promise<Paragraph | null> {
  if (!dataUrl) return null;
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const data = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
  const width = 560;
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 },
    children: [new ImageRun({ type: "jpg", data, transformation: { width, height: Math.round((width * img.height) / img.width) } })],
  });
}

export async function exportPackageDocx(pkg: TourPackage) {
  const start = addDays(pkg.travelDate, 0);
  const end = addDays(pkg.travelDate, Math.max(0, pkg.days.length - 1));
  const hasNights = pkg.days.length > 1;
  const cover = await coverImage(pkg.coverImage);
  const kv = (k: string, v: string) => [cell(k, { w: 24, fill: LIGHT, bold: true }), cell(v, { w: 76 })];

  const children: (Paragraph | Table)[] = [
    p(pkg.title, { bold: true, size: 44, center: true, after: 40 }),
    p(pkg.subtitle, { size: 28, center: true, after: 120 }),
    ...(cover ? [cover] : []),

    heading("TOUR INFORMATION"),
    table([
      kv("Tour Code", pkg.code),
      kv("Tour Type", pkg.tourType),
      kv("Guest Name", pkg.guestName),
      kv("Nationality", pkg.nationality),
      kv("Number of Guests", `${pkg.numGuests} adults + ${pkg.numChildren} children`),
      kv("Contact", pkg.contact),
      kv("Travel Date", start ? `${dateLong(start)}  →  ${dateLong(end)}` : ""),
      kv("Duration", durationOf(pkg.days.length)),
    ]),

    heading("BRIEF ITINERARY"),
    table([
      [cell("DAY", { w: 22, fill: GREY, bold: true, center: true }), cell("DESCRIPTION", { w: 60, fill: GREY, bold: true }), cell("OVERNIGHT", { w: 18, fill: GREY, bold: true, center: true })],
      ...pkg.days.map((d, i) => [cell(`DAY ${i + 1} (${dateShort(addDays(pkg.travelDate, i))})`, { center: true }), cell(d.title), cell(d.overnight || "—", { center: true })]),
    ]),
  ];

  /* PRICES */
  const priceRows: TableCell[][] = [];
  (hasNights ? pkg.options : pkg.options.slice(0, 1)).forEach((o) => {
    if (!isOptionComplete(o)) return;
    const pr = computePrices(pkg, o);
    priceRows.push([cell(hasNights ? `TOUR PACKAGE (${o.stars} STAR HOTEL)` : "TOUR PACKAGE", { w: 70 }), cell(usd(pr.totalPerPax), { w: 30, bold: true, right: true })]);
    if (pkg.vatPct > 0) priceRows.push([cell("VAT PER PERSON"), cell(usd(pr.vat), { right: true })]);
  });
  if (priceRows.length) {
    children.push(
      heading("PRICES"),
      table([[cell("Options", { w: 70, fill: GREY, bold: true }), cell("PRICE / GUEST", { w: 30, fill: GREY, bold: true, right: true })], ...priceRows]),
      p(`Valid until ${pkg.validDate ? fmtDate(pkg.validDate) : "—"}. Prices in USD.`, { italics: true, size: 18, before: 80 }),
    );
  }

  /* ACCOMMODATIONS */
  const stayOptions = pkg.options.filter((o) => groupStays(o).length > 0);
  if (hasNights && stayOptions.length) {
    children.push(
      heading("ACCOMMODATIONS"),
      p("Accommodation is listed without availability. Please check with us for availability once you confirm this package. Similar options will be provided in case the listed one is sold out.", { italics: true, size: 19 }),
    );
    stayOptions.forEach((o) => {
      children.push(
        p(o.label, { bold: true, size: 23, before: 160 }),
        table([
          [cell("LOCATION + NAME", { w: 50, fill: GREY, bold: true }), cell("ROOMS / SERVICES", { w: 30, fill: GREY, bold: true }), cell("QTY", { w: 20, fill: GREY, bold: true })],
          ...groupStays(o).map((g) => [
            cell([`${g.destination.toUpperCase()} (${g.nights} Night${g.nights > 1 ? "s" : ""})`, `${g.hotelName} ${g.stars}★`, `Address: ${g.address}`]),
            cell(g.rooms.map((r) => r.name)),
            cell(g.rooms.map((r) => `${r.qty} ${unitOf(r.name)}`)),
          ]),
        ]),
      );
    });
  }

  /* DETAILED ITINERARY */
  if (pkg.days.length) children.push(heading("DETAILED ITINERARY"));
  pkg.days.forEach((d, i) => {
    children.push(p(`DAY ${i + 1} (${dateShort(addDays(pkg.travelDate, i))}) – ${d.title}`, { bold: true, size: 23, before: 200 }));
    if (d.pickup || d.ends) children.push(p(`Pickup: ${d.pickup || "—"} | Ends: ${d.ends || "—"}`));
    lines(d.description).forEach((l) => children.push(p(l)));
    if (d.suggestion.trim()) children.push(p(`Suggestion: ${d.suggestion}`, { italics: true }));
    if (d.overnight) children.push(p(`Overnight in ${d.overnight}.`));
    const meals = mealsText(d.meals);
    children.push(p(`Inclusions: ${d.inclusions.join(", ") || "—"}${meals ? ` | Meals: ${meals}` : ""}`, { bold: true }));
  });

  /* ĐIỀU KHOẢN */
  const t = pkg.terms;
  children.push(
    heading("INCLUSIONS"), ...list(t.inclusions),
    heading("EXCLUSIONS"), ...list(t.exclusions),
    heading("RATES AND CONDITIONS"), ...list(t.rates),
    heading("PAYMENT TERMS"), ...list(t.payment),
    heading("CANCELLATION POLICY"),
    p("For FIT (1–9 pax):", { bold: true }), ...list(t.cancelFit),
    p("For GIT (10+ pax):", { bold: true, before: 100 }), ...list(t.cancelGit),
  );
  if (t.cancelNote.trim()) children.push(p(t.cancelNote, { before: 100 }));
  if (pkg.note.trim()) children.push(heading("NOTES"), ...lines(pkg.note).map((l) => p(l)));
  children.push(p("Should you have any further inquiries, please feel free to contact us at any time!", { italics: true, center: true, before: 300 }));

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children }] });
  download(await Packer.toBlob(doc), `${pkg.code.replace("/", "-")} ${pkg.title}.docx`);
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
