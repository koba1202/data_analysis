import { useState } from "react";
import { T } from "../../constants/theme";
import { handleMissing } from "../../api/client";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";
import Card from "../ui/Card";
import Spinner from "../ui/Spinner";
import ErrorMsg from "../ui/ErrorMsg";

// Step3: 欠損値処理（API経由）
const StepMissing = ({ uploadResult, sessionId, onProcessed }) => {
  const missingCols = uploadResult.columns.filter((c) => c.missing_count > 0);
  const [strategies, setStrategies] = useState(() =>
    Object.fromEntries(missingCols.map((c) => [c.name, c.dtype === "numeric" ? "mean" : "mode"]))
  );
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const apply = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await handleMissing(sessionId, strategies);
      setResult(res);
      setApplied(true);
      if (onProcessed) onProcessed(res);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!missingCols.length) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>&#10024;</div>
        <p style={{ fontFamily: T.fontSans, color: T.text, fontSize: 16, margin: 0 }}>欠損値はありません</p>
        <p style={{ fontFamily: T.fontSans, color: T.textSub, fontSize: 13 }}>次のステップに進んでください</p>
      </Card>
    );
  }

  const options = [
    { value: "mean", label: "平均値" },
    { value: "median", label: "中央値" },
    { value: "mode", label: "最頻値" },
    { value: "zero", label: "0埋め" },
    { value: "ffill", label: "前方補完" },
    { value: "drop", label: "行削除" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <ErrorMsg message={error} onRetry={apply} />}
      {applied && result && (
        <div style={{ background: T.successSoft, borderRadius: T.radius, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span>&#10004;</span>
          <span style={{ fontFamily: T.fontSans, color: T.success, fontSize: 13 }}>
            処理完了（{result.row_count_before}行 → {result.row_count_after}行）
          </span>
        </div>
      )}
      {missingCols.map((col) => (
        <Card key={col.name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: T.font, color: T.text, fontSize: 14 }}>{col.name}</span>
              <Badge color={T.danger}>{col.missing_count} 欠損</Badge>
              <Badge color={col.dtype === "numeric" ? T.accent : T.warn}>{col.dtype}</Badge>
            </div>
            <select value={strategies[col.name]} disabled={applied}
              onChange={(e) => setStrategies((p) => ({ ...p, [col.name]: e.target.value }))}
              style={{
                background: T.surface, color: T.text, border: `1px solid ${T.border}`,
                borderRadius: 6, padding: "6px 12px", fontFamily: T.fontSans, fontSize: 13, outline: "none",
              }}>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </Card>
      ))}
      {loading && <Spinner text="欠損値を処理中..." />}
      {!applied && !loading && <Btn onClick={apply}>欠損値を処理する</Btn>}
    </div>
  );
};

export default StepMissing;
