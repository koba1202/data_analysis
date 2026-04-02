import { useState } from "react";
import Papa from "papaparse";
import { T } from "../../constants/theme";
import { uploadCSV } from "../../api/client";
import Spinner from "../ui/Spinner";
import ErrorMsg from "../ui/ErrorMsg";

// Step1: CSVアップロード
const StepUpload = ({ onUpload }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // クライアント側プレビュー用に先頭行だけパース
      const localPreview = await new Promise((resolve) => {
        Papa.parse(file, {
          header: true, skipEmptyLines: true, preview: 10,
          complete: (res) => resolve(res.data),
        });
      });
      // サーバーにアップロード
      const { data: result } = await uploadCSV(file);
      onUpload({ ...result, localPreview });
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, paddingTop: 40 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>&#128202;</div>
        <h2 style={{ fontFamily: T.fontSans, color: T.text, margin: 0, fontSize: 22 }}>CSVファイルをアップロード</h2>
        <p style={{ color: T.textSub, fontFamily: T.fontSans, fontSize: 14, marginTop: 8 }}>
          ドラッグ＆ドロップ、またはクリックで選択
        </p>
      </div>
      {error && <ErrorMsg message={error} />}
      {uploading ? (
        <Spinner text="アップロード中..." />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => {
            const inp = document.createElement("input");
            inp.type = "file"; inp.accept = ".csv";
            inp.onchange = (e) => handleFile(e.target.files[0]); inp.click();
          }}
          style={{
            width: "100%", maxWidth: 480, height: 180, borderRadius: 14,
            border: `2px dashed ${dragging ? T.accent : T.border}`,
            background: dragging ? T.accentSoft : "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all .25s",
          }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.6 }}>&#11014;&#65039;</div>
          <span style={{ color: T.textSub, fontFamily: T.fontSans, fontSize: 13 }}>.csv ファイル（最大 50MB）</span>
        </div>
      )}
    </div>
  );
};

export default StepUpload;
