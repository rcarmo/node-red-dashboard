import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/preact";
import { html } from "htm/preact";
import { GroupCard } from "./GroupCard";
import type { UiGroup } from "../../state";
import { I18nProvider } from "../../lib/i18n";

const baseProps = {
  index: 0,
  columnSpan: 4,
  padding: { x: 10, y: 8 },
  sizes: { cy: 5, cx: 4 },
};

const wrap = (node: ReturnType<typeof html>) =>
  html`<${I18nProvider} lang="en" locales=${{ en: {} }}>${node}</${I18nProvider}>`;

describe("GroupCard", () => {
  test("shows header by default", () => {
    const group: UiGroup = {
      header: { id: "g1", name: "Test Group", config: {} },
      items: [],
    };
    const { container } = render(wrap(html`<${GroupCard} group=${group} ...${baseProps} />`));
    const header = container.querySelector(".nr-dashboard-group-card__header");
    expect(header).not.toBeNull();
    expect(container.textContent).toContain("Test Group");
  });

  test("hides header when disp is false", () => {
    const group: UiGroup = {
      header: { id: "g2", name: "Hidden Header", config: { disp: false } },
      items: [],
    };
    const { container } = render(wrap(html`<${GroupCard} group=${group} ...${baseProps} />`));
    const header = container.querySelector(".nr-dashboard-group-card__header");
    expect(header).toBeNull();
    expect(container.textContent).not.toContain("Hidden Header");
  });

  test("shows header when disp is explicitly true", () => {
    const group: UiGroup = {
      header: { id: "g3", name: "Visible Group", config: { disp: true } },
      items: [],
    };
    const { container } = render(wrap(html`<${GroupCard} group=${group} ...${baseProps} />`));
    const header = container.querySelector(".nr-dashboard-group-card__header");
    expect(header).not.toBeNull();
    expect(container.textContent).toContain("Visible Group");
  });

  test("applies className from header config", () => {
    const group: UiGroup = {
      header: { id: "g4", name: "Styled Group", config: { className: "custom-class" } },
      items: [],
    };
    const { container } = render(wrap(html`<${GroupCard} group=${group} ...${baseProps} />`));
    const section = container.querySelector(".nr-dashboard-group-card");
    expect(section?.classList.contains("custom-class")).toBe(true);
  });

  test("shows collapse button when collapse enabled", () => {
    const group: UiGroup = {
      header: { id: "g5", name: "Collapsible", config: { collapse: true } },
      items: [],
    };
    const { container } = render(wrap(html`<${GroupCard} group=${group} ...${baseProps} />`));
    const collapseBtn = container.querySelector(".nr-dashboard-group-card__collapse");
    expect(collapseBtn).not.toBeNull();
  });

  test("hides collapse button when collapse disabled", () => {
    const group: UiGroup = {
      header: { id: "g6", name: "Non-Collapsible", config: { collapse: false } },
      items: [],
    };
    const { container } = render(wrap(html`<${GroupCard} group=${group} ...${baseProps} />`));
    const collapseBtn = container.querySelector(".nr-dashboard-group-card__collapse");
    expect(collapseBtn).toBeNull();
  });
});
