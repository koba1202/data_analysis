"""欠損値処理・エンコーディング・正規化サービス"""

import pandas as pd
from sklearn.preprocessing import LabelEncoder


def handle_missing(df: pd.DataFrame, strategies: dict[str, str]) -> pd.DataFrame:
    """欠損値処理を実行する

    strategies: {カラム名: 処理方法}
    処理方法: mean, median, mode, zero, ffill, drop
    """
    df = df.copy()

    for col, strategy in strategies.items():
        if col not in df.columns:
            continue

        if strategy == "mean":
            numeric_col = pd.to_numeric(df[col], errors="coerce")
            df[col] = numeric_col.fillna(numeric_col.mean())
        elif strategy == "median":
            numeric_col = pd.to_numeric(df[col], errors="coerce")
            df[col] = numeric_col.fillna(numeric_col.median())
        elif strategy == "mode":
            mode_val = df[col].mode()
            if len(mode_val) > 0:
                df[col] = df[col].fillna(mode_val.iloc[0])
        elif strategy == "zero":
            df[col] = df[col].fillna(0)
        elif strategy == "ffill":
            df[col] = df[col].ffill()
        elif strategy == "drop":
            df = df.dropna(subset=[col])

    return df.reset_index(drop=True)


def apply_label_encoding(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """ラベルエンコーディングを適用する"""
    df = df.copy()
    for col in columns:
        if col in df.columns:
            le = LabelEncoder()
            non_null_mask = df[col].notna()
            df.loc[non_null_mask, col] = le.fit_transform(df.loc[non_null_mask, col].astype(str))
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def apply_onehot_encoding(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """ワンホットエンコーディングを適用する"""
    return pd.get_dummies(df, columns=columns, drop_first=False, dtype=int)
