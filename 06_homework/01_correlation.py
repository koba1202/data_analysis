import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import matplotlib.pyplot as plt
from shared.utils import load_data_undrop, setup_plot, plot_correlation_matrix


def main():
    setup_plot()
    # df = load_data_undrop("06_homework/data/Titanic.csv")

    # データ加工が必要（例：man, femeal → 0, 1）
    # df['sex'] = df['sex'].replace({'male': 0, 'female': 1})
    # df['embarked'] = df['embarked'].replace({'S': 1, 'C': 2, 'Q': 3})
    # df['deck'] = df['deck'].replace(
        # {'': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7}
    # )
    # df['who'] = df['who'].replace({'child': 0, 'man': 1, 'woman': 2})

    # 意味が被っている列を削除
    # df = df.drop(columns=['alive', 'embark_town', 'class', 'alone'])
    # df.dropna()

    # とりあえず邪魔だから列削除（対応は後で考える）
    # df = df.drop(columns=['adult_male'])

    # 相関行列を表示
    # print(f"\n{'=' * 50}")
    # print("【相関行列】")
    # print(df.corr().round(3).to_string())

    # 散布図マトリックスを保存
    # plot_correlation_matrix(df, "01_correlation.png", "06_homework\\output\\")

    # カスタムデータフレームで散布図作成
    df = load_data_undrop("06_homework/data/Titanic.csv").dropna()
    rate_table = df.groupby(["pclass", "who"])["survived"].mean().unstack()
    print(rate_table)
    rate_table.plot(kind="bar")
    plt.ylabel("Survival Rate")
    file_path = os.path.join('06_homework', 'output', '01_correlation_custom_data.png')
    plt.savefig(file_path)
    plt.close()
    # plot_correlation_matrix(df, "01_correlation_custom_data.png", "06_homework\\output\\")


if __name__ == "__main__":
    main()
