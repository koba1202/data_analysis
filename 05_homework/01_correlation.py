"""Phase 1: wlchild2.csv（5変数）の相関分析"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.utils import load_data, setup_plot, plot_correlation_matrix


def main():
    setup_plot()
    df = load_data("data/wlchild2.csv")

    # 相関行列を表示
    print(f"\n{'=' * 50}")
    print("【相関行列】")
    print(df.corr().round(3).to_string())

    # 散布図マトリックスを保存
    plot_correlation_matrix(df, "01_correlation.png")


if __name__ == "__main__":
    main()
