import { T } from "../../constants/theme";
import Badge from "../ui/Badge";

// Step4: 目的変数選択
const StepTarget = ({ uploadResult, target, setTarget }) => {
  const { columns } = uploadResult;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontFamily: T.fontSans, color: T.textSub, fontSize: 14, margin: 0 }}>
        予測したいカラム（目的変数）を選択してください
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {columns.map((c) => {
          const sel = target === c.name;
          return (
            <div key={c.name} onClick={() => setTarget(c.name)}
              style={{
                background: sel ? T.accentSoft : T.card,
                border: `1.5px solid ${sel ? T.accent : T.border}`,
                borderRadius: T.radius, padding: "12px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all .15s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${sel ? T.accent : T.textDim}`,
                  background: sel ? T.accent : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                }}>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
                <span style={{ fontFamily: T.font, color: T.text, fontSize: 14 }}>{c.name}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Badge color={c.dtype === "numeric" ? T.accent : T.warn}>{c.dtype}</Badge>
                <Badge color={T.textSub}>{c.unique_count} ユニーク</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepTarget;
