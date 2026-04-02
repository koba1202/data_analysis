import { T } from "../../constants/theme";

// ローディングスピナー
const Spinner = ({ text = "読み込み中..." }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20 }}>
    <div style={{
      width: 20, height: 20, border: `2px solid ${T.border}`,
      borderTopColor: T.accent, borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <span style={{ fontFamily: T.fontSans, color: T.textSub, fontSize: 13 }}>{text}</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default Spinner;
