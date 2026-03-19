import sys
import os
import numpy as np
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.utils import load_data, setup_plot, run_ols, print_model_summary, save_fig


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
    save_fig(filename)


def main():
    setup_plot()
    df = load_data("data/wlchild.csv")

    # 1. age -> weight の単回帰
    model_aw = run_ols(df, ["age"], "weight")
    print_model_summary(model_aw, "単回帰: age -> weight", ["切片", "age"])
    plot_regression(df, "age", "weight", model_aw,
                    "年齢 \u2192 体重 の単回帰", "02_age_weight.png")

    # 2. age -> length の単回帰
    model_al = run_ols(df, ["age"], "length")
    print_model_summary(model_al, "単回帰: age -> length", ["切片", "age"])
    plot_regression(df, "age", "length", model_al,
                    "年齢 \u2192 身長 の単回帰", "02_age_length.png")

    # 3. length -> weight の単回帰
    model_lw = run_ols(df, ["length"], "weight")
    print_model_summary(model_lw, "単回帰: length -> weight", ["切片", "length"])
    plot_regression(df, "length", "weight", model_lw,
                    "身長 \u2192 体重 の単回帰", "02_length_weight.png")

    # まとめ表
    from shared.utils import print_r2_comparison
    print_r2_comparison([
        ("age -> weight", model_aw),
        ("age -> length", model_al),
        ("length -> weight", model_lw),
    ])


if __name__ == "__main__":
    main()
