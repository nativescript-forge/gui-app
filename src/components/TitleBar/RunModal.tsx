import { FiPlay, FiX, FiArrowRight, FiArrowLeft, FiZap } from "react-icons/fi";
import { useState, useEffect } from "react";
import type { RunConfig, AdbDevice } from "../../shared/types";
import { ActionSelection } from "./RunWizard/ActionSelection";
import { DeviceSelection } from "./RunWizard/DeviceSelection";
import { RunOptions } from "./RunWizard/RunOptions";
import { RunPreview } from "./RunWizard/RunPreview";
import { invoke } from "@tauri-apps/api/core";
import { PlatformStatus } from "../../shared/platformDetection";

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (config: RunConfig) => void;
  platform: "android" | "ios" | null;
  initialDeviceId?: string | null;
  initialAction?: "run" | "debug";
  flavor?: string;
  platformStatus: PlatformStatus;
  isMac: boolean;
}

export function RunModal({
  isOpen,
  onClose,
  onRun,
  platform: initialPlatform,
  initialDeviceId,
  initialAction = "run",
  flavor,
  platformStatus,
  isMac,
}: RunModalProps) {
  const [wizardStep, setWizardStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [devices, setDevices] = useState<AdbDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [runConfig, setRunConfig] = useState<RunConfig>({
    platform:
      initialPlatform && (isMac || initialPlatform === "android")
        ? initialPlatform
        : "android",
    action: initialAction,
    mode: "debug",
    format:
      initialPlatform === "android" || !isMac
        ? "apk"
        : initialPlatform === "ios"
          ? "ipa"
          : "apk",
    buildType: "local",
    deviceId: initialDeviceId || undefined,
    clean: false,
    noWatch: false,
    noHmr: false,
    force: false,
    uglify: true,
  });

  useEffect(() => {
    if (isOpen) {
      setRunConfig((prev) => ({
        ...prev,
        platform:
          initialPlatform && (isMac || initialPlatform === "android")
            ? initialPlatform
            : "android",
        action: initialAction,
        mode: "debug",
        format:
          initialPlatform === "android" || !isMac
            ? "apk"
            : initialPlatform === "ios"
              ? "ipa"
              : "apk",
        buildType: "local",
        deviceId: initialDeviceId || undefined,
      }));
      setWizardStep(1);
      scanDevices();
    }
  }, [isOpen, initialPlatform, initialDeviceId, initialAction, platformStatus]);

  const scanDevices = async () => {
    setScanning(true);
    try {
      const result = (await invoke("get_adb_devices")) as AdbDevice[];
      setDevices(result);
    } catch (e) {
      console.error("Failed to scan devices in RunModal:", e);
    } finally {
      setScanning(false);
    }
  };

  const handleNext = () => {
    setWizardStep((s) => s + 1);
  };

  const handleBack = () => {
    setWizardStep((s) => s - 1);
  };

  const generateCommandPreview = () => {
    const parts = ["ns", runConfig.action, runConfig.platform];

    if (runConfig.deviceId) {
      parts.push("--device");
      parts.push(runConfig.deviceId);
    } else if (runConfig.emulator) {
      parts.push("--emulator");
    }

    if (runConfig.action === "debug") {
      if (runConfig.debugBrk) parts.push("--debug-brk");
      if (runConfig.start) parts.push("--start");
    }

    if (runConfig.timeout) {
      parts.push("--timeout");
      parts.push(runConfig.timeout.toString());
    }

    if (runConfig.noWatch) parts.push("--no-watch");
    if (runConfig.clean) parts.push("--clean");
    if (runConfig.noHmr) parts.push("--no-hmr");
    if (runConfig.force) parts.push("--force");

    if (runConfig.platform === "android" && runConfig.aab) {
      parts.push("--aab");
    }

    // Env flags
    if (runConfig.uglify) parts.push("--env.uglify");
    if (runConfig.aot && flavor?.toLowerCase().includes("angular"))
      parts.push("--env.aot");
    if (runConfig.snapshot && runConfig.platform === "android")
      parts.push("--env.snapshot");
    if (runConfig.v8cache && runConfig.platform === "android")
      parts.push("--env.v8cache");
    if (runConfig.compileSnapshot && runConfig.platform === "android")
      parts.push("--env.compileSnapshot");
    if (runConfig.report) parts.push("--env.report");
    if (runConfig.sourceMap) parts.push("--env.sourceMap");
    if (runConfig.hiddenSourceMap) parts.push("--env.hiddenSourceMap");

    if (runConfig.additionalOptions) {
      parts.push(runConfig.additionalOptions);
    }

    return parts.join(" ");
  };

  const handleCopy = () => {
    const command = generateCommandPreview();
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    // Pastikan field mandatory terisi sebelum dikirim ke Rust
    // mode, format, buildType di Rust BuildConfig bersifat mandatory (String)
    const finalConfig = {
      ...runConfig,
      mode: runConfig.mode || "debug",
      format:
        runConfig.format || (runConfig.platform === "android" ? "apk" : "ipa"),
      buildType: runConfig.buildType || "local",
    };
    onRun(finalConfig);
    onClose();
  };

  if (!isOpen) return null;

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <ActionSelection
            runConfig={runConfig}
            setRunConfig={setRunConfig}
            platformStatus={platformStatus}
            isMac={isMac}
          />
        );
      case 2:
        return (
          <DeviceSelection
            runConfig={runConfig}
            setRunConfig={setRunConfig}
            devices={devices}
            scanning={scanning}
            onScan={scanDevices}
          />
        );
      case 3:
        return (
          <RunOptions
            runConfig={runConfig}
            setRunConfig={setRunConfig}
            flavor={flavor}
          />
        );
      case 4:
        return (
          <RunPreview
            runConfig={runConfig}
            generateCommandPreview={generateCommandPreview}
            copied={copied}
            handleCopy={handleCopy}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 border border-base-300 shadow-2xl w-full max-w-2xl overflow-hidden rounded-3xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-base-200/50 py-2.5 px-6 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-xl ${runConfig.action === "debug" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}
            >
              {runConfig.action === "debug" ? (
                <FiZap className="w-4 h-4" />
              ) : (
                <FiPlay className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-base-content leading-none mb-0.5">
                {runConfig.action === "debug"
                  ? "Debug Configuration"
                  : "Run Configuration"}
              </h2>
              <div className="text-[10px] font-bold text-base-content/60 uppercase tracking-widest flex items-center gap-2">
                Target: {runConfig.platform}{" "}
                <span className="opacity-20">•</span> Step {wizardStep} of 4
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
            onClick={onClose}
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-8 pt-3">
          <ul className="steps w-full">
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 1 ? "step-primary" : "text-base-content/30"}`}
            >
              Mode
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 2 ? "step-primary" : "text-base-content/30"}`}
            >
              Device
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 3 ? "step-primary" : "text-base-content/30"}`}
            >
              Options
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 4 ? "step-primary" : "text-base-content/30"}`}
            >
              Review
            </li>
          </ul>
        </div>

        {/* Modal Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {renderWizardStep()}
        </div>

        {/* Footer */}
        <div className="bg-base-200/50 p-3 px-6 border-t border-base-300 flex items-center justify-between">
          <button
            className={`btn btn-sm btn-ghost gap-2 rounded-xl text-xs font-bold uppercase tracking-widest ${wizardStep === 1 ? "invisible" : ""}`}
            onClick={handleBack}
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            className="btn btn-sm btn-primary px-6 gap-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            onClick={wizardStep === 4 ? handleRun : handleNext}
          >
            {wizardStep === 4
              ? runConfig.action === "debug"
                ? "Start Debug"
                : "Start Run"
              : "Next Step"}
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
