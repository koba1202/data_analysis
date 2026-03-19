import sys
import os
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.utils import (
    load_data, setup_plot, run_ols, print_model_summary,
    print_r2_comparison, save_fig, plot_pred_vs_actual,
)


def main():
    setup_plot()
    df = load_data("data/wlchild2.csv")

    # --- 基本統計量 ---
    print(f"\n{'=' * 50}")
    print("【基本統計量】")
    print(df.describe().round(2).to_string())

    # --- 相関行列 ---
    print(f"\n{'=' * 50}")
    print("【相関行列】")
    print(df.corr().round(3).to_string())

    y = df["weight"].values

    # --- モデル1: age + length -> weight ---
    model1 = run_ols(df, ["age", "length"], "weight")
    print_model_summary(model1, "モデル1: age + length -> weight", ["切片", "age", "length"])

    # --- モデル2: age + length + ude + tekubi -> weight ---
    model2 = run_ols(df, ["age", "length", "ude", "tekubi"], "weight")
    print_model_summary(
        model2, "モデル2: age + length + ude + tekubi -> weight",
        ["切片", "age", "length", "ude", "tekubi"],
    )

    # --- モデル3: length + tekubi -> weight ---
    model3 = run_ols(df, ["length", "tekubi"], "weight")
    print_model_summary(
        model3, "モデル3: length + tekubi -> weight",
        ["切片", "length", "tekubi"],
    )

    # --- モデル比較 ---
    print_r2_comparison([
        ("age + length", model1),
        ("age + length + ude + tekubi", model2),
        ("length + tekubi", model3),
    ])

    # --- 可視化 ---
    _, axes = plt.subplots(1, 2, figsize=(14, 6))

    # 左: モデル1 予測値 vs 実測値
    ax = axes[0]
    y_pred1 = model1.fittedvalues
    ax.scatter(y_pred1, y, alpha=0.3, s=10)
    lims = [min(y.min(), y_pred1.min()), max(y.max(), y_pred1.max())]
    ax.plot(lims, lims, color="red", linestyle="--", linewidth=1)
    ax.set_title(f"モデル1: age+length（R\u00b2={model1.rsquared:.3f}）")
    ax.set_xlabel("予測値（weight）")
    ax.set_ylabel("実測値（weight）")

    # 右: モデル2 予測値 vs 実測値
    ax = axes[1]
    y_pred2 = model2.fittedvalues
    ax.scatter(y_pred2, y, alpha=0.3, s=10)
    lims = [min(y.min(), y_pred2.min()), max(y.max(), y_pred2.max())]
    ax.plot(lims, lims, color="red", linestyle="--", linewidth=1)
    ax.set_title(f"モデル2: age+length+ude+tekubi（R\u00b2={model2.rsquared:.3f}）")
    ax.set_xlabel("予測値（weight）")
    ax.set_ylabel("実測値（weight）")

    save_fig("04_extended.png")


if __name__ == "__main__":
    main()
