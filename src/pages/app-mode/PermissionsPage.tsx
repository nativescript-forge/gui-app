import { useState, useEffect } from "react";
import {
  FiShield,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
  FiSave,
  FiInfo,
  FiCheckCircle,
  FiX,
  FiActivity,
  FiExternalLink,
  FiRefreshCw,
  FiTerminal,
  FiFileText,
  FiEye,
  FiRotateCcw,
  FiAlertCircle,
} from "react-icons/fi";
import { FaCode } from "react-icons/fa";
import { SiAndroid, SiApple } from "react-icons/si";
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import masterPermissions from "../../data/permissions_master.json";

interface PermissionsPageProps {
  projectPath: string;
  showToast: (
    message: string,
    type: "info" | "success" | "error" | "warning",
  ) => void;
}

export function PermissionsPage({
  projectPath,
  showToast,
}: PermissionsPageProps) {
  const [activePlatform, setActivePlatform] = useState<"android" | "ios">(
    "android",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Current permissions in files
  const [androidPermissions, setAndroidPermissions] = useState<string[]>([]);
  const [iosPermissions, setIosPermissions] = useState<Record<string, string>>(
    {},
  );

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(
    null,
  );
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Backup logic state
  const [backups, setBackups] = useState<
    { path: string; timestamp: string; type: "android" | "ios" | "visionos" }[]
  >([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [deleteBackupConfirm, setDeleteBackupConfirm] = useState<{
    item:
      | {
          path: string;
          timestamp: string;
          type: "android" | "ios" | "visionos";
        }
      | "all";
    files: string[];
    fullPath: string;
    selectedFile?: string;
    selectedFileContent?: string;
  } | null>(null);

  const [restoreBackupConfirm, setRestoreBackupConfirm] = useState<{
    item: {
      path: string;
      timestamp: string;
      type: "android" | "ios" | "visionos";
    };
    files: string[];
    fullPath: string;
    selectedFile?: string;
    selectedFileContent?: string;
  } | null>(null);

  useEffect(() => {
    loadPermissions();
    loadBackups();
  }, [projectPath]);

  const loadBackups = async () => {
    if (!projectPath) return;
    try {
      const backupDir = await join(
        projectPath,
        ".nsforge",
        "backups",
        "permissions",
      );
      const exists = await invoke<boolean>("path_exists", { path: backupDir });
      if (!exists) {
        setBackups([]);
        return;
      }

      const types = ["android", "ios", "visionos"];
      let allBackups: {
        path: string;
        timestamp: string;
        type: "android" | "ios" | "visionos";
      }[] = [];

      for (const type of types) {
        const typeDir = await join(backupDir, type);
        if (await invoke<boolean>("path_exists", { path: typeDir })) {
          const folders = await invoke<string[]>("read_dir", { path: typeDir });
          folders.forEach((f) => {
            allBackups.push({
              path: f,
              timestamp: f,
              type: type as "android" | "ios" | "visionos",
            });
          });
        }
      }
      setBackups(
        allBackups.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
      );
    } catch (e) {
      console.error("Failed to load backups:", e);
    }
  };

  const prepareRestoreBackup = async (item: {
    path: string;
    timestamp: string;
    type: "android" | "ios" | "visionos";
  }) => {
    if (!projectPath) return;
    try {
      const path = await join(
        projectPath,
        ".nsforge",
        "backups",
        "permissions",
        item.type,
        item.timestamp,
      );
      const files = await invoke<string[]>("read_dir", { path });

      let firstFileContent = "";
      if (files.length > 0) {
        const filePath = await join(path, files[0]);
        firstFileContent = await invoke<string>("read_text_file", {
          path: filePath,
        });
      }

      setRestoreBackupConfirm({
        item,
        files,
        fullPath: path,
        selectedFile: files[0],
        selectedFileContent: firstFileContent,
      });
    } catch (e) {
      showToast(`Failed to prepare restore: ${e}`, "error");
    }
  };

  const confirmRestoreBackup = async () => {
    if (!projectPath || !restoreBackupConfirm) return;
    setLoadingBackups(true);
    const item = restoreBackupConfirm.item;
    try {
      const foundPath = await join(
        projectPath,
        ".nsforge",
        "backups",
        "permissions",
        item.type,
        item.timestamp,
      );

      if (!foundPath) throw new Error("Backup files not found");

      const backupFiles = await invoke<string[]>("read_dir", {
        path: foundPath,
      });

      for (const file of backupFiles) {
        const src = await join(foundPath, file);
        let dest = "";
        if (item.type === "android") {
          dest = await join(
            projectPath,
            "App_Resources",
            "Android",
            "src",
            "main",
            file,
          );
        } else if (item.type === "ios") {
          dest = await join(projectPath, "App_Resources", "iOS", file);
        } else if (item.type === "visionos") {
          dest = await join(projectPath, "App_Resources", "visionOS", file);
        } else {
          dest = await join(projectPath, file);
        }

        await invoke("copy_file", {
          src,
          dest,
        });
      }

      setRestoreBackupConfirm(null);
      await loadPermissions();
      showToast("Restore complete! Permissions reloaded.", "success");
    } catch (e) {
      showToast(`Restore failed: ${e}`, "error");
    } finally {
      setLoadingBackups(false);
    }
  };

  const restoreFilePreview = async (fileName: string) => {
    if (!projectPath || !restoreBackupConfirm) return;
    try {
      const filePath = await join(restoreBackupConfirm.fullPath, fileName);
      const content = await invoke<string>("read_text_file", {
        path: filePath,
      });
      setRestoreBackupConfirm((prev) =>
        prev
          ? {
              ...prev,
              selectedFile: fileName,
              selectedFileContent: content,
            }
          : null,
      );
    } catch (e) {
      showToast(`Failed to load file preview: ${e}`, "error");
    }
  };

  const prepareDeleteBackup = async (
    item:
      | {
          path: string;
          timestamp: string;
          type: "android" | "ios" | "visionos";
        }
      | "all",
  ) => {
    if (!projectPath) return;
    try {
      if (item === "all") {
        const fullPath = await join(
          projectPath,
          ".nsforge",
          "backups",
          "permissions",
        );
        setDeleteBackupConfirm({
          item: "all",
          files: ["ALL BACKUP HISTORY"],
          fullPath,
        });
      } else {
        const path = await join(
          projectPath,
          ".nsforge",
          "backups",
          "permissions",
          item.type,
          item.timestamp,
        );
        const files = await invoke<string[]>("read_dir", { path });

        let firstFileContent = "";
        if (files.length > 0) {
          const filePath = await join(path, files[0]);
          firstFileContent = await invoke<string>("read_text_file", {
            path: filePath,
          });
        }

        setDeleteBackupConfirm({
          item,
          files,
          fullPath: path,
          selectedFile: files[0],
          selectedFileContent: firstFileContent,
        });
      }
    } catch (e) {
      showToast(`Failed to prepare deletion: ${e}`, "error");
    }
  };

  const confirmDeleteBackup = async () => {
    if (!projectPath || !deleteBackupConfirm) return;
    setLoadingBackups(true);
    try {
      if (deleteBackupConfirm.item === "all") {
        const path = await join(
          projectPath,
          ".nsforge",
          "backups",
          "permissions",
        );
        await invoke("remove_dir", { path });
      } else {
        const path = await join(
          projectPath,
          ".nsforge",
          "backups",
          "permissions",
          deleteBackupConfirm.item.type,
          deleteBackupConfirm.item.timestamp,
        );
        await invoke("remove_dir", { path });
      }
      setDeleteBackupConfirm(null);
      if (deleteBackupConfirm.item === "all") {
        setBackups([]);
      } else {
        loadBackups();
      }
      showToast("Backup deleted successfully!", "success");
    } catch (e) {
      showToast(`Delete failed: ${e}`, "error");
    } finally {
      setLoadingBackups(false);
    }
  };

  const previewFile = async (fileName: string) => {
    if (
      !projectPath ||
      !deleteBackupConfirm ||
      deleteBackupConfirm.item === "all"
    )
      return;
    try {
      const path = await join(
        projectPath,
        ".nsforge",
        "backups",
        "permissions",
        deleteBackupConfirm.item.type,
        deleteBackupConfirm.item.timestamp,
        fileName,
      );
      const content = await invoke<string>("read_text_file", { path });
      setDeleteBackupConfirm({
        ...deleteBackupConfirm,
        selectedFile: fileName,
        selectedFileContent: content,
      });
    } catch (e) {
      showToast(`Failed to read file: ${e}`, "error");
    }
  };

  const loadPermissions = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const android = await invoke<string[]>("get_android_permissions", {
        projectPath,
      });
      const ios = await invoke<Record<string, string>>("get_ios_permissions", {
        projectPath,
      });
      setAndroidPermissions(android);
      setIosPermissions(ios);
    } catch (err) {
      console.error("Failed to load permissions:", err);
      showToast("Failed to load permissions from files", "error");
    } finally {
      setLoading(false);
    }
  };

  const masterData =
    activePlatform === "android"
      ? masterPermissions.android_permissions
      : masterPermissions.ios_permissions;

  const filteredMaster = masterData.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentPlatformPermissions =
    activePlatform === "android"
      ? androidPermissions
      : Object.keys(iosPermissions);

  const openAddModal = () => {
    setSearchQuery("");
    setShowAddModal(true);
  };

  const handleAddPermission = async (permissionName: string) => {
    if (activePlatform === "android") {
      if (androidPermissions.includes(permissionName)) {
        showToast("Permission already exists", "warning");
        return;
      }
      const newPermissions = [...androidPermissions, permissionName];
      setAndroidPermissions(newPermissions);
    } else {
      if (iosPermissions[permissionName]) {
        showToast("Permission already exists", "warning");
        return;
      }
      const master = masterPermissions.ios_permissions.find(
        (p) => p.name === permissionName,
      );
      setIosPermissions({
        ...iosPermissions,
        [permissionName]: master?.description || "Access requested.",
      });
    }
    setShowAddModal(false);
    showToast("Permission added to list (unsaved)", "info");
  };

  const confirmDelete = (name: string) => {
    const master = masterData.find((p) => p.name === name);
    if (master?.sensitivity === "high") {
      setPermissionToDelete(name);
      setShowDeleteModal(true);
    } else {
      deletePermission(name);
    }
  };

  const deletePermission = (name: string) => {
    if (activePlatform === "android") {
      setAndroidPermissions(androidPermissions.filter((p) => p !== name));
    } else {
      const newIos = { ...iosPermissions };
      delete newIos[name];
      setIosPermissions(newIos);
    }
    setShowDeleteModal(false);
    showToast("Permission removed from list (unsaved)", "info");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (activePlatform === "android") {
        await invoke("save_android_permissions", {
          projectPath,
          permissions: androidPermissions,
        });
      } else {
        await invoke("save_ios_permissions", {
          projectPath,
          permissions: iosPermissions,
        });
      }
      showToast(
        "Permissions saved successfully with backup created",
        "success",
      );
      setShowPreviewModal(false);
      await loadPermissions();
      loadBackups();
    } catch (err) {
      console.error("Failed to save permissions:", err);
      showToast(`Failed to save: ${err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const getSensitivityColor = (s: string) => {
    switch (s) {
      case "high":
        return "text-error bg-error/10";
      case "medium":
        return "text-warning bg-warning/10";
      default:
        return "text-success bg-success/10";
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="text-3xl font-extrabold flex items-center gap-3">
            <FiShield className="text-primary" />
            Permissions
          </div>
          <div className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Manage{" "}
            {activePlatform === "android"
              ? "Android Manifest"
              : "iOS Info.plist"}{" "}
            properties
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPermissions}
            className={`btn btn-ghost btn-sm gap-2 ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {!loading && <FiRefreshCw className="w-4 h-4" />} Reload
          </button>
          <button
            onClick={() => setShowPreviewModal(true)}
            className={`btn btn-primary btn-sm gap-2 shadow-lg shadow-primary/20 ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {!loading && <FiSave className="w-4 h-4" />} Save Changes
          </button>
          <button
            onClick={openAddModal}
            className="btn btn-secondary text-white btn-sm gap-2 shadow-lg shadow-secondary/20"
          >
            <FiPlus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActivePlatform("android")}
              className={`btn btn-sm justify-start gap-3 ${
                activePlatform === "android" ? "btn-primary" : "btn-ghost"
              }`}
            >
              <SiAndroid className="w-4 h-4" /> Android
            </button>
            <button
              onClick={() => setActivePlatform("ios")}
              className={`btn btn-sm justify-start gap-3 ${
                activePlatform === "ios" ? "btn-primary" : "btn-ghost"
              }`}
            >
              <SiApple className="w-4 h-4" /> iOS
            </button>

            <div className="divider my-4"></div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/40 px-3">
                Resources
              </h3>
              <a
                href={
                  activePlatform === "android"
                    ? "https://developer.android.com/guide/topics/permissions/overview"
                    : "https://developer.apple.com/documentation/bundleresources/protected-resources"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm w-full justify-start gap-3 group px-3"
              >
                <FiExternalLink className="w-4 h-4 text-base-content/30 group-hover:text-primary transition-colors" />
                <span className="text-xs font-bold text-base-content/60 group-hover:text-primary transition-colors">
                  Official Docs
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="card bg-base-100 border border-base-200 shadow-sm min-h-[500px]">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <FiActivity className="text-primary w-4 h-4" />
                  Active{" "}
                  {activePlatform === "android"
                    ? "Permissions"
                    : "Usage Descriptions"}
                </h2>
                <span className="badge badge-ghost font-bold py-3">
                  {currentPlatformPermissions.length} Total
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] opacity-30">
                    Reading configuration...
                  </p>
                </div>
              ) : currentPlatformPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-base-200 rounded-3xl flex items-center justify-center mb-4">
                    <FiShield className="w-8 h-8 opacity-10" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-30">
                    No permissions defined
                  </p>
                  <button
                    onClick={openAddModal}
                    className="btn btn-link btn-xs mt-2 text-primary no-underline font-black uppercase tracking-wider text-xs"
                  >
                    Add your first permission
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {currentPlatformPermissions.map((name) => {
                    const master = masterData.find((p) => p.name === name);
                    return (
                      <div
                        key={name}
                        className="group bg-base-200/30 rounded-2xl p-4 border border-base-content/5 hover:border-primary/20 transition-all hover:shadow-md relative overflow-hidden"
                      >
                        {/* Status indicator on the left */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 ${
                            master?.sensitivity === "high"
                              ? "bg-error/50"
                              : master?.sensitivity === "medium"
                                ? "bg-warning/50"
                                : "bg-success/50"
                          }`}
                        />

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <div className="text-sm font-bold text-base-content break-words leading-tight mb-1.5">
                                {name}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {master && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getSensitivityColor(
                                      master.sensitivity,
                                    )}`}
                                  >
                                    {master.sensitivity}
                                  </span>
                                )}
                                {master?.added_in && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-base-300 text-base-content/60">
                                    {activePlatform === "android"
                                      ? "SDK"
                                      : "iOS"}{" "}
                                    {master.added_in}+
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-base-content/60 leading-relaxed italic">
                              {activePlatform === "android"
                                ? master?.description || "Custom permission"
                                : iosPermissions[name] ||
                                  "No description provided"}
                            </p>
                          </div>
                          <button
                            onClick={() => confirmDelete(name)}
                            className="btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tips/Info section matching ProjectConfig style */}
          <div className="mt-6 p-6 bg-base-200/50 rounded-3xl border border-base-content/5 flex gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl h-fit">
              <FiInfo className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-base-content">
                Platform Tip
              </h4>
              <p className="text-xs text-base-content/60 leading-relaxed">
                {activePlatform === "android"
                  ? "Permissions are declared in AndroidManifest.xml. High sensitivity permissions might require user consent at runtime."
                  : "iOS requires clear 'Usage Description' strings in Info.plist. App Store reviewers check these carefully."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-10 mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                Backup History
              </div>
              {backups.length > 0 && (
                <div className="badge badge-xs badge-ghost opacity-40 font-black">
                  {backups.length}
                </div>
              )}
            </div>
            {backups.length > 0 && (
              <button
                className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-2 font-black"
                onClick={() => prepareDeleteBackup("all")}
              >
                <FiTrash2 className="w-3 h-3" /> DELETE ALL
              </button>
            )}
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden mb-8">
            <table className="table table-md">
              <thead className="bg-base-200/50">
                <tr>
                  <th className="text-[10px] font-black uppercase">
                    Timestamp
                  </th>
                  <th className="text-[10px] font-black uppercase">Type</th>
                  <th className="text-[10px] font-black uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center py-8 opacity-30 text-xs italic"
                    >
                      No backups found. They are created automatically when you
                      save permissions.
                    </td>
                  </tr>
                ) : (
                  backups.map((b, i) => {
                    const formatTimestamp = (ts: string) => {
                      try {
                        const parts = ts.split("T");
                        if (parts.length === 2) {
                          const datePart = parts[0];
                          const timePart = parts[1].replace("Z", "");
                          const t = timePart.split("-");
                          if (t.length >= 3) {
                            const iso = `${datePart}T${t[0]}:${t[1]}:${t[2]}${t[3] ? "." + t[3] : ""}Z`;
                            const d = new Date(iso);
                            if (d.toString() !== "Invalid Date") {
                              const day = d.getDate();
                              const month = d.toLocaleString("en-GB", {
                                month: "short",
                              });
                              const year = d.getFullYear();
                              const time = d
                                .toLocaleString("en-GB", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: true,
                                })
                                .toUpperCase();
                              return `${day} ${month} ${year}, ${time}`;
                            }
                          }
                        }
                        return ts;
                      } catch (e) {
                        return ts;
                      }
                    };

                    return (
                      <tr
                        key={i}
                        className="hover:bg-base-200/30 transition-colors group"
                      >
                        <td className="font-mono text-xs opacity-60">
                          {formatTimestamp(b.timestamp)}
                        </td>
                        <td>
                          <span
                            className={`badge badge-xs text-[8px] font-black badge-ghost`}
                          >
                            {b.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-right flex items-center justify-end gap-1">
                          <button
                            className="btn btn-ghost btn-xs gap-2 hover:bg-warning/10 hover:text-warning"
                            onClick={() => prepareRestoreBackup(b)}
                            disabled={loadingBackups}
                            title="Restore this backup"
                          >
                            <FiRefreshCw className="w-3 h-3" />
                            Restore
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => prepareDeleteBackup(b)}
                            disabled={loadingBackups}
                            title="Delete this backup"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Permission Modal */}
      {showAddModal && (
        <div className="modal modal-open bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="modal-box w-11/12 max-w-2xl bg-base-100 rounded-[3rem] p-0 overflow-hidden border border-base-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-base-200 flex items-center justify-between bg-base-200/30">
              <div>
                <h3 className="text-xl font-black text-base-content flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <FiPlus className="w-5 h-5 text-primary" />
                  </div>
                  Add{" "}
                  {activePlatform === "android"
                    ? "Permission"
                    : "Usage Description"}
                </h3>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-base-content/30 mt-2 ml-12">
                  Choose from master database
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-ghost btn-circle btn-sm hover:bg-base-300 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="relative mb-8">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  className="input w-full pl-14 py-8 rounded-[1.5rem] bg-base-200/50 focus:bg-base-100 transition-all border-2 border-transparent focus:border-primary/20 text-base font-medium shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {filteredMaster.length === 0 ? (
                  <div className="text-center py-10 opacity-30">
                    <FiSearch className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-[11px] font-black uppercase tracking-widest">
                      No results found
                    </p>
                  </div>
                ) : (
                  filteredMaster.map((p) => {
                    const isAdded =
                      activePlatform === "android"
                        ? androidPermissions.includes(p.name)
                        : !!iosPermissions[p.name];

                    return (
                      <div
                        key={p.name}
                        className={`group p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between gap-4 ${
                          isAdded
                            ? "bg-base-200/50 opacity-60 border-transparent"
                            : "bg-base-100 border-base-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-2">
                            <div className="text-sm font-black text-base-content break-words leading-tight mb-1.5">
                              {p.name}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${getSensitivityColor(p.sensitivity)}`}
                              >
                                {p.sensitivity}
                              </span>
                              {p.added_in && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-base-200 text-base-content/60">
                                  {activePlatform === "android" ? "SDK" : "iOS"}{" "}
                                  {p.added_in}+
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-base-content/50 leading-relaxed italic line-clamp-2">
                            {p.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddPermission(p.name)}
                          disabled={isAdded}
                          className={`btn btn-circle transition-all duration-300 ${
                            isAdded
                              ? "btn-ghost text-success"
                              : "btn-primary shadow-xl shadow-primary/20 hover:scale-110"
                          }`}
                        >
                          {isAdded ? (
                            <FiCheckCircle className="w-5 h-5" />
                          ) : (
                            <FiPlus className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal modal-open bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="modal-box bg-base-100 rounded-[2.5rem] p-8 border-2 border-error/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-error/10 rounded-2xl flex items-center justify-center">
                <FiAlertTriangle className="w-8 h-8 text-error animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-error">
                  Sensitive Permission
                </h3>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-error/40 mt-1">
                  Security Warning
                </p>
              </div>
            </div>

            <div className="bg-error/5 rounded-2xl p-6 mb-8 border border-error/10">
              <p className="text-sm font-bold text-base-content/80 leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="text-error font-black px-2 py-0.5 bg-error/10 rounded-md">
                  {permissionToDelete}
                </span>
                ?
              </p>
              <p className="text-xs text-base-content/50 leading-relaxed mt-4 italic border-t border-error/10 pt-4">
                Removing high-sensitivity permissions may break certain
                application features that rely on this access.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                className="btn btn-ghost flex-1 rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-base-200"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error flex-[1.5] rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-error/20"
                onClick={() =>
                  permissionToDelete && deletePermission(permissionToDelete)
                }
              >
                Yes, Remove Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview & Save Modal */}
      {showPreviewModal && (
        <div className="modal modal-open bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="modal-box w-11/12 max-w-xl bg-base-100 rounded-[3rem] p-0 overflow-hidden border border-base-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-base-200 bg-base-200/30 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-base-content flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-xl">
                    <FiSave className="w-5 h-5 text-success" />
                  </div>
                  Preview Changes
                </h3>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-base-content/30 mt-2 ml-12">
                  Reviewing updates for{" "}
                  {activePlatform === "android"
                    ? "AndroidManifest.xml"
                    : "Info.plist"}
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="btn btn-ghost btn-circle btn-sm hover:bg-base-300 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="bg-base-200/50 rounded-[2rem] p-6 mb-8 border border-base-content/5 shadow-inner">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-base-content/30">
                      Target File
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-success bg-success/10 px-4 py-1.5 rounded-full border border-success/20">
                    {activePlatform === "android"
                      ? "AndroidManifest.xml"
                      : "Info.plist"}
                  </span>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-3 custom-scrollbar">
                  {activePlatform === "android"
                    ? androidPermissions.map((p) => (
                        <div
                          key={p}
                          className="text-xs font-mono text-base-content/70 py-3 px-4 bg-base-100 rounded-xl border border-base-content/5 flex items-center gap-3"
                        >
                          <span className="text-success font-bold">+</span>
                          <span className="opacity-50">uses-permission:</span>
                          <span className="font-bold">{p}</span>
                        </div>
                      ))
                    : Object.entries(iosPermissions).map(([k, v]) => (
                        <div
                          key={k}
                          className="text-xs font-mono text-base-content/70 py-3 px-4 bg-base-100 rounded-xl border border-base-content/5"
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-success font-bold">+</span>
                            <span className="font-bold text-primary">{k}</span>
                          </div>
                          <p className="pl-6 opacity-60 text-xs leading-relaxed italic">
                            {v}
                          </p>
                        </div>
                      ))}
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-warning/5 rounded-2xl border border-warning/10 mb-8">
                <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center shrink-0">
                  <FiAlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <p className="text-xs font-bold text-warning/80 leading-relaxed uppercase tracking-wider">
                  Backup of existing files will be created automatically before
                  saving.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  className="btn btn-ghost flex-1 rounded-2xl font-black uppercase tracking-wider text-xs"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-[2] rounded-2xl font-black uppercase tracking-wider text-xs shadow-2xl shadow-primary/30 gap-3 group"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Apply and Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup & Preview Modal */}
      {restoreBackupConfirm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl bg-base-100 border border-base-200 p-0 overflow-hidden shadow-2xl flex flex-col h-[700px]">
            {/* Modal Header */}
            <div className="bg-base-200/80 p-6 flex items-center justify-between border-b border-base-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 text-warning rounded-xl scale-110 shadow-sm border border-warning/10">
                  <FiRotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">
                    Confirm Restoration
                  </h3>
                  <div className="flex items-center gap-2 opacity-50 font-mono text-[9px] mt-1 bg-base-300/50 px-2 py-1 rounded border border-base-300">
                    <FiTerminal className="w-3 h-3" />
                    <span className="truncate max-w-md">
                      {restoreBackupConfirm.fullPath}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-circle btn-sm hover:rotate-90 transition-transform"
                onClick={() => setRestoreBackupConfirm(null)}
              >
                <FiX />
              </button>
            </div>

            {/* Split View Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Vertical Tabs (File List) */}
              <div className="w-80 border-r border-base-300 bg-base-200/40 flex flex-col">
                <div className="px-5 py-4 border-b border-base-300 bg-base-200/20 flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    File List
                  </div>
                  <div className="badge badge-warning badge-xs font-black px-1.5 py-2">
                    {restoreBackupConfirm.files.length}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-3 space-y-1.5 custom-scrollbar">
                  {restoreBackupConfirm.files.map((file, idx) => (
                    <button
                      key={idx}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all relative overflow-hidden group ${
                        restoreBackupConfirm.selectedFile === file
                          ? "bg-warning text-white shadow-lg shadow-warning/30"
                          : "hover:bg-base-300 opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => restoreFilePreview(file)}
                    >
                      <div className="relative z-10 flex items-center gap-3 w-full">
                        <FiFileText
                          className={`w-4 h-4 shrink-0 ${restoreBackupConfirm.selectedFile === file ? "text-white" : "text-warning"}`}
                        />
                        <span className="text-xs font-bold truncate flex-1">
                          {file}
                        </span>
                        {restoreBackupConfirm.selectedFile === file && (
                          <FiEye className="w-3 h-3 animate-pulse" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Content Preview */}
              <div className="flex-1 bg-[#121212] overflow-hidden flex flex-col">
                <div className="px-6 py-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Preview Area
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/20">
                    UTF-8
                  </span>
                </div>

                {restoreBackupConfirm.selectedFileContent ? (
                  <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed custom-scrollbar bg-black/20">
                    <pre className="text-warning/80 whitespace-pre-wrap break-all">
                      {restoreBackupConfirm.selectedFileContent}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-white">
                    <FiFileText className="w-16 h-16 mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">
                      Select a file to preview
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Always Sticky) */}
            <div className="p-8 bg-base-200/60 border-t border-base-300 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                  <FiAlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-warning mb-0.5">
                    Restore Action
                  </p>
                  <p className="text-[10px] opacity-60 font-medium">
                    This will overwrite your current configuration files.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  className="btn btn-ghost px-10 hover:bg-base-300"
                  onClick={() => setRestoreBackupConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-warning text-white px-10 gap-3 shadow-xl shadow-warning/30 hover:shadow-warning/50 transition-all font-black"
                  onClick={confirmRestoreBackup}
                  disabled={loadingBackups}
                >
                  {loadingBackups ? (
                    <FiRefreshCw className="animate-spin w-4 h-4" />
                  ) : (
                    <FiRotateCcw className="w-4 h-4" />
                  )}
                  RESTORE FILES
                </button>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/70 backdrop-blur-sm transition-all"
            onClick={() => setRestoreBackupConfirm(null)}
          ></div>
        </div>
      )}

      {/* Delete Backup & Preview Modal (Vertical Tab Layout) */}
      {deleteBackupConfirm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl bg-base-100 border border-base-200 p-0 overflow-hidden shadow-2xl flex flex-col h-[700px]">
            {/* Modal Header */}
            <div className="bg-base-200/80 p-6 flex items-center justify-between border-b border-base-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-error/10 text-error rounded-xl scale-110 shadow-sm border border-error/10">
                  <FiTrash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">
                    Confirm Deletion
                  </h3>
                  <div className="flex items-center gap-2 opacity-50 font-mono text-[9px] mt-1 bg-base-300/50 px-2 py-1 rounded border border-base-300">
                    <FiTerminal className="w-3 h-3" />
                    <span className="truncate max-w-md">
                      {deleteBackupConfirm.fullPath}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-circle btn-sm hover:rotate-90 transition-transform"
                onClick={() => setDeleteBackupConfirm(null)}
              >
                <FiX />
              </button>
            </div>

            {/* Split View Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Vertical Tabs (File List) */}
              <div className="w-80 border-r border-base-300 bg-base-200/40 flex flex-col">
                <div className="px-5 py-4 border-b border-base-300 bg-base-200/20 flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    File List
                  </div>
                  <div className="badge badge-primary badge-xs font-black px-1.5 py-2">
                    {deleteBackupConfirm.files.length}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-3 space-y-1.5 custom-scrollbar">
                  {deleteBackupConfirm.files.map((file, idx) => (
                    <button
                      key={idx}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all relative overflow-hidden group ${
                        deleteBackupConfirm.selectedFile === file
                          ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : "hover:bg-base-300 opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => previewFile(file)}
                      disabled={deleteBackupConfirm.item === "all"}
                    >
                      <div className="relative z-10 flex items-center gap-3 w-full">
                        <FiFileText
                          className={`w-4 h-4 shrink-0 ${deleteBackupConfirm.selectedFile === file ? "text-white" : "text-primary"}`}
                        />
                        <span className="text-xs font-bold truncate flex-1">
                          {file}
                        </span>
                        {deleteBackupConfirm.selectedFile === file && (
                          <FiEye className="w-3 h-3 animate-pulse" />
                        )}
                      </div>
                    </button>
                  ))}

                  {deleteBackupConfirm.item === "all" && (
                    <div className="p-8 text-center space-y-4 mt-12 bg-base-100/50 rounded-2xl border border-dashed border-base-300 mx-2">
                      <div className="w-12 h-12 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto">
                        <FiAlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest mb-1">
                          Preview Disabled
                        </p>
                        <p className="text-[10px] opacity-40 font-medium leading-relaxed">
                          Individual file preview is not available for bulk
                          deletion actions.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Content Preview Pane */}
              <div className="flex-1 flex flex-col bg-base-100 relative group">
                <div className="px-6 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/10 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-mono font-bold tracking-tight opacity-70">
                      {deleteBackupConfirm.selectedFile ||
                        "Select a file to preview"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="badge badge-outline badge-xs font-black border-base-300 opacity-40 px-2 py-2 tracking-widest">
                      READ ONLY
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#0d0d0d] p-8 custom-scrollbar">
                  {deleteBackupConfirm.selectedFileContent ? (
                    <div className="relative">
                      {/* Code Background Glow Effects */}
                      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none" />

                      <pre className="text-xs font-mono leading-relaxed text-[#e0e0e0] select-all relative z-10 whitespace-pre-wrap break-all">
                        {deleteBackupConfirm.selectedFileContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                        <FaCode className="w-24 h-24 text-base-300 opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FiInfo className="w-8 h-8 text-primary/20 animate-bounce" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black tracking-[0.2em] opacity-20 mb-2 uppercase">
                          No Content Loaded
                        </p>
                        <p className="text-xs opacity-20 font-medium">
                          Select a file from the list to view its source code
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer (Always Sticky) */}
            <div className="p-8 bg-base-200/60 border-t border-base-300 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                  <FiAlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-error mb-0.5">
                    Destructive Action
                  </p>
                  <p className="text-[10px] opacity-60 font-medium">
                    Are you sure? This backup data will be permanently purged.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  className="btn btn-ghost px-10 hover:bg-base-300"
                  onClick={() => setDeleteBackupConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error text-white px-10 gap-3 shadow-xl shadow-error/30 hover:shadow-error/50 transition-all font-black"
                  onClick={confirmDeleteBackup}
                  disabled={loadingBackups}
                >
                  {loadingBackups ? (
                    <FiRefreshCw className="animate-spin w-4 h-4" />
                  ) : (
                    <FiTrash2 className="w-4 h-4" />
                  )}
                  {deleteBackupConfirm.item === "all"
                    ? "WIPE ALL HISTORY"
                    : "PURGE BACKUP"}
                </button>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/70 backdrop-blur-sm transition-all"
            onClick={() => setDeleteBackupConfirm(null)}
          ></div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(128, 128, 128, 0.2);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(128, 128, 128, 0.4);
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
