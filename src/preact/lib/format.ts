export function formatNumber(value: number, lang?: string | null): string {
  const formatter = new Intl.NumberFormat(lang || undefined);
  return formatter.format(value);
}

function toDate(value: string, mode?: "date" | "time" | "datetime"): Date | undefined {
  if (!value) return undefined;
  if (mode === "time") {
    const maybe = new Date(`1970-01-01T${value}`);
    return Number.isNaN(maybe.getTime()) ? undefined : maybe;
  }
  const maybe = mode === "datetime" ? new Date(value) : new Date(value);
  return Number.isNaN(maybe.getTime()) ? undefined : maybe;
}

export function formatDateInput(value: string, mode: "date" | "time" | "datetime" | undefined, lang?: string | null): string | undefined {
  const date = toDate(value, mode === "datetime" ? "datetime" : mode);
  if (!date) return undefined;
  const options: Intl.DateTimeFormatOptions = {};
  if (mode === "time") {
    options.timeStyle = "short";
  } else if (mode === "datetime") {
    options.dateStyle = "medium";
    options.timeStyle = "short";
  } else {
    options.dateStyle = "medium";
  }
  return new Intl.DateTimeFormat(lang || undefined, options).format(date);
}
