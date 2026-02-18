import { FiTerminal, FiCopy, FiCheck, FiPlay, FiZap } from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import type { RunConfig } from "../../../shared/types";

interface RunPreviewProps {
  runConfig: RunConfig;
  generateCommandPreview: () => string;
  copied: boolean;
  handleCopy: () => void;
}

export function RunPreview({
  runConfig,
  generateCommandPreview,
  copied,
  handleCopy,
}: RunPreviewProps) {
  const command = generateCommandPreview();

  return (
    <div className="space-y-5 py-1">
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-2">
        <div
          className={`p-4 rounded-[1.2rem] shadow-lg ${
            runConfig.action === "debug"
              ? "bg-warning text-warning-content"
              : "bg-primary text-primary-content"
          }`}
        >
          {runConfig.action === "debug" ? (
            <FiZap className="w-8 h-8" />
          ) : (
            <FiPlay className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-xl font-black tracking-tight text-base-content uppercase">
          Ready to {runConfig.action === "debug" ? "Debug" : "Launch"}
        </h3>
        <p className="text-xs text-base-content/60 max-w-xs mx-auto leading-relaxed font-bold">
          The following command will be executed to {runConfig.action} your app.
        </p>
      </div>

      <div className="bg-base-200/50 rounded-[1.2rem] border border-base-300 overflow-hidden shadow-inner">
        <div className="bg-base-300/50 px-4 py-2 flex items-center justify-between border-b border-base-300">
          <div className="flex items-center gap-2">
            <FiTerminal className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-40">
              Command Preview
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="btn btn-ghost btn-xs gap-1.5 h-7 min-h-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all px-2.5"
          >
            {copied ? (
              <>
                <FiCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase">Copied</span>
              </>
            ) : (
              <>
                <FiCopy className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase">Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="p-4 font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap bg-black/30 text-primary-content/90 min-h-[70px] border-t border-white/5 selection:bg-primary selection:text-white">
          {command}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-base-200/50 p-3 rounded-xl border border-base-300 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-base-300/50 rounded-lg shadow-inner">
            {runConfig.platform === "android" ? (
              <SiAndroid className="w-4 h-4 text-success" />
            ) : (
              <SiApple className="w-4 h-4 text-info" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-30 leading-none mb-1.5">
              Platform
            </span>
            <span className="text-sm font-black capitalize text-base-content">
              {runConfig.platform}
            </span>
          </div>
        </div>

        <div className="bg-base-200/50 p-3 rounded-xl border border-base-300 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-base-300/50 rounded-lg text-primary shadow-inner">
            <FiTerminal className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-30 leading-none mb-1.5">
              Mode
            </span>
            <span className="text-sm font-black capitalize text-base-content">
              {runConfig.action} Mode
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
