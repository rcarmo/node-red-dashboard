const LAYOUT_STYLE_ID = "nr-dashboard-layout-style";

export function ensureLayoutStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(LAYOUT_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = LAYOUT_STYLE_ID;
  style.textContent = `
    :root {
      --nr-dashboard-card-bg: var(--nr-dashboard-groupBackgroundColor, rgba(255, 255, 255, 0.03));
      --nr-dashboard-card-border: var(--nr-dashboard-groupBorderColor, rgba(255, 255, 255, 0.12));
      --nr-dashboard-card-text: var(--nr-dashboard-groupTextColor, var(--nr-dashboard-widgetTextColor, #e9ecf1));
      --nr-dashboard-nav-active: var(--nr-dashboard-sidebarBackgroundColor, rgba(255, 255, 255, 0.08));
      --nr-dashboard-nav-border-active: var(--nr-dashboard-widgetBorderColor, rgba(255, 255, 255, 0.35));
      --nr-dashboard-nav-border: var(--nr-dashboard-widgetBorderColor, rgba(255, 255, 255, 0.12));
    }

    .nr-dashboard-tabs {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nr-dashboard-tabs__btn {
      width: 100%;
      text-align: left;
      padding: 8px 10px;
      margin-bottom: 6px;
      border-radius: 6px;
      border: 1px solid var(--nr-dashboard-nav-border);
      background: rgba(255, 255, 255, 0.04);
      color: inherit;
      cursor: pointer;
    }

    .nr-dashboard-tabs__btn.is-active {
      border-color: var(--nr-dashboard-nav-border-active);
      background: var(--nr-dashboard-nav-active);
    }

    .nr-dashboard-tabs__btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
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
    }

    .nr-dashboard-group-card__header {
      font-weight: 600;
    }

    .nr-dashboard-group-card__meta {
      opacity: 0.8;
      font-size: 13px;
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

    @keyframes nr-dashboard-skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  doc.head.appendChild(style);
}
