// ============================================================
// DATA LAB — React フロントエンド（API連携版）
// ============================================================
// 単一ファイル版です。コンポーネント分割時は
// frontend-setup.md のディレクトリ構成に従って分割してください。
// ============================================================

import { useState, useMemo, useCallback, useEffect } from "react";
import Papa from "papaparse";

// ─────────────────────────────────────────────
//  定数・テーマ（constants/theme.js に分離可）
// ─────────────────────────────────────────────
const T = {
  bg: "#0f1117",
  surface: "#181b24",
  card: "#1e2230",
  border: "#2a2f40",
  accent: "#6c8cff",
  accentSoft: "rgba(108,140,255,.12)",
  accentGlow: "rgba(108,140,255,.25)",
  warn: "#ffb86c",
  warnSoft: "rgba(255,184,108,.12)",
  danger: "#ff6b81",
  dangerSoft: "rgba(255,107,129,.12)",
  success: "#50fa7b",
  successSoft: "rgba(80,250,123,.12)",
  text: "#e8ecf4",
  textSub: "#8892a8",
  textDim: "#555d73",
  radius: 10,
  font: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  fontSans: "'DM Sans', 'Segoe UI', sans-serif",
};

const STEPS = [
  "CSVアップロード",
  "データ確認",
  "欠損値処理",
  "目的変数",
  "説明変数",
  "モデル実行",
];

// API ベースURL（Viteプロキシ経由）
const API = "/api";

// ─────────────────────────────────────────────
//  API クライアント（api/client.js に分離可）
// ─────────────────────────────────────────────
const apiCall = async (method, path, body, isFormData = false) => {
  const opts = {
    method,
    headers: isFormData ? {} : { "Content-Type": "application/json" },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

const api = {
  /** CSVアップロード */
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);
    return apiCall("POST", "/upload", form, true);
  },
  /** 基本統計量取得 */
  stats: (sessionId) => apiCall("GET", `/stats/${sessionId}`),
  /** 欠損値処理 */
  handleMissing: (sessionId, strategies) =>
    apiCall("POST", "/preprocess/missing", { session_id: sessionId, strategies }),
  /** モデル学習 */
  train: (sessionId, params) =>
    apiCall("POST", "/train", { session_id: sessionId, ...params }),
};

// ─────────────────────────────────────────────
//  共通UIコンポーネント（ui/ に分離可）
// ─────────────────────────────────────────────
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

const Badge = ({ children, color = T.accent }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 6,
    fontSize: 11, fontWeight: 700, fontFamily: T.font,
    background: color + "20", color, letterSpacing: ".5px",
  }}>{children}</span>
);

const Card = ({ children, style }) => (
  <div style={{
    background: T.card, borderRadius: T.radius,
    border: `1px solid ${T.border}`, padding: 20, ...style,
  }}>{children}</div>
);

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

const ErrorMsg = ({ message, onRetry }) => (
  <div style={{
    background: T.dangerSoft, borderRadius: T.radius, padding: "12px 16px",
    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
  }}>
    <span style={{ color: T.danger, fontFamily: T.fontSans, fontSize: 13 }}>⚠️ {message}</span>
    {onRetry && <Btn variant="ghost" onClick={onRetry} style={{ padding: "4px 12px", fontSize: 12 }}>再試行</Btn>}
  </div>
);

