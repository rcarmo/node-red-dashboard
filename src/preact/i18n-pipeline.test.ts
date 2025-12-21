import { resolveLanguage } from "./index";

describe("i18n pipeline language selection", () => {
  test("prefers state.lang over site and navigator", () => {
    const lang = resolveLanguage("pt", { lang: "fr" }, "es-ES");
    expect(lang).toBe("pt");
  });

  test("falls back to site lang then locale", () => {
    expect(resolveLanguage(null, { lang: "de" }, "en-US")).toBe("de");
    expect(resolveLanguage(null, { locale: "it" }, "en-US")).toBe("it");
  });

  test("uses navigator when state and site missing", () => {
    expect(resolveLanguage(null, null, "es-ES")).toBe("es-ES");
  });

  test("defaults to en when nothing valid provided", () => {
    expect(resolveLanguage(null, null, undefined)).toBe("en");
    expect(resolveLanguage("", null, "")).toBe("en");
  });
});
