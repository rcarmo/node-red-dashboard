import { html } from "htm/preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type DropdownOption = { label: string; value: unknown; type?: string; disabled?: boolean };
export type DropdownControl = UiControl & {
  label?: string;
  name?: string;
  options?: DropdownOption[];
  multiple?: boolean;
  place?: string;
  tooltip?: string;
  className?: string;
  topic?: string;
  value?: unknown;
  resetSelection?: boolean;
};

function parseOptionValue(val: string, type?: string): unknown {
  if (!type || type.startsWith("str")) return val;
  if (type === "number" || type === "num") {
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }
  if (type === "json") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function serializeOptionValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

function inferType(opt?: DropdownOption): string | undefined {
  if (!opt) return undefined;
  if (opt.type) return opt.type;
  if (typeof opt.value === "number") return "number";
  if (typeof opt.value === "string") return "string";
  return "json";
}

function parseWithOptions(raw: string, opts: DropdownOption[]): unknown {
  const matched = opts.find((o) => serializeOptionValue(o.value) === raw);
  return parseOptionValue(raw, inferType(matched));
}

function normalizeValue(value: unknown, opts: DropdownOption[], multiple: boolean): unknown {
  if (multiple) {
    if (Array.isArray(value)) {
      return value.map((v) => parseWithOptions(serializeOptionValue(v), opts));
    }
    if (value === null || value === undefined || value === "") return [];
    if (typeof value === "string") {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => parseWithOptions(v, opts));
    }
    return [value];
  }
  if (value === undefined) return null;
  if (value === "") return null;
  const serialized = serializeOptionValue(value);
  return parseWithOptions(serialized, opts);
}

export function buildDropdownEmit(ctrl: DropdownControl, fallbackLabel: string, value: unknown): Record<string, unknown> {
  return {
    id: ctrl.id,
    value: {
      payload: value,
      topic: ctrl.topic ?? fallbackLabel,
      type: "dropdown",
    },
  };
}

// Threshold for showing search filter (matches Angular behavior)
const SEARCH_THRESHOLD = 7;

