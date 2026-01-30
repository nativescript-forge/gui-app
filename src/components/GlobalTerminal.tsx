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

interface GlobalTerminalProps {
  logs: string;
  isRunning: boolean;
  title?: string;
  onClose?: () => void;
  onStop?: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  buildOutputPath?: string | null;
}

export function GlobalTerminal({
  logs,
  isRunning,
  title = "Terminal Output",
  onClose,
  onStop,
  isVisible,
  setIsVisible,
  buildOutputPath,
}: GlobalTerminalProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (terminalRef.current && isExpanded) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-[60] transition-all duration-500 ease-in-out terminal-container left-1/2 -translate-x-1/2 w-[95%] max-w-5xl ${
        isMaximized
          ? "bottom-0 h-[85vh] rounded-t-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.6)]"
          : isExpanded
            ? "bottom-0 h-[400px] rounded-t-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            : "bottom-6 h-12 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
      } bg-[#1e1e1e] border border-white/10 flex flex-col overflow-hidden backdrop-blur-md`}
    >
      {/* Header / Grabber */}
      <div
        className="bg-[#2d2d2d] px-6 py-3 flex items-center justify-between cursor-pointer border-b border-white/5 hover:bg-[#333] transition-colors h-12 shrink-0"
        onClick={() => !isMaximized && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <FiTerminal
            className={`${isRunning ? "text-primary animate-pulse" : "text-success"} w-4 h-4`}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            {title}
          </span>
          {isRunning && (
            <div className="flex items-center gap-4 ml-4">
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-xs text-primary"></span>
                <span className="text-[9px] text-primary/70 animate-pulse font-medium">
                  PROCESSING...
                </span>
              </div>

              {/* Stop Button */}
              <button
                className="btn btn-error btn-xs h-7 min-h-7 px-3 rounded-md flex items-center gap-2 hover:bg-error/80 transition-all border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onStop) onStop();
                }}
              >
                <FiSquare className="w-2.5 h-2.5 fill-current" />
                <span className="text-[9px] font-bold">STOP PROCESS</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Maximize/Minimize Toggle */}
          <button
            className="btn btn-ghost btn-xs text-white/40 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsMaximized(!isMaximized);
              setIsExpanded(true);
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <FiMinimize2 className="w-3.5 h-3.5" />
            ) : (
              <FiMaximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Expand/Collapse Toggle */}
          {!isMaximized && (
            <button
              className="btn btn-ghost btn-xs text-white/40 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronUp className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Close Button */}
          {!isRunning && (
            <button
              className="btn btn-ghost btn-xs text-white/40 hover:text-error transition-colors"
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
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className={`flex-1 p-6 overflow-y-auto font-mono text-[11px] custom-scrollbar bg-black/60 transition-all duration-300 ${
          isExpanded || isMaximized
            ? "opacity-100 visible"
            : "opacity-0 invisible h-0"
        }`}
      >
        <div className="min-h-full">
          {logs ? (
            <pre className="whitespace-pre-wrap break-all leading-relaxed text-green-400/90 pb-8">
              {logs}
              {isRunning && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle"></span>
              )}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/10 gap-4 py-12">
              <FiTerminal className="w-12 h-12 opacity-10" />
              <div className="flex flex-col items-center gap-1">
                <span className="uppercase tracking-[0.3em] text-[10px] font-bold">
                  Terminal Ready
                </span>
                <span className="text-[9px] opacity-40">
                  Awaiting command execution...
                </span>
              </div>
            </div>
          )}

          {/* Status Badge inside content */}
          {!isRunning && logs && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 py-2 px-4 rounded-lg bg-success/10 border border-success/20 w-fit">
                <FiCheckCircle className="text-success w-3 h-3" />
                <span className="text-[10px] text-success font-bold uppercase tracking-wider">
                  Process Finished
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
