export type PayloadType = "str" | "num" | "bool" | "json" | "date" | "bin" | string | undefined;

export function resolveTypedPayload(value: unknown, type?: PayloadType): unknown {
  const t = (type || "str").toString();
  if (t === "date") return Date.now();
  if (t === "num" || t === "number") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
    if (typeof value === "string" && value.trim() === "") return 0;
    return value;
  }
  if (t === "bool" || t === "boolean") {
    if (value === "false" || value === 0 || value === "0") return false;
    return Boolean(value ?? true);
  }
  if (t === "json") {
    if (typeof value === "object" && value !== null) return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (t === "bin") {
    if (value instanceof Uint8Array) return value;
    if (typeof value === "string") {
      try {
        return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
      } catch {
        return value;
      }
    }
    return value;
  }
  // default string passthrough
  return value;
}
