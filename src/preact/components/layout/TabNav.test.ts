import { describe, expect, test, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { render, fireEvent } from "@testing-library/preact";
import { html } from "htm/preact";
import { TabNav } from "./TabNav";
import type { UiMenuItem } from "../../state";
import { I18nProvider } from "../../lib/i18n";

const wrap = (node: ReturnType<typeof html>) =>
  html`<${I18nProvider} lang="en" locales=${{ en: {} }}>${node}</${I18nProvider}>`;

describe("TabNav", () => {
  describe("link tab handling", () => {
    let openSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      openSpy = spyOn(window, "open").mockImplementation(() => null);
    });

    afterEach(() => {
      openSpy.mockRestore();
    });

    test("opens newtab link in new window", () => {
      const menu: UiMenuItem[] = [
        { header: "Regular Tab" },
        { header: "External Link", link: "https://example.com", target: "newtab" },
      ];
      const onSelect = mock(() => {});

      const { container } = render(wrap(html`<${TabNav} menu=${menu} selectedIndex=${0} onSelect=${onSelect} />`));
      const buttons = container.querySelectorAll("button");
      
      // Click the link tab
      fireEvent.click(buttons[1]);
      
      expect(openSpy).toHaveBeenCalledWith("https://example.com", "External Link");
      expect(onSelect).not.toHaveBeenCalled(); // Should NOT call onSelect
    });

    test("opens thistab link in same window", () => {
      const menu: UiMenuItem[] = [
        { header: "Regular Tab" },
        { header: "Same Tab Link", link: "https://example.com/page", target: "thistab" },
      ];
      const onSelect = mock(() => {});

      const { container } = render(wrap(html`<${TabNav} menu=${menu} selectedIndex=${0} onSelect=${onSelect} />`));
      const buttons = container.querySelectorAll("button");
      
      // Click the link tab
      fireEvent.click(buttons[1]);
      
      expect(openSpy).toHaveBeenCalledWith("https://example.com/page", "_self");
      expect(onSelect).not.toHaveBeenCalled(); // Should NOT call onSelect
    });

    test("calls onSelect for iframe link tabs", () => {
      const menu: UiMenuItem[] = [
        { header: "Regular Tab" },
        { header: "Iframe Link", link: "https://example.com/embed", target: "iframe" },
      ];
      const onSelect = mock(() => {});

      const { container } = render(wrap(html`<${TabNav} menu=${menu} selectedIndex=${0} onSelect=${onSelect} />`));
      const buttons = container.querySelectorAll("button");
      
      // Click the link tab
      fireEvent.click(buttons[1]);
      
      expect(openSpy).not.toHaveBeenCalled(); // Should NOT open window
      expect(onSelect).toHaveBeenCalledWith(1); // Should call onSelect
    });

    test("calls onSelect for regular tabs", () => {
      const menu: UiMenuItem[] = [
        { header: "Tab A" },
        { header: "Tab B" },
      ];
      const onSelect = mock(() => {});

      const { container } = render(wrap(html`<${TabNav} menu=${menu} selectedIndex=${0} onSelect=${onSelect} />`));
      const buttons = container.querySelectorAll("button");
      
      // Click the second tab
      fireEvent.click(buttons[1]);
      
      expect(openSpy).not.toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith(1);
    });
  });

  describe("tab visibility", () => {
    test("filters hidden tabs from display", () => {
      const menu: UiMenuItem[] = [
        { header: "Visible Tab" },
        { header: "Hidden Tab", hidden: true },
        { header: "Another Visible" },
      ];
      const onSelect = mock(() => {});

      const { container } = render(wrap(html`<${TabNav} menu=${menu} selectedIndex=${0} onSelect=${onSelect} />`));
      const buttons = container.querySelectorAll("button");
      
      expect(buttons.length).toBe(2); // Only visible tabs
      expect(buttons[0].getAttribute("aria-label")).toBe("Visible Tab");
      expect(buttons[1].getAttribute("aria-label")).toBe("Another Visible");
    });

    test("preserves original index for hidden tab selections", () => {
      const menu: UiMenuItem[] = [
        { header: "Tab 0" },
        { header: "Tab 1 Hidden", hidden: true },
        { header: "Tab 2" },
      ];
      const onSelect = mock(() => {});

      const { container } = render(wrap(html`<${TabNav} menu=${menu} selectedIndex=${0} onSelect=${onSelect} />`));
      const buttons = container.querySelectorAll("button");
      
      // Click "Tab 2" which is visually second but has originalIndex of 2
      fireEvent.click(buttons[1]);
      
      expect(onSelect).toHaveBeenCalledWith(2); // Original index, not visual index
    });
  });

  describe("disabled tabs", () => {
    test("disables button for disabled tabs", () => {
      const menu: UiMenuItem[] = [
        { header: "Active Tab" },
        { header: "Disabled Tab", disabled: true },
      ];
      const onSelect = mock(() => {});

      const { container } = render(wrap(html`<${TabNav} menu=${menu} selectedIndex=${0} onSelect=${onSelect} />`));
      const buttons = container.querySelectorAll("button");
      
      expect(buttons[0].disabled).toBe(false);
      expect(buttons[1].disabled).toBe(true);
    });
  });
});
