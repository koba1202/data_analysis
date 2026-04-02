"""モデル学習・評価サービス"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix,
    r2_score, mean_squared_error, mean_absolute_error,
)

from app.services.preprocess_service import apply_label_encoding, apply_onehot_encoding


# モデルマッピング
CLASSIFICATION_MODELS = {
    "logistic_regression": LogisticRegression,
    "decision_tree": DecisionTreeClassifier,
    "random_forest": RandomForestClassifier,
    "knn": KNeighborsClassifier,
}

REGRESSION_MODELS = {
    "linear_regression": LinearRegression,
    "decision_tree": DecisionTreeRegressor,
    "random_forest": RandomForestRegressor,
}


def train_model(
    df: pd.DataFrame,
    target: str,
    features: list[str],
    task_type: str,
    model_name: str,
    encoding: dict[str, str],
    test_ratio: float,
    normalize: bool,
    random_state: int,
) -> dict:
    """モデルの学習・評価を実行する"""

    # エンコーディング処理
    work_df = df.copy()
    label_cols = [col for col, enc in encoding.items() if enc == "label"]
    onehot_cols = [col for col, enc in encoding.items() if enc == "onehot"]

    if label_cols:
        work_df = apply_label_encoding(work_df, label_cols)
    if onehot_cols:
        work_df = apply_onehot_encoding(work_df, onehot_cols)

    # ワンホット後に特徴量名を更新（元のカラム名が展開されている場合）
    actual_features = []
    for f in features:
        if f in work_df.columns:
            actual_features.append(f)
        else:
            # ワンホットエンコーディングで展開されたカラムを検索
            expanded = [c for c in work_df.columns if c.startswith(f + "_")]
            actual_features.extend(expanded)

    if not actual_features:
        raise ValueError("有効な特徴量がありません")

    # ターゲットとフィーチャーの分離
    X = work_df[actual_features].apply(pd.to_numeric, errors="coerce")
    y = work_df[target]

    # ターゲットが分類の場合は文字列のまま、回帰の場合は数値変換
    if task_type == "regression":
        y = pd.to_numeric(y, errors="coerce")

    # 欠損値のある行を除去
    valid_mask = X.notna().all(axis=1) & y.notna()
    X = X[valid_mask]
    y = y[valid_mask]

    if len(X) == 0:
        raise ValueError("有効なデータがありません")

    # データ分割
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_ratio, random_state=random_state
    )

    # 正規化
    if normalize:
        scaler = MinMaxScaler()
        X_train = pd.DataFrame(scaler.fit_transform(X_train), columns=actual_features)
        X_test = pd.DataFrame(scaler.transform(X_test), columns=actual_features)

    # モデル生成・学習
    if task_type == "classification":
        model_class = CLASSIFICATION_MODELS.get(model_name)
    else:
        model_class = REGRESSION_MODELS.get(model_name)

    if model_class is None:
        raise ValueError(f"不正なモデル名: {model_name}")

    if model_name == "logistic_regression":
        model = model_class(max_iter=1000, random_state=random_state)
    elif model_name in ("knn",):
        model = model_class()
    elif model_name == "linear_regression":
        model = model_class()
    else:
        model = model_class(random_state=random_state)

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    # 特徴量重要度の取得
    feature_importance = _get_feature_importance(model, actual_features)

    # 結果の構築
    if task_type == "classification":
        return _build_classification_result(
            y_test, y_pred, model_name,
            len(X_train), len(X_test),
            feature_importance,
        )
    else:
        return _build_regression_result(
            y_test, y_pred, model_name,
            len(X_train), len(X_test),
            feature_importance,
        )


def _get_feature_importance(model, feature_names: list[str]) -> dict[str, float]:
    """特徴量重要度を取得する"""
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        coef = model.coef_
        if coef.ndim > 1:
            importances = np.abs(coef).mean(axis=0)
        else:
            importances = np.abs(coef)
    else:
        # KNNなど重要度がないモデル
        return {name: 0.0 for name in feature_names}

    # 合計で正規化
    total = importances.sum()
    if total > 0:
        importances = importances / total

    return {
        name: round(float(imp), 4)
        for name, imp in zip(feature_names, importances)
    }


def _build_classification_result(
    y_test, y_pred, model_name: str,
    train_size: int, test_size: int,
    feature_importance: dict,
) -> dict:
    """分類結果を構築する"""
    labels = sorted([str(l) for l in set(y_test) | set(y_pred)])
    cm = confusion_matrix(y_test, y_pred, labels=[
        # 元の型に戻す
        next(v for v in set(y_test) | set(y_pred) if str(v) == l)
        for l in labels
    ])

    return {
        "task_type": "classification",
        "model": model_name,
        "train_size": train_size,
        "test_size": test_size,
        "metrics": {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "precision_macro": round(float(precision_score(y_test, y_pred, average="macro", zero_division=0)), 4),
            "recall_macro": round(float(recall_score(y_test, y_pred, average="macro", zero_division=0)), 4),
            "f1_macro": round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        },
        "confusion_matrix": {
            "labels": labels,
            "matrix": cm.tolist(),
        },
        "feature_importance": feature_importance,
    }


def _build_regression_result(
    y_test, y_pred, model_name: str,
    train_size: int, test_size: int,
    feature_importance: dict,
) -> dict:
    """回帰結果を構築する"""
    mse = mean_squared_error(y_test, y_pred)

    # actual_vs_predicted（最大30件）
    avp = []
    for actual, predicted in zip(y_test[:30], y_pred[:30]):
        avp.append({
            "actual": round(float(actual), 4),
            "predicted": round(float(predicted), 4),
        })

    return {
        "task_type": "regression",
        "model": model_name,
        "train_size": train_size,
        "test_size": test_size,
        "metrics": {
            "r2": round(float(r2_score(y_test, y_pred)), 4),
            "mse": round(float(mse), 4),
            "rmse": round(float(np.sqrt(mse)), 4),
            "mae": round(float(mean_absolute_error(y_test, y_pred)), 4),
        },
        "actual_vs_predicted": avp,
        "feature_importance": feature_importance,
    }
