"""GET /api/stats/{session_id} - 基本統計量"""

from fastapi import APIRouter, HTTPException

from app.session.store import session_store
from app.services.data_service import compute_stats

router = APIRouter()


@router.get("/stats/{session_id}")
async def get_stats(session_id: str):
    """指定セッションのデータに対する基本統計量を返す"""

    df = session_store.get(session_id)
    if df is None:
        raise HTTPException(status_code=404, detail="セッションが存在しません")

    stats = compute_stats(df)

    return {
        "session_id": session_id,
        "row_count": len(df),
        "columns": stats,
    }
