import { T } from "./constants/theme";
import { useWizard } from "./hooks/useWizard";
import Header from "./components/layout/Header";
import Stepper from "./components/layout/Stepper";
import FooterNav from "./components/layout/FooterNav";
import StepUpload from "./components/steps/StepUpload";
import StepPreview from "./components/steps/StepPreview";
import StepMissing from "./components/steps/StepMissing";
import StepTarget from "./components/steps/StepTarget";
import StepFeatures from "./components/steps/StepFeatures";
import StepModel from "./components/steps/StepModel";

// メインアプリ（ウィザード制御）
export default function App() {
  const {
    step, setStep, sessionId, uploadResult,
    target, setTarget, features, setFeatures,
    encoding, setEncoding,
    canNext, handleUpload, nextStep, prevStep, reset,
  } = useWizard();

  return (
    <div style={{ minHeight: "100vh", minWidth: "100vh", background: T.bg, color: T.text, fontFamily: T.fontSans }}>
      <Header showReset={!!uploadResult} onReset={reset} />
      {step > 0 && <Stepper currentStep={step} onStepClick={setStep} />}

      {/* コンテンツ */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px", paddingBottom: 100 }}>
        {step === 0 && <StepUpload onUpload={handleUpload} />}
        {step === 1 && <StepPreview uploadResult={uploadResult} sessionId={sessionId} />}
        {step === 2 && <StepMissing uploadResult={uploadResult} sessionId={sessionId} />}
        {step === 3 && <StepTarget uploadResult={uploadResult} target={target} setTarget={setTarget} />}
        {step === 4 && (
          <StepFeatures uploadResult={uploadResult} target={target}
            features={features} setFeatures={setFeatures}
            encoding={encoding} setEncoding={setEncoding} />
        )}
        {step === 5 && (
          <StepModel uploadResult={uploadResult} sessionId={sessionId}
            target={target} features={features} encoding={encoding} />
        )}
      </div>

      <FooterNav step={step} canNext={canNext} onBack={prevStep} onNext={nextStep} />
    </div>
  );
}