// ─────────────────────────────────────────────
//  Step 1: CSVアップロード
// ─────────────────────────────────────────────
const StepUpload = ({ onUpload }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // クライアント側プレビュー用に先頭行だけパース
      const localPreview = await new Promise((resolve) => {
        Papa.parse(file, {
          header: true, skipEmptyLines: true, preview: 10,
          complete: (res) => resolve(res.data),
        });
      });
      // サーバーにアップロード
      const result = await api.upload(file);
      onUpload({ ...result, localPreview });
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, paddingTop: 40 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        <h2 style={{ fontFamily: T.fontSans, color: T.text, margin: 0, fontSize: 22 }}>CSVファイルをアップロード</h2>
        <p style={{ color: T.textSub, fontFamily: T.fontSans, fontSize: 14, marginTop: 8 }}>
          ドラッグ＆ドロップ、またはクリックで選択
        </p>
      </div>
      {error && <ErrorMsg message={error} />}
      {uploading ? (
        <Spinner text="アップロード中..." />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => {
            const inp = document.createElement("input");
            inp.type = "file"; inp.accept = ".csv";
            inp.onchange = (e) => handleFile(e.target.files[0]); inp.click();
          }}
          style={{
            width: "100%", maxWidth: 480, height: 180, borderRadius: 14,
            border: `2px dashed ${dragging ? T.accent : T.border}`,
            background: dragging ? T.accentSoft : "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all .25s",
          }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.6 }}>⬆️</div>
          <span style={{ color: T.textSub, fontFamily: T.fontSans, fontSize: 13 }}>.csv ファイル（最大 50MB）</span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  Step 2: データ確認（サーバーの統計量を使用）
// ─────────────────────────────────────────────
const StepPreview = ({ uploadResult, sessionId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.stats(sessionId);
      setStats(data);
    } catch (e) {
      setError(e.message);
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

// ─────────────────────────────────────────────
//  Step 3: 欠損値処理（API経由）
// ─────────────────────────────────────────────
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
      const res = await api.handleMissing(sessionId, strategies);
      setResult(res);
      setApplied(true);
      if (onProcessed) onProcessed(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!missingCols.length) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
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
          <span>✅</span>
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

// ─────────────────────────────────────────────
//  Step 4: 目的変数選択
// ─────────────────────────────────────────────
const StepTarget = ({ uploadResult, target, setTarget }) => {
  const { columns } = uploadResult;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontFamily: T.fontSans, color: T.textSub, fontSize: 14, margin: 0 }}>
        予測したいカラム（目的変数）を選択してください
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {columns.map((c) => {
          const sel = target === c.name;
          return (
            <div key={c.name} onClick={() => setTarget(c.name)}
              style={{
                background: sel ? T.accentSoft : T.card,
                border: `1.5px solid ${sel ? T.accent : T.border}`,
                borderRadius: T.radius, padding: "12px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all .15s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${sel ? T.accent : T.textDim}`,
                  background: sel ? T.accent : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                }}>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
                <span style={{ fontFamily: T.font, color: T.text, fontSize: 14 }}>{c.name}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Badge color={c.dtype === "numeric" ? T.accent : T.warn}>{c.dtype}</Badge>
                <Badge color={T.textSub}>{c.unique_count} ユニーク</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  Step 5: 説明変数選択・数値化設定
// ─────────────────────────────────────────────
const StepFeatures = ({ uploadResult, target, features, setFeatures, encoding, setEncoding }) => {
  const available = uploadResult.columns.filter((c) => c.name !== target);
  const toggleFeature = (name) =>
    setFeatures((p) => p.includes(name) ? p.filter((f) => f !== name) : [...p, name]);
  const selectAll = () => setFeatures(available.map((c) => c.name));
  const clearAll = () => setFeatures([]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontFamily: T.fontSans, color: T.textSub, fontSize: 14, margin: 0 }}>
          説明変数を選択し、カテゴリ変数の数値化方法を設定
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={selectAll} style={{ padding: "6px 14px", fontSize: 12 }}>全選択</Btn>
          <Btn variant="ghost" onClick={clearAll} style={{ padding: "6px 14px", fontSize: 12 }}>全解除</Btn>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {available.map((c) => {
          const checked = features.includes(c.name);
          const isCat = c.dtype === "categorical" || c.dtype === "text";
          return (
            <Card key={c.name} style={{ padding: "10px 16px", opacity: checked ? 1 : 0.5, transition: "opacity .15s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleFeature(c.name)}
                    style={{ accentColor: T.accent, width: 16, height: 16 }} />
                  <span style={{ fontFamily: T.font, color: T.text, fontSize: 13 }}>{c.name}</span>
                  <Badge color={c.dtype === "numeric" ? T.accent : T.warn}>{c.dtype}</Badge>
                </div>
                {isCat && checked && (
                  <select value={encoding[c.name] || "label"}
                    onChange={(e) => setEncoding((p) => ({ ...p, [c.name]: e.target.value }))}
                    style={{
                      background: T.surface, color: T.text, border: `1px solid ${T.border}`,
                      borderRadius: 6, padding: "4px 10px", fontFamily: T.fontSans, fontSize: 12, outline: "none",
                    }}>
                    <option value="label">ラベルエンコーディング</option>
                    <option value="onehot">ワンホットエンコーディング</option>
                  </select>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  Step 6: モデル選定・実行（API経由）
// ─────────────────────────────────────────────
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
      const res = await api.train(sessionId, {
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
      setError(e.message);
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
            { id: "classification", label: "分類", icon: "🏷️" },
            { id: "regression", label: "回帰", icon: "📈" },
          ].map((t) => (
            <div key={t.id} onClick={() => { setTaskType(t.id); setModel(""); setResults(null); }}
              style={{
                flex: 1, padding: "14px 16px", borderRadius: T.radius,
                border: `1.5px solid ${taskType === t.id ? T.accent : T.border}`,
                background: taskType === t.id ? T.accentSoft : "transparent",
                cursor: "pointer", textAlign: "center", transition: "all .15s",
              }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
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
        <Btn onClick={run} disabled={!model}>🚀 モデルを実行</Btn>
      )}

      {/* 結果表示 */}
      {results && (
        <Card style={{ border: `1px solid ${T.accent}40` }}>
          <h4 style={{ fontFamily: T.fontSans, color: T.accent, margin: "0 0 16px", fontSize: 16 }}>📊 分析結果</h4>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Badge color={T.textSub}>学習: {results.train_size}</Badge>
            <Badge color={T.textSub}>テスト: {results.test_size}</Badge>
          </div>

          {results.task_type === "classification" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 指標 */}
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

              {/* 特徴量重要度 */}
              {results.feature_importance && (
                <div>
                  <h5 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 8px", fontSize: 13 }}>特徴量重要度</h5>
                  {Object.entries(results.feature_importance)
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
              )}
            </div>
          ) : (
            /* 回帰結果 */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "R²", value: (results.metrics.r2 * 100).toFixed(1) + "%", color: T.accent },
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

              {/* 特徴量重要度 */}
              {results.feature_importance && (
                <div>
                  <h5 style={{ fontFamily: T.fontSans, color: T.text, margin: "0 0 8px", fontSize: 13 }}>特徴量重要度</h5>
                  {Object.entries(results.feature_importance)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, val]) => (
                      <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: T.font, fontSize: 12, color: T.text, minWidth: 120 }}>{name}</span>
                        <div style={{ flex: 1, height: 8, background: T.surface, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${val * 100}%`, height: "100%", background: T.accent, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: T.font, fontSize: 11, color: T.textSub, minWidth: 40, textAlign: "right" }}>
                          {(val * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  メインアプリ
// ─────────────────────────────────────────────
export default function DataAnalysisApp() {
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [target, setTarget] = useState("");
  const [features, setFeatures] = useState([]);
  const [encoding, setEncoding] = useState({});

  const canNext = useMemo(() => {
    if (step === 0) return !!uploadResult;
    if (step === 1) return true;
    if (step === 2) return true;
    if (step === 3) return !!target;
    if (step === 4) return features.length > 0;
    return false;
  }, [step, uploadResult, target, features]);

  const handleUpload = (result) => {
    setSessionId(result.session_id);
    setUploadResult(result);
    setStep(1);
  };

  const nextStep = () => {
    if (step === 3 && features.length === 0) {
      setFeatures(uploadResult.columns.filter((c) => c.name !== target).map((c) => c.name));
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const reset = () => {
    setStep(0); setSessionId(null); setUploadResult(null);
    setTarget(""); setFeatures([]); setEncoding({});
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.fontSans }}>
      {/* ヘッダー */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚗️</span>
          <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, letterSpacing: "1px", color: T.accent }}>DATA LAB</span>
        </div>
        {uploadResult && (
          <Btn variant="danger" onClick={reset} style={{ padding: "6px 14px", fontSize: 12 }}>リセット</Btn>
        )}
      </div>

      {/* ステッパー */}
      {step > 0 && (
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 4, minWidth: "fit-content" }}>
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} onClick={() => i < step && setStep(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                    borderRadius: 20, background: active ? T.accentSoft : done ? T.successSoft : "transparent",
                    cursor: done ? "pointer" : "default", transition: "all .15s", whiteSpace: "nowrap",
                  }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: active ? T.accent : done ? T.success : T.surface,
                    color: active || done ? "#fff" : T.textDim,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, fontFamily: T.font,
                  }}>{done ? "✓" : i + 1}</div>
                  <span style={{ fontSize: 12, color: active ? T.accent : done ? T.success : T.textDim, fontWeight: active ? 600 : 400 }}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* コンテンツ */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px", paddingBottom: 100 }}>
        {step === 0 && <StepUpload onUpload={handleUpload} />}
        {step === 1 && <StepPreview uploadResult={uploadResult} sessionId={sessionId} />}
        {step === 2 && <StepMissing uploadResult={uploadResult} sessionId={sessionId} />}
        {step === 3 && <StepTarget uploadResult={uploadResult} target={target} setTarget={setTarget} />}
        {step === 4 && (
          <StepFeatures uploadResult={uploadResult} target={target}
            features={features} setFeatures={setFeatures}
            encoding={encoding} setEncoding={setEncoding} />
        )}
        {step === 5 && (
          <StepModel uploadResult={uploadResult} sessionId={sessionId}
            target={target} features={features} encoding={encoding} />
        )}
      </div>

      {/* フッターナビ */}
      {step > 0 && step < STEPS.length && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px",
          background: `linear-gradient(transparent, ${T.bg} 30%)`,
          display: "flex", justifyContent: "space-between", pointerEvents: "none",
        }}>
          <div style={{ pointerEvents: "auto" }}>
            <Btn variant="ghost" onClick={() => setStep((s) => s - 1)}>← 戻る</Btn>
          </div>
          {step < STEPS.length - 1 && (
            <div style={{ pointerEvents: "auto" }}>
              <Btn onClick={nextStep} disabled={!canNext}>次へ →</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
