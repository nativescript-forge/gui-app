import React, { useState, useEffect } from "react";
import {
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaVial,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";

export const SETUP_PREFIX = "ns-forge-setup-v1-";

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  testFn?: () => Promise<{ success: boolean; message: string }>;
}

interface SetupWizardProps {
  steps: SetupStep[];
  onFinish: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  steps,
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [hasTested, setHasTested] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);

  // Load results from localStorage on mount
  useEffect(() => {
    const results: Record<string, { success: boolean; message: string }> = {};
    const tested: Record<string, boolean> = {};
    steps.forEach((step) => {
      const saved = localStorage.getItem(`${SETUP_PREFIX}${step.id}`);
      if (saved) {
        try {
          results[step.id] = JSON.parse(saved);
          tested[step.id] = true;
        } catch (e) {
          console.error("Failed to parse test result", e);
        }
      }
    });
    setTestResults(results);
    setHasTested(tested);
  }, [steps]);

  const handleTest = async () => {
    const step = steps[currentStep];
    if (!step.testFn) return;

    setIsTesting(true);
    setHasTested((prev) => ({ ...prev, [step.id]: true }));
    try {
      const result = await step.testFn();
      const updatedResults = { ...testResults, [step.id]: result };
      setTestResults(updatedResults);
      localStorage.setItem(`${SETUP_PREFIX}${step.id}`, JSON.stringify(result));
    } catch (error) {
      const result = {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
      setTestResults({ ...testResults, [step.id]: result });
      localStorage.setItem(`${SETUP_PREFIX}${step.id}`, JSON.stringify(result));
    } finally {
      setIsTesting(false);
    }
  };

  const handleNext = () => {
    const step = steps[currentStep];

    // If step has no test function, mark it as successful when clicking Continue
    if (!step.testFn) {
      const autoResult = { success: true, message: "Step completed" };
      setTestResults((prev) => ({ ...prev, [step.id]: autoResult }));
      setHasTested((prev) => ({ ...prev, [step.id]: true }));
      localStorage.setItem(
        `${SETUP_PREFIX}${step.id}`,
        JSON.stringify(autoResult),
      );
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepResult = testResults[steps[currentStep].id];

  return (
    <div className="card bg-base-100 shadow-2xl overflow-hidden border border-base-300">
      {/* Progress Header */}
      <div className="bg-base-200 p-6 border-b border-base-300">
        <ul className="steps w-full">
          {steps.map((step, index) => {
            const result = testResults[step.id];
            const isActivePath = index <= currentStep;
            const isStepSuccess = result?.success;

            return (
              <li
                key={index}
                className={`step text-xs md:text-sm ${
                  isActivePath
                    ? isStepSuccess
                      ? "step-success"
                      : "step-primary"
                    : ""
                }`}
                onClick={() => index < currentStep && setCurrentStep(index)}
                style={{ cursor: index < currentStep ? "pointer" : "default" }}
              >
                <div className="flex flex-col items-center">
                  <span className="hidden md:inline">{step.title}</span>
                  {result?.success && (
                    <FaCheck className="text-[10px] mt-1 text-success" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card-body p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          {/* Info Sidebar */}
          <div className="lg:col-span-4 bg-base-200/50 p-6 border-r border-base-300">
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-grow space-y-3">
                <div>
                  <span className="text-primary font-mono text-[10px] uppercase tracking-widest font-semibold">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <h2 className="text-xl font-bold mt-0.5 leading-tight">
                    {steps[currentStep].title}
                  </h2>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  {steps[currentStep].description}
                </p>

                {steps[currentStep].testFn && (
                  <div className="pt-2">
                    <button
                      className={`btn btn-md btn-block gap-3 shadow-sm ${isTesting ? "btn-disabled" : currentStepResult?.success ? "btn-success" : "btn-outline btn-primary"}`}
                      onClick={handleTest}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <FaSpinner className="animate-spin" />
                      ) : currentStepResult?.success ? (
                        <FaCheck />
                      ) : (
                        <FaVial />
                      )}
                      {isTesting
                        ? "Testing..."
                        : currentStepResult?.success
                          ? "Verification Success"
                          : "Test Setup"}
                    </button>

                    {currentStepResult && hasTested[steps[currentStep].id] && (
                      <div
                        className={`mt-3 p-3 rounded-xl text-xs border shadow-sm ${currentStepResult.success ? "bg-success/5 border-success/20 text-success" : "bg-error/5 border-error/20 text-error"}`}
                      >
                        <div className="flex gap-2.5">
                          {currentStepResult.success ? (
                            <FaCheck className="mt-0.5 flex-shrink-0" />
                          ) : (
                            <FaTimes className="mt-0.5 flex-shrink-0" />
                          )}
                          <p className="font-mono text-[11px] break-words leading-relaxed">
                            {currentStepResult.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-base-300/50">
                <div className="p-3 bg-info/5 border border-info/20 rounded-xl">
                  <h4 className="text-info font-bold text-[10px] mb-1 flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-info"></span>
                    Pro Tip
                  </h4>
                  <p className="text-[10px] text-info/80 leading-normal">
                    You can always go back and review previous steps if you
                    missed anything.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 p-6 flex flex-col">
            <div className="flex-grow animate-in fade-in slide-in-from-bottom-4 duration-300">
              {steps[currentStep].content}
            </div>

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-base-300">
              <button
                className={`btn btn-ghost btn-sm gap-2 ${currentStep === 0 ? "invisible" : ""}`}
                onClick={handleBack}
              >
                <FaArrowLeft /> Previous
              </button>

              <button
                className={`btn btn-sm ${
                  currentStep === steps.length - 1
                    ? "btn-success px-8"
                    : "btn-primary px-6"
                } gap-2 shadow-md`}
                onClick={handleNext}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Finish Setup <FaCheck />
                  </>
                ) : (
                  <>
                    Continue <FaArrowRight />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
