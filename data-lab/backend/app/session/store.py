"""インメモリセッション管理"""

import uuid
import time
import threading
from typing import Optional

import pandas as pd


# セッションの有効期限（秒）: デフォルト30分
SESSION_TIMEOUT = 30 * 60


class SessionStore:
    """サーバーメモリ上でセッション（DataFrame）を管理するクラス"""

    def __init__(self):
        # {session_id: {"df": DataFrame, "last_access": timestamp}}
        self._store: dict[str, dict] = {}
        self._lock = threading.Lock()

    def create(self, df: pd.DataFrame) -> str:
        """新規セッションを作成し、session_idを返す"""
        session_id = str(uuid.uuid4())
        with self._lock:
            self._store[session_id] = {
                "df": df,
                "last_access": time.time(),
            }
        return session_id

    def get(self, session_id: str) -> Optional[pd.DataFrame]:
        """DataFrameを取得する。存在しなければNoneを返す"""
        with self._lock:
            entry = self._store.get(session_id)
            if entry is None:
                return None
            entry["last_access"] = time.time()
            return entry["df"]

    def update(self, session_id: str, df: pd.DataFrame) -> bool:
        """DataFrameを上書きする。セッションが存在しなければFalseを返す"""
        with self._lock:
            if session_id not in self._store:
                return False
            self._store[session_id] = {
                "df": df,
                "last_access": time.time(),
            }
            return True

    def delete(self, session_id: str) -> None:
        """セッションを削除する"""
        with self._lock:
            self._store.pop(session_id, None)

    def cleanup(self) -> int:
        """期限切れセッションを一括削除し、削除件数を返す"""
        now = time.time()
        expired = []
        with self._lock:
            for sid, entry in self._store.items():
                if now - entry["last_access"] > SESSION_TIMEOUT:
                    expired.append(sid)
            for sid in expired:
                del self._store[sid]
        return len(expired)


# シングルトンインスタンス
session_store = SessionStore()
