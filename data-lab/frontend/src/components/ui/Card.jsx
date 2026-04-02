import { T } from "../../constants/theme";

// カードコンテナコンポーネント
const Card = ({ children, style }) => (
  <div style={{
    background: T.card, borderRadius: T.radius,
    border: `1px solid ${T.border}`, padding: 20, ...style,
  }}>{children}</div>
);

export default Card;
