import {
  FiSettings,
  FiTrash2,
  FiClock,
  FiShield,
  FiInfo,
  FiChevronLeft,
  FiPackage,
  FiSave,
  FiRefreshCw,
  FiLock,
  FiAlertTriangle,
  FiFolder,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { IntroPage } from "../setup/intro/IntroPage";

type SettingsPageProps = {
  systemReport: {
    info: string;
    doctor: string;
    packageManager: string;
  } | null;
  isRefreshingSystemReport?: boolean;
  onRefreshSystemReport: () => Promise<void>;
  onBack: () => void;
  onReSetup: () => void;
  onClearLogs: () => Promise<void>;
  onRunCommand: (command: string, args: Record<string, any>) => Promise<void>;
  showToast: (
    message: string,
    type: "info" | "success" | "error" | "warning",
  ) => void;
  theme: "light" | "dark";
};

export function SettingsPage({
  systemReport,
  isRefreshingSystemReport,
  onRefreshSystemReport,
  onBack,
  onReSetup,
  onClearLogs,
  onRunCommand,
  showToast,
  theme,
}: SettingsPageProps) {
  const [clearing, setClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [availablePMs, setAvailablePMs] = useState<string[]>([]);
  const [selectedPM, setSelectedPM] = useState<string>("");
  const [updatingPM, setUpdatingPM] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [showLegalViewer, setShowLegalViewer] = useState(false);
  const [defaultParentDir, setDefaultParentDir] = useState<string>(
    localStorage.getItem("ns-forge-default-parent-dir") || "",
  );

  const handleBrowseDefaultDir = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: "Select Default Project Parent Directory",
      });

      if (selected && typeof selected === "string") {
        setDefaultParentDir(selected);
        localStorage.setItem("ns-forge-default-parent-dir", selected);
        showToast("Default parent directory updated.", "success");
      }
    } catch (err) {
      console.error("Failed to select directory:", err);
      showToast("Failed to select directory.", "error");
    }
  };

  const handleClearDefaultDir = () => {
    setDefaultParentDir("");
    localStorage.removeItem("ns-forge-default-parent-dir");
    showToast("Default parent directory cleared.", "info");
  };

  useEffect(() => {
    async function loadAvailablePMs() {
      setDetecting(true);
      try {
        const pms = await invoke<string[]>("detect_available_package_managers");
        setAvailablePMs(pms);
      } catch (err) {
        console.error("Failed to detect package managers:", err);
      } finally {
        setDetecting(false);
      }
    }
    loadAvailablePMs();
  }, []);

  // Sync selected PM when system report changes (e.g. after saving)
  useEffect(() => {
    const currentPMText = systemReport?.packageManager?.trim() || "";
    const match = currentPMText.match(/(npm|yarn|pnpm|bun)/i);
    if (match) {
      setSelectedPM(match[1].toLowerCase());
    }
  }, [systemReport]);

  const handleUpdatePM = async () => {
    if (!selectedPM) return;
    setUpdatingPM(true);
    try {
      await onRunCommand("set_ns_package_manager", { pm: selectedPM });
      setUpdatingPM(false);
      showToast(
        `Default package manager set to ${selectedPM.toUpperCase()}`,
        "success",
      );
      // Refresh system report in background to update the "Currently: ..." display
      await onRefreshSystemReport();
    } catch (err) {
      console.error("Failed to update package manager:", err);
      showToast(`Failed to update package manager: ${err}`, "error");
      setUpdatingPM(false);
    }
  };

  const handleClearLogs = () => {
    setShowConfirmModal(true);
  };

  const confirmClearLogs = async () => {
    setShowConfirmModal(false);
    setClearing(true);
    try {
      await onClearLogs();
      showToast("Activity logs have been cleared successfully.", "success");
    } catch (err) {
      console.error("Failed to clear logs:", err);
      showToast("Failed to clear logs.", "error");
    } finally {
      setClearing(false);
    }
  };

  const handleResetApp = async () => {
    setResetting(true);
    try {
      // 1. Clear all localStorage
      localStorage.clear();

      // 2. Clear activity logs via API
      await onClearLogs();

      showToast("Application has been reset successfully.", "success");

      // 3. Force reload the app to trigger initial setup flow
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Failed to reset app:", err);
      showToast("Failed to reset application.", "error");
      setResetting(false);
      setShowResetModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm btn-circle"
          title="Go Back"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FiSettings className="text-primary" />
          Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Project Creation Section */}
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="p-6 border-b border-base-200 bg-base-200/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiPlus className="text-primary" />
                Project Creation
              </h2>
              <p className="text-sm opacity-60 mt-1">
                Customize default values for new project creation.
              </p>
            </div>

            <div className="p-6">
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-bold text-sm mb-1">
                    Default Parent Directory
                  </h3>
                  <p className="text-xs opacity-50 leading-relaxed mb-4">
                    The directory where new NativeScript projects will be
                    created by default.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-base-200 rounded-xl border border-base-300 overflow-hidden group">
                      <FiFolder className="text-primary shrink-0" />
                      <span
                        className={`text-sm truncate flex-1 ${!defaultParentDir ? "opacity-30 italic" : ""}`}
                        title={defaultParentDir}
                      >
                        {defaultParentDir || "No default directory selected"}
                      </span>
                      {defaultParentDir && (
                        <button
                          onClick={handleClearDefaultDir}
                          className="btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Clear Default"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleBrowseDefaultDir}
                      className="btn btn-primary btn-sm rounded-xl px-6 gap-2"
                    >
                      <FiSearch className="w-3.5 h-3.5" />
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Privacy Section */}
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="p-6 border-b border-base-200 bg-base-200/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiShield className="text-primary" />
                Legal & Privacy
              </h2>
              <p className="text-sm opacity-60 mt-1">
                Review our terms of service and privacy policy.
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between gap-8">
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">Legal Agreements</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-success badge-sm gap-1.5 font-bold py-3 px-4">
                      <FiLock className="w-3 h-3" />
                      Agreed on Setup
                    </span>
                    <p className="text-xs opacity-50 leading-relaxed">
                      You have accepted our Privacy Policy and Terms &
                      Conditions.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLegalViewer(!showLegalViewer)}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <FiInfo className="w-3.5 h-3.5" />
                  {showLegalViewer ? "Hide Documents" : "View Documents"}
                </button>
              </div>

              {showLegalViewer && (
                <div className="mt-8 pt-8 border-t border-base-200 animate-in slide-in-from-top duration-300">
                  <IntroPage theme={theme} onAgree={() => {}} readOnly={true} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NativeScript Configuration Section */}
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="p-6 border-b border-base-200 bg-base-200/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiPackage className="text-primary" />
                NativeScript Configuration
              </h2>
              <p className="text-sm opacity-60 mt-1">
                Configure global NativeScript CLI settings.
              </p>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">
                    Default Package Manager
                  </h3>
                  <p className="text-xs opacity-50 leading-relaxed">
                    Choose which package manager NativeScript should use for
                    installing dependencies and running commands.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">
                      Currently:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="badge badge-sm badge-ghost font-bold text-[10px] uppercase">
                        {(() => {
                          const pm = systemReport?.packageManager?.trim() || "";
                          const match = pm.match(/(npm|yarn|pnpm|bun)/i);
                          return match ? match[1] : "...";
                        })()}
                      </span>
                      {isRefreshingSystemReport && (
                        <span className="loading loading-spinner loading-[10px] opacity-40"></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="form-control">
                    <div className="relative">
                      <select
                        className={`select select-bordered select-sm w-full sm:w-40 rounded-xl focus:select-primary transition-all ${detecting ? "opacity-50" : ""}`}
                        value={selectedPM}
                        onChange={(e) => setSelectedPM(e.target.value)}
                        disabled={updatingPM || detecting}
                      >
                        <option value="" disabled>
                          {detecting ? "Detecting..." : "Select PM"}
                        </option>
                        {availablePMs.map((pm) => (
                          <option key={pm} value={pm}>
                            {pm.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      {detecting && (
                        <span className="loading loading-spinner loading-xs absolute right-9 top-1/2 -translate-y-1/2 opacity-40"></span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleUpdatePM}
                    disabled={updatingPM || !selectedPM || detecting}
                    className="btn btn-primary btn-sm rounded-xl px-6 gap-2 min-w-[160px]"
                  >
                    {updatingPM ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FiSave className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs Section */}
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="p-6 border-b border-base-200 bg-base-200/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiClock className="text-primary" />
                Activity Management
              </h2>
              <p className="text-sm opacity-60 mt-1">
                Manage your activity logs and report data.
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between gap-8">
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">
                    Clear Activity Logs
                  </h3>
                  <p className="text-xs opacity-50 leading-relaxed">
                    This will permanently delete all records of your activities,
                    including build history, run history, and navigation logs
                    shown on the home page.
                  </p>
                </div>
                <button
                  onClick={handleClearLogs}
                  disabled={clearing}
                  className={`btn btn-error btn-sm gap-2 ${clearing ? "loading" : ""}`}
                >
                  {!clearing && <FiTrash2 className="w-3.5 h-3.5" />}
                  Clear All Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Setup Section */}
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="p-6 border-b border-base-200 bg-base-200/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiRefreshCw className="text-primary" />
                System Environment
              </h2>
              <p className="text-sm opacity-60 mt-1">
                Re-run the environment setup wizard if needed.
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between gap-8">
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">
                    Environment Setup Wizard
                  </h3>
                  <p className="text-xs opacity-50 leading-relaxed">
                    If you want to re-check or re-configure your NativeScript
                    development environment (Node.js, JDK, Android SDK), you can
                    trigger the setup wizard manually here.
                  </p>
                </div>
                <button
                  onClick={onReSetup}
                  className="btn btn-outline btn-primary btn-sm gap-2"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  Re-run Setup
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* App Info Section */}
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="p-6 border-b border-base-200 bg-base-200/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiInfo className="text-primary" />
                Application Information
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-60">Version</span>
                <span className="font-mono font-bold">0.1.0</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-base-200 pt-4">
                <span className="opacity-60">Environment</span>
                <span className="badge badge-primary badge-outline font-mono text-[10px]">
                  Development
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-base-200 pt-4">
                <span className="opacity-60">Database</span>
                <span className="flex items-center gap-2">
                  <FiShield className="text-success w-3 h-3" />
                  SQLite (nsforge.db)
                </span>
              </div>
              <div className="pt-6 border-t border-base-200">
                <button
                  onClick={() => setShowResetModal(true)}
                  className="btn btn-outline btn-error btn-sm w-full gap-2"
                >
                  <FiAlertTriangle className="w-3.5 h-3.5" />
                  Reset Application to Factory Settings
                </button>
                <p className="text-[10px] text-error opacity-60 mt-2 text-center">
                  Warning: This will clear all settings, agreements, and logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center opacity-20 text-[10px] uppercase tracking-[0.2em] font-bold">
        NativeScript Forge &bull; Built with Tauri & React
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal modal-open">
          <div className="modal-box border border-base-300 shadow-2xl">
            <h3 className="font-bold text-lg flex items-center gap-2 text-error">
              <FiTrash2 />
              Confirm Clear Logs
            </h3>
            <p className="py-4 text-sm opacity-70">
              Are you sure you want to clear all activity logs? This action
              cannot be undone and will permanently delete all history records.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm"
                onClick={confirmClearLogs}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setShowConfirmModal(false)}
          ></div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal modal-open">
          <div className="modal-box border-2 border-error shadow-2xl">
            <h3 className="font-bold text-lg flex items-center gap-2 text-error">
              <FiAlertTriangle />
              Critical: Factory Reset
            </h3>
            <div className="py-4 space-y-3">
              <p className="text-sm font-bold">
                Are you absolutely sure you want to reset the application?
              </p>
              <p className="text-xs opacity-70 leading-relaxed">
                This action will:
              </p>
              <ul className="list-disc list-inside text-xs opacity-70 space-y-1 ml-2">
                <li>Remove all legal agreement flags</li>
                <li>Clear all environment setup test results</li>
                <li>Delete all activity logs and history</li>
                <li>Reset all application configurations</li>
              </ul>
              <p className="text-xs font-bold text-error mt-4">
                The application will restart and you will need to complete the
                setup from the beginning.
              </p>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => !resetting && setShowResetModal(false)}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                className={`btn btn-error btn-sm gap-2 ${resetting ? "loading" : ""}`}
                onClick={handleResetApp}
                disabled={resetting}
              >
                {resetting ? "Resetting..." : "Yes, Reset Everything"}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/60"
            onClick={() => !resetting && setShowResetModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
}
