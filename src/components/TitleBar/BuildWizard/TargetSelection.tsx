import { FiCpu, FiSmartphone, FiCloud } from "react-icons/fi";
import type { BuildConfig } from "../../../app/types";

interface TargetSelectionProps {
  buildConfig: BuildConfig;
  setBuildConfig: (config: BuildConfig | ((prev: BuildConfig) => BuildConfig)) => void;
}

export function TargetSelection({
  buildConfig,
  setBuildConfig,
}: TargetSelectionProps) {
  return (
    <div className="space-y-3 py-1">
      <div className="text-center mb-3">
        <h3 className="text-base font-bold text-base-content">
          Select Build Target
        </h3>
        <p className="text-xs text-base-content/60">
          Choose how you want to build your application
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
            buildConfig.buildType === "local"
              ? "border-primary bg-primary/10 shadow-md"
              : "border-base-300 hover:border-primary/50 bg-base-200/50"
          }`}
          onClick={() =>
            setBuildConfig({ ...buildConfig, buildType: "local" })
          }
        >
          <div
            className={`p-2.5 rounded-full ${buildConfig.buildType === "local" ? "bg-primary text-primary-content" : "bg-base-300 opacity-50"}`}
          >
            <FiCpu className="w-5 h-5" />
          </div>
          <div className="text-center">
            <div className="font-bold text-xs text-base-content">
              Local Build
            </div>
            <div className="text-[10px] text-base-content/60 mt-0.5 text-balance">
              Build using your local machine resources
            </div>
          </div>
        </button>

        {buildConfig.platform === "ios" ? (
          <button
            className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
              buildConfig.buildType === "simulator"
                ? "border-primary bg-primary/10 shadow-md"
                : "border-base-300 hover:border-primary/50 bg-base-200/50"
            }`}
            onClick={() =>
              setBuildConfig({ ...buildConfig, buildType: "simulator" })
            }
          >
            <div
              className={`p-2.5 rounded-full ${buildConfig.buildType === "simulator" ? "bg-primary text-primary-content" : "bg-base-300 opacity-50"}`}
            >
              <FiSmartphone className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-bold text-xs text-base-content">
                Simulator Build
              </div>
              <div className="text-[10px] text-base-content/60 mt-0.5 text-balance">
                Build specifically for iOS Simulator
              </div>
            </div>
          </button>
        ) : (
          <div className="relative group opacity-60 cursor-not-allowed grayscale">
            <div
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all w-full h-full ${
                buildConfig.buildType === "cloud"
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-base-300 hover:border-primary/50 bg-base-200/50"
              }`}
            >
              <div
                className={`p-2.5 rounded-full ${buildConfig.buildType === "cloud" ? "bg-primary text-primary-content" : "bg-base-300 opacity-50"}`}
              >
                <FiCloud className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="font-bold text-xs text-base-content">
                  Cloud Build
                </div>
                <div className="text-[10px] text-base-content/60 mt-0.5 text-balance">
                  Build on Norrix Cloud Infrastructure
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2 badge badge-warning badge-[9px] font-bold shadow-sm h-3.5 px-1.5 leading-none">
              COMING SOON
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
