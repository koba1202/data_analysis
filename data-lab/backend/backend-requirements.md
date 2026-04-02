# DATA LAB — バックエンド要件定義書（FastAPI）

## 1. 技術スタック

| 項目 | 技術 | バージョン目安 |
|------|------|---------------|
| フレームワーク | FastAPI | 0.110+ |
| ASGI サーバー | Uvicorn | 0.29+ |
| データ操作 | Pandas | 2.2+ |
| 数値計算 | NumPy | 1.26+ |
| 機械学習 | scikit-learn | 1.4+ |
| バリデーション | Pydantic v2 | (FastAPI同梱) |
| CORS | fastapi.middleware.cors | — |

その他適宜必要なライブラリをインストールすること

### 依存パッケージ（`requirements.txt`）

```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
pandas>=2.2.0
numpy>=1.26.0
scikit-learn>=1.4.0
python-multipart>=0.0.9
```

仮想環境を作成し、ライブラリをインストール、管理（`requirements.txt`）すること

仮想環境名： `venv_fastapi`

---

## 2. ディレクトリ構成

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI アプリ生成 & ルーター登録
│   ├── config.py              # 設定（CORS許可オリジン等）
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── upload.py          # POST /api/upload
│   │   ├── stats.py           # GET  /api/stats/{session_id}
│   │   ├── preprocess.py      # POST /api/preprocess/missing
│   │   └── train.py           # POST /api/train
│   ├── services/
│   │   ├── __init__.py
│   │   ├── data_service.py    # データ読込・型推定・統計計算
│   │   ├── preprocess_service.py  # 欠損値処理・エンコーディング・正規化
│   │   └── model_service.py   # モデル学習・評価
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py         # Pydantic リクエスト/レスポンススキーマ
│   └── session/
│       ├── __init__.py
│       └── store.py           # インメモリセッション管理
├── tests/
│   ├── test_upload.py
│   ├── test_preprocess.py
│   └── test_train.py
├── requirements.txt
└── README.md
```

---

## 3. セッション管理

### 方針
- CSVアップロード時に UUID v4 でセッションIDを発行
- サーバーメモリ上に `{session_id: DataFrame}` を辞書で保持
- 全APIでセッションIDを通じてデータにアクセス
- 一定時間（デフォルト30分）操作がなければ自動クリーンアップ

### `session/store.py` 仕様

```
SessionStore
├── create(df: DataFrame) -> str          # 新規セッション作成、session_id返却
├── get(session_id: str) -> DataFrame     # DataFrame取得（なければ404）
├── update(session_id: str, df: DataFrame)# DataFrame上書き
├── delete(session_id: str)               # セッション削除
└── cleanup()                             # 期限切れセッション一括削除
```

---

## 4. API エンドポイント仕様

### 4.1 `POST /api/upload`

CSVファイルを受け取り、セッションを作成してデータ概要を返す。

**リクエスト**
- Content-Type: `multipart/form-data`
- Body: `file` (CSVファイル)

**レスポンス** `200 OK`
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "row_count": 150,
  "column_count": 5,
  "columns": [
    {
      "name": "sepal_length",
      "dtype": "numeric",
      "missing_count": 0,
      "unique_count": 35,
      "sample_values": [5.1, 4.9, 4.7, 4.6, 5.0]
    },
    {
      "name": "species",
      "dtype": "categorical",
      "missing_count": 3,
      "unique_count": 3,
      "sample_values": ["setosa", "versicolor", "virginica"]
    }
  ],
  "preview": [
    {"sepal_length": 5.1, "sepal_width": 3.5, "species": "setosa"},
    ...
  ]
}
```

**エラー**
- `400`: CSV解析失敗（不正なフォーマット）
- `413`: ファイルサイズ上限超過（上限: 50MB）

---

### 4.2 `GET /api/stats/{session_id}`

指定セッションのデータに対する基本統計量を返す。

**レスポンス** `200 OK`
```json
{
  "session_id": "...",
  "row_count": 150,
  "columns": {
    "sepal_length": {
      "dtype": "numeric",
      "count": 150,
      "mean": 5.84,
      "std": 0.83,
      "min": 4.3,
      "q25": 5.1,
      "median": 5.8,
      "q75": 6.4,
      "max": 7.9,
      "missing_count": 0,
      "missing_ratio": 0.0
    },
    "species": {
      "dtype": "categorical",
      "count": 150,
      "unique_count": 3,
      "top": "setosa",
      "top_freq": 50,
      "value_counts": {"setosa": 50, "versicolor": 50, "virginica": 50},
      "missing_count": 0,
      "missing_ratio": 0.0
    }
  }
}
```

**エラー**
- `404`: セッションが存在しない

---

### 4.3 `POST /api/preprocess/missing`

欠損値処理を実行し、セッション内のDataFrameを更新する。

**リクエスト**
```json
{
  "session_id": "...",
  "strategies": {
    "sepal_length": "mean",
    "species": "mode"
  }
}
```

**`strategies` の選択肢**

| 値 | 処理内容 | 対象型 |
|----|---------|--------|
| `mean` | 平均値で補完 | numeric |
| `median` | 中央値で補完 | numeric |
| `mode` | 最頻値で補完 | 両方 |
| `zero` | 0で補完 | numeric |
| `ffill` | 前方の値で補完 | 両方 |
| `drop` | 欠損行を削除 | 両方 |

