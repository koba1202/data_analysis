"""POST /api/train - モデル学習・評価"""

import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException

from app.models.schemas import TrainRequest
from app.session.store import session_store
from app.services.model_service import train_model, CLASSIFICATION_MODELS, REGRESSION_MODELS

router = APIRouter()

# 学習用スレッドプール（キャンセル時にプロセスごと止められるよう1スレッド）
_train_executor = ThreadPoolExecutor(max_workers=2)

# 学習タイムアウト（秒）
TRAIN_TIMEOUT = 50


@router.post("/train")
async def train(req: TrainRequest):
    """モデルの学習・評価を実行する"""

    df = session_store.get(req.session_id)
    if df is None:
        raise HTTPException(status_code=404, detail="セッションが存在しません")

    # カラム存在チェック
    if req.target not in df.columns:
        raise HTTPException(status_code=400, detail=f"ターゲットカラム '{req.target}' が存在しません")

    for feat in req.features:
        if feat not in df.columns:
            raise HTTPException(status_code=400, detail=f"特徴量カラム '{feat}' が存在しません")

    # モデル名チェック
    if req.task_type == "classification":
        if req.model not in CLASSIFICATION_MODELS:
            raise HTTPException(status_code=400, detail=f"不正なモデル名: {req.model}")
    elif req.task_type == "regression":
        if req.model not in REGRESSION_MODELS:
            raise HTTPException(status_code=400, detail=f"不正なモデル名: {req.model}")
    else:
        raise HTTPException(status_code=400, detail=f"不正なタスクタイプ: {req.task_type}")

    # 学習実行（タイムアウト付き）
    loop = asyncio.get_running_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(
                _train_executor,
                lambda: train_model(
                    df=df,
                    target=req.target,
                    features=req.features,
                    task_type=req.task_type,
                    model_name=req.model,
                    encoding=req.encoding,
                    test_ratio=req.test_ratio,
                    normalize=req.options.normalize,
                    random_state=req.options.random_state,
                ),
            ),
            timeout=TRAIN_TIMEOUT,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail=f"学習が{TRAIN_TIMEOUT}秒以内に完了しませんでした。データ量や特徴量を減らしてください",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"学習中にエラーが発生しました: {str(e)}")

    result["session_id"] = req.session_id
    return result
