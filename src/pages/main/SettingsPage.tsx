import {
  FiSettings,
  FiTrash2,
  FiClock,
  FiShield,
  FiInfo,
  FiChevronLeft,
} from "react-icons/fi";
import Database from "@tauri-apps/plugin-sql";
import { useState } from "react";

type SettingsPageProps = {
  db: Database | null;
  onBack: () => void;
  onClearLogs: () => Promise<void>;
  showToast: (
    message: string,
    type: "info" | "success" | "error" | "warning",
  ) => void;
};

export function SettingsPage({
  db,
  onBack,
  onClearLogs,
  showToast,
}: SettingsPageProps) {
  const [clearing, setClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    </div>
  );
}
