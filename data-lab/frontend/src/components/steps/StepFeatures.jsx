import { T } from "../../constants/theme";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";
import Card from "../ui/Card";

// Step5: 説明変数選択・数値化設定
const StepFeatures = ({ uploadResult, target, features, setFeatures, encoding, setEncoding }) => {
  const available = uploadResult.columns.filter((c) => c.name !== target);
  const toggleFeature = (name) =>
    setFeatures((p) => p.includes(name) ? p.filter((f) => f !== name) : [...p, name]);
  const selectAll = () => setFeatures(available.map((c) => c.name));
  const clearAll = () => setFeatures([]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontFamily: T.fontSans, color: T.textSub, fontSize: 14, margin: 0 }}>
          説明変数を選択し、カテゴリ変数の数値化方法を設定
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={selectAll} style={{ padding: "6px 14px", fontSize: 12 }}>全選択</Btn>
          <Btn variant="ghost" onClick={clearAll} style={{ padding: "6px 14px", fontSize: 12 }}>全解除</Btn>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {available.map((c) => {
          const checked = features.includes(c.name);
          const isCat = c.dtype === "categorical" || c.dtype === "text";
          return (
            <Card key={c.name} style={{ padding: "10px 16px", opacity: checked ? 1 : 0.5, transition: "opacity .15s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleFeature(c.name)}
                    style={{ accentColor: T.accent, width: 16, height: 16 }} />
                  <span style={{ fontFamily: T.font, color: T.text, fontSize: 13 }}>{c.name}</span>
                  <Badge color={c.dtype === "numeric" ? T.accent : T.warn}>{c.dtype}</Badge>
                </div>
                {isCat && checked && (
                  <select value={encoding[c.name] || "label"}
                    onChange={(e) => setEncoding((p) => ({ ...p, [c.name]: e.target.value }))}
                    style={{
                      background: T.surface, color: T.text, border: `1px solid ${T.border}`,
                      borderRadius: 6, padding: "4px 10px", fontFamily: T.fontSans, fontSize: 12, outline: "none",
                    }}>
                    <option value="label">ラベルエンコーディング</option>
                    <option value="onehot">ワンホットエンコーディング</option>
                  </select>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StepFeatures;
