import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import statsmodels.api as sm


def run_simple_regression(df, x_col, y_col, label):
    """単回帰分析を実行し、結果を返す"""
    X = df[x_col].values
    y = df[y_col].values
    X_with_const = sm.add_constant(X)
    model = sm.OLS(y, X_with_const).fit()

    print(f"\n{'='*50}")
    print(f"【単回帰】{label}")
    print(f"  R2      = {model.rsquared:.4f}")
    print(f"  切片     = {model.params[0]:.4f}")
    print(f"  回帰係数 = {model.params[1]:.6f}")
    print(f"  p値      = {model.pvalues[1]:.2e}")
    print(f"  観測数   = {model.nobs:.0f}")

    return model


def plot_regression(df, x_col, y_col, model, title, filename):
    """散布図＋回帰直線を描画して保存"""
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.scatter(df[x_col], df[y_col], alpha=0.3, s=10, label="データ")

    # 回帰直線
    x_range = np.linspace(df[x_col].min(), df[x_col].max(), 100)
    y_pred = model.params[0] + model.params[1] * x_range
    ax.plot(x_range, y_pred, color="red", linewidth=2, label="回帰直線")

    r2 = model.rsquared
    ax.set_title(f"{title}（R\u00b2 = {r2:.4f}）")
    ax.set_xlabel(x_col)
    ax.set_ylabel(y_col)
    ax.legend()
    plt.tight_layout()
    plt.savefig(f"output/{filename}")
    plt.close()
    print(f"  -> output/{filename} に保存しました")


def main():
    plt.rcParams["font.family"] = "MS Gothic"

    # データ読み込み
    df = pd.read_csv("data/wlchild.csv").dropna()
    print(f"データ件数: {len(df)}")

    # 1. age → weight の単回帰
    model_aw = run_simple_regression(df, "age", "weight", "age -> weight")
    plot_regression(df, "age", "weight", model_aw,
                    "年齢 \u2192 体重 の単回帰", "02_age_weight.png")

    # 2. age -> length の単回帰
    model_al = run_simple_regression(df, "age", "length", "age -> length")
    plot_regression(df, "age", "length", model_al,
                    "年齢 \u2192 身長 の単回帰", "02_age_length.png")

    # 3. length -> weight の単回帰
    model_lw = run_simple_regression(df, "length", "weight", "length -> weight")
    plot_regression(df, "length", "weight", model_lw,
                    "身長 \u2192 体重 の単回帰", "02_length_weight.png")

    # まとめ表
    print(f"\n{'='*50}")
    print("【単回帰 R2 比較】")
    print(f"  age -> weight  : R2 = {model_aw.rsquared:.4f}")
    print(f"  age -> length  : R2 = {model_al.rsquared:.4f}")
    print(f"  length -> weight: R2 = {model_lw.rsquared:.4f}")


if __name__ == "__main__":
    main()
