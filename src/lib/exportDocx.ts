import {
  AlignmentType, Document, ImageRun, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";
import type { TourPackage } from "../types";
import { addDays, computePrices, dateLong, dateShort, durationOf, usd } from "./packageLogic";
import { fmtDate } from "./format";

const FONT = "Times New Roman";
const GREY = "D9D9D9";
const AMBER = "FFF3C4";

interface PO { bold?: boolean; size?: number; center?: boolean; right?: boolean; italics?: boolean; after?: number; before?: number }
const p = (text: string, o: PO = {}) =>
  new Paragraph({
    alignment: o.center ? AlignmentType.CENTER : o.right ? AlignmentType.RIGHT : undefined,
    spacing: { after: o.after ?? 60, before: o.before ?? 0 },
    children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? 22, font: FONT })],
  });

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

const heading = (t: string) => p(t, { bold: true, size: 26, before: 280, after: 100 });

async function coverImage(dataUrl: string): Promise<Paragraph | null> {
  if (!dataUrl) return null;
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const bin = atob(dataUrl.split(",")[1]);
  const data = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const width = 560;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [new ImageRun({ type: "jpg", data, transformation: { width, height: Math.round((width * img.height) / img.width) } })],
  });
}

export async function exportPackageDocx(pkg: TourPackage) {
  const price = computePrices(pkg);
  const end = addDays(pkg.travelDate, Math.max(0, pkg.days.length - 1));
  const cover = await coverImage(pkg.coverImage);

  const children: (Paragraph | Table)[] = [
    p(pkg.title, { bold: true, size: 44, center: true, after: 40 }),
    p(pkg.subtitle, { size: 28, center: true, after: 120 }),
    ...(cover ? [cover] : []),
    p(`Tour Code: ${pkg.code} / Tour Type: ${pkg.tourType}`, { size: 18, center: true, italics: true }),

    heading("INFORMATION"),
    table([
      [cell("Guest Name:", { w: 18, bold: true }), cell(pkg.guestName, { w: 32 }), cell("Nationality:", { w: 18, bold: true }), cell(pkg.nationality, { w: 32 })],
      [cell("Number of Guests:", { bold: true }), cell(String(pkg.numGuests)), cell("Contact:", { bold: true }), cell(pkg.contact)],
      [cell("Travel Date:", { bold: true }), cell([dateLong(addDays(pkg.travelDate, 0)), pkg.days.length > 1 ? dateLong(end) : ""].filter(Boolean)), cell("Duration:", { bold: true }), cell(durationOf(pkg.days.length))],
    ]),

    heading("BRIEF ITINERARY"),
    table([
      [cell("DAY", { w: 16, fill: GREY, bold: true, center: true }), cell("DESCRIPTION", { w: 68, fill: GREY, bold: true }), cell("OVERNIGHT", { w: 16, fill: GREY, bold: true, center: true })],
      ...pkg.days.map((d, i) => [
        cell(`DAY ${i + 1} (${dateShort(addDays(pkg.travelDate, i))})`, { center: true }), cell(d.title), cell(d.overnight.toUpperCase(), { center: true }),
      ]),
    ]),
  ];

  if (pkg.nights.length) {
    children.push(
      heading("ACCOMMODATIONS"),
      table([
        [cell("NIGHT", { w: 18, fill: GREY, bold: true, center: true }), cell("HOTEL", { w: 52, fill: GREY, bold: true }), cell("ROOMS", { w: 30, fill: GREY, bold: true })],
        ...pkg.nights.map((n, i) => [
          cell(`Night ${i + 1} (${dateShort(addDays(pkg.travelDate, i))})`, { center: true }),
          cell(n.hotelName ? [`${n.hotelName} ${"★".repeat(n.stars)}`, n.address] : ["—"]),
          cell(n.rooms.map((r) => `${r.qty} × ${r.name}`)),
        ]),
      ]),
    );
  }

  children.push(
    heading("PRICES"),
    table([
      [cell("DAY", { w: 10, fill: GREY, bold: true, center: true }), cell("TITLE", { w: 36, fill: GREY, bold: true }), cell("MEALS", { w: 8, fill: GREY, bold: true, center: true }), cell("INCLUSIONS", { w: 28, fill: GREY, bold: true }), cell("ADULT", { w: 18, fill: GREY, bold: true, right: true })],
      ...pkg.days.map((d, i) => [
        cell(`DAY ${i + 1}`, { center: true }), cell(d.title), cell(d.meals, { center: true }), cell(d.inclusions.map((x) => `✓ ${x}`)), cell(usd(Number(d.adultPrice) || 0), { right: true }),
      ]),
      [cell("LAND TOUR / PAX", { span: 4, fill: AMBER, bold: true, right: true }), cell(usd(price.landPerPax), { fill: AMBER, bold: true, right: true })],
    ]),
    p("", { after: 120 }),
    table([
      [cell("PRICE SUMMARY — PER PAX", { span: 2, fill: GREY, bold: true })],
      [cell("Land tour", { w: 75 }), cell(usd(price.landPerPax), { w: 25, right: true })],
      [cell(`Accommodation (${usd(price.accTotal)} ÷ ${price.adults} pax)`), cell(usd(price.accPerPax), { right: true })],
      ...(price.markup > 0 ? [[cell(`Service fee (${pkg.markupPct}%)`), cell(usd(price.markup), { right: true })]] : []),
      [cell("TOTAL PER PAX", { fill: AMBER, bold: true }), cell(usd(price.totalPerPax), { fill: AMBER, bold: true, right: true })],
      [cell(`TOTAL FOR ${price.adults} PAX`, { bold: true }), cell(usd(price.groupTotal), { bold: true, right: true })],
    ]),
    p(`Valid until ${pkg.validDate ? fmtDate(pkg.validDate) : "—"}. Prices in USD.`, { italics: true, size: 18, before: 80 }),
  );

  if (pkg.note.trim()) children.push(heading("NOTES"), ...pkg.note.split("\n").map((l) => p(l)));

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children }] });
  const blob = await Packer.toBlob(doc);
  download(blob, `${pkg.code.replace("/", "-")} ${pkg.title}.docx`);
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
