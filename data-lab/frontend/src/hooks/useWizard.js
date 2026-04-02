import { useState, useMemo } from "react";
import { STEPS } from "../constants/theme";

// ウィザード状態管理フック
export function useWizard() {
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [target, setTarget] = useState("");
  const [features, setFeatures] = useState([]);
  const [encoding, setEncoding] = useState({});

  const canNext = useMemo(() => {
    if (step === 0) return !!uploadResult;
    if (step === 1) return true;
    if (step === 2) return true;
    if (step === 3) return !!target;
    if (step === 4) return features.length > 0;
    return false;
  }, [step, uploadResult, target, features]);

  const handleUpload = (result) => {
    setSessionId(result.session_id);
    setUploadResult(result);
    setStep(1);
  };

  const nextStep = () => {
    // Step4に進む時、説明変数が未選択なら全カラムを自動選択
    if (step === 3 && features.length === 0) {
      setFeatures(uploadResult.columns.filter((c) => c.name !== target).map((c) => c.name));
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const reset = () => {
    setStep(0);
    setSessionId(null);
    setUploadResult(null);
    setTarget("");
    setFeatures([]);
    setEncoding({});
  };

  return {
    step, setStep, sessionId, uploadResult,
    target, setTarget, features, setFeatures,
    encoding, setEncoding,
    canNext, handleUpload, nextStep, prevStep, reset,
  };
}
