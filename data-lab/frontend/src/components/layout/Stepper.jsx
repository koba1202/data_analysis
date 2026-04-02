import { T } from "../../constants/theme";
import { STEPS } from "../../constants/theme";

// ステップ進捗バー
const Stepper = ({ currentStep, onStepClick }) => (
  <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, overflowX: "auto" }}>
    <div style={{ display: "flex", gap: 4, minWidth: "fit-content" }}>
      {STEPS.map((s, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} onClick={() => done && onStepClick(i)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: 20, background: active ? T.accentSoft : done ? T.successSoft : "transparent",
              cursor: done ? "pointer" : "default", transition: "all .15s", whiteSpace: "nowrap",
            }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: active ? T.accent : done ? T.success : T.surface,
              color: active || done ? "#fff" : T.textDim,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, fontFamily: T.font,
            }}>{done ? "\u2713" : i + 1}</div>
            <span style={{ fontSize: 12, color: active ? T.accent : done ? T.success : T.textDim, fontWeight: active ? 600 : 400 }}>{s}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export default Stepper;
