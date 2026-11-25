export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Tên file an toàn cho Windows/macOS */
export const safeFileName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "-").trim();
