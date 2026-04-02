import { T } from "../../constants/theme";
import Btn from "./Btn";

// エラーメッセージ表示コンポーネント
const ErrorMsg = ({ message, onRetry }) => (
  <div style={{
    background: T.dangerSoft, borderRadius: T.radius, padding: "12px 16px",
    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
  }}>
    <span style={{ color: T.danger, fontFamily: T.fontSans, fontSize: 13 }}>{message}</span>
    {onRetry && <Btn variant="ghost" onClick={onRetry} style={{ padding: "4px 12px", fontSize: 12 }}>再試行</Btn>}
  </div>
);

export default ErrorMsg;
