import { useState, useCallback, useEffect } from "react";
import { T } from "../../constants/theme";
import { getStats } from "../../api/client";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Spinner from "../ui/Spinner";
import ErrorMsg from "../ui/ErrorMsg";

// Step2: データ確認（サーバーの統計量を使用）
const StepPreview = ({ uploadResult, sessionId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getStats(sessionId);
      setStats(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const { columns, preview, row_count, column_count } = uploadResult;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 概要バッジ */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Badge color={T.accent}>{row_count} 行</Badge>
        <Badge color={T.warn}>{column_count} 列</Badge>
      </div>

      {/* プレビューテーブル */}
      <div style={{ overflowX: "auto", borderRadius: T.radius, border: `1px solid ${T.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.font, fontSize: 12 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.name} style={{
                  padding: "10px 14px", textAlign: "left", color: T.accent,
                  borderBottom: `1px solid ${T.border}`, background: T.surface,
                  whiteSpace: "nowrap", fontWeight: 700, letterSpacing: ".3px",
                }}>{c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(preview || []).slice(0, 8).map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.name} style={{
                    padding: "8px 14px", borderBottom: `1px solid ${T.border}22`,
                    color: T.text, whiteSpace: "nowrap", maxWidth: 180,
                    overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {row[c.name] ?? <span style={{ color: T.danger, fontStyle: "italic" }}>null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* カラム情報（APIレスポンス直結） */}
      <Card>
        <h4 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 12px", fontSize: 14 }}>カラム情報</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {columns.map((c) => {
            const clr = c.dtype === "numeric" ? T.accent : c.dtype === "categorical" ? T.warn : T.textSub;
            return (
              <div key={c.name} style={{
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, fontFamily: T.font, color: T.text,
              }}>
                <span style={{ minWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                <Badge color={clr}>{c.dtype}</Badge>
                {c.missing_count > 0 && <Badge color={T.danger}>欠損 {c.missing_count}</Badge>}
                <Badge color={T.textSub}>{c.unique_count} ユニーク</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 統計量（API取得） */}
      {loading && <Spinner text="統計量を計算中..." />}
      {error && <ErrorMsg message={error} onRetry={fetchStats} />}
      {stats && (
        <Card>
          <h4 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 12px", fontSize: 14 }}>基本統計量</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.font, fontSize: 12 }}>
              <thead>
                <tr>
                  {["カラム", "型", "件数", "平均", "標準偏差", "最小", "中央値", "最大"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "right", color: T.textSub, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.columns).filter(([, v]) => v.dtype === "numeric").map(([name, s]) => (
                  <tr key={name}>
                    <td style={{ padding: "6px 10px", color: T.text, textAlign: "left" }}>{name}</td>
                    <td style={{ padding: "6px 10px", color: T.accent, textAlign: "right" }}>{s.dtype}</td>
                    <td style={{ padding: "6px 10px", color: T.text, textAlign: "right" }}>{s.count}</td>
                    <td style={{ padding: "6px 10px", color: T.text, textAlign: "right" }}>{s.mean}</td>
                    <td style={{ padding: "6px 10px", color: T.text, textAlign: "right" }}>{s.std}</td>
                    <td style={{ padding: "6px 10px", color: T.text, textAlign: "right" }}>{s.min}</td>
                    <td style={{ padding: "6px 10px", color: T.text, textAlign: "right" }}>{s.median}</td>
                    <td style={{ padding: "6px 10px", color: T.text, textAlign: "right" }}>{s.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StepPreview;
