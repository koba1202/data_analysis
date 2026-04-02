"""データ読込・型推定・統計計算サービス"""

from io import BytesIO
from typing import Any

import pandas as pd
import numpy as np


def read_csv(file_bytes: bytes) -> pd.DataFrame:
    """CSVファイルのバイト列からDataFrameを生成する"""
    return pd.read_csv(BytesIO(file_bytes))


def infer_dtype(series: pd.Series) -> str:
    """カラムのデータ型を推定する

    - 数値比率80%以上 → numeric
    - それ以外 → categorical
    """
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    # 文字列カラムでも数値に変換できるものが80%以上ならnumeric
    non_null = series.dropna()
    if len(non_null) == 0:
        return "categorical"

    numeric_count = pd.to_numeric(non_null, errors="coerce").notna().sum()
    if numeric_count / len(non_null) >= 0.8:
        return "numeric"

    return "categorical"


def get_column_info(df: pd.DataFrame) -> list[dict[str, Any]]:
    """各カラムの基本情報を取得する"""
    columns = []
    for col in df.columns:
        dtype = infer_dtype(df[col])
        sample = df[col].dropna().head(5).tolist()
        # NaN を None に変換
        sample = [None if isinstance(v, float) and np.isnan(v) else v for v in sample]
        columns.append({
            "name": col,
            "dtype": dtype,
            "missing_count": int(df[col].isna().sum()),
            "unique_count": int(df[col].nunique()),
            "sample_values": sample,
        })
    return columns


def get_preview(df: pd.DataFrame, n: int = 10) -> list[dict[str, Any]]:
    """先頭n行のプレビューを返す"""
    preview_df = df.head(n)
    # NaN を None に変換
    return preview_df.where(preview_df.notna(), None).to_dict(orient="records")


def compute_stats(df: pd.DataFrame) -> dict[str, Any]:
    """全カラムの統計量を計算する"""
    result = {}
    total_rows = len(df)

    for col in df.columns:
        dtype = infer_dtype(df[col])
        missing_count = int(df[col].isna().sum())
        missing_ratio = round(missing_count / total_rows, 4) if total_rows > 0 else 0.0

        if dtype == "numeric":
            series = pd.to_numeric(df[col], errors="coerce")
            desc = series.describe()
            result[col] = {
                "dtype": "numeric",
                "count": int(desc.get("count", 0)),
                "mean": _safe_round(desc.get("mean")),
                "std": _safe_round(desc.get("std")),
                "min": _safe_round(desc.get("min")),
                "q25": _safe_round(desc.get("25%")),
                "median": _safe_round(desc.get("50%")),
                "q75": _safe_round(desc.get("75%")),
                "max": _safe_round(desc.get("max")),
                "missing_count": missing_count,
                "missing_ratio": missing_ratio,
            }
        else:
            vc = df[col].value_counts()
            top = vc.index[0] if len(vc) > 0 else None
            top_freq = int(vc.iloc[0]) if len(vc) > 0 else None
            result[col] = {
                "dtype": "categorical",
                "count": int(df[col].notna().sum()),
                "unique_count": int(df[col].nunique()),
                "top": str(top) if top is not None else None,
                "top_freq": top_freq,
                "value_counts": {str(k): int(v) for k, v in vc.items()},
                "missing_count": missing_count,
                "missing_ratio": missing_ratio,
            }

    return result


def _safe_round(value, decimals: int = 4) -> float | None:
    """NaN安全な丸め処理"""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    return round(float(value), decimals)
