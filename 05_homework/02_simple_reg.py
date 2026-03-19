"""Phase 2: 各変数から weight への単回帰分析"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.utils import (
    load_data, setup_plot, run_ols, print_model_summary,
    print_r2_comparison, save_fig,
)


def plot_regression(df, x_col, y_col, model, title, filename):
    """散布図＋回帰直線を描画して保存"""
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.scatter(df[x_col], df[y_col], alpha=0.3, s=10, label="データ")

    x_range = np.linspace(df[x_col].min(), df[x_col].max(), 100)
    y_pred = model.params[0] + model.params[1] * x_range
    ax.plot(x_range, y_pred, color="red", linewidth=2, label="回帰直線")

    ax.set_title(f"{title}（R\u00b2 = {model.rsquared:.4f}）")
    ax.set_xlabel(x_col)
    ax.set_ylabel(y_col)
    ax.legend()
    save_fig(filename)


def main():
    setup_plot()
    df = load_data("data/wlchild2.csv")

    # 各説明変数 -> weight の単回帰
    x_vars = [
        ("age", "年齢 \u2192 体重"),
        ("length", "身長 \u2192 体重"),
        ("ude", "上腕囲 \u2192 体重"),
        ("tekubi", "手首囲 \u2192 体重"),
    ]

    models = []
    for x_col, title in x_vars:
        model = run_ols(df, [x_col], "weight")
        print_model_summary(model, f"単回帰: {x_col} -> weight", ["切片", x_col])
        plot_regression(df, x_col, "weight", model, title, f"02_{x_col}_weight.png")
        models.append((f"{x_col} -> weight", model))

    # R2 比較表
    print_r2_comparison(models)


if __name__ == "__main__":
    main()