export function DropdownWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asDrop = control as DropdownControl;
  const { t } = useI18n();
  const label = asDrop.label || asDrop.name || t("dropdown_label", "Select {index}", { index: index + 1 });
  const labelHtml = { __html: label as string };
  const opts = useMemo(() => asDrop.options ?? [], [asDrop.options]);
  const multiple = Boolean(asDrop.multiple);
  const [value, setValue] = useState<unknown>(normalizeValue(asDrop.value, opts, multiple));
  const lastReset = useRef<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Show search when more than threshold options
  const showSearch = opts.length > SEARCH_THRESHOLD;

  // Filter options by search term
  const filteredOpts = useMemo(() => {
    if (!searchTerm.trim()) return opts;
    const term = searchTerm.toLowerCase();
    return opts.filter((opt) => {
      const labelText = String(opt.label ?? opt.value).toLowerCase();
      return labelText.includes(term);
    });
  }, [opts, searchTerm]);

  // Check if all non-disabled options are selected
  const enabledOpts = useMemo(() => opts.filter((o) => !o.disabled), [opts]);
  const allSelected = useMemo(() => {
    if (!multiple || !Array.isArray(value)) return false;
    return enabledOpts.every((opt) =>
      (value as unknown[]).some((v) => serializeOptionValue(v) === serializeOptionValue(opt.value))
    );
  }, [multiple, value, enabledOpts]);

  useEffect(() => {
    const normalized = normalizeValue(asDrop.value, opts, multiple);
    if (multiple) {
      const filtered = (normalized as unknown[]).filter((v) =>
        opts.some((o) => serializeOptionValue(o.value) === serializeOptionValue(v)),
      );
      setValue(filtered);
    } else {
      const exists = opts.some((o) => serializeOptionValue(o.value) === serializeOptionValue(normalized));
      setValue(exists ? normalized : null);
    }
  }, [asDrop.value, asDrop.resetSelection, multiple, opts]);

  useEffect(() => {
    if (asDrop.resetSelection && !lastReset.current) {
      setValue(multiple ? [] : null);
      lastReset.current = true;
    }
    if (!asDrop.resetSelection) {
      lastReset.current = false;
    }
  }, [asDrop.resetSelection, multiple]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        // Emit on close for multiple mode (batch selection)
        if (multiple && onEmit) {
          onEmit("update-value", buildDropdownEmit(asDrop, label, value));
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, multiple, onEmit, asDrop, label, value]);

  // Focus search input when opening; reset focusedIndex
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
      if (showSearch && searchRef.current) {
        searchRef.current.focus();
      }
    }
  }, [isOpen, showSearch]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (isOpen) {
      setSearchTerm("");
      // Emit on close for multiple mode
      if (multiple && onEmit) {
        onEmit("update-value", buildDropdownEmit(asDrop, label, value));
      }
    }
  };

  const handleOptionClick = useCallback((opt: DropdownOption) => {
    if (opt.disabled) return;
    const optValue = parseOptionValue(serializeOptionValue(opt.value), inferType(opt));

    if (multiple) {
      const arr = Array.isArray(value) ? (value as unknown[]) : [];
      const exists = arr.some((v) => serializeOptionValue(v) === serializeOptionValue(optValue));
      const newValue = exists
        ? arr.filter((v) => serializeOptionValue(v) !== serializeOptionValue(optValue))
        : [...arr, optValue];
      setValue(newValue);
      // Don't emit immediately in multiple mode - emit on close
    } else {
      setValue(optValue);
      setIsOpen(false);
      setSearchTerm("");
      if (onEmit) onEmit("update-value", buildDropdownEmit(asDrop, label, optValue));
    }
  }, [multiple, value, onEmit, asDrop, label]);

  const handleSelectAll = useCallback(() => {
    if (!multiple) return;
    if (allSelected) {
      setValue([]);
    } else {
      const allValues = enabledOpts.map((opt) =>
        parseOptionValue(serializeOptionValue(opt.value), inferType(opt))
      );
      setValue(allValues);
    }
  }, [multiple, allSelected, enabledOpts]);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      setFocusedIndex(-1);
    } else if (e.key === "Enter") {
      if (!isOpen) {
        setIsOpen(true);
      } else if (focusedIndex >= 0 && focusedIndex < filteredOpts.length) {
        const opt = filteredOpts[focusedIndex];
        if (!opt.disabled) {
          handleOptionClick(opt);
        }
      }
    } else if (e.key === " " && !showSearch) {
      // Space toggles when not in search mode
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (focusedIndex >= 0 && focusedIndex < filteredOpts.length) {
        e.preventDefault();
        const opt = filteredOpts[focusedIndex];
        if (!opt.disabled) {
          handleOptionClick(opt);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        // Find next non-disabled option
        let next = focusedIndex + 1;
        while (next < filteredOpts.length && filteredOpts[next].disabled) {
          next++;
        }
        if (next < filteredOpts.length) {
          setFocusedIndex(next);
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        // Find previous non-disabled option
        let prev = focusedIndex - 1;
        while (prev >= 0 && filteredOpts[prev].disabled) {
          prev--;
        }
        if (prev >= 0) {
          setFocusedIndex(prev);
        }
      }
    } else if (e.key === "Home" && isOpen) {
      e.preventDefault();
      // Find first non-disabled option
      const first = filteredOpts.findIndex((o) => !o.disabled);
      if (first >= 0) setFocusedIndex(first);
    } else if (e.key === "End" && isOpen) {
      e.preventDefault();
      // Find last non-disabled option
      for (let i = filteredOpts.length - 1; i >= 0; i--) {
        if (!filteredOpts[i].disabled) {
          setFocusedIndex(i);
          break;
        }
      }
    }
  };

  // Build display text
  const displayText = useMemo(() => {
    if (multiple) {
      const arr = Array.isArray(value) ? (value as unknown[]) : [];
      if (arr.length === 0) return asDrop.place || t("dropdown_select", "Select...");
      if (arr.length === 1) {
        const match = opts.find((o) => serializeOptionValue(o.value) === serializeOptionValue(arr[0]));
        return match ? String(match.label ?? match.value) : String(arr[0]);
      }
      return t("dropdown_selected_count", "{count} selected", { count: arr.length });
    }
    if (value === null || value === undefined || value === "") {
      return asDrop.place || t("dropdown_select", "Select...");
    }
    const match = opts.find((o) => serializeOptionValue(o.value) === serializeOptionValue(value));
    return match ? String(match.label ?? match.value) : String(value);
  }, [value, multiple, opts, asDrop.place, t]);

  const isOptionSelected = useCallback((opt: DropdownOption): boolean => {
    if (multiple) {
      const arr = Array.isArray(value) ? (value as unknown[]) : [];
      return arr.some((v) => serializeOptionValue(v) === serializeOptionValue(opt.value));
    }
    return serializeOptionValue(value) === serializeOptionValue(opt.value);
  }, [value, multiple]);

  const showLabel = !(Number(asDrop.width) === 1) && label.length > 0;

  return html`<div
    ref=${containerRef}
    class=${`nr-dashboard-dropdown ${asDrop.className || ""} ${isOpen ? "is-open" : ""}`.trim()}
    title=${asDrop.tooltip || undefined}
    onKeyDown=${handleKeyDown}
  >
    ${showLabel ? html`<p class="nr-dashboard-dropdown__label" dangerouslySetInnerHTML=${labelHtml}></p>` : null}
    <div class="nr-dashboard-dropdown__field">
      <button
        type="button"
        class=${`nr-dashboard-dropdown__trigger ${isOpen ? "is-open" : ""}`.trim()}
        disabled=${Boolean(disabled)}
        onClick=${handleToggle}
        aria-haspopup="listbox"
        aria-expanded=${isOpen}
        aria-label=${label}
      >
        <span class="nr-dashboard-dropdown__value">${displayText}</span>
        <span class="nr-dashboard-dropdown__chevron" aria-hidden="true">▼</span>
      </button>
      ${isOpen ? html`<div 
        class="nr-dashboard-dropdown__menu" 
        role="listbox" 
        aria-multiselectable=${multiple}
        aria-activedescendant=${focusedIndex >= 0 ? `dropdown-opt-${control.id}-${focusedIndex}` : undefined}
      >
        ${showSearch ? html`<div class="nr-dashboard-dropdown__search">
          <input
            ref=${searchRef}
            type="text"
            class="nr-dashboard-dropdown__search-input"
            placeholder=${t("dropdown_search", "Search...")}
            value=${searchTerm}
            onInput=${(e: Event) => setSearchTerm((e.target as HTMLInputElement).value)}
            onClick=${(e: Event) => e.stopPropagation()}
            aria-label=${t("dropdown_search", "Search...")}
          />
        </div>` : null}
        ${multiple && enabledOpts.length > 1 ? html`<div class="nr-dashboard-dropdown__select-all">
          <label class="nr-dashboard-dropdown__option nr-dashboard-dropdown__option--all">
            <input
              type="checkbox"
              checked=${allSelected}
              onChange=${handleSelectAll}
              class="nr-dashboard-dropdown__checkbox"
            />
            <span>${allSelected ? t("dropdown_deselect_all", "Deselect all") : t("dropdown_select_all", "Select all")}</span>
          </label>
        </div>` : null}
        <ul class="nr-dashboard-dropdown__options">
          ${filteredOpts.length === 0
            ? html`<li class="nr-dashboard-dropdown__empty">${t("dropdown_no_results", "No results")}</li>`
            : filteredOpts.map((opt, idx) => {
                const selected = isOptionSelected(opt);
                const focused = idx === focusedIndex;
                return html`<li
                  ref=${(el: HTMLLIElement | null) => { optionRefs.current[idx] = el; }}
                  id=${`dropdown-opt-${control.id}-${idx}`}
                  key=${serializeOptionValue(opt.value)}
                  class=${`nr-dashboard-dropdown__option ${selected ? "is-selected" : ""} ${focused ? "is-focused" : ""} ${opt.disabled ? "is-disabled" : ""}`.trim()}
                  role="option"
                  aria-selected=${selected}
                  aria-disabled=${opt.disabled}
                  onClick=${() => handleOptionClick(opt)}
                >
                  ${multiple ? html`<input
                    type="checkbox"
                    checked=${selected}
                    disabled=${opt.disabled}
                    class="nr-dashboard-dropdown__checkbox"
                    tabIndex=${-1}
                    aria-hidden="true"
                  />` : null}
                  <span>${opt.label ?? opt.value}</span>
                </li>`;
              })}
        </ul>
      </div>` : null}
    </div>
  </div>`;
}
