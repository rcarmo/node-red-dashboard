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
  padding: "8px 10px 10px 10px",
  borderRadius: "4px",
  background: "var(--nr-dashboard-toastBackgroundColor, rgba(32,32,32,0.92))",
  color: "var(--nr-dashboard-toastTextColor, #fff)",
  minWidth: "260px",
  boxShadow: "var(--nr-dashboard-toastShadow, 0 6px 16px rgba(0,0,0,0.28))",
  fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
  pointerEvents: "auto",
  position: "relative",
  border: "4px solid var(--nr-dashboard-infoColor, #60a5fa)",
};

export const titleStyles: Record<string, string | number> = {
  fontWeight: 600,
  fontSize: "16px",
  lineHeight: "20px",
  marginBottom: "2px",
};

export const messageStyles: Record<string, string | number> = {
  fontSize: "14px",
  lineHeight: "20px",
};
