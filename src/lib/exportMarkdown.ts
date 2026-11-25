import type { TourPackage } from "../types";
import { addDays, computePrices, dateLong, dateShort, durationOf, groupStays, isOptionComplete, mealsText, unitOf, usd } from "./packageLogic";
import { fmtDate } from "./format";
import { downloadBlob, safeFileName } from "./download";

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
function table(head: string[], rows: string[][], align: ("l" | "r" | "c")[] = []) {
  const sep = head.map((_, i) => (align[i] === "r" ? "---:" : align[i] === "c" ? ":---:" : "---"));
  return [`| ${head.join(" | ")} |`, `| ${sep.join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
}
const bullets = (items: string[]) => items.filter((t) => t.trim()).map((t) => `- ${t}`).join("\n");

/** Dựng nội dung Markdown theo cùng cấu trúc với tài liệu Word/PDF (ảnh bìa không đưa vào file .md) */
export function packageToMarkdown(pkg: TourPackage): string {
  const start = addDays(pkg.travelDate, 0);
  const end = addDays(pkg.travelDate, Math.max(0, pkg.days.length - 1));
  const hasNights = pkg.days.length > 1;
  const out: string[] = [`# ${pkg.title}`];
  if (pkg.subtitle) out.push(`**${pkg.subtitle}**`);

  out.push("## TOUR INFORMATION", table(["Field", "Value"], [
    ["Tour Code", pkg.code],
    ["Tour Type", pkg.tourType],
    ["Guest Name", pkg.guestName],
    ["Nationality", pkg.nationality],
    ["Number of Guests", `${pkg.numGuests} adults + ${pkg.numChildren} children`],
    ["Contact", pkg.contact],
    ["Travel Date", start ? `${dateLong(start)} → ${dateLong(end)}` : ""],
    ["Duration", durationOf(pkg.days.length)],
  ]));

  if (pkg.days.length) {
    out.push("## BRIEF ITINERARY", table(["Day", "Description", "Overnight"],
      pkg.days.map((d, i) => [`DAY ${i + 1} (${dateShort(addDays(pkg.travelDate, i))})`, d.title, d.overnight || "—"])));
  }

  const priceRows: string[][] = [];
  (hasNights ? pkg.options : pkg.options.slice(0, 1)).forEach((o) => {
    if (!isOptionComplete(o)) return;
    const p = computePrices(pkg, o);
    priceRows.push([hasNights ? `TOUR PACKAGE (${o.stars} STAR HOTEL)` : "TOUR PACKAGE", `**${usd(p.totalPerPax)}**`]);
    if (pkg.vatPct > 0) priceRows.push(["VAT PER PERSON", usd(p.vat)]);
  });
  if (priceRows.length) {
    out.push("## PRICES", table(["Options", "PRICE / GUEST"], priceRows, ["l", "r"]),
      `*Valid until ${pkg.validDate ? fmtDate(pkg.validDate) : "—"}. Prices in USD.*`);
  }

  const stayOptions = pkg.options.filter((o) => groupStays(o).length > 0);
  if (hasNights && stayOptions.length) {
    out.push("## ACCOMMODATIONS",
      "*Accommodation is listed without availability. Please check with us for availability once you confirm this package. Similar options will be provided in case the listed one is sold out.*");
    stayOptions.forEach((o) => {
      out.push(`### ${o.label}`, table(["Location + Name", "Rooms / Services", "Qty"],
        groupStays(o).map((g) => [
          `**${g.destination.toUpperCase()}** (${g.nights} Night${g.nights > 1 ? "s" : ""}) — ${g.hotelName} ${g.stars}★. Address: ${g.address}`,
          g.rooms.map((r) => r.name).join("\n"),
          g.rooms.map((r) => `${r.qty} ${unitOf(r.name)}`).join("\n"),
        ])));
    });
  }

  if (pkg.days.length) {
    out.push("## DETAILED ITINERARY");
    pkg.days.forEach((d, i) => {
      const meals = mealsText(d.meals);
      const block = [`### DAY ${i + 1} (${dateShort(addDays(pkg.travelDate, i))}) – ${d.title}`];
      if (d.pickup || d.ends) block.push(`Pickup: ${d.pickup || "—"} | Ends: ${d.ends || "—"}`);
      d.description.split("\n").filter((l) => l.trim()).forEach((l) => block.push(l));
      if (d.suggestion.trim()) block.push(`*Suggestion: ${d.suggestion}*`);
      if (d.overnight) block.push(`Overnight in ${d.overnight}.`);
      block.push(`**Inclusions:** ${d.inclusions.join(", ") || "—"}${meals ? ` | **Meals:** ${meals}` : ""}`);
      out.push(block.join("\n\n"));
    });
  }

  const t = pkg.terms;
  out.push("## INCLUSIONS", bullets(t.inclusions), "## EXCLUSIONS", bullets(t.exclusions),
    "## RATES AND CONDITIONS", bullets(t.rates), "## PAYMENT TERMS", bullets(t.payment),
    "## CANCELLATION POLICY", "**For FIT (1–9 pax):**", bullets(t.cancelFit), "**For GIT (10+ pax):**", bullets(t.cancelGit));
  if (t.cancelNote.trim()) out.push(t.cancelNote);
  if (pkg.note.trim()) out.push("## NOTES", pkg.note);
  out.push("*Should you have any further inquiries, please feel free to contact us at any time!*");

  return out.filter(Boolean).join("\n\n") + "\n";
}

export function exportPackageMarkdown(pkg: TourPackage) {
  downloadBlob(new Blob([packageToMarkdown(pkg)], { type: "text/markdown;charset=utf-8" }), `${safeFileName(`${pkg.code} ${pkg.title}`)}.md`);
}
