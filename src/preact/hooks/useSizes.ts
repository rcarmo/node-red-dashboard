import { html } from "htm/preact";
import { createContext } from "preact";
import type { VNode } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { applySizesToRoot, resolveSizes } from "../lib/sizes";
import type { SiteSizes } from "../types";

const SizesContext = createContext<SiteSizes | null>(null);

type SizesProviderProps = {
  site: unknown;
  tabId?: string | number;
  children: VNode | VNode[];
};

export function SizesProvider({ site, tabId, children }: SizesProviderProps): VNode {
  const [sizes, setSizes] = useState<SiteSizes>(() => resolveSizes(site));
  const root = typeof document !== "undefined" ? (document.getElementById("nr-dashboard-root") ?? document.getElementById("app")) : null;

  useEffect(() => {
    setSizes(resolveSizes(site));
  }, [site]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setSizes(resolveSizes(site));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [site]);

  useEffect(() => {
    applySizesToRoot(sizes, root ?? undefined);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dashboard:size", { detail: sizes }));
    }
  }, [sizes, root]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("resize"));
    }
  }, [tabId]);

  return html`<${SizesContext.Provider} value=${sizes}>${children}<//>`;
}

export function useSizes(): SiteSizes {
  const ctx = useContext(SizesContext);
  return ctx ?? resolveSizes(null);
}
