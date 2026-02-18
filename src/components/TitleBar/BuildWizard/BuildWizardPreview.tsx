import { FiCopy, FiCheck, FiTerminal, FiSettings, FiBox, FiCpu, FiCloud } from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import type { BuildConfig } from "../../../shared/types";

interface BuildWizardPreviewProps {
  buildConfig: BuildConfig;
  generateCommandPreview: () => string;
  copied: boolean;
  handleCopy: () => void;
}

export function BuildWizardPreview({
  buildConfig,
  generateCommandPreview,
  copied,
  handleCopy,
}: BuildWizardPreviewProps) {
  return (
    <div className="space-y-4 py-1">
      <div className="text-center mb-1">
        <h3 className="text-base font-bold text-base-content">
          Build Summary
        </h3>
        <p className="text-xs text-base-content/60">
          Review your configuration before building
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-base-200/50 p-3 rounded-2xl border border-base-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <FiSettings className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
              General
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Target</span>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {buildConfig.buildType === "local" ? (
                  <FiCpu className="w-3 h-3 text-primary" />
                ) : (
                  <FiCloud className="w-3 h-3 text-warning" />
                )}
                <span className="capitalize">{buildConfig.buildType}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Platform</span>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {buildConfig.platform === "android" ? (
                  <SiAndroid className="w-3 h-3 text-success" />
                ) : (
                  <SiApple className="w-3 h-3 text-base-content" />
                )}
                <span className="capitalize">{buildConfig.platform}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Mode</span>
              <span
                className={`text-xs font-bold capitalize ${buildConfig.mode === "release" ? "text-warning" : "text-primary"}`}
              >
                {buildConfig.mode}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-base-200/50 p-3 rounded-2xl border border-base-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-secondary/10 rounded-lg text-secondary">
              <FiBox className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
              Output
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Format</span>
              <span className="text-xs font-bold uppercase">
                {buildConfig.format}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Clean Build</span>
              <span
                className={`text-xs font-bold ${buildConfig.clean ? "text-success" : "text-base-content/40"}`}
              >
                {buildConfig.clean ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Uglify</span>
              <span
                className={`text-xs font-bold ${buildConfig.uglify ? "text-success" : "text-base-content/40"}`}
              >
                {buildConfig.uglify ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-base-300 rounded-lg text-base-content/60">
              <FiTerminal className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-base-content/60">
              Command Preview
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={`btn btn-ghost btn-xs gap-1.5 h-7 rounded-lg transition-all ${copied ? "text-success bg-success/10" : "text-primary hover:bg-primary/10"}`}
          >
            {copied ? (
              <>
                <FiCheck className="w-3 h-3" />
                <span className="text-[10px] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <FiCopy className="w-3 h-3" />
                <span className="text-[10px] font-bold">Copy Command</span>
              </>
            )}
          </button>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-base-300/50 p-4 rounded-2xl border border-base-300 font-mono text-[11px] break-all leading-relaxed shadow-inner min-h-[60px] flex items-center">
            <span className="text-base-content/80">
              {generateCommandPreview()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
