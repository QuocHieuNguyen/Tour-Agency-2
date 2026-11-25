import { useSyncExternalStore } from "react";

export interface Toast { id: number; message: string }

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

export function dismiss(id: number) { toasts = toasts.filter((t) => t.id !== id); emit(); }

export function notify(message: string) {
  const id = ++seq;
  toasts = [...toasts, { id, message }];
  emit();
  setTimeout(() => dismiss(id), 9000);
}

export const useToasts = () =>
  useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => toasts);
