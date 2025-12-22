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
    : "var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.18))";
  const focusRing = error
    ? "0 0 0 2px color-mix(in srgb, var(--nr-dashboard-errorColor, #f87171) 55%, transparent)"
    : focused
      ? "0 0 0 2px color-mix(in srgb, var(--nr-dashboard-widgetColor, #1f8af2) 55%, transparent)"
      : "none";

  return {
    width: "100%",
    padding: dense ? "8px 10px" : "10px 12px",
    borderRadius: "4px",
    border: `1px solid ${borderColor}`,
    background: "var(--nr-dashboard-widgetFieldBg, #fff)",
    color: "var(--nr-dashboard-widgetTextColor, #000)",
    outline: "none",
    boxShadow: focusRing,
    transition: "box-shadow 140ms ease, border-color 140ms ease, background 140ms ease",
    appearance: "none",
    WebkitAppearance: "none",
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : "text",
    paddingRight: hasAdornment ? "40px" : dense ? "10px" : "12px",
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
