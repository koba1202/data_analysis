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
    df = load_data("data/wlchild.csv")

    y = df["weight"].values
    age = df["age"].values
    length = df["length"].values

    # --- 1. 単回帰（ベースライン）: age -> weight ---
    model_simple = run_ols(df, ["age"], "weight")
    print_model_summary(model_simple, "モデル1: 単回帰 age -> weight", ["切片", "age"])

    # --- 2. 多項式回帰: length + length^2 -> weight ---
    df["length2"] = length ** 2
    model_poly = run_ols(df, ["length", "length2"], "weight")
    print_model_summary(
        model_poly, "モデル2: 多項式 length + length^2 -> weight",
        ["切片", "length", "length^2"],
    )

    # --- 3. 交互作用モデル: age + length + age*length -> weight ---
    df["age_x_length"] = age * length
    model_inter = run_ols(df, ["age", "length", "age_x_length"], "weight")
    print_model_summary(
        model_inter, "モデル3: 交互作用 age + length + age*length -> weight",
        ["切片", "age", "length", "age*length"],
    )

    # --- R2 比較表 ---
    print_r2_comparison([
        ("単回帰 (age->weight)", model_simple),
        ("多項式 (length+length^2->weight)", model_poly),
        ("交互作用 (age+length+age*length)", model_inter),
    ])

    # --- 可視化1: 単回帰 vs 多項式 ---
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.scatter(length, y, alpha=0.3, s=10, label="データ")
    x_plot = np.linspace(length.min(), length.max(), 200)

    # 単回帰直線（length -> weight）
    X_simple_len = sm.add_constant(length)
    model_simple_length = sm.OLS(y, X_simple_len).fit()
    y_simple = model_simple_length.params[0] + model_simple_length.params[1] * x_plot
    ax.plot(x_plot, y_simple, color="orange", linewidth=2,
            label=f"単回帰 (R\u00b2={model_simple_length.rsquared:.3f})")

    # 多項式曲線
    y_poly = (model_poly.params[0]
              + model_poly.params[1] * x_plot
              + model_poly.params[2] * x_plot ** 2)
    ax.plot(x_plot, y_poly, color="red", linewidth=2,
            label=f"多項式 (R\u00b2={model_poly.rsquared:.3f})")

    ax.set_title("身長 \u2192 体重: 単回帰 vs 多項式回帰")
    ax.set_xlabel("length（身長）")
    ax.set_ylabel("weight（体重 kg）")
    ax.legend()
    save_fig("03_polynomial.png")

    # --- 可視化2: 交互作用モデルの予測値 vs 実測値 ---
    plot_pred_vs_actual(
        y, model_inter.fittedvalues,
        f"交互作用モデル（age + length + age\u00d7length）\n"
        f"予測値 vs 実測値（R\u00b2={model_inter.rsquared:.3f}）",
        "03_interaction.png",
    )

    # 一時カラムを削除
    df.drop(columns=["length2", "age_x_length"], inplace=True)


if __name__ == "__main__":
    main()
