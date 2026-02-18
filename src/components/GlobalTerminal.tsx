import { useState, useEffect, useRef } from "react";
import {
  FiTerminal,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiCheckCircle,
  FiMaximize2,
  FiMinimize2,
  FiSquare,
  FiFolder,
} from "react-icons/fi";
import { invoke } from "@tauri-apps/api/core";
import { stripAnsi } from "../shared/utils";

interface GlobalTerminalProps {
  logs: string;
  isRunning: boolean;
  title?: string;
  onClose?: () => void;
  onStop?: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  buildOutputPath?: string | null;
  processStatus?: {
    status: string;
    action: string;
    message?: string;
  } | null;
}

/**
 * GlobalTerminal Component
 *
 * A professional terminal panel with an integrated Android Studio-style status bar.
 *
 * Features:
 * - Auto-trigger: Appears as a status bar at the bottom-right when a command starts.
 * - Progress Tracking: Displays a real-time progress bar (simulated or based on events).
 * - Interactive: Click the status bar to expand into a full terminal panel.
 * - Responsive: Adapts between status bar, expanded panel, and maximized view.
 *
 * Integration:
 * 1. Pass `isRunning` to trigger the visibility.
 * 2. Pass `processStatus` for real-time action labels and messages.
 * 3. Use `onStop` to handle process termination from the UI.
 */
