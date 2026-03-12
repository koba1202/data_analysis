import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import statsmodels.api as sm


def main():
    plt.rcParams["font.family"] = "MS Gothic"

    # データ読み込み
    df = pd.read_csv("data/wlchild.csv").dropna()
    print(f"データ件数: {len(df)}")

    y = df["weight"].values
    age = df["age"].values
    length = df["length"].values

    # --- 1. 単回帰（ベースライン）: age → weight ---
    X_simple = sm.add_constant(age)
    model_simple = sm.OLS(y, X_simple).fit()

    print(f"\n{'=' * 50}")
    print("【モデル1】単回帰: age -> weight")
    print(f"  R2 = {model_simple.rsquared:.4f}")

    # --- 2. 多項式回帰: age + age^2 → weight ---
    length2 = length**2
    X_poly = sm.add_constant(np.column_stack([length, length2]))
    model_poly = sm.OLS(y, X_poly).fit()

    print(f"\n{'=' * 50}")
    print("【モデル2】多項式回帰: length + length^2 -> weight")
    print(f"  R2         = {model_poly.rsquared:.4f}")
    print(f"  Adj. R2    = {model_poly.rsquared_adj:.4f}")
    print(f"  切片       = {model_poly.params[0]:.4f}")
    print(f"  length の係数 = {model_poly.params[1]:.4f}")
    print(f"  length^2 の係数 = {model_poly.params[2]:.4f}")
    for i, name in enumerate(["切片", "length", "length^2"]):
        print(f"  {name}: p値 = {model_poly.pvalues[i]:.2e}")

    # --- 3. 交互作用モデル: age + length + age*length → weight ---
    interaction = age * length
    X_inter = sm.add_constant(np.column_stack([age, length, interaction]))
    model_inter = sm.OLS(y, X_inter).fit()

    print(f"\n{'=' * 50}")
    print("【モデル3】交互作用: age + length + age*length -> weight")
    print(f"  R2      = {model_inter.rsquared:.4f}")
    print(f"  Adj. R2 = {model_inter.rsquared_adj:.4f}")
    names = ["切片", "age", "length", "age*length"]
    for i, name in enumerate(names):
        print(
            f"  {name}: 係数 = {model_inter.params[i]:.6f}, "
            f"p値 = {model_inter.pvalues[i]:.2e}"
        )

    # --- R2 比較表 ---
    print(f"\n{'=' * 50}")
    print("【R2 比較表】")
    print(f"  {'モデル':<30} {'R2':>8} {'Adj.R2':>8}")
    print(f"  {'-' * 48}")
    rows = [
        ("単回帰 (age->weight)", model_simple.rsquared, model_simple.rsquared_adj),
        ("多項式 (age+age^2->weight)", model_poly.rsquared, model_poly.rsquared_adj),
        ("交互作用 (age+len+age*len)", model_inter.rsquared, model_inter.rsquared_adj),
    ]
    for name, r2, adj_r2 in rows:
        print(f"  {name:<30} {r2:>8.4f} {adj_r2:>8.4f}")

    # --- 可視化1: 単回帰 vs 多項式 ---
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.scatter(length, y, alpha=0.3, s=10, label="データ")
    x_plot = np.linspace(length.min(), length.max(), 200)

    # 単回帰直線
    X_simple = sm.add_constant(length)
    model_simple_length = sm.OLS(y, X_simple).fit()
    y_simple = model_simple_length.params[0] + model_simple_length.params[1] * x_plot
    ax.plot(
        x_plot,
        y_simple,
        color="orange",
        linewidth=2,
        label=f"単回帰 (R\u00b2={model_simple_length.rsquared:.3f})",
    )

    # 多項式曲線
    y_poly = (
        model_poly.params[0]
        + model_poly.params[1] * x_plot
        + model_poly.params[2] * x_plot**2
    )
    ax.plot(
        x_plot,
        y_poly,
        color="red",
        linewidth=2,
        label=f"多項式 (R\u00b2={model_poly.rsquared:.3f})",
    )

    ax.set_title("年齢 \u2192 身長: 単回帰 vs 多項式回帰")
    ax.set_xlabel("length（身長）")
    ax.set_ylabel("weight（体重 kg）")
    ax.legend()
    plt.tight_layout()
    plt.savefig("output/03_polynomial.png")
    plt.close()
    print("\n-> output/03_polynomial.png に保存しました")

    # --- 可視化2: 交互作用モデルの予測値 vs 実測値 ---
    fig, ax = plt.subplots(figsize=(8, 6))
    y_pred_inter = model_inter.fittedvalues
    ax.scatter(y_pred_inter, y, alpha=0.3, s=10)
    lims = [min(y.min(), y_pred_inter.min()), max(y.max(), y_pred_inter.max())]
    ax.plot(lims, lims, color="red", linewidth=1, linestyle="--", label="y=x")
    ax.set_title(
        f"交互作用モデル（age + length + age\u00d7length）\n"
        f"予測値 vs 実測値（R\u00b2={model_inter.rsquared:.3f}）"
    )
    ax.set_xlabel("予測値（weight）")
    ax.set_ylabel("実測値（weight）")
    ax.legend()
    plt.tight_layout()
    plt.savefig("output/03_interaction.png")
    plt.close()
    print("-> output/03_interaction.png に保存しました")


if __name__ == "__main__":
    main()
