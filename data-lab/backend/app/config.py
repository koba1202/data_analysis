"""アプリケーション設定"""

# CORS許可オリジン
ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:5174",   # Vite dev server
    "http://localhost:3000",   # 予備
]

# アップロードファイルサイズ上限（バイト）: 50MB
MAX_UPLOAD_SIZE = 50 * 1024 * 1024
