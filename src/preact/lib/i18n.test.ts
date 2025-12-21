import { render } from "@testing-library/preact";
import { html } from "htm/preact";
import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { I18nProvider, useI18n } from "./i18n";

if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = window.HTMLElement;
}

type SubjectProps = {
  keyName: string;
  fallback?: string;
  params?: Record<string, string | number>;
};

function Subject({ keyName, fallback, params }: SubjectProps) {
  const { t } = useI18n();
  return html`<span>${t(keyName, fallback, params)}</span>`;
}

describe("i18n", () => {
  test("falls back to defaults and interpolates", () => {
    const { getByText } = render(html`<${I18nProvider} lang="pt">
      <${Subject} keyName="char_counter" fallback="{used}/{max}" params=${{ used: 2, max: 5 }} />
    </${I18nProvider}>`);

    expect(getByText("2/5")).toBeTruthy();
  });

  test("uses provided locales and language prefix fallback", () => {
    const locales = {
      en: { greeting: "Hello" },
      pt: { greeting: "Olá" },
    };

    const { getByText } = render(html`<${I18nProvider} lang="pt-BR" locales=${locales}>
      <${Subject} keyName="greeting" fallback="Hi" />
    </${I18nProvider}>`);

    expect(getByText("Olá")).toBeTruthy();
  });
});
