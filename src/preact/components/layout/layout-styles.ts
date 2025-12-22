const LAYOUT_STYLE_ID = "nr-dashboard-layout-style";
const DASHBOARD_SCOPE = "#nr-dashboard-root";

export function ensureLayoutStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(LAYOUT_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = LAYOUT_STYLE_ID;
  style.textContent = `
    ${DASHBOARD_SCOPE} {
      --nr-dashboard-card-bg: var(--nr-dashboard-groupBackgroundColor, transparent);
      --nr-dashboard-card-border: var(--nr-dashboard-groupBorderColor, transparent);
      --nr-dashboard-card-text: var(--nr-dashboard-groupTextColor, var(--nr-dashboard-widgetTextColor, inherit));
      --nr-dashboard-nav-active: var(--nr-dashboard-pageSidebarBackgroundColor, rgba(0, 0, 0, 0.04));
      --nr-dashboard-nav-border-active: var(--nr-dashboard-widgetBorderColor, rgba(0, 0, 0, 0.24));
      --nr-dashboard-nav-border: var(--nr-dashboard-widgetBorderColor, rgba(0, 0, 0, 0.12));
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs {
      list-style: none;
      padding: 4px 4px;
      margin: 0;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs li:last-child .nr-dashboard-tabs__btn {
      margin-bottom: 0;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__btn {
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      margin-bottom: 4px;
      border-radius: 4px;
      border: 1px solid var(--nr-dashboard-nav-border);
      background: rgba(0, 0, 0, 0.02);
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

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__btn.is-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__icon {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-weight: 700;
      background: rgba(0, 0, 0, 0.06);
      border: 1px solid var(--nr-dashboard-nav-border);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__icon i {
      font-size: 18px;
      line-height: 1;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__icon img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__icon-glyph {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      width: 100%;
      height: 100%;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs--icon .nr-dashboard-tabs__label {
      display: none;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__btn.is-active {
      border-color: var(--nr-dashboard-nav-border-active);
      background: var(--nr-dashboard-nav-active);
      border-right: 4px solid var(--nr-dashboard-groupTextColor, var(--nr-dashboard-nav-border-active));
      box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.06);
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      filter: grayscale(0.2);
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__btn:not(:disabled):hover {
      background: rgba(0, 0, 0, 0.06);
      border-color: var(--nr-dashboard-nav-border-active);
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__btn:focus-visible {
      outline: 2px solid var(--nr-dashboard-nav-border-active);
      outline-offset: 1px;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-tabs__label {
      min-width: 120px;
      display: inline-flex;
      align-items: center;
      line-height: 20px;
      letter-spacing: 0.02em;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-group-card {
      border: 1px solid var(--nr-dashboard-card-border);
      border-radius: 10px;
      background: var(--nr-dashboard-card-bg);
      color: var(--nr-dashboard-card-text);
      min-height: 120px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
      padding: 8px;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-group-card__header {
      font-weight: 500;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-group-card__collapse {
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

    ${DASHBOARD_SCOPE} .nr-dashboard-group-card__collapse:hover {
      background: rgba(0, 0, 0, 0.06);
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-group-card__collapse:focus-visible {
      outline: 2px solid var(--nr-dashboard-widgetColor, #1f8af2);
      outline-offset: 2px;
      background: rgba(0, 0, 0, 0.06);
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-group-card__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-group-card__item {
      font-size: 12px;
      opacity: 0.9;
    }

    ${DASHBOARD_SCOPE} .nr-dashboard-widget-frame {
      background: var(--nr-dashboard-widgetBackgroundColor, transparent);
      border: 1px solid var(--nr-dashboard-widgetBorderColor, transparent);
      color: var(--nr-dashboard-widgetTextColor, inherit);
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
      background: radial-gradient(circle, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0) 60%);
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

    .nr-dashboard-wheel-spin {
      animation: nr-dashboard-wheel 1.05s linear infinite;
    }

    .nr-dashboard-fade-in {
      animation: nr-dashboard-fade 1.2s ease-in;
    }

    @keyframes nr-dashboard-nav-backdrop {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes nr-dashboard-skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @keyframes nr-dashboard-wheel {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes nr-dashboard-fade {
      0% { opacity: 0; }
      30% { opacity: 0; }
      100% { opacity: 1; }
    }
  `;
  doc.head.appendChild(style);
}
