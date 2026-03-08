import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";
import type { ProjectRow, SyncStatus } from "../../shared/types";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectRow[];
  onSync: (path: string) => Promise<void>;
  theme: string;
}

export function SyncModal({
  isOpen,
  onClose,
  projects,
  onSync,
  theme,
}: SyncModalProps) {
  const [statuses, setStatuses] = useState<
    Record<string, SyncStatus | "loading" | "error">
  >({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      checkAll();
    }
  }, [isOpen, projects]);

  const checkStatus = async (path: string) => {
    try {
      setStatuses((prev) => ({ ...prev, [path]: "loading" }));
      const status = await invoke<SyncStatus>("check_sync_status", {
        projectPath: path,
      });
      setStatuses((prev) => ({ ...prev, [path]: status }));
    } catch (err) {
      console.error(`Failed to check sync status for ${path}:`, err);
      setStatuses((prev) => ({ ...prev, [path]: "error" }));
    }
  };

  const checkAll = () => {
    projects.forEach((p) => checkStatus(p.path));
  };

  const handleSync = async (path: string) => {
    setSyncing((prev) => ({ ...prev, [path]: true }));
    try {
      await onSync(path);
      await checkStatus(path);
    } finally {
      setSyncing((prev) => ({ ...prev, [path]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-theme={theme}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
    >
      <div className="modal-box border border-base-content/10 bg-base-200 shadow-2xl max-w-2xl w-full p-0 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-content/10 bg-base-300/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FiRefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-base-content">
                Synchronization Hub
              </h3>
              <p className="text-[11px] opacity-50 uppercase tracking-wider font-bold">
                Metadata & Cache Consistency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-base-content"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-30 gap-3">
                <FiRefreshCw className="w-12 h-12" />
                <p>No projects found in library</p>
              </div>
            ) : (
              projects.map((project) => {
                const status = statuses[project.path];
                const isSyncing = syncing[project.path];
                const isError = status === "error";
                const isLoading = status === "loading";
                const syncData = typeof status === "object" ? status : null;
                const isOutOfSync = syncData && !syncData.isSynced;

                return (
                  <div
                    key={project.path}
                    className="relative flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-content/5 hover:border-base-content/10 transition-all group overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg transition-colors ${isError ? "bg-error/10 text-error" : isOutOfSync ? "bg-warning/10 text-warning" : isLoading || isSyncing ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}
                      >
                        {isLoading || isSyncing ? (
                          <FiRefreshCw className="w-5 h-5 animate-spin" />
                        ) : isError ? (
                          <FiAlertTriangle className="w-5 h-5" />
                        ) : isOutOfSync ? (
                          <FiAlertTriangle className="w-5 h-5" />
                        ) : (
                          <FiCheckCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-sm text-base-content truncate">
                          {project.name}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono truncate max-w-[250px] sm:max-w-[350px]">
                          {project.path}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div
                          className={`text-[10px] font-bold uppercase tracking-widest ${isSyncing ? "text-primary animate-pulse" : isError ? "text-error" : isOutOfSync ? "text-warning" : "text-success opacity-50"}`}
                        >
                          {isSyncing
                            ? "Syncing…"
                            : isLoading
                              ? "Checking…"
                              : isError
                                ? "Error"
                                : isOutOfSync
                                  ? "Out of Sync"
                                  : "Synchronized"}
                        </div>
                        {syncData?.lastSynced && (
                          <div className="text-[10px] opacity-50 mt-0.5">
                            Last:{" "}
                            {new Date(
                              syncData.lastSynced * 1000,
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleSync(project.path)}
                        disabled={
                          (!isOutOfSync && !isError) || isSyncing || isLoading
                        }
                        className={`btn btn-sm min-w-[100px] ${isOutOfSync ? "btn-warning" : isError ? "btn-error btn-outline" : "btn-ghost border border-base-content/5 opacity-50"} ${isSyncing ? "loading loading-spinner" : ""}`}
                      >
                        {isSyncing
                          ? "Syncing"
                          : isOutOfSync
                            ? "Sync Now"
                            : isError
                              ? "Retry"
                              : "Synced"}
                      </button>
                    </div>
                    {/* Sync Progress Bar shim */}
                    {isSyncing && (
                      <div className="absolute bottom-0 left-0 h-[2px] bg-primary animate-progress-indefinite w-full rounded-b-xl" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-content/10 bg-base-300/30 flex justify-between items-center text-[11px] opacity-60">
          <span className="italic font-medium text-base-content">
            Syncs .nsforge metadata with package.json
          </span>
          <button
            onClick={checkAll}
            className="btn btn-ghost btn-xs gap-1 font-bold uppercase tracking-tighter hover:bg-base-content/10 text-base-content"
          >
            <FiRefreshCw className="w-3" /> Refresh Statuses
          </button>
        </div>
      </div>
    </div>
  );
}
