"""共通ユーティリティ: データ読み込み、OLS回帰、グラフ描画のヘルパー関数"""

import os
import pandas as pd
import matplotlib.pyplot as plt
import statsmodels.api as sm


def load_data(csv_path):
    """CSV読み込み + 欠損除去 + float変換"""
    df = pd.read_csv(csv_path).dropna()
    for col in df.columns:
        df[col] = df[col].astype(float)
    print(f"データ件数: {len(df)}")
    return df


def load_data_undrop(csv_path):
    """CSV読み込み"""
    df = pd.read_csv(csv_path)
    # for col in df.columns:
    #     df[col] = df[col].astype(float)
    print(f"データ件数: {len(df)}")
    return df


def setup_plot():
    """matplotlibの日本語フォント設定"""
    plt.rcParams["font.family"] = "MS Gothic"


def run_ols(df, x_cols, y_col):
    """OLS回帰を実行して結果モデルを返す

    x_cols: 説明変数の列名リスト（DataFrameに存在するカラム名）
    y_col: 目的変数の列名
    """
    X = sm.add_constant(df[x_cols].values)
    y = df[y_col].values
    model = sm.OLS(y, X).fit()
    return model


def print_model_summary(model, name, var_names):
    """モデルの主要統計量をコンソールに表示"""
    print(f"\n{'=' * 50}")
    print(f"【{name}】")
    print(model.summary())
    print(f"  R2      = {model.rsquared:.4f}")
    print(f"  Adj. R2 = {model.rsquared_adj:.4f}")
    print(f"  AIC     = {model.aic:.1f}")
    print(f"  観測数  = {model.nobs:.0f}")
    print(f"  {'変数':<15} {'係数':>12} {'p値':>12}")
    print(f"  {'-' * 40}")
    for i, name_v in enumerate(var_names):
        print(f"  {name_v:<15} {model.params[i]:>12.4f} {model.pvalues[i]:>12.2e}")


def print_r2_comparison(rows):
    """複数モデルのR2比較表を表示

    rows: [(モデル名, model), ...] のリスト
    """
    print(f"\n{'=' * 50}")
    print("【R2 比較表】")
    print(f"  {'モデル':<40} {'R2':>8} {'Adj.R2':>8} {'AIC':>10}")
    print(f"  {'-' * 68}")
    for name, m in rows:
        print(f"  {name:<40} {m.rsquared:>8.4f} {m.rsquared_adj:>8.4f} {m.aic:>10.1f}")


def save_fig(filename, output_dir="output"):
    """グラフを保存してクローズ"""
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    plt.tight_layout()
    plt.savefig(filepath)
    plt.close()
    print(f"  -> {filepath} に保存しました")


def plot_pred_vs_actual(y_true, y_pred, title, filename, output_dir="output"):
    """予測値 vs 実測値の散布図を描画・保存"""
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.scatter(y_pred, y_true, alpha=0.3, s=10)
    lims = [min(y_true.min(), y_pred.min()), max(y_true.max(), y_pred.max())]
    ax.plot(lims, lims, color="red", linewidth=1, linestyle="--", label="y=x")
    ax.set_title(title)
    ax.set_xlabel("予測値")
    ax.set_ylabel("実測値")
    ax.legend()
    save_fig(filename, output_dir)


def plot_correlation_matrix(df, filename, output_dir="output"):
    """相関行列の散布図マトリックスを描画・保存"""
    corr = df.corr()
    cols = df.columns
    n = len(cols)
    print(f"総件数: {len(df)}")

    _, axes = plt.subplots(n, n, figsize=(10, 9))

    for i, col_y in enumerate(cols):
        for j, col_x in enumerate(cols):
            ax = axes[i][j]
            if i == j:
                ax.hist(df[col_x], bins=14)
            else:
                r = corr.loc[col_y, col_x]
                ax.scatter(df[col_x], df[col_y], s=10)
                ax.text(0.05, 0.93, f"r = {r:.3f}", transform=ax.transAxes)

            if i == n - 1:
                ax.set_xlabel(col_x, fontsize=10)
            else:
                ax.set_xticklabels([])
            if j == 0:
                ax.set_ylabel(col_y, fontsize=10)
            else:
                ax.set_yticklabels([])

    save_fig(filename, output_dir)
