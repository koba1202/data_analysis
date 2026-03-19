"""Phase 3: 交互作用・多項式回帰 - ude, tekubi を活用したモデル改善"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt
import statsmodels.api as sm

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.utils import (
    load_data, setup_plot, run_ols, print_model_summary,
    print_r2_comparison, save_fig, plot_pred_vs_actual,
)


def main():
    setup_plot()
    df = load_data("data/wlchild2.csv")

    y = df["weight"].values

    # --- モデル1: 単回帰 age -> weight（ベースライン）---
    model1 = run_ols(df, ["age"], "weight")
    print_model_summary(model1, "モデル1: 単回帰 age -> weight", ["切片", "age"])

    # --- モデル2: 重回帰 age + length -> weight ---
    model2 = run_ols(df, ["age", "length"], "weight")
    print_model_summary(model2, "モデル2: age + length -> weight", ["切片", "age", "length"])

    # --- モデル3: 全変数 age + length + ude + tekubi -> weight ---
    model3 = run_ols(df, ["age", "length", "ude", "tekubi"], "weight")
    print_model_summary(
        model3, "モデル3: age + length + ude + tekubi -> weight",
        ["切片", "age", "length", "ude", "tekubi"],
    )

    # --- モデル4: 交互作用 age + length + age*length -> weight ---
    df["age_x_length"] = df["age"].values * df["length"].values
    model4 = run_ols(df, ["age", "length", "age_x_length"], "weight")
    print_model_summary(
        model4, "モデル4: 交互作用 age + length + age*length -> weight",
        ["切片", "age", "length", "age*length"],
    )

    # --- モデル5: 全変数 + 交互作用 ---
    df["ude_x_tekubi"] = df["ude"].values * df["tekubi"].values
    model5 = run_ols(df, ["age", "length", "ude", "tekubi", "age_x_length", "ude_x_tekubi"], "weight")
    print_model_summary(
        model5,
        "モデル5: 全変数 + 交互作用 (age*length, ude*tekubi)",
        ["切片", "age", "length", "ude", "tekubi", "age*length", "ude*tekubi"],
    )

    # --- モデル6: 多項式 length + length^2 + ude -> weight ---
    df["length2"] = df["length"].values ** 2
    model6 = run_ols(df, ["length", "length2", "ude"], "weight")
    print_model_summary(
        model6, "モデル6: 多項式 length + length^2 + ude -> weight",
        ["切片", "length", "length^2", "ude"],
    )

    # --- R2 比較表 ---
    print_r2_comparison([
        ("単回帰 (age)", model1),
        ("重回帰 (age+length)", model2),
        ("全変数 (age+length+ude+tekubi)", model3),
        ("交互作用 (age+length+age*length)", model4),
        ("全変数+交互作用", model5),
        ("多項式 (length+length^2+ude)", model6),
    ])

    # --- 可視化: 予測値 vs 実測値の比較（ベストモデル2つ）---
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # 左: モデル3（全変数）
    ax = axes[0]
    y_pred3 = model3.fittedvalues
    ax.scatter(y_pred3, y, alpha=0.3, s=10)
    lims = [min(y.min(), y_pred3.min()), max(y.max(), y_pred3.max())]
    ax.plot(lims, lims, color="red", linestyle="--", linewidth=1)
    ax.set_title(f"全変数モデル（R\u00b2={model3.rsquared:.3f}）")
    ax.set_xlabel("予測値（weight）")
    ax.set_ylabel("実測値（weight）")

    # 右: モデル5（全変数+交互作用）
    ax = axes[1]
    y_pred5 = model5.fittedvalues
    ax.scatter(y_pred5, y, alpha=0.3, s=10)
    lims = [min(y.min(), y_pred5.min()), max(y.max(), y_pred5.max())]
    ax.plot(lims, lims, color="red", linestyle="--", linewidth=1)
    ax.set_title(f"全変数+交互作用（R\u00b2={model5.rsquared:.3f}）")
    ax.set_xlabel("予測値（weight）")
    ax.set_ylabel("実測値（weight）")

    save_fig("03_model_comparison.png")

    # 一時カラムを削除
    df.drop(columns=["age_x_length", "ude_x_tekubi", "length2"], inplace=True)


if __name__ == "__main__":
    main()
