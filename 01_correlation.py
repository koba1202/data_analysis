import pandas as pd
import matplotlib.pyplot as plt


# 列は['age', 'length', 'weight']
def main():
    df = pd.read_csv("data/wlchild.csv").dropna()

    df["age"] = df["age"].astype(float)
    # print(df["age"].max())
    df["weight"] = df["weight"].astype(float)
    # print(df.dtypes)

    # 相関係数を計算
    corr = df.corr()

    cols = df.columns

    n = len(cols)
    print(f"総件数: {len(df)}")
    _, axes = plt.subplots(n, n, figsize=(10, 9))

    for i, col_y in enumerate(cols):
        for j, col_x in enumerate(cols):
            ax = axes[i][j]
            if i == j:
                # 対角のヒストグラムを作成
                ax.hist(df[col_x], bins=14)
            else:
                r = corr.loc[col_y, col_x]
                ax.scatter(df[col_x], df[col_y], s=10)
                ax.text(0.05, 0.93, f"r = {r:.3f}", transform=ax.transAxes)

            if i == n - 1:
                ax.set_xlabel(col_x, fontsize=10)
            else:
                ax.set_xticklabels([])
            if j == 0:
                ax.set_ylabel(col_y, fontsize=10)
            else:
                ax.set_yticklabels([])

    # print(corr.round(3).to_string())
    plt.tight_layout()
    plt.savefig("output/01_correlation.png")


if __name__ == "__main__":
    main()
