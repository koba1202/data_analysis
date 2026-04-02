"""POST /api/preprocess/missing - 欠損値処理"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import MissingRequest
from app.session.store import session_store
from app.services.preprocess_service import handle_missing
from app.services.data_service import get_column_info

router = APIRouter()

VALID_STRATEGIES = {"mean", "median", "mode", "zero", "ffill", "drop"}


@router.post("/preprocess/missing")
async def preprocess_missing(req: MissingRequest):
    """欠損値処理を実行し、セッション内のDataFrameを更新する"""

    df = session_store.get(req.session_id)
    if df is None:
        raise HTTPException(status_code=404, detail="セッションが存在しません")

    # バリデーション
    for col, strategy in req.strategies.items():
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"カラム '{col}' が存在しません")
        if strategy not in VALID_STRATEGIES:
            raise HTTPException(
                status_code=400,
                detail=f"不正な処理方法 '{strategy}' です。有効な値: {', '.join(VALID_STRATEGIES)}"
            )

    row_count_before = len(df)

    # 欠損値処理の実行
    df_processed = handle_missing(df, req.strategies)

    # セッション更新
    session_store.update(req.session_id, df_processed)

    # 残りの欠損値をカウント
    remaining = {}
    for col in df_processed.columns:
        mc = int(df_processed[col].isna().sum())
        if mc > 0:
            remaining[col] = mc

    # 更新後のカラム情報
    columns = get_column_info(df_processed)

    return {
        "session_id": req.session_id,
        "row_count_before": row_count_before,
        "row_count_after": len(df_processed),
        "columns_processed": list(req.strategies.keys()),
        "remaining_missing": remaining,
        "columns": columns,
    }
