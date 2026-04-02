import { T } from "../../constants/theme";

// 共通ボタンコンポーネント
const Btn = ({ children, onClick, disabled, variant = "primary", style }) => {
  const base = {
    padding: "10px 24px", borderRadius: T.radius, border: "none",
    fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1, transition: "all .2s",
    display: "inline-flex", alignItems: "center", gap: 8,
  };
  const variants = {
    primary: { background: T.accent, color: "#fff" },
    ghost: { background: "transparent", color: T.accent, border: `1px solid ${T.border}` },
    danger: { background: T.dangerSoft, color: T.danger },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => !disabled && (e.target.style.transform = "translateY(-1px)")}
      onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}>
      {children}
    </button>
  );
};

export default Btn;
