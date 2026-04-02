import { T } from "../../constants/theme";
import { STEPS } from "../../constants/theme";
import Btn from "../ui/Btn";

// フッターナビゲーション（戻る・次へボタン）
const FooterNav = ({ step, canNext, onBack, onNext }) => {
  if (step <= 0 || step >= STEPS.length) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px",
      background: `linear-gradient(transparent, ${T.bg} 30%)`,
      display: "flex", justifyContent: "space-between", pointerEvents: "none",
    }}>
      <div style={{ pointerEvents: "auto" }}>
        <Btn variant="ghost" onClick={onBack}>&larr; 戻る</Btn>
      </div>
      {step < STEPS.length - 1 && (
        <div style={{ pointerEvents: "auto" }}>
          <Btn onClick={onNext} disabled={!canNext}>次へ &rarr;</Btn>
        </div>
      )}
    </div>
  );
};

export default FooterNav;
