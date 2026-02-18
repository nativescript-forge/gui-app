import { FiPlay, FiZap, FiInfo } from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import type { RunConfig } from "../../../shared/types";
import { PlatformStatus } from "../../../shared/platformDetection";

interface ActionSelectionProps {
  runConfig: RunConfig;
  setRunConfig: (config: RunConfig | ((prev: RunConfig) => RunConfig)) => void;
  platformStatus: PlatformStatus;
  isMac: boolean;
}

export function ActionSelection({
  runConfig,
  setRunConfig,
  platformStatus,
  isMac,
}: ActionSelectionProps) {
  return (
    <div className="space-y-6 py-1">
      <div>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/40 mb-3 block px-1">
          Target Platform
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Android Button */}
          <button
            className={`btn h-auto py-4 flex flex-col items-center gap-2.5 rounded-2xl border transition-all group ${
              runConfig.platform === "android"
                ? "btn-primary border-primary shadow-lg ring-2 ring-primary/10"
                : "btn-ghost bg-base-200/50 border-transparent hover:border-base-300 opacity-70 hover:opacity-100"
            } ${!platformStatus.android.available ? "opacity-30 grayscale cursor-not-allowed border-dashed" : ""}`}
            onClick={() =>
              platformStatus.android.available &&
              setRunConfig((prev) => ({
                ...prev,
                platform: "android",
                format: "apk",
              }))
            }
            disabled={!platformStatus.android.available}
          >
            <SiAndroid
              className={`w-6 h-6 transition-transform group-hover:scale-110 ${runConfig.platform === "android" ? "text-white" : "text-success"}`}
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black tracking-tight">Android</span>
              <span className="text-[10px] font-bold opacity-50 mt-1 leading-relaxed max-w-[120px]">
                {!platformStatus.android.available
                  ? platformStatus.android.reason || "Not Available"
                  : "Device or Emulator"}
              </span>
            </div>
          </button>

          {/* iOS Button */}
          <button
            className={`btn h-auto py-4 flex flex-col items-center gap-2.5 rounded-2xl border transition-all group ${
              runConfig.platform === "ios"
                ? "btn-primary border-primary shadow-lg ring-2 ring-primary/10"
                : "btn-ghost bg-base-200/50 border-transparent hover:border-base-300 opacity-70 hover:opacity-100"
            } ${!platformStatus.ios.available ? "opacity-30 grayscale cursor-not-allowed border-dashed" : ""}`}
            onClick={() =>
              platformStatus.ios.available &&
              setRunConfig((prev) => ({
                ...prev,
                platform: "ios",
                format: "ipa",
              }))
            }
            disabled={!platformStatus.ios.available}
          >
            <SiApple
              className={`w-6 h-6 transition-transform group-hover:scale-110 ${runConfig.platform === "ios" ? "text-white" : "text-base-content"}`}
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black tracking-tight">iOS</span>
              <span className="text-[10px] font-bold opacity-50 mt-1 leading-relaxed max-w-[120px]">
                {!platformStatus.ios.available
                  ? platformStatus.ios.reason || "Not Available"
                  : "Device or Simulator"}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/40 block">
            Execution Mode
          </label>
          <div className="dropdown dropdown-end dropdown-hover">
            <label
              tabIndex={0}
              className="btn btn-ghost btn-xs btn-circle text-info/70 hover:text-info hover:bg-info/10 transition-colors"
            >
              <FiInfo className="w-4 h-4" />
            </label>
            <div
              tabIndex={0}
              className="dropdown-content z-[1] card card-compact w-64 p-3 shadow-2xl bg-base-100 border border-base-200"
            >
              <div className="font-bold mb-1 text-primary text-[11px]">
                Run Mode
              </div>
              <p className="text-[10px] opacity-70 mb-2.5 leading-relaxed">
                Runs the application in production mode without debugging.
              </p>
              <div className="font-bold mb-1 text-warning text-[11px]">
                Debug Mode
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed">
                Runs the application with debugging and hot reload capabilities.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className={`btn h-auto py-4 flex flex-col items-center gap-2.5 rounded-2xl border transition-all group ${
              runConfig.action === "run"
                ? "btn-primary border-primary shadow-lg ring-2 ring-primary/10"
                : "btn-ghost bg-base-200/50 border-transparent hover:border-base-300 opacity-70 hover:opacity-100"
            }`}
            onClick={() =>
              setRunConfig((prev) => ({
                ...prev,
                action: "run",
                mode: "release",
                format: prev.platform === "android" ? "apk" : "ipa",
                buildType: "local",
              }))
            }
          >
            <FiPlay
              className={`w-6 h-6 transition-transform group-hover:scale-110 ${runConfig.action === "run" ? "text-white" : "text-primary"}`}
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black tracking-tight">
                Run Mode
              </span>
              <span className="text-[10px] font-bold opacity-50 mt-1 leading-relaxed max-w-[130px]">
                Production, optimized, no debugging
              </span>
            </div>
          </button>
          <button
            className={`btn h-auto py-4 flex flex-col items-center gap-2.5 rounded-2xl border transition-all group ${
              runConfig.action === "debug"
                ? "btn-warning border-warning shadow-lg ring-2 ring-warning/10 text-warning-content"
                : "btn-ghost bg-base-200/50 border-transparent hover:border-base-300 opacity-70 hover:opacity-100"
            }`}
            onClick={() =>
              setRunConfig((prev) => ({
                ...prev,
                action: "debug",
                mode: "debug",
                format: prev.platform === "android" ? "apk" : "ipa",
                buildType: "local",
              }))
            }
          >
            <FiZap
              className={`w-6 h-6 transition-transform group-hover:scale-110 ${runConfig.action === "debug" ? "text-warning-content" : "text-warning"}`}
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black tracking-tight">
                Debug Mode
              </span>
              <span className="text-[10px] font-bold opacity-50 mt-1 leading-relaxed max-w-[130px]">
                Development with hot reload & debugger
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
