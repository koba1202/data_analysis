import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.utils import load_data, setup_plot, plot_correlation_matrix


def main():
    setup_plot()
    df = load_data("data/wlchild.csv")
    plot_correlation_matrix(df, "01_correlation.png")


if __name__ == "__main__":
    main()
