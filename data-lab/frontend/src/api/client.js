import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 分析処理は時間がかかる可能性あり
});

// --- API 関数 ---

/** CSV アップロード → プレビュー・カラム情報を取得 */
export const uploadCSV = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/upload', form);
};

/** 基本統計量を取得 */
export const getStats = (sessionId) => {
  return api.get(`/stats/${sessionId}`);
};

/** 欠損値処理を実行 */
export const handleMissing = (sessionId, strategies) => {
  return api.post(`/preprocess/missing`, { session_id: sessionId, strategies });
};

/** モデル学習・評価を実行 */
export const trainModel = (sessionId, params) => {
  return api.post(`/train`, { session_id: sessionId, ...params });
};

export default api;
