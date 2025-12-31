import { html } from "htm/preact";
import type { VNode } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { formatDateInput } from "../../lib/format";
import { buildFieldStyles } from "../styles/fieldStyles";

export type DatePickerControl = UiControl & {
  name?: string;
  label?: string;
  mode?: "date" | "time" | "datetime";
  value?: string;
  className?: string;
  min?: string;
  max?: string;
  required?: boolean;
  error?: string;
};

export function resolveDateInputType(mode?: string): "date" | "time" | "datetime-local" {
  if (mode === "time") return "time";
  if (mode === "datetime") return "datetime-local";
  return "date";
}

// Calendar helper functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYYYYMMDD(str: string): Date | null {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type CalendarProps = {
  value: string;
  min?: string;
  max?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  t: (key: string, fallback: string, vars?: Record<string, unknown>) => string;
  lang: string;
};

function Calendar({ value, min, max, onSelect, onClose, t, lang }: CalendarProps): VNode {
  const today = new Date();
  const initialDate = parseYYYYMMDD(value) || today;
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [focusedDay, setFocusedDay] = useState<number>(initialDate.getDate());
  const gridRef = useRef<HTMLTableElement>(null);

  const minDate = min ? parseYYYYMMDD(min) : null;
  const maxDate = max ? parseYYYYMMDD(max) : null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const isDateDisabled = useCallback((year: number, month: number, day: number): boolean => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }, [minDate, maxDate]);

  const isDateSelected = useCallback((year: number, month: number, day: number): boolean => {
    const selected = parseYYYYMMDD(value);
    if (!selected) return false;
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
  }, [value]);

  const isToday = useCallback((year: number, month: number, day: number): boolean => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  }, []);

  // Keyboard navigation for calendar grid
  const handleGridKeyDown = useCallback((e: KeyboardEvent) => {
    let newDay = focusedDay;
    let newMonth = viewMonth;
    let newYear = viewYear;
    let handled = false;

    switch (e.key) {
      case "ArrowLeft":
        newDay = focusedDay - 1;
        handled = true;
        break;
      case "ArrowRight":
        newDay = focusedDay + 1;
        handled = true;
        break;
      case "ArrowUp":
        newDay = focusedDay - 7;
        handled = true;
        break;
      case "ArrowDown":
        newDay = focusedDay + 7;
        handled = true;
        break;
      case "Home":
        newDay = 1;
        handled = true;
        break;
      case "End":
        newDay = daysInMonth;
        handled = true;
        break;
      case "PageUp":
        // Previous month
        if (e.shiftKey) {
          newYear = viewYear - 1;
        } else {
          newMonth = viewMonth - 1;
          if (newMonth < 0) {
            newMonth = 11;
            newYear = viewYear - 1;
          }
        }
        handled = true;
        break;
      case "PageDown":
        // Next month
        if (e.shiftKey) {
          newYear = viewYear + 1;
        } else {
          newMonth = viewMonth + 1;
          if (newMonth > 11) {
            newMonth = 0;
            newYear = viewYear + 1;
          }
        }
        handled = true;
        break;
      case "Enter":
      case " ":
        if (!isDateDisabled(viewYear, viewMonth, focusedDay)) {
          const dateStr = formatYYYYMMDD(new Date(viewYear, viewMonth, focusedDay));
          onSelect(dateStr);
          onClose();
        }
        handled = true;
        break;
      case "Escape":
        onClose();
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();

      // Handle month boundary crossing
      if (newDay < 1) {
        newMonth--;
        if (newMonth < 0) {
          newMonth = 11;
          newYear--;
        }
        newDay = getDaysInMonth(newYear, newMonth) + newDay;
      } else if (newDay > getDaysInMonth(newYear, newMonth)) {
        newDay = newDay - getDaysInMonth(newYear, newMonth);
        newMonth++;
        if (newMonth > 11) {
          newMonth = 0;
          newYear++;
        }
      }

      if (newYear !== viewYear) setViewYear(newYear);
      if (newMonth !== viewMonth) setViewMonth(newMonth);
      setFocusedDay(Math.max(1, Math.min(newDay, getDaysInMonth(newYear, newMonth))));
    }
  }, [focusedDay, viewMonth, viewYear, daysInMonth, isDateDisabled, onSelect, onClose]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (day: number) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    const dateStr = formatYYYYMMDD(new Date(viewYear, viewMonth, day));
    onSelect(dateStr);
    onClose();
  };

  const handleToday = () => {
    const dateStr = formatYYYYMMDD(today);
    if (!isDateDisabled(today.getFullYear(), today.getMonth(), today.getDate())) {
      onSelect(dateStr);
      onClose();
    }
  };

  const handleClear = () => {
    onSelect("");
    onClose();
  };

  // Build calendar grid
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  
  // Fill in empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }
  
  // Fill in days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Fill in remaining empty cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Get localized month name if possible
  const monthName = (() => {
    try {
      return new Intl.DateTimeFormat(lang, { month: "long" }).format(new Date(viewYear, viewMonth, 1));
    } catch {
      return MONTH_NAMES[viewMonth];
    }
  })();

  return html`<div class="nr-dashboard-calendar" onClick=${(e: Event) => e.stopPropagation()}>
    <div class="nr-dashboard-calendar__header">
      <button
        type="button"
        class="nr-dashboard-calendar__nav"
        onClick=${handlePrevMonth}
        aria-label=${t("calendar_prev_month", "Previous month")}
      >
        <i class="fa fa-chevron-left" aria-hidden="true"></i>
      </button>
      <span class="nr-dashboard-calendar__title">${monthName} ${viewYear}</span>
      <button
        type="button"
        class="nr-dashboard-calendar__nav"
        onClick=${handleNextMonth}
        aria-label=${t("calendar_next_month", "Next month")}
      >
        <i class="fa fa-chevron-right" aria-hidden="true"></i>
      </button>
    </div>
    <table 
      ref=${gridRef}
      class="nr-dashboard-calendar__grid" 
      role="grid"
      tabIndex=${0}
      onKeyDown=${handleGridKeyDown}
      aria-label=${t("calendar_grid", "Calendar")}
    >
      <thead>
        <tr>
          ${DAY_NAMES.map((d) => html`<th class="nr-dashboard-calendar__day-header" scope="col">${d}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${weeks.map((week) => html`<tr>
          ${week.map((day) => day === null
            ? html`<td class="nr-dashboard-calendar__cell nr-dashboard-calendar__cell--empty" role="gridcell"></td>`
            : html`<td
                class=${`nr-dashboard-calendar__cell ${isDateSelected(viewYear, viewMonth, day) ? "is-selected" : ""} ${isToday(viewYear, viewMonth, day) ? "is-today" : ""} ${day === focusedDay ? "is-focused" : ""} ${isDateDisabled(viewYear, viewMonth, day) ? "is-disabled" : ""}`.trim()}
                onClick=${() => handleDayClick(day)}
                role="gridcell"
                aria-selected=${isDateSelected(viewYear, viewMonth, day)}
                aria-disabled=${isDateDisabled(viewYear, viewMonth, day)}
              >
                <span>${day}</span>
              </td>`
          )}
        </tr>`)}
      </tbody>
    </table>
    <div class="nr-dashboard-calendar__footer">
      <button
        type="button"
        class="nr-dashboard-calendar__btn"
        onClick=${handleToday}
      >
        ${t("calendar_today", "Today")}
      </button>
      <button
        type="button"
        class="nr-dashboard-calendar__btn nr-dashboard-calendar__btn--clear"
        onClick=${handleClear}
      >
        ${t("calendar_clear", "Clear")}
      </button>
    </div>
  </div>`;
}

export function DatePickerWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const c = control as DatePickerControl;
  const { t, lang } = useI18n();
  const label = c.label || c.name || t("date_label", "Date {index}", { index: index + 1 });
  const [value, setValue] = useState<string>(c.value || "");
  const [error, setError] = useState<string>("");
  const [focused, setFocused] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useMemo(() => `nr-dashboard-date-${index}`, [index]);
  const isDisabled = Boolean(disabled);

  const inputType = resolveDateInputType(c.mode);
  const showCalendar = c.mode !== "time"; // Only show calendar for date/datetime modes

  // Sync from external value changes
  useEffect(() => {
    if (c.value !== undefined) {
      setValue(c.value);
    }
  }, [c.value]);

  // Close calendar when clicking outside
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarOpen]);

  const validate = (next: string): boolean => {
    if (c.required && next.trim().length === 0) {
      setError(c.error || t("error_required", "A value is required."));
      return false;
    }
    if (c.min && next && next < c.min) {
      setError(c.error || t("error_min", "Value is before the allowed range."));
      return false;
    }
    if (c.max && next && next > c.max) {
      setError(c.error || t("error_max", "Value is after the allowed range."));
      return false;
    }
    setError("");
    return true;
  };

  const handleInputChange = (e: Event) => {
    if (isDisabled) return;
    const v = (e.target as HTMLInputElement).value;
    setValue(v);
    if (!validate(v)) return;
    onEmit?.("update-value", { id: c.id, value: { payload: v, type: "date-picker" } });
  };

  const handleCalendarSelect = (dateStr: string) => {
    setValue(dateStr);
    if (!validate(dateStr)) return;
    onEmit?.("update-value", { id: c.id, value: { payload: dateStr, type: "date-picker" } });
  };

  const toggleCalendar = () => {
    if (isDisabled) return;
    setIsCalendarOpen(!isCalendarOpen);
  };

  const fieldStyles = buildFieldStyles({ error: Boolean(error), focused, disabled: isDisabled, hasAdornment: true });

  return html`<div ref=${containerRef} class="nr-dashboard-date-picker__container">
    <div class="nr-dashboard-date-picker__row">
      <label for=${inputId} class="nr-dashboard-date-picker__label">${label}</label>
      <div class="nr-dashboard-date-picker__input-container">
        <input
          id=${inputId}
          class=${`nr-dashboard-date-picker__input ${c.className || ""}`.trim()}
          type=${inputType}
          value=${value}
          disabled=${isDisabled}
          lang=${lang}
          aria-invalid=${error ? "true" : "false"}
          aria-errormessage=${error ? `err-date-${index}` : undefined}
          aria-valuetext=${formatDateInput(value, c.mode, lang) || undefined}
          onInput=${handleInputChange}
          onFocus=${() => {
            setFocused(true);
          }}
          onBlur=${() => setFocused(false)}
          onClick=${() => {
            if (showCalendar && !isDisabled) setIsCalendarOpen(true);
          }}
          style=${fieldStyles}
          min=${c.min || undefined}
          max=${c.max || undefined}
        />
        ${showCalendar ? html`<button
          type="button"
          class="nr-dashboard-date-picker__icon"
          onClick=${toggleCalendar}
          aria-label=${t("calendar_toggle", "Open calendar")}
          disabled=${isDisabled}
        >
          <i class="fa fa-calendar" aria-hidden="true"></i>
        </button>` : html`<span class="nr-dashboard-date-picker__icon" aria-hidden="true">
          <i class="fa fa-clock-o" aria-hidden="true"></i>
        </span>`}
      </div>
    </div>
    ${isCalendarOpen && showCalendar ? html`<${Calendar}
      value=${value}
      min=${c.min}
      max=${c.max}
      onSelect=${handleCalendarSelect}
      onClose=${() => setIsCalendarOpen(false)}
      t=${t}
      lang=${lang}
    />` : null}
    ${error
      ? html`<span
          id=${`err-date-${index}`}
          role="alert"
          class="nr-dashboard-date-picker__error"
        >${error}</span>`
      : null}
  </div>`;
}
