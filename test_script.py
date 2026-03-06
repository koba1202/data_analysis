import pandas as pd


def main():
    df = pd.read_csv("data/StaffOvertime.csv")
    columns = df.columns
    print(df["section"])
    print(df["overtime"])
    print(columns)


if __name__ == "__main__":
    main()
