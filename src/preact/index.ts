import { render } from "preact";
import { html } from "htm/preact";
import { useEffect, useState } from "preact/hooks";
import { createSocketBridge, UiSocketBridge } from "./socket";

type ConnectionState = "disconnected" | "connecting" | "ready";

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

export function App() {
  const [connState, setConnState] = useState<ConnectionState>("connecting");
  const [socketId, setSocketId] = useState<string>("");
  const [bridge, setBridge] = useState<UiSocketBridge | null>(null);

  useEffect(() => {
    const b = createSocketBridge({
      onConnect: (id) => {
        setSocketId(id);
        setConnState("ready");
      },
      onControls: () => {
        setConnState("ready");
      },
      onReplayDone: () => {
        setConnState("ready");
      },
    });
    setBridge(b);
    return () => b.dispose();
  }, []);

  const statusLabel = (() => {
    switch (connState) {
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
        <span style=${{ fontSize: "12px", opacity: 0.7 }}>Socket: ${statusLabel}${socketId ? ` (${socketId})` : ""}</span>
      </header>
      <section style=${layoutStyles}>
        <nav style=${navStyles}>
          <h3 style=${{ marginTop: 0 }}>Tabs</h3>
          <ul style=${{ listStyle: "none", padding: 0, margin: 0, opacity: 0.6 }}>
            <li>Placeholder tab list</li>
          </ul>
        </nav>
        <main style=${contentStyles}>
          <h2>Welcome</h2>
          <p>This is the new HTM/Preact shell running under Bun. Widgets and layout will render here.</p>
          <p>Socket bridge ${bridge ? "is active" : "not active"}.</p>
        </main>
      </section>
    </div>
  `;
}

export function bootstrap() {
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
