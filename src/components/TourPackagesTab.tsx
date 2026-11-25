import { useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import type { Lead, PackageStatus } from "../types";
import { packageStore, usePackages } from "../lib/packageStore";
import { durationOf, dateShort, isOptionComplete } from "../lib/packageLogic";
import { fmtDate, fmtDateTime } from "../lib/format";
import TourPackageEditor from "./TourPackageEditor";

export const STATUS_STYLE: Record<PackageStatus, string> = {
  Unverified: "bg-orange-500 text-white",
  Verified: "bg-emerald-600 text-white",
  Revised: "bg-indigo-600 text-white",
};

export default function TourPackagesTab({ lead }: { lead: Lead }) {
  const packages = usePackages(lead.id);
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = packages.find((p) => p.id === openId) ?? null;
  const canCreate = Boolean(lead.id);

  const create = () => setOpenId(packageStore.create(lead).id);
  const remove = (id: string, code: string) => {
    if (window.confirm(`Xoá tour package ${code}?`)) packageStore.remove(id);
  };

  return (
    <div className="p-5">
      <div className="rounded-lg border border-line">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <div>
            <h3 className="font-bold">Tour Packages</h3>
            <p className="text-gray-500">Show {packages.length} Tour Package</p>
          </div>
          <button
            onClick={create}
            disabled={!canCreate}
            title={canCreate ? undefined : "Lưu lead trước khi tạo tour package"}
            className="ml-auto flex items-center gap-1.5 rounded bg-brand px-3 py-2 text-[11px] font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={13} /> NEW TOUR PACKAGE
          </button>
        </div>

        {!canCreate && <p className="px-4 py-6 text-center text-gray-500">Hãy lưu lead trước, sau đó mới tạo được tour package.</p>}
        {canCreate && packages.length === 0 && (
          <p className="px-4 py-10 text-center text-gray-500">Lead này chưa có tour package. Bấm <b>NEW TOUR PACKAGE</b> để tạo.</p>
        )}

        {packages.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5">#</th><th className="px-2">Code</th><th className="px-2">Title</th>
                  <th className="px-2">Duration</th><th className="px-2">Status</th><th className="px-2">Valid date</th>
                  <th className="px-2">Note</th><th className="px-2" />
                </tr>
              </thead>
              <tbody>
                {packages.map((p, i) => (
                  <tr key={p.id} className="border-b border-line align-top last:border-0 hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-2 py-3 font-medium">{p.code}</td>
                    <td className="px-2 py-3">
                      <button onClick={() => setOpenId(p.id)} className="text-left font-bold text-brand hover:underline">{p.title || "(chưa đặt tên)"}</button>
                      <div className="mt-1 text-[11px] text-gray-400">
                        {p.days.length} ngày · {p.options.filter((o) => o.nights.length > 0 && isOptionComplete(o)).length}/{p.options.length} phương án khách sạn đủ
                        {p.travelDate ? ` · khởi hành ${dateShort(new Date(p.travelDate + "T00:00:00"))}` : ""}
                      </div>
                      <div className="text-[11px] text-gray-400">{p.createdBy} · cập nhật {fmtDateTime(p.updatedAt)}</div>
                    </td>
                    <td className="px-2 py-3">
                      {p.days.length > 0 && <span className="rounded bg-emerald-500 px-2 py-1 text-[12px] font-bold text-white">{durationOf(p.days.length)}</span>}
                    </td>
                    <td className="px-2 py-3"><span className={`rounded px-2 py-1 text-[12px] font-semibold ${STATUS_STYLE[p.status]}`}>{p.status}</span></td>
                    <td className="px-2 py-3 text-red-500">{p.validDate ? fmtDate(p.validDate) : "---"}</td>
                    <td className="max-w-[200px] px-2 py-3 text-gray-600">{p.note || "---"}</td>
                    <td className="whitespace-nowrap px-2 py-3">
                      <button aria-label="Mở tour package" onClick={() => setOpenId(p.id)} className="rounded p-1.5 text-gray-500 hover:bg-panel"><Eye size={15} /></button>
                      <button aria-label="Xoá tour package" onClick={() => remove(p.id, p.code)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {opened && <TourPackageEditor key={opened.id} pkg={opened} onClose={() => setOpenId(null)} />}
    </div>
  );
}