export function GlobalTerminal({
  logs,
  isRunning,
  title = "Terminal Output",
  onClose,
  onStop,
  isVisible,
  setIsVisible,
  buildOutputPath,
  processStatus,
}: GlobalTerminalProps) {
  // 1: compact (Status Bar), 2: medium (25% window), 3: large (55% window)
  const [viewMode, setViewMode] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Cycle through modes: compact -> medium -> large -> compact
  const handleModeCycle = () => {
    setViewMode((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
  };

  const handleRevealInExplorer = async () => {
    if (!buildOutputPath) return;
    try {
      // Get directory path from file path
      const dirPath = buildOutputPath.substring(
        0,
        Math.max(
          buildOutputPath.lastIndexOf("\\"),
          buildOutputPath.lastIndexOf("/"),
        ),
      );
      await invoke("reveal_in_explorer", { path: dirPath });
    } catch (err) {
      console.error("Failed to reveal in explorer:", err);
    }
  };

  // Auto-trigger visibility when process starts
  useEffect(() => {
    if (isRunning) {
      setIsVisible(true);
      setViewMode(1); // Force compact mode (Status Bar) when starting
    }
  }, [isRunning, setIsVisible]);

  // Progress simulation
  useEffect(() => {
    let interval: number;
    if (isRunning) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + 2;
          if (prev < 70) return prev + 0.5;
          if (prev < 95) return prev + 0.1;
          return prev;
        });
      }, 200);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 1000);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (terminalRef.current && (viewMode === 3 || viewMode === 2)) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, viewMode]);

  const getStatusText = () => {
    const action = processStatus?.action?.replace("-", " ") || "process";
    if (!isRunning) return `Done ${action}`;

    switch (processStatus?.status) {
      case "starting":
        return `Starting ${action}`;
      case "building":
      case "running":
        return `Processing ${action}`;
      case "finished":
        return `Done ${action}`;
      default:
        return `Processing ${action}`;
    }
  };

  if (!isVisible) return null;

  const isLarge = viewMode === 3;
  const isMedium = viewMode === 2;
  const isCompact = viewMode === 1;

  return (
    <div
      className={`fixed z-[60] transition-all duration-500 ease-in-out terminal-container shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${
        isLarge
          ? "bottom-6 right-6 w-[65vw] h-[55vh] rounded-2xl"
          : isMedium
            ? "bottom-6 right-6 w-[50vw] h-[25vh] rounded-xl"
            : "bottom-6 right-6 w-[320px] h-9 rounded-full"
      } bg-[#1a1a1a] border border-white/10 flex flex-col overflow-hidden backdrop-blur-xl`}
    >
      {/* Header / Clickable Area */}
      <div
        className={`flex items-center transition-all duration-300 cursor-pointer ${
          !isCompact
            ? "bg-[#252525] h-11 border-b border-white/5 hover:bg-[#2a2a2a] px-4 justify-between"
            : "bg-[#252525]/95 h-full hover:bg-[#2d2d2d] px-4 justify-between"
        }`}
        onClick={handleModeCycle}
      >
        {isCompact ? (
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FiTerminal
                className={`${isRunning ? "text-primary animate-pulse" : "text-success"} w-3 h-3 shrink-0`}
              />
              <span className="text-[10px] font-bold text-white/90 truncate uppercase tracking-wider">
                {getStatusText()}
              </span>
            </div>

            {isRunning && (
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  className="btn btn-ghost btn-xs h-6 w-6 p-0 text-error hover:bg-error/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStop) onStop();
                  }}
                  title="Stop Process"
                >
                  <FiSquare className="w-2.5 h-2.5 fill-current" />
                </button>
              </div>
            )}

            {!isRunning && (
              <button
                className="btn btn-ghost btn-xs h-6 w-6 p-0 text-white/40 hover:text-error shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                  if (onClose) onClose();
                }}
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-0.5">
                <FiTerminal
                  className={`${isRunning ? "text-primary animate-pulse" : "text-success"} w-3.5 h-3.5`}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 truncate">
                  {getStatusText()}
                </span>
              </div>

              {(isRunning || isMedium) && (
                <div className="w-full flex flex-col gap-1">
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isRunning && (
                <button
                  className="btn btn-ghost btn-xs h-7 w-7 p-0 text-error hover:bg-error/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStop) onStop();
                  }}
                  title="Stop Process"
                >
                  <FiSquare className="w-3 h-3 fill-current" />
                </button>
              )}

              {!isRunning && (
                <button
                  className="btn btn-ghost btn-xs h-7 w-7 p-0 text-white/40 hover:text-error"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(false);
                    if (onClose) onClose();
                  }}
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content Area */}
      <div
        ref={terminalRef}
        className={`flex-1 overflow-y-auto font-mono text-[11px] custom-scrollbar bg-black/40 transition-all duration-500 ${
          !isCompact ? "opacity-100 visible p-6" : "opacity-0 invisible h-0"
        }`}
      >
        <div className="min-h-full">
          {logs && (isLarge || isMedium) ? (
            <pre className="whitespace-pre-wrap break-all leading-relaxed text-green-400/90 pb-8 selection:bg-primary/30 font-medium">
              {stripAnsi(logs)}
              {isRunning && (
                <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-1 align-middle shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              )}
            </pre>
          ) : (
            !isCompact && (
              <div className="h-full flex flex-col items-center justify-center text-white/10 gap-4 py-8">
                <div className="relative">
                  <FiTerminal
                    className={`${isLarge ? "w-16 h-16" : "w-10 h-10"} opacity-10`}
                  />
                  <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full"></div>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span
                    className={`uppercase tracking-[0.4em] font-black text-white/20 ${isLarge ? "text-[11px]" : "text-[9px]"}`}
                  >
                    {isRunning ? "Action in Progress" : "Terminal Ready"}
                  </span>
                  <span className="text-[9px] opacity-40 font-medium max-w-[200px]">
                    {isRunning
                      ? `Currently ${processStatus?.action || "executing tasks"}...`
                      : "Awaiting command execution..."}
                  </span>
                </div>
              </div>
            )
          )}

          {/* Status Badge inside content */}
          {!isRunning && logs && (isLarge || isMedium) && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 py-2 px-4 rounded-lg bg-success/10 border border-success/20 w-fit">
                <FiCheckCircle className="text-success w-3 h-3" />
                <span className="text-[10px] text-success font-bold uppercase tracking-wider">
                  {getStatusText()}
                </span>
              </div>

              {buildOutputPath && (
                <button
                  onClick={handleRevealInExplorer}
                  className="btn btn-primary btn-xs h-8 px-4 rounded-lg flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/20 border-none"
                >
                  <FiFolder className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Reveal in Explorer
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
