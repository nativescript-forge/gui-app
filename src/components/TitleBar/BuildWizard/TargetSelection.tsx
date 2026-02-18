import { FiCpu, FiSmartphone, FiCloud } from "react-icons/fi";
import type { BuildConfig } from "../../../shared/types";

interface TargetSelectionProps {
  buildConfig: BuildConfig;
  setBuildConfig: (
    config: BuildConfig | ((prev: BuildConfig) => BuildConfig),
  ) => void;
}

export function TargetSelection({
  buildConfig,
  setBuildConfig,
}: TargetSelectionProps) {
  return (
    <div className="space-y-6 py-2">
      <div className="text-center mb-6">
        <h3 className="text-lg font-black text-base-content uppercase tracking-tight">
          Select Build Type
        </h3>
        <p className="text-sm text-base-content/60 font-medium">
          Choose how you want to build your application
        </p>
      </div>

      {/* Build Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
            buildConfig.buildType === "local"
              ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]"
              : "border-base-300 hover:border-primary/50 bg-base-200/50 hover:scale-[1.01]"
          }`}
          onClick={() => setBuildConfig({ ...buildConfig, buildType: "local" })}
        >
          <div
            className={`p-4 rounded-2xl ${buildConfig.buildType === "local" ? "bg-primary text-primary-content" : "bg-base-300 text-base-content/40"}`}
          >
            <FiCpu className="w-7 h-7" />
          </div>
          <div className="text-center">
            <div className="font-black text-sm text-base-content uppercase tracking-wider">
              Local Build
            </div>
            <div className="text-[10px] text-base-content/60 mt-1.5 font-bold leading-relaxed max-w-[140px]">
              Build using your own machine resources
            </div>
          </div>
        </button>

        {buildConfig.platform === "ios" ? (
          <button
            className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
              buildConfig.buildType === "simulator"
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]"
                : "border-base-300 hover:border-primary/50 bg-base-200/50 hover:scale-[1.01]"
            }`}
            onClick={() =>
              setBuildConfig({ ...buildConfig, buildType: "simulator" })
            }
          >
            <div
              className={`p-4 rounded-2xl ${buildConfig.buildType === "simulator" ? "bg-primary text-primary-content" : "bg-base-300 text-base-content/40"}`}
            >
              <FiSmartphone className="w-7 h-7" />
            </div>
            <div className="text-center">
              <div className="font-black text-sm text-base-content uppercase tracking-wider">
                Simulator
              </div>
              <div className="text-[10px] text-base-content/60 mt-1.5 font-bold leading-relaxed max-w-[140px]">
                Build for iOS Simulator development
              </div>
            </div>
          </button>
        ) : (
          <div className="relative group opacity-40 cursor-not-allowed grayscale h-full">
            <div className="flex flex-col items-center gap-4 p-6 rounded-3xl border-2 border-base-300 bg-base-200/50 w-full h-full">
              <div className="p-4 rounded-2xl bg-base-300 text-base-content/40">
                <FiCloud className="w-7 h-7" />
              </div>
              <div className="text-center">
                <div className="font-black text-sm text-base-content uppercase tracking-wider">
                  Cloud Build
                </div>
                <div className="text-[10px] text-base-content/60 mt-1.5 font-bold leading-relaxed max-w-[140px]">
                  Build on Norrix Cloud Infrastructure
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 badge badge-warning badge-xs font-black shadow-sm">
              SOON
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