**レスポンス** `200 OK`
```json
{
  "session_id": "...",
  "row_count_before": 150,
  "row_count_after": 147,
  "columns_processed": ["sepal_length", "species"],
  "remaining_missing": {}
}
```

---

### 4.4 `POST /api/train`

モデルの学習・評価を実行する。

**リクエスト**
```json
{
  "session_id": "...",
  "target": "species",
  "features": ["sepal_length", "sepal_width", "petal_length", "petal_width"],
  "task_type": "classification",
  "model": "random_forest",
  "encoding": {
    "species_note": "label"
  },
  "test_ratio": 0.2,
  "options": {
    "normalize": false,
    "random_state": 42
  }
}
```

**`model` の選択肢**

| task_type | model値 | scikit-learn クラス |
|-----------|--------|---------------------|
| classification | `logistic_regression` | LogisticRegression |
| classification | `decision_tree` | DecisionTreeClassifier |
| classification | `random_forest` | RandomForestClassifier |
| classification | `knn` | KNeighborsClassifier |
| regression | `linear_regression` | LinearRegression |
| regression | `decision_tree` | DecisionTreeRegressor |
| regression | `random_forest` | RandomForestRegressor |

**レスポンス（分類）** `200 OK`
```json
{
  "session_id": "...",
  "task_type": "classification",
  "model": "random_forest",
  "train_size": 120,
  "test_size": 30,
  "metrics": {
    "accuracy": 0.967,
    "precision_macro": 0.970,
    "recall_macro": 0.967,
    "f1_macro": 0.966
  },
  "confusion_matrix": {
    "labels": ["setosa", "versicolor", "virginica"],
    "matrix": [
      [10, 0, 0],
      [0, 9, 1],
      [0, 0, 10]
    ]
  },
  "feature_importance": {
    "petal_length": 0.45,
    "petal_width": 0.38,
    "sepal_length": 0.10,
    "sepal_width": 0.07
  }
}
```

**レスポンス（回帰）** `200 OK`
```json
{
  "session_id": "...",
  "task_type": "regression",
  "model": "random_forest",
  "train_size": 120,
  "test_size": 30,
  "metrics": {
    "r2": 0.923,
    "mse": 0.041,
    "rmse": 0.203,
    "mae": 0.158
  },
  "actual_vs_predicted": [
    {"actual": 5.1, "predicted": 5.23},
    {"actual": 4.9, "predicted": 4.87},
    ...
  ],
  "feature_importance": {
    "petal_width": 0.52,
    "petal_length": 0.35,
    "sepal_width": 0.08,
    "sepal_length": 0.05
  }
}
```

**エラー**
- `404`: セッション不存在
- `400`: 不正なパラメータ（存在しないカラム名、不正なモデル名等）
- `422`: バリデーションエラー

---

## 5. Pydantic スキーマ定義（`models/schemas.py`）

以下のスキーマを定義する：

```
# リクエスト
UploadResponse
StatsResponse
MissingRequest          # session_id, strategies
MissingResponse
TrainRequest            # session_id, target, features, task_type, model, encoding, test_ratio, options
TrainClassificationResult
TrainRegressionResult

# 共通
ColumnInfo              # name, dtype, missing_count, unique_count, sample_values
ColumnStats             # dtype別の統計情報
ConfusionMatrix         # labels, matrix
```

---

## 6. サービス層の責務

### `data_service.py`
- CSVファイルの読込（`pd.read_csv`）
- カラムのデータ型推定ロジック（数値比率80%以上→numeric、ユニーク数20以下→categorical）
- `df.describe()` ベースの統計量算出
- カテゴリ列の `value_counts()` 取得

### `preprocess_service.py`
- 欠損値処理（`df.fillna()`, `df.dropna()`）
- ラベルエンコーディング（`LabelEncoder`）
- ワンホットエンコーディング（`pd.get_dummies`）
- 正規化（`MinMaxScaler`）/ 標準化（`StandardScaler`）— 将来対応

### `model_service.py`
- `train_test_split` によるデータ分割
- scikit-learn モデルの生成・学習・予測
- 評価指標の計算（`accuracy_score`, `classification_report`, `r2_score`, `mean_squared_error` 等）
- 混同行列の生成（`confusion_matrix`）
- 特徴量重要度の取得（対応モデルのみ）

---

## 7. CORS 設定

```python
# config.py
ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",   # 予備
]
```

---

## 8. 起動方法

```bash
cd backend
venv_fastapi\Scirpts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 9. 将来の拡張ポイント

| 項目 | 概要 | 優先度 |
|------|------|--------|
| 外れ値検出 | IQR法 / Zスコアで外れ値を検出・処理するエンドポイント追加 | 中 |
| 相関分析 | `GET /api/correlation/{session_id}` で相関行列を返す | 中 |
| 正規化・標準化 | `/api/preprocess/scale` エンドポイント追加 | 高 |
| ハイパーパラメータ | GridSearchCV によるパラメータチューニング | 低 |
| モデルエクスポート | joblib で学習済みモデルをダウンロード | 低 |
| 結果レポート | 分析結果をPDF/CSVでエクスポート | 低 |
| DB永続化 | セッションデータをRedis/SQLiteに永続化 | 低 |
