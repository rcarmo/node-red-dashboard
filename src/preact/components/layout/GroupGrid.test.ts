import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/preact";
import { html } from "htm/preact";
import { GroupGrid } from "./GroupGrid";
import type { UiGroup } from "../../state";
import { I18nProvider } from "../../lib/i18n";

const baseSizes = {
  columns: 4,
  gx: 6,
  gy: 6,
  px: 10,
  py: 8,
  cy: 5,
  cx: 4,
  dense: true,
};

describe("GroupGrid", () => {
  test("sets dense auto-flow when requested", () => {
    const { container } = render(html`<${I18nProvider} lang="en" locales=${{ en: {} }}>
      <${GroupGrid}
        groups=${[{ header: { id: "one" }, items: [] } as UiGroup]}
        sizes=${baseSizes}
      />
    </${I18nProvider}>`);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gridAutoFlow).toBe("dense");
  });

  test("filters hidden groups and passes padding/gaps", () => {
    const groups: UiGroup[] = [
      { header: { id: "a", name: "A" }, items: [] },
      { header: { id: "b", name: "B", config: { hidden: true } }, items: [] },
    ];

    const { container } = render(html`<${I18nProvider} lang="en" locales=${{ en: {} }}>
      <${GroupGrid} groups=${groups} sizes=${baseSizes} />
    </${I18nProvider}>`);
    const cards = container.querySelectorAll(".nr-dashboard-group-card");
    expect(cards.length).toBe(1);
    const card = cards[0] as HTMLElement;
    expect(card.style.padding).toBe("8px 10px");
  });

  test("shows fallback when no visible groups", () => {
    const groups: UiGroup[] = [
      { header: { id: "a", config: { hidden: true } }, items: [] },
    ];
    const { container } = render(html`<${I18nProvider} lang="en" locales=${{ en: {} }}>
      <${GroupGrid} groups=${groups} sizes=${baseSizes} />
    </${I18nProvider}>`);
    expect(container.textContent).toContain("No groups in this tab yet.");
  });
});
