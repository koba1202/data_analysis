"""POST /api/upload - CSVファイルアップロード"""

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import MAX_UPLOAD_SIZE
from app.session.store import session_store
from app.services.data_service import read_csv, get_column_info, get_preview

router = APIRouter()


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """CSVファイルを受け取り、セッションを作成してデータ概要を返す"""

    # ファイル形式チェック
    if file.filename and not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSVファイルのみ対応しています")

    # ファイル読込
    contents = await file.read()

    # サイズチェック
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="ファイルサイズが上限（50MB）を超えています")

    # CSV解析
    try:
        df = read_csv(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSVの解析に失敗しました: {str(e)}")

    # セッション作成
    session_id = session_store.create(df)

    # カラム情報
    columns = get_column_info(df)

    # プレビュー
    preview = get_preview(df)

    return {
        "session_id": session_id,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": columns,
        "preview": preview,
    }
