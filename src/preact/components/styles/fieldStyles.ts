export type FieldStyleOptions = {
  error?: boolean;
  focused?: boolean;
  disabled?: boolean;
  hasAdornment?: boolean;
  dense?: boolean;
};

export const fieldWrapperStyles: Record<string, string | number> = {
  display: "grid",
  gap: "6px",
  width: "100%",
};

export const fieldLabelStyles: Record<string, string | number> = {
  fontSize: "13px",
  opacity: 0.85,
  color: "var(--nr-dashboard-widgetTextColor, inherit)",
  lineHeight: 1.3,
};

export const fieldHelperStyles: Record<string, string | number> = {
  fontSize: "11px",
  opacity: 0.7,
  color: "var(--nr-dashboard-widgetTextColor, inherit)",
};

export function buildFieldStyles(opts: FieldStyleOptions = {}): Record<string, string | number> {
  const { error, focused, disabled, hasAdornment, dense } = opts;
  const borderColor = error
    ? "var(--nr-dashboard-errorColor, #f87171)"
    : focused
      ? "var(--nr-dashboard-widgetColor, #1f8af2)"
      : "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.24))";

  return {
    width: "100%",
    padding: dense ? "6px 0" : "8px 0",
    borderRadius: "0px",
    border: "none",
    borderBottom: `1px solid ${borderColor}`,
    background: "transparent",
    color: "var(--nr-dashboard-widgetTextColor, #000)",
    outline: "none",
    boxShadow: "none",
    transition: "border-color 140ms ease, background 140ms ease",
    appearance: "none",
    WebkitAppearance: "none",
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : "text",
    paddingRight: hasAdornment ? "36px" : "0px",
  };
}

export const adornmentStyles: Record<string, string | number> = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.6))",
  fontSize: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
