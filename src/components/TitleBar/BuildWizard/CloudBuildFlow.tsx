import { FiCloud, FiInfo } from "react-icons/fi";
import type { BuildConfig } from "../../../shared/types";

interface CloudBuildFlowProps {
  wizardStep: number;
  buildConfig: BuildConfig;
  setBuildConfig: (config: BuildConfig | ((prev: BuildConfig) => BuildConfig)) => void;
}

export function CloudBuildFlow({
  wizardStep,
}: CloudBuildFlowProps) {
  switch (wizardStep) {
    case 2:
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6">
          <div className="p-6 bg-warning/10 rounded-full text-warning animate-pulse">
            <FiCloud className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-base-content">
              Cloud Build Coming Soon
            </h3>
            <p className="text-sm text-base-content/60 max-w-sm mx-auto">
              We are working hard to bring you Norrix Cloud Infrastructure.
              Soon you will be able to build your apps in the cloud without local setup.
            </p>
          </div>
          <div className="alert bg-base-200 border-base-300 text-xs py-3 px-4 rounded-2xl flex items-center gap-3 max-w-md">
            <FiInfo className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-left">
              Cloud builds will support GitHub, GitLab, and Bitbucket integration with automatic signing management.
            </span>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <p className="text-base-content/60 italic text-sm">
            Step {wizardStep} is not yet available for Cloud Build.
          </p>
        </div>
      );
  }
}
