import { render } from "preact";
import { html } from "htm/preact";
import { connectSocket } from "./socket";

export function App() {
  return html`<main style="padding:16px;font-family:sans-serif">
    <h1>Node-RED Dashboard v2 (Preact + HTM)</h1>
    <p>This is the new shell running on Bun. Socket bridge placeholder is wired.</p>
  </main>`;
}

export function bootstrap() {
  if (typeof document === "undefined") return;

  const root = document.getElementById("app") ?? (() => {
    const el = document.createElement("div");
    el.id = "app";
    document.body.appendChild(el);
    return el;
  })();

  // Establish Socket.IO connection (no handlers yet)
  connectSocket();
  render(html`<${App} />`, root);
}

bootstrap();
