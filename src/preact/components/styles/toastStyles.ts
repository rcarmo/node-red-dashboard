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
  background: "var(--nr-dashboard-groupBackgroundColor, rgba(20,22,28,0.9))",
  color: "var(--nr-dashboard-pageTextColor, #fff)",
  minWidth: "260px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
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
