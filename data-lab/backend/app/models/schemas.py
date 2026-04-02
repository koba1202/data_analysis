"""Pydantic リクエスト/レスポンススキーマ"""

from typing import Any, Optional
from pydantic import BaseModel, Field


# --- 共通 ---

class ColumnInfo(BaseModel):
    """カラム情報"""
    name: str
    dtype: str  # "numeric" | "categorical"
    missing_count: int
    unique_count: int
    sample_values: list[Any] = []


# --- Upload ---

class UploadResponse(BaseModel):
    session_id: str
    row_count: int
    column_count: int
    columns: list[ColumnInfo]
    preview: list[dict[str, Any]]


# --- Stats ---

class NumericColumnStats(BaseModel):
    dtype: str = "numeric"
    count: int
    mean: float
    std: float
    min: float
    q25: float
    median: float
    q75: float
    max: float
    missing_count: int
    missing_ratio: float


class CategoricalColumnStats(BaseModel):
    dtype: str = "categorical"
    count: int
    unique_count: int
    top: Optional[str] = None
    top_freq: Optional[int] = None
    value_counts: dict[str, int]
    missing_count: int
    missing_ratio: float


class StatsResponse(BaseModel):
    session_id: str
    row_count: int
    columns: dict[str, Any]


# --- Preprocess: Missing ---

class MissingRequest(BaseModel):
    session_id: str
    strategies: dict[str, str]


class MissingResponse(BaseModel):
    session_id: str
    row_count_before: int
    row_count_after: int
    columns_processed: list[str]
    remaining_missing: dict[str, int]
    # フロントエンド用: 更新後のカラム情報
    columns: list[ColumnInfo] = []


# --- Train ---

class TrainOptions(BaseModel):
    normalize: bool = False
    random_state: int = 42


class TrainRequest(BaseModel):
    session_id: str
    target: str
    features: list[str]
    task_type: str  # "classification" | "regression"
    model: str
    encoding: dict[str, str] = {}
    test_ratio: float = Field(default=0.2, gt=0, lt=1)
    options: TrainOptions = TrainOptions()


class ConfusionMatrix(BaseModel):
    labels: list[str]
    matrix: list[list[int]]


class TrainClassificationResult(BaseModel):
    session_id: str
    task_type: str = "classification"
    model: str
    train_size: int
    test_size: int
    metrics: dict[str, float]
    confusion_matrix: ConfusionMatrix
    feature_importance: dict[str, float]


class ActualVsPredicted(BaseModel):
    actual: float
    predicted: float


class TrainRegressionResult(BaseModel):
    session_id: str
    task_type: str = "regression"
    model: str
    train_size: int
    test_size: int
    metrics: dict[str, float]
    actual_vs_predicted: list[ActualVsPredicted]
    feature_importance: dict[str, float]
