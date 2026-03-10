import pandas as pd
import seaborn as sns


def main():
    df = pd.read_csv("data/wlchild.csv")

    df["age"] = df["age"].astype(float)
    print(df["age"].max())
    df["weight"] = df["weight"].astype(float)
    print(df.dtypes)

    sns.pairplot(df)


if __name__ == "__main__":
    main()
