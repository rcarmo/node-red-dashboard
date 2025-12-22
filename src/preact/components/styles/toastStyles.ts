export const overlayStyles: Record<string, string | number> = {
  position: "fixed",
  top: "16px",
  right: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  zIndex: 9999,
  pointerEvents: "none",
};

export const cardBaseStyles: Record<string, string | number> = {
  padding: "10px 12px",
  borderRadius: "8px",
  background: "var(--nr-dashboard-toastBackgroundColor, var(--nr-dashboard-groupBackgroundColor, transparent))",
  color: "var(--nr-dashboard-toastTextColor, var(--nr-dashboard-pageTextColor, inherit))",
  minWidth: "260px",
  boxShadow: "var(--nr-dashboard-toastShadow, 0 4px 12px rgba(0,0,0,0.2))",
  pointerEvents: "auto",
  position: "relative",
};

export const titleStyles: Record<string, string | number> = { fontWeight: 700, marginBottom: "4px" };
export const messageStyles: Record<string, string | number> = { fontSize: "13px" };

export const closeButtonStyles: Record<string, string | number> = {
  position: "absolute",
  top: "6px",
  right: "6px",
  background: "transparent",
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
};
