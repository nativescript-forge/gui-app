import { useState, useEffect, useMemo } from "react";
import {
  FiKey,
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
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";
import { invoke } from "@tauri-apps/api/core";
import masterPermissions from "../../data/permissions_master.json";

interface Permission {
  name: string;
  description: string;
  sensitivity: "low" | "medium" | "high";
  impact: string;
  use_case: string;
  added_in?: number;
}

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

  useEffect(() => {
    loadPermissions();
  }, [projectPath]);

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
    <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <FaAndroid className="w-4 h-4" /> Android
            </button>
            <button
              onClick={() => setActivePlatform("ios")}
              className={`btn btn-sm justify-start gap-3 ${
                activePlatform === "ios" ? "btn-primary" : "btn-ghost"
              }`}
            >
              <FaApple className="w-4 h-4" /> iOS
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
                className="btn btn-ghost btn-xs w-full justify-between group px-3"
              >
                <span className="text-xs font-bold text-base-content/60 group-hover:text-primary transition-colors">
                  Official Docs
                </span>
                <FiExternalLink className="w-3 h-3 text-base-content/30 group-hover:text-primary transition-colors" />
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
    </div>
  );
}
