import { useEffect, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  submitLabel?: string;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/** Popup form dùng chung cho các trang CRUD */
export default function FormModal({ title, submitLabel = "LƯU", onSubmit, onClose, children, wide }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form role="dialog" aria-modal="true" aria-label={title} onSubmit={submit} className={`my-6 w-full ${wide ? "max-w-3xl" : "max-w-xl"} rounded-lg bg-white shadow-2xl`}>
        <div className="flex items-center border-b border-line px-5 py-3">
          <h2 className="text-base font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="ml-auto rounded p-1.5 hover:bg-panel"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="rounded border border-line px-4 py-2 text-[11px] font-bold hover:bg-panel">HUỶ</button>
          <button type="submit" className="rounded bg-brand px-4 py-2 text-[11px] font-bold text-white hover:bg-brand-dark">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

export function Field({ label, children, required, error }: { label: string; children: ReactNode; required?: boolean; error?: string }) {
  return (
    <label className="block">
      <span className="label">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-[12px] font-medium text-red-600">{error}</span>}
    </label>
  );
}
