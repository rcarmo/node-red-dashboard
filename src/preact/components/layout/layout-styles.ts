const LAYOUT_STYLE_ID = "nr-dashboard-layout-style";

export function ensureLayoutStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(LAYOUT_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = LAYOUT_STYLE_ID;
  style.textContent = `
    :root {
      --nr-dashboard-card-bg: var(--nr-dashboard-groupBackgroundColor, transparent);
      --nr-dashboard-card-border: var(--nr-dashboard-groupBorderColor, transparent);
      --nr-dashboard-card-text: var(--nr-dashboard-groupTextColor, var(--nr-dashboard-widgetTextColor, inherit));
      --nr-dashboard-nav-active: var(--nr-dashboard-sidebarBackgroundColor, rgba(255, 255, 255, 0.08));
      --nr-dashboard-nav-border-active: var(--nr-dashboard-widgetBorderColor, rgba(255, 255, 255, 0.35));
      --nr-dashboard-nav-border: var(--nr-dashboard-widgetBorderColor, rgba(255, 255, 255, 0.12));
    }

    .nr-dashboard-tabs {
      list-style: none;
      padding: 4px 4px;
      margin: 0;
    }

    .nr-dashboard-tabs li:last-child .nr-dashboard-tabs__btn {
      margin-bottom: 0;
    }

    .nr-dashboard-tabs__btn {
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      margin-bottom: 4px;
      border-radius: 4px;
      border: 1px solid var(--nr-dashboard-nav-border);
      background: rgba(255, 255, 255, 0.04);
      color: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
      justify-content: flex-start;
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      font-family: inherit;
      transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
    }

    .nr-dashboard-tabs__btn.is-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px;
    }

    .nr-dashboard-tabs__icon {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--nr-dashboard-nav-border);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    }

    .nr-dashboard-tabs__icon i {
      font-size: 18px;
      line-height: 1;
    }

    .nr-dashboard-tabs__icon img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }

    .nr-dashboard-tabs__icon-glyph {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      width: 100%;
      height: 100%;
    }

    .nr-dashboard-tabs--icon .nr-dashboard-tabs__label {
      display: none;
    }

    .nr-dashboard-tabs__btn.is-active {
      border-color: var(--nr-dashboard-nav-border-active);
      background: var(--nr-dashboard-nav-active);
      border-right: 4px solid var(--nr-dashboard-groupTextColor, var(--nr-dashboard-nav-border-active));
      box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
    }

    .nr-dashboard-tabs__btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      filter: grayscale(0.2);
    }

    .nr-dashboard-tabs__btn:not(:disabled):hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--nr-dashboard-nav-border-active);
    }

    .nr-dashboard-tabs__btn:focus-visible {
      outline: 2px solid var(--nr-dashboard-nav-border-active);
      outline-offset: 1px;
    }

    .nr-dashboard-tabs__label {
      min-width: 120px;
      display: inline-flex;
      align-items: center;
      line-height: 20px;
      letter-spacing: 0.02em;
    }

    .nr-dashboard-group-card {
      border: 1px solid var(--nr-dashboard-card-border);
      border-radius: 10px;
      background: var(--nr-dashboard-card-bg);
      color: var(--nr-dashboard-card-text);
      min-height: 120px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    }

    .nr-dashboard-group-card__header {
      font-weight: 500;
    }

    .nr-dashboard-group-card__collapse {
      border: none;
      background: transparent;
      color: inherit;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 6px;
      min-width: 28px;
      min-height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 120ms ease;
    }

    .nr-dashboard-group-card__collapse:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .nr-dashboard-group-card__collapse:focus-visible {
      outline: 2px solid var(--nr-dashboard-widgetColor, #1f8af2);
      outline-offset: 2px;
      background: rgba(255, 255, 255, 0.08);
    }

    .nr-dashboard-group-card__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
    }

    .nr-dashboard-group-card__item {
      font-size: 12px;
      opacity: 0.9;
    }

    .nr-dashboard-widget-frame {
      background: var(--nr-dashboard-widgetBackgroundColor, #14171d);
      border: 1px solid var(--nr-dashboard-widgetBorderColor, rgba(255, 255, 255, 0.08));
      color: var(--nr-dashboard-widgetTextColor, #e9ecf1);
      border-radius: 8px;
    }

    .nr-dashboard-icon-press {
      position: relative;
      overflow: hidden;
      transition: transform 140ms ease, background 160ms ease;
    }

    .nr-dashboard-icon-press::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%);
      opacity: 0;
      transform: scale(0.4);
      transition: opacity 220ms ease, transform 220ms ease;
    }

    .nr-dashboard-icon-press:active {
      transform: scale(0.96);
      background: rgba(255, 255, 255, 0.08);
    }

    .nr-dashboard-icon-press:active::after {
      opacity: 1;
      transform: scale(1.6);
      transition: opacity 120ms ease, transform 220ms ease;
    }

    @keyframes nr-dashboard-nav-backdrop {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes nr-dashboard-skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  doc.head.appendChild(style);
}
