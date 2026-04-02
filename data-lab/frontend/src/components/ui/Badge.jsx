import { T } from "../../constants/theme";

// バッジ（タグ表示）コンポーネント
const Badge = ({ children, color = T.accent }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 6,
    fontSize: 11, fontWeight: 700, fontFamily: T.font,
    background: color + "20", color, letterSpacing: ".5px",
  }}>{children}</span>
);

export default Badge;
