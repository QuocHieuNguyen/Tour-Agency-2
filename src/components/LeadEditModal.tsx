import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  Bell, Check, Info, Layers, Paperclip, Plus, RefreshCw, Save, ScrollText, Receipt, Ticket, Package, X,
} from "lucide-react";
import { FOLLOW_LEVELS, type Lead } from "../types";
import {
  CAMPAIGNS, CSKH_REAL_DEMAND, LEAD_VERIFY_STATUS, SALE_REAL_DEMAND, SOURCES, STAFF,
} from "../data/options";
import { fmtDateTime } from "../lib/format";
import { usePackages } from "../lib/packageStore";
import TourPackagesTab from "./TourPackagesTab";

interface Props {
  lead: Lead;
  onSave: (lead: Lead) => Promise<Lead>;
  onClose: () => void;
}

type Tab = "info" | "packages" | "invoices" | "vouchers" | "logs";

export default function LeadEditModal({ lead, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Lead>(lead);
  const [saved, setSaved] = useState<Lead>(lead);
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving] = useState(false);
  const [newReminder, setNewReminder] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [showErrors, setShowErrors] = useState(false);
  const isNew = !draft.id;
  const sourceError = showErrors && !draft.source.trim();
  const pkgCount = usePackages(draft.id).length;

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = <K extends keyof Lead>(key: K, value: Lead[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const requestClose = () => {
    if (dirty && !window.confirm("Có thay đổi chưa lưu. Đóng và bỏ thay đổi?")) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const save = async () => {
    if (!draft.source.trim()) {
      setShowErrors(true);
      setTab("info");
      return;
    }
    setSaving(true);
    try {
      const result = await onSave(draft);
      setSaved(result);
      setDraft(result);
    } finally {
      setSaving(false);
    }
  };

  const addReminder = () => {
    const text = newReminder.trim();
    if (!text) return;
    set("reminders", [...draft.reminders, { id: crypto.randomUUID(), text, done: false, createdAt: new Date().toISOString() }]);
    setNewReminder("");
  };

  const tabs: { id: Tab; label: string; icon: ReactNode; badge?: number }[] = [
    { id: "info", label: "Information", icon: <Info size={14} /> },
    { id: "packages", label: "Tour Packages", icon: <Package size={14} />, badge: pkgCount },
    { id: "invoices", label: "Invoices", icon: <Receipt size={14} /> },
    { id: "vouchers", label: "Vouchers", icon: <Ticket size={14} /> },
    { id: "logs", label: "Follow Logs", icon: <ScrollText size={14} /> },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-3 md:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-label={`Edit lead ${draft.code}`}
        className="flex max-h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.18 }}
      >
        {/* header */}
        <div className="flex items-start gap-4 border-b border-line px-5 pt-4">
          <div>
            <div className="text-[12px] font-bold">{isNew ? "NEW LEAD" : "EDIT LEAD"}</div>
            <div className="py-1 text-base font-bold">{draft.code || "Mã tự sinh khi lưu"}</div>
          </div>
          <button onClick={requestClose} aria-label="Close" className="ml-auto rounded p-1.5 hover:bg-panel"><X size={20} /></button>
        </div>
        <div className="flex gap-5 border-b border-line px-5">
          {tabs.map((t) => (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 py-2.5 text-[12px] font-semibold ${tab === t.id ? "border-brand text-brand" : "border-transparent text-gray-600 hover:text-ink"}`}
            >
              {t.icon} {t.label}
              {t.badge ? <span className="grid size-4 place-items-center rounded-full bg-gray-700 text-[10px] text-white">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto">
          {tab === "packages" ? (
            <TourPackagesTab lead={draft} />
          ) : tab !== "info" ? (
            <div className="grid h-72 place-items-center text-gray-500">Tab này sẽ được build ở bước sau.</div>
          ) : (
            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_480px]">
              {/* LEFT */}
              <div className="space-y-5">
                <Section title="Customer">
                  <div className="grid gap-4 md:grid-cols-[2fr_1.2fr_1.5fr]">
                    <Field label="Customer"><input className="field" value={draft.customer} onChange={(e) => set("customer", e.target.value)} /></Field>
                    <Field label="Phone no"><input className="field" value={draft.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                    <Field label="Email"><input type="email" className="field" value={draft.email} onChange={(e) => set("email", e.target.value)} /></Field>
                  </div>
                </Section>

                <Section title="Trip">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Number of Paxs"><input type="number" min={0} className="field" value={draft.paxs} onChange={(e) => set("paxs", Number(e.target.value))} /></Field>
                    <Field label="Travel Date"><input type="date" className="field" value={draft.travelDate} onChange={(e) => set("travelDate", e.target.value)} /></Field>
                    <Field label="Duration"><input className="field" placeholder="vd: 6N 7D" value={draft.duration} onChange={(e) => set("duration", e.target.value)} /></Field>
                  </div>
                  <Field label="Destinations" className="mt-4"><textarea rows={3} className="field resize-y" value={draft.destinations} onChange={(e) => set("destinations", e.target.value)} /></Field>
                </Section>

                <Section title="Source">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Lead Code"><input className="field" disabled value={draft.code || "Tự sinh khi lưu"} /></Field>
                    <Field label={<>Source <span className="text-red-500">*</span></>} error={sourceError ? "Vui lòng chọn Source" : undefined}>
                      <Select value={draft.source} onChange={(v) => set("source", v)} options={SOURCES} placeholder="--- Select Source ---" invalid={sourceError} />
                    </Field>
                    <Field label="Campaign">
                      <Select value={draft.campaign} onChange={(v) => set("campaign", v)} options={CAMPAIGNS} placeholder="--- Select Campain ---" />
                    </Field>
                  </div>
                </Section>

                <Section title="Request">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Details">
                      <textarea rows={5} className="field resize-y !border-emerald-300 !bg-emerald-50 font-medium" value={draft.details} onChange={(e) => set("details", e.target.value)} />
                    </Field>
                    <Field label="Note">
                      <textarea rows={5} className="field resize-y !border-amber-300 !bg-amber-50" value={draft.note} onChange={(e) => set("note", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Attachments" className="mt-4">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                      className="rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center"
                    >
                      <p className="text-gray-600">Drag &amp; drop, or click to upload file(s)</p>
                      <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 inline-flex items-center gap-1.5 rounded border border-brand px-3 py-1.5 text-[11px] font-bold text-brand hover:bg-blue-50">
                        <Paperclip size={12} /> FROM LOCAL
                      </button>
                      <input ref={fileRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                      {draft.attachments.length > 0 && (
                        <ul className="mt-3 flex flex-wrap justify-center gap-2">
                          {draft.attachments.map((name) => (
                            <li key={name} className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[12px] shadow-sm ring-1 ring-line">
                              {name}
                              <button aria-label={`Xoá ${name}`} onClick={() => set("attachments", draft.attachments.filter((n) => n !== name))}><X size={12} /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-2 text-[11px] text-gray-400">Session data: chỉ lưu tên file. Nội dung file sẽ lưu vào Supabase Storage / Google Drive sau.</p>
                    </div>
                  </Field>
                </Section>
              </div>

              {/* RIGHT */}
              <div className="space-y-5">
                <Section title="Follow-up">
                  <Field label="Status">
                    <select className="field !w-auto" value={draft.followLevel} onChange={(e) => set("followLevel", e.target.value as Lead["followLevel"])}>
                      {FOLLOW_LEVELS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="CSKH Real Demand Status" className="mt-3"><Select value={draft.cskhRealDemand} onChange={(v) => set("cskhRealDemand", v)} options={CSKH_REAL_DEMAND} /></Field>
                  <Field label="Sale Real Demand Status" className="mt-3"><Select value={draft.saleRealDemand} onChange={(v) => set("saleRealDemand", v)} options={SALE_REAL_DEMAND} /></Field>
                  <Field label="Lead Verify Status (CSKH)" className="mt-3"><Select value={draft.leadVerifyStatus} onChange={(v) => set("leadVerifyStatus", v)} options={LEAD_VERIFY_STATUS} /></Field>
                </Section>

                <Section title="Assignments">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Sales"><Select value={draft.sales} onChange={(v) => set("sales", v)} options={STAFF} /></Field>
                    <Field label="Customer Care"><Select value={draft.customerCare} onChange={(v) => set("customerCare", v)} options={STAFF} placeholder="— Chưa gán —" /></Field>
                  </div>
                </Section>

                <Section title="Reminders">
                  <div className="flex gap-2">
                    <input className="field" placeholder="Thêm reminder…" value={newReminder} onChange={(e) => setNewReminder(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addReminder()} />
                    <button onClick={addReminder} className="flex items-center gap-1 rounded bg-brand px-3 text-[11px] font-bold text-white hover:bg-brand-dark"><Plus size={13} /> ADD</button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {draft.reminders.map((r) => (
                      <li key={r.id} className="flex items-center gap-2 rounded border border-line px-2 py-1.5">
                        <button
                          aria-label={r.done ? "Đánh dấu chưa xong" : "Đánh dấu xong"}
                          onClick={() => set("reminders", draft.reminders.map((x) => x.id === r.id ? { ...x, done: !x.done } : x))}
                          className={`grid size-4 place-items-center rounded border ${r.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300"}`}
                        >{r.done && <Check size={11} />}</button>
                        <span className={`flex-1 ${r.done ? "text-gray-400 line-through" : ""}`}>{r.text}</span>
                        <button aria-label="Xoá reminder" onClick={() => set("reminders", draft.reminders.filter((x) => x.id !== r.id))}><X size={13} className="text-gray-400" /></button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 flex gap-2 rounded border-l-4 border-amber-400 bg-amber-50 p-2 text-[12px] text-amber-700">
                    <Bell size={14} className="mt-0.5 shrink-0" />
                    Reminder giúp bạn không bỏ sót việc quan trọng. Hãy cập nhật trạng thái reminder sau mỗi lần xử lý công việc.
                  </p>
                </Section>

                <Section title="Flags">
                  <div className="grid grid-cols-2 gap-y-3">
                    <Toggle label="Postpone" checked={draft.postpone} onChange={(v) => set("postpone", v)} />
                    <Toggle label="Called" checked={draft.called} onChange={(v) => set("called", v)} />
                    <Toggle label="Fully customized prices" checked={draft.fullyCustomizedPrices} onChange={(v) => set("fullyCustomizedPrices", v)} />
                  </div>
                </Section>

                {!isNew && (
                  <Section title="Activity">
                    <dl className="space-y-1 text-gray-500">
                      <div>Created by <b className="text-ink">{draft.createdBy}</b></div>
                      <div>Created: {fmtDateTime(draft.createdAt)}</div>
                      <div>Updated: {fmtDateTime(draft.updatedAt)}</div>
                    </dl>
                  </Section>
                )}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center gap-3 border-t border-line bg-white px-5 py-3">
          <div className="text-[12px] text-gray-500">
            <b className="text-ink">{draft.createdBy}</b> – B2B ITE
            {dirty && <span className="ml-3 font-semibold text-amber-600">● Chưa lưu</span>}
          </div>
          <div className="ml-auto flex gap-2">
            <FooterBtn onClick={() => setDraft(saved)} icon={<RefreshCw size={13} />} label="REFRESH" disabled={!dirty} />
            <FooterBtn onClick={requestClose} icon={<X size={13} />} label="CLOSE" />
            <button onClick={save} disabled={(!dirty && !isNew) || saving} className="flex items-center gap-1.5 rounded bg-brand px-4 py-2 text-[11px] font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
              <Save size={13} /> {saving ? "SAVING…" : "SAVE LEAD"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  function addFiles(files: FileList | null) {
    if (!files) return;
    const names = Array.from(files).map((f) => f.name).filter((n) => !draft.attachments.includes(n));
    if (names.length) set("attachments", [...draft.attachments, ...names]);
  }
}

/* ---------- small UI helpers ---------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 rounded bg-panel px-3 py-2 font-bold"><Layers size={14} className="text-brand" /> {title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children, className = "", error }: { label: ReactNode; children: ReactNode; className?: string; error?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-[12px] font-medium text-red-600">{error}</span>}
    </label>
  );
}

function Select({ value, onChange, options, placeholder = "— Chọn —", invalid }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; invalid?: boolean }) {
  return (
    <select className="field" aria-invalid={invalid || undefined} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-semibold text-gray-700">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-4 w-8 rounded-full bg-gray-300 transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 after:absolute after:left-0.5 after:top-0.5 after:size-3 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
      {label}
    </label>
  );
}

function FooterBtn({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-1.5 rounded border border-line px-4 py-2 text-[11px] font-bold text-gray-700 hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50">
      {icon} {label}
    </button>
  );
}
