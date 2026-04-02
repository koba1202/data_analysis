import { T } from "../../constants/theme";
import Btn from "../ui/Btn";

// ヘッダー（タイトル・リセットボタン）
const Header = ({ showReset, onReset }) => (
  <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20 }}>&#9879;&#65039;</span>
      <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, letterSpacing: "1px", color: T.accent }}>DATA LAB</span>
    </div>
    {showReset && (
      <Btn variant="danger" onClick={onReset} style={{ padding: "6px 14px", fontSize: 12 }}>リセット</Btn>
    )}
  </div>
);

export default Header;
