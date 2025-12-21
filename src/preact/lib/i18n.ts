import { html } from "htm/preact";
import { createContext } from "preact";
import type { ComponentChildren, VNode } from "preact";
import { useContext, useMemo } from "preact/hooks";

export type LocaleMessages = Record<string, string>;
export type LocaleMap = Record<string, LocaleMessages>;

const defaultMessages: LocaleMessages = {
  required_label: "Required",
  error_required: "This field is required.",
  error_pattern: "Value does not match the required format.",
  error_min: "Value is before the allowed range.",
  error_max: "Value is after the allowed range.",
  collapsed: "Collapsed",
  no_widgets: "No widgets in this group yet.",
  char_counter: "{used}/{max}",
  expand_group: "Expand group",
  collapse_group: "Collapse group",
  no_groups: "No groups in this tab yet.",
  no_tabs: "No tabs yet",
  form_no_fields: "No fields configured.",
  submit_label: "Submit",
  loading: "Loading dashboard...",
  app_title: "Node-RED Dashboard v2",
  tabs_label: "Tabs",
  no_tabs_defined_title: "No tabs defined yet.",
  no_tabs_defined_body: "Add UI nodes in Node-RED and deploy to see them here.",
  select_tab_prompt: "Select a tab to view its content.",
  widget_count_one: "{count} widget",
  widget_count_other: "{count} widgets",
  tab_label: "Tab {index}",
  input_label: "Input {index}",
  date_label: "Date {index}",
  form_label: "Form {index}",
  toast_label: "Toast {index}",
  toast_message: "Toast message",
  toast_close: "Close notification",
  toast_overlay_title: "Notification",
  toast_overlay_close: "Dismiss notification",
  socket_status: "Socket: {status}",
  socket_status_with_id: "Socket: {status} ({id})",
  status_connected: "Connected",
  status_connecting: "Connecting",
  status_disconnected: "Disconnected",
  widget_preview_empty: "(no value yet)",
  text_label: "Text {index}",
  dimensions_px: "{width}×{height} px",
  link_open: "Open {label}",
  audio_controls: "Audio controls for {label}",
  number_value_label: "{label}: {value}",
  gauge_label: "Gauge {index}",
  group_label: "Group {index}",
};

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce((acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)), template);
}

function normalizeLang(lang?: string | null): string {
  if (!lang) return "en";
  return lang.replace("_", "-").toLowerCase();
}

function resolveMessages(locales: LocaleMap | undefined, lang: string): LocaleMessages {
  if (!locales) return defaultMessages;
  const normalized = normalizeLang(lang);
  const exact = locales[normalized];
  if (exact) return { ...defaultMessages, ...exact };
  const prefix = normalized.split("-")[0];
  const base = locales[prefix];
  if (base) return { ...defaultMessages, ...base };
  return defaultMessages;
}

export const I18nContext = createContext<{ t: (key: string, fallback?: string, params?: Record<string, string | number>) => string; lang: string }>(
  {
    t: (key: string, fallback?: string, params?: Record<string, string | number>) => interpolate(fallback ?? key, params),
    lang: "en",
  },
);

export function I18nProvider(props: { lang?: string | null; locales?: LocaleMap; children: ComponentChildren }): VNode {
  const { lang, locales, children } = props;
  const resolvedLang = normalizeLang(lang ?? "en");
  const messages = useMemo(() => resolveMessages(locales, resolvedLang), [locales, resolvedLang]);
  const t = (key: string, fallback?: string, params?: Record<string, string | number>) => {
    const template = messages[key] ?? fallback ?? key;
    return interpolate(template, params);
  };
  return html`<${I18nContext.Provider} value=${{ t, lang: resolvedLang }}>${children}</${I18nContext.Provider}>`;
}

export function useI18n(): { t: (key: string, fallback?: string, params?: Record<string, string | number>) => string; lang: string } {
  return useContext(I18nContext);
}

export function hydrateLocales(): LocaleMap | undefined {
  if (typeof window === "undefined") return undefined;
  const maybe = (window as unknown as { __nrDashboardLocales?: unknown }).__nrDashboardLocales;
  if (maybe && typeof maybe === "object") {
    return maybe as LocaleMap;
  }
  return undefined;
}
