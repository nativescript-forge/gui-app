import { FiSmartphone, FiActivity, FiSquare, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { LuRocket } from "react-icons/lu";

interface StatusBarProps {
  processStatus: {
    status: "starting" | "building" | "running" | "finished" | "error" | "terminated";
    action: string;
    deviceId?: string;
    exitCode?: number;
    message?: string;
  } | null;
  onStop: () => void;
}

export function StatusBar({ processStatus, onStop }: StatusBarProps) {
  if (!processStatus) return null;

  const getStatusColor = () => {
    switch (processStatus.status) {
      case "running":
        return "text-success bg-success/10 border-success/20";
      case "building":
      case "starting":
        return "text-warning bg-warning/10 border-warning/20";
      case "error":
        return "text-error bg-error/10 border-error/20";
      case "terminated":
        return "text-base-content/50 bg-base-content/5 border-base-content/10";
      default:
        return "text-base-content/70 bg-base-content/5 border-base-content/10";
    }
  };

  const getStatusIcon = () => {
    switch (processStatus.status) {
      case "running":
        return <FiCheckCircle className="w-3.5 h-3.5 animate-pulse" />;
      case "building":
      case "starting":
        return <FiActivity className="w-3.5 h-3.5 animate-spin" />;
      case "error":
        return <FiAlertCircle className="w-3.5 h-3.5" />;
      default:
        return <FiActivity className="w-3.5 h-3.5" />;
    }
  };

  const isRunning = ["starting", "building", "running"].includes(processStatus.status);

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${getStatusColor()}`}>
      <div className="flex items-center gap-2.5 border-r border-current/10 pr-3">
        {getStatusIcon()}
        <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
          {processStatus.status === "building" ? "Building..." : 
           processStatus.status === "running" ? "Active" : 
           processStatus.status.charAt(0).toUpperCase() + processStatus.status.slice(1)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <LuRocket className="w-3 h-3 opacity-70" />
            <span className="text-[10px] font-bold opacity-90">
              {processStatus.action.replace("-", " ").toUpperCase()}
            </span>
          </div>
          {processStatus.deviceId && (
            <div className="flex items-center gap-1.5">
              <FiSmartphone className="w-3 h-3 opacity-70" />
              <span className="text-[9px] font-medium opacity-60">
                {processStatus.deviceId}
              </span>
            </div>
          )}
        </div>

        {isRunning && (
          <button
            onClick={onStop}
            className="group flex items-center justify-center w-8 h-8 rounded-xl bg-error/20 hover:bg-error text-error hover:text-white transition-all duration-300"
            title="Stop Process"
          >
            <FiSquare className="w-4 h-4 fill-current group-hover:scale-90 transition-transform" />
          </button>
        )}
      </div>

      {processStatus.message && !isRunning && (
        <div className="max-w-[200px] truncate text-[9px] font-medium opacity-60 border-l border-current/10 pl-3">
          {processStatus.message}
        </div>
      )}
    </div>
  );
}
