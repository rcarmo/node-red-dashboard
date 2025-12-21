import { afterEach, describe, expect, test } from "bun:test";
import {
  App,
  applySizesToRoot,
  applyThemeToRoot,
  groupColumnSpan,
  findFirstFocusable,
  resolveSizes,
  shouldShowLoading,
} from "./index";

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow) {
    globalThis.window = originalWindow;
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete globalThis.window;
  }
});

describe("App shell", () => {
  test("App is a function component", () => {
    expect(typeof App).toBe("function");
  });
});

describe("Sizing", () => {
  test("resolves defaults", () => {
    const sizes = resolveSizes(null);
    expect(sizes).toEqual({
      sx: 48,
      sy: 48,
      gx: 6,
      gy: 6,
      cx: 6,
      cy: 6,
      px: 0,
      py: 0,
      columns: 24,
      dense: false,
    });
  });

  test("respects site sizes and columns", () => {
    const sizes = resolveSizes({ sizes: { sx: 60, gy: 10, columns: 12 } });
    expect(sizes.sx).toBe(60);
    expect(sizes.gy).toBe(10);
    expect(sizes.columns).toBe(12);
  });

  test("uses compact sizes on very small screens", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.window = { innerWidth: 320 };
    const sizes = resolveSizes(null);
    expect(sizes.sx).toBe(42);
    expect(sizes.sy).toBe(42);
  });
});

describe("Group span", () => {
  test("caps span to available columns", () => {
    const span = groupColumnSpan({ header: { config: { width: 30 } } }, 5);
    expect(span).toBe(5);
  });

  test("defaults to max columns when width missing", () => {
    const span = groupColumnSpan({}, 4);
    expect(span).toBe(4);
  });
});

describe("Theme application", () => {
  test("sets and clears CSS vars", () => {
    const style: Record<string, string> = {};
    const root = {
      style: {
        setProperty: (k: string, v: string) => {
          style[k] = v;
        },
        removeProperty: (k: string) => {
          delete style[k];
        },
      },
    } as HTMLElement;

    applyThemeToRoot(
      {
        themeState: {
          "page-backgroundColor": { value: "#111" },
          "widget-textColor": { value: "#eee" },
          "page-textColor": { value: "#abc" },
        },
      },
      root,
    );

    expect(style["--nr-dashboard-pageBackgroundColor"]).toBe("#111");
    expect(style["--nr-dashboard-widgetTextColor"]).toBe("#eee");
    expect(style["--nr-dashboard-pageTextColor"]).toBe("#abc");

    applyThemeToRoot(null, root);
    expect(style["--nr-dashboard-pageBackgroundColor"]).toBeUndefined();
    expect(style["--nr-dashboard-widgetTextColor"]).toBeUndefined();
    expect(style["--nr-dashboard-pageTextColor"]).toBeUndefined();
  });

  test("derives readable text when only background is supplied", () => {
    const style: Record<string, string> = {};
    const root = {
      style: {
        setProperty: (k: string, v: string) => {
          style[k] = v;
        },
        removeProperty: (k: string) => {
          delete style[k];
        },
      },
    } as HTMLElement;

    applyThemeToRoot(
      {
        themeState: {
          "page-backgroundColor": { value: "#ffffff" },
        },
      },
      root,
    );

    expect(style["--nr-dashboard-pageTextColor"]).toBe("#0b0d11");

    applyThemeToRoot(
      {
        themeState: {
          "page-backgroundColor": { value: "#000000" },
        },
      },
      root,
    );

    expect(style["--nr-dashboard-pageTextColor"]).toBe("#f4f6fb");
  });
});

describe("Loading and focus helpers", () => {
  test("shouldShowLoading is true unless ready", () => {
    expect(shouldShowLoading("connecting")).toBe(true);
    expect(shouldShowLoading("ready")).toBe(false);
  });

  test("findFirstFocusable returns query result or root", () => {
    const btn = { tagName: "BUTTON" } as unknown as HTMLElement;
    const root = {
      querySelector: () => btn,
    } as unknown as HTMLElement;
    expect(findFirstFocusable(root)).toBe(btn);

    const rootFallback = {
      querySelector: () => null,
    } as unknown as HTMLElement;
    expect(findFirstFocusable(rootFallback)).toBe(rootFallback);
  });
});

describe("Size tokens", () => {
  test("writes CSS variables", () => {
    const style: Record<string, string> = {};
    const root = {
      style: {
        setProperty: (k: string, v: string) => {
          style[k] = v;
        },
      },
    } as HTMLElement;

    applySizesToRoot(
      { sx: 10, sy: 11, gx: 2, gy: 3, cx: 4, cy: 5, px: 6, py: 7, columns: 8 },
      root,
    );

    expect(style["--nr-dashboard-sx"]).toBe("10");
    expect(style["--nr-dashboard-columns"]).toBe("8");
  });
});
