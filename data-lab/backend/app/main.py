"""FastAPI アプリケーション エントリーポイント"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGINS
from app.routers import upload, stats, preprocess, train
from app.session.store import session_store

import asyncio


async def _periodic_cleanup():
    """定期的に期限切れセッションをクリーンアップする"""
    while True:
        await asyncio.sleep(300)  # 5分ごと
        session_store.cleanup()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリのライフサイクル管理"""
    task = asyncio.create_task(_periodic_cleanup())
    yield
    task.cancel()


app = FastAPI(
    title="DATA LAB API",
    description="データ分析Webアプリケーションのバックエンド",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(stats.router, prefix="/api", tags=["stats"])
app.include_router(preprocess.router, prefix="/api", tags=["preprocess"])
app.include_router(train.router, prefix="/api", tags=["train"])


@app.get("/")
async def root():
    return {"message": "DATA LAB API is running"}
