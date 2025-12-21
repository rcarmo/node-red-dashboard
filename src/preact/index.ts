import { render, type VNode } from "preact";
import { html } from "htm/preact";
import { useDashboardState } from "./state";

const appStyles: Record<string, string> = {
  fontFamily: "'Inter', system-ui, sans-serif",
  background: "var(--nr-dashboard-pageBackgroundColor, #0f1115)",
  color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
  minHeight: "100vh",
  display: "grid",
  gridTemplateRows: "56px 1fr",
};

const toolbarStyles: Record<string, string> = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "0 16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const layoutStyles: Record<string, string> = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  minHeight: "calc(100vh - 56px)",
};

const navStyles: Record<string, string> = {
  borderRight: "1px solid rgba(255,255,255,0.08)",
  padding: "16px",
};

const contentStyles: Record<string, string> = {
  padding: "16px",
};

export function App(): VNode {
  const { state, selectedTab, actions } = useDashboardState();

  const statusLabel = (() => {
    switch (state.connection) {
      case "ready":
        return "Connected";
      case "connecting":
        return "Connecting";
      default:
        return "Disconnected";
    }
  })();

  return html`
    <div style=${appStyles}>
      <header style=${toolbarStyles}>
        <strong>Node-RED Dashboard v2</strong>
        <span style=${{ fontSize: "12px", opacity: 0.7 }}>Socket: ${statusLabel}${state.socketId ? ` (${state.socketId})` : ""}</span>
      </header>
      <section style=${layoutStyles}>
        <nav style=${navStyles}>
          <h3 style=${{ marginTop: 0 }}>Tabs</h3>
          <ul style=${{ listStyle: "none", padding: 0, margin: 0, opacity: 0.9 }}>
            ${state.menu.length === 0
              ? html`<li style=${{ opacity: 0.6 }}>No tabs yet</li>`
              : state.menu.map((tab, idx) => {
                  const active = idx === state.selectedTabIndex;
                  return html`<li key=${tab.id ?? tab.header ?? idx}>
                    <button
                      style=${{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        marginBottom: "6px",
                        borderRadius: "6px",
                        border: active
                          ? "1px solid rgba(255,255,255,0.35)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: active
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.04)",
                        color: "inherit",
                        cursor: "pointer",
                        opacity: tab.disabled || tab.hidden ? 0.4 : 1,
                      }}
                      disabled=${tab.disabled || tab.hidden}
                      onClick=${() => actions.selectTab(idx)}
                    >
                      ${tab.header || tab.name || `Tab ${idx + 1}`}
                    </button>
                  </li>`;
                })}
          </ul>
        </nav>
        <main style=${contentStyles}>
          <h2>Welcome</h2>
          <p>This is the new HTM/Preact shell running under Bun. Widgets and layout will render here.</p>
          <p>Connection: ${statusLabel} ${state.socketId ? `(${state.socketId})` : ""}</p>
          <p>Tabs loaded: ${state.menu.length} ${selectedTab ? `(selected: ${selectedTab.header || selectedTab.name || "(unnamed)"})` : ""}</p>
        </main>
      </section>
    </div>
  `;
}

export function bootstrap(): void {
  if (typeof document === "undefined") return;

  const root = document.getElementById("app") ?? (() => {
    const el = document.createElement("div");
    el.id = "app";
    document.body.appendChild(el);
    return el;
  })();

  render(html`<${App} />`, root);
}

bootstrap();
