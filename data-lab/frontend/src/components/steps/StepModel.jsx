import { useState } from "react";
import { T } from "../../constants/theme";
import { trainModel } from "../../api/client";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";
import Card from "../ui/Card";
import Spinner from "../ui/Spinner";
import ErrorMsg from "../ui/ErrorMsg";

// Step6: モデル選定・実行（API経由）
const StepModel = ({ uploadResult, sessionId, target, features, encoding }) => {
  const targetCol = uploadResult.columns.find((c) => c.name === target);
  const [taskType, setTaskType] = useState(() =>
    targetCol?.dtype === "numeric" && targetCol?.unique_count > 10 ? "regression" : "classification"
  );
  const [model, setModel] = useState("");
  const [splitRatio, setSplitRatio] = useState(0.2);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const models = taskType === "classification"
    ? [
        { id: "logistic_regression", name: "ロジスティック回帰" },
        { id: "decision_tree", name: "決定木" },
        { id: "random_forest", name: "ランダムフォレスト" },
        { id: "knn", name: "k-NN" },
      ]
    : [
        { id: "linear_regression", name: "線形回帰" },
        { id: "decision_tree", name: "決定木" },
        { id: "random_forest", name: "ランダムフォレスト" },
      ];

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await trainModel(sessionId, {
        target,
        features,
        task_type: taskType,
        model,
        encoding,
        test_ratio: splitRatio,
        options: { normalize: false, random_state: 42 },
      });
      setResults(res);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* タスクタイプ */}
      <Card>
        <h4 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 12px", fontSize: 14 }}>タスクタイプ</h4>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { id: "classification", label: "分類", icon: "&#127991;&#65039;" },
            { id: "regression", label: "回帰", icon: "&#128200;" },
          ].map((t) => (
            <div key={t.id} onClick={() => { setTaskType(t.id); setModel(""); setResults(null); }}
              style={{
                flex: 1, padding: "14px 16px", borderRadius: T.radius,
                border: `1.5px solid ${taskType === t.id ? T.accent : T.border}`,
                background: taskType === t.id ? T.accentSoft : "transparent",
                cursor: "pointer", textAlign: "center", transition: "all .15s",
              }}>
              <div style={{ fontSize: 24, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: t.icon }} />
              <div style={{ fontFamily: T.fontSans, color: T.text, fontSize: 14 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* モデル選択 */}
      <Card>
        <h4 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 12px", fontSize: 14 }}>モデル選択</h4>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {models.map((m) => (
            <div key={m.id} onClick={() => { setModel(m.id); setResults(null); }}
              style={{
                padding: "10px 18px", borderRadius: T.radius,
                border: `1.5px solid ${model === m.id ? T.accent : T.border}`,
                background: model === m.id ? T.accentSoft : "transparent",
                cursor: "pointer", fontFamily: T.fontSans, fontSize: 13,
                color: model === m.id ? T.accent : T.text, transition: "all .15s",
              }}>
              {m.name}
            </div>
          ))}
        </div>
      </Card>

      {/* 分割比率 */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h4 style={{ fontFamily: T.fontSans, color: T.text, margin: 0, fontSize: 14 }}>テストデータ比率</h4>
          <Badge color={T.accent}>{(splitRatio * 100).toFixed(0)}%</Badge>
        </div>
        <input type="range" min="0.1" max="0.5" step="0.05" value={splitRatio}
          onChange={(e) => setSplitRatio(Number(e.target.value))}
          style={{ width: "100%", marginTop: 12, accentColor: T.accent }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.fontSans, fontSize: 11, color: T.textDim, marginTop: 4 }}>
          <span>学習: {(100 - splitRatio * 100).toFixed(0)}%</span>
          <span>テスト: {(splitRatio * 100).toFixed(0)}%</span>
        </div>
      </Card>

      {/* 実行 */}
      {error && <ErrorMsg message={error} onRetry={run} />}
      {loading ? (
        <Spinner text="モデルを学習中..." />
      ) : (
        <Btn onClick={run} disabled={!model}>&#128640; モデルを実行</Btn>
      )}

      {/* 結果表示 */}
      {results && (
        <Card style={{ border: `1px solid ${T.accent}40` }}>
          <h4 style={{ fontFamily: T.fontSans, color: T.accent, margin: "0 0 16px", fontSize: 16 }}>&#128202; 分析結果</h4>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Badge color={T.textSub}>学習: {results.train_size}</Badge>
            <Badge color={T.textSub}>テスト: {results.test_size}</Badge>
          </div>

          {results.task_type === "classification" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 分類指標 */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "Accuracy", value: (results.metrics.accuracy * 100).toFixed(1), color: T.accent },
                  { label: "Precision", value: (results.metrics.precision_macro * 100).toFixed(1), color: T.warn },
                  { label: "Recall", value: (results.metrics.recall_macro * 100).toFixed(1), color: T.success },
                  { label: "F1", value: (results.metrics.f1_macro * 100).toFixed(1), color: T.text },
                ].map((m) => (
                  <div key={m.label} style={{
                    flex: 1, minWidth: 100, background: m.color + "18",
                    borderRadius: T.radius, padding: 14, textAlign: "center",
                  }}>
                    <div style={{ fontFamily: T.font, fontSize: 24, color: m.color, fontWeight: 700 }}>{m.value}%</div>
                    <div style={{ fontFamily: T.fontSans, color: T.textSub, fontSize: 12, marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* 混同行列 */}
              {results.confusion_matrix && (
                <div>
                  <h5 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 8px", fontSize: 13 }}>混同行列</h5>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", fontFamily: T.font, fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: "6px 12px", color: T.textDim }}></th>
                          {results.confusion_matrix.labels.map((l) => (
                            <th key={l} style={{ padding: "6px 12px", color: T.accent, textAlign: "center" }}>予測:{l}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.confusion_matrix.labels.map((actual, ri) => (
                          <tr key={actual}>
                            <td style={{ padding: "6px 12px", color: T.warn, fontWeight: 600 }}>実際:{actual}</td>
                            {results.confusion_matrix.matrix[ri].map((v, ci) => {
                              const isCorrect = ri === ci;
                              return (
                                <td key={ci} style={{
                                  padding: "8px 16px", textAlign: "center",
                                  color: isCorrect ? T.success : v > 0 ? T.danger : T.textDim,
                                  background: isCorrect ? T.successSoft : v > 0 ? T.dangerSoft : "transparent",
                                  borderRadius: 4, fontWeight: 700,
                                }}>{v}</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 特徴量重要度（分類） */}
              {results.feature_importance && (
                <FeatureImportance data={results.feature_importance} />
              )}
            </div>
          ) : (
            /* 回帰結果 */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "R\u00B2", value: (results.metrics.r2 * 100).toFixed(1) + "%", color: T.accent },
                  { label: "RMSE", value: results.metrics.rmse.toFixed(3), color: T.warn },
                  { label: "MAE", value: results.metrics.mae.toFixed(3), color: T.success },
                ].map((m) => (
                  <div key={m.label} style={{
                    flex: 1, minWidth: 100, background: m.color + "18",
                    borderRadius: T.radius, padding: 14, textAlign: "center",
                  }}>
                    <div style={{ fontFamily: T.font, fontSize: 24, color: m.color, fontWeight: 700 }}>{m.value}</div>
                    <div style={{ fontFamily: T.fontSans, color: T.textSub, fontSize: 12, marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* 実測 vs 予測 ミニチャート */}
              {results.actual_vs_predicted && (
                <div>
                  <h5 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 8px", fontSize: 13 }}>
                    実測値 vs 予測値（先頭{Math.min(results.actual_vs_predicted.length, 30)}件）
                  </h5>
                  <div style={{ display: "flex", gap: 2, alignItems: "end", height: 100 }}>
                    {results.actual_vs_predicted.slice(0, 30).map((d, i) => {
                      const maxV = Math.max(
                        ...results.actual_vs_predicted.map((p) => Math.max(Math.abs(p.actual), Math.abs(p.predicted)))
                      ) || 1;
                      const hA = Math.max(4, (Math.abs(d.actual) / maxV) * 90);
                      const hP = Math.max(4, (Math.abs(d.predicted) / maxV) * 90);
                      return (
                        <div key={i} style={{ display: "flex", gap: 1, alignItems: "end" }}>
                          <div style={{ width: 4, height: hA, background: T.accent, borderRadius: 2, opacity: 0.6 }} title={`実測: ${d.actual}`} />
                          <div style={{ width: 4, height: hP, background: T.warn, borderRadius: 2, opacity: 0.6 }} title={`予測: ${d.predicted.toFixed(2)}`} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                    <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.accent }}>● 実測値</span>
                    <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.warn }}>● 予測値</span>
                  </div>
                </div>
              )}

              {/* 特徴量重要度（回帰） */}
              {results.feature_importance && (
                <FeatureImportance data={results.feature_importance} />
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// 特徴量重要度の表示（分類・回帰共通）
const FeatureImportance = ({ data }) => (
  <div>
    <h5 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 8px", fontSize: 13 }}>特徴量重要度</h5>
    {Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: T.font, fontSize: 12, color: T.text, minWidth: 120 }}>{name}</span>
          <div style={{ flex: 1, height: 8, background: T.surface, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${val * 100}%`, height: "100%", background: T.accent, borderRadius: 4, transition: "width .5s" }} />
          </div>
          <span style={{ fontFamily: T.font, fontSize: 11, color: T.textSub, minWidth: 40, textAlign: "right" }}>
            {(val * 100).toFixed(1)}%
          </span>
        </div>
      ))}
  </div>
);

export default StepModel;
