import { useMemo, useState, useEffect, useRef } from "react";
import type { ProjectRow, BuildConfig, Route } from "../../app/types";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";
import {
  FiCopy,
  FiPlay,
  FiCheckCircle,
  FiChevronDown,
  FiPackage,
  FiCpu,
  FiZap,
  FiBox,
  FiFolder,
  FiActivity,
  FiHardDrive,
  FiRefreshCw,
  FiAlertTriangle,
  FiInfo,
  FiTerminal,
  FiHash,
  FiDownload,
  FiShield,
  FiArrowUpCircle,
  FiGlobe,
  FiSettings,
  FiCommand,
  FiLayers,
  FiX,
} from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export type DashboardPageProps = {
  projects: ProjectRow[];
  projectPath: string | null;
  setProjectPath: (projectPath: string | null) => void;
  running: boolean;
  systemReport: {
    info: string;
    doctor: string;
    packageManager: string;
  } | null;
  logText: string;
  logFilter: "all" | "errors";
  setLogFilter: (filter: "all" | "errors") => void;
  onOpenBuildModal: () => void;
  onRunAction: (
    action:
      | "run-android"
      | "run-ios"
      | "debug-android"
      | "debug-ios"
      | "build"
      | "clean"
      | "install"
      | "doctor"
      | "info"
      | "update"
      | "migrate"
      | "package-manager"
      | "resources-update"
      | "resources-generate-splashes"
      | "resources-generate-icons",
    deviceId?: string,
    buildConfig?: BuildConfig,
    sourcePath?: string,
    backgroundColor?: string,
  ) => Promise<string | void>;
  onRunNpm: (args: string[], cwd?: string) => Promise<void>;
  currentAction: string | null;
  setRoute: (route: Route) => void;
};

export function DashboardPage(props: DashboardPageProps) {
  const {
    projects,
    projectPath,
    setProjectPath,
    running,
    logText,
    logFilter,
    setLogFilter,
    onOpenBuildModal,
    onRunAction,
    onRunNpm,
    currentAction,
  } = props;
  const [nodeModulesExist, setNodeModulesExist] = useState<boolean | null>(
    null,
  );
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [projectIcon, setProjectIcon] = useState<string | null>(null);
  const packageCheckRunIdRef = useRef(0);
  const [projectPackages, setProjectPackages] = useState<
    Record<string, string>
  >({});
  const [packageChecks, setPackageChecks] = useState<
    Record<
      string,
      {
        currentRange: string;
        latest: string | null;
        status: "loading" | "upToDate" | "outdated" | "error";
      }
    >
  >({});
  const [checkingPackages, setCheckingPackages] = useState(false);
  const [updatingPackages, setUpdatingPackages] = useState<
    Record<string, boolean>
  >({});
  const [bulkUpdatingPackages, setBulkUpdatingPackages] = useState(false);
  const [packageJsonError, setPackageJsonError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectIcon = async () => {
      if (!props.projectPath) return;

      const iconPaths = [
        "App_Resources/Android/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
        "App_Resources/Android/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        "App_Resources/Android/src/main/res/drawable-xxxhdpi/logo.png",
        "App_Resources/Android/src/main/res/drawable-xxhdpi/logo.png",
        "App_Resources/iOS/Assets.xcassets/AppIcon.appiconset/icon-1024.png",
      ];

      for (const relPath of iconPaths) {
        try {
          const fullPath = await join(props.projectPath, relPath);
          // Check if file exists using invoke
          const exists = await invoke("check_directory_exists", {
            path: fullPath,
          }).catch(() => false);

          if (exists) {
            try {
              const contents = await readFile(fullPath);
              const blob = new Blob([contents], { type: "image/png" });
              const assetUrl = URL.createObjectURL(blob);
              setProjectIcon(assetUrl);
              return;
            } catch (readErr) {
              console.error("Failed to read icon file:", readErr);
              // Fallback to convertFileSrc
              const assetUrl = convertFileSrc(fullPath);
              setProjectIcon(assetUrl);
              return;
            }
          }
        } catch (e) {
          console.error("Error fetching icon for", relPath, e);
        }
      }
      setProjectIcon(null);
    };
    fetchProjectIcon();
  }, [props.projectPath]);

  const activeProject = useMemo(() => {
    return props.projects.find((p) => p.path === props.projectPath);
  }, [props.projects, props.projectPath]);

  const lastOpenedStr = useMemo(() => {
    if (!activeProject?.last_opened) return "Never";
    return new Date(activeProject.last_opened).toLocaleString();
  }, [activeProject]);

  const createdAtStr = useMemo(() => {
    if (!activeProject?.created_at) return "N/A";
    return new Date(activeProject.created_at).toLocaleString();
  }, [activeProject]);

  const checkProjectHealth = async () => {
    if (!props.projectPath) return;
    setCheckingHealth(true);
    try {
      // Check if node_modules exists
      const exists = (await invoke("check_directory_exists", {
        path: `${props.projectPath}/node_modules`,
      })) as boolean;
      setNodeModulesExist(exists);
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    if (props.projectPath) {
      checkProjectHealth();
    }
  }, [props.projectPath]);

  const copyToClipboard = async (text: string) => {
    await writeText(text);
  };

  const normalizeSemver = (input: string | null | undefined) => {
    if (!input) return null;
    const match = input.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])] as const;
  };

  const compareSemver = (
    a: readonly [number, number, number] | null,
    b: readonly [number, number, number] | null,
  ) => {
    if (!a || !b) return 0;
    if (a[0] !== b[0]) return a[0] - b[0];
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[2] - b[2];
  };

  const getLatestFromRegistry = async (packageName: string) => {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      "dist-tags"?: { latest?: string };
    };
    return json["dist-tags"]?.latest || null;
  };

  const loadAndCheckProjectPackages = async (path: string) => {
    const runId = ++packageCheckRunIdRef.current;
    setCheckingPackages(true);
    setProjectPackages({});
    setPackageChecks({});
    setPackageJsonError(null);

    try {
      const all = (await invoke("get_project_packages", {
        projectPath: path,
      })) as Record<string, string>;
      setProjectPackages(all);

      const names = Object.keys(all).sort((a, b) => a.localeCompare(b));
      setPackageChecks(
        Object.fromEntries(
          names.map((name) => [
            name,
            { currentRange: all[name], latest: null, status: "loading" },
          ]),
        ),
      );

      const queue = [...names];
      const workerCount = Math.min(8, queue.length);
      const workers = Array.from({ length: workerCount }).map(async () => {
        while (queue.length > 0) {
          const name = queue.shift();
          if (!name) break;
          try {
            const latest = await getLatestFromRegistry(name);
            if (packageCheckRunIdRef.current !== runId) return;
            setPackageChecks((prev) => {
              const current = prev[name]?.currentRange ?? all[name] ?? "";
              const currentSemver = normalizeSemver(current);
              const latestSemver = normalizeSemver(latest);
              const isOutdated =
                latest != null &&
                currentSemver != null &&
                latestSemver != null &&
                compareSemver(currentSemver, latestSemver) < 0;
              return {
                ...prev,
                [name]: {
                  currentRange: current,
                  latest,
                  status: isOutdated ? "outdated" : "upToDate",
                },
              };
            });
          } catch {
            if (packageCheckRunIdRef.current !== runId) return;
            setPackageChecks((prev) => {
              const current = prev[name]?.currentRange ?? all[name] ?? "";
              return {
                ...prev,
                [name]: {
                  currentRange: current,
                  latest: null,
                  status: "error",
                },
              };
            });
          }
        }
      });

      await Promise.all(workers);
    } catch (err) {
      console.error("Failed to check project packages:", err);
      if (packageCheckRunIdRef.current === runId) {
        setPackageJsonError(String(err));
      }
    } finally {
      if (packageCheckRunIdRef.current === runId) {
        setCheckingPackages(false);
      }
    }
  };

  useEffect(() => {
    if (!props.projectPath) return;
    loadAndCheckProjectPackages(props.projectPath);
  }, [props.projectPath]);

  const updateSinglePackage = async (packageName: string) => {
    if (!props.projectPath) return;
    if (props.running) return;
    setUpdatingPackages((prev) => ({ ...prev, [packageName]: true }));
    try {
      await onRunNpm(["install", `${packageName}@latest`], props.projectPath);
      await loadAndCheckProjectPackages(props.projectPath);
    } finally {
      setUpdatingPackages((prev) => ({ ...prev, [packageName]: false }));
    }
  };

  const updateAllOutdatedPackages = async (packageNames: string[]) => {
    if (!props.projectPath) return;
    if (props.running) return;
    if (packageNames.length === 0) return;
    setBulkUpdatingPackages(true);
    try {
      for (const name of packageNames) {
        setUpdatingPackages((prev) => ({ ...prev, [name]: true }));
        try {
          await onRunNpm(["install", `${name}@latest`], props.projectPath);
        } finally {
          setUpdatingPackages((prev) => ({ ...prev, [name]: false }));
        }
      }
      await loadAndCheckProjectPackages(props.projectPath);
    } finally {
      setBulkUpdatingPackages(false);
    }
  };

  const projectPlatforms = useMemo(() => {
    if (!activeProject?.platforms) return [];
    return activeProject.platforms
      .split(",")
      .map((p) => p.trim().toLowerCase());
  }, [activeProject]);

  const isNsVersionOutdated = useMemo(() => {
    if (!activeProject?.nativescript_version) return false;
    // Simple check: if it doesn't contain "9." it's likely outdated (NativeScript 8 or older)
    return !activeProject.nativescript_version.includes("9.");
  }, [activeProject]);

  const corePackages = useMemo(() => {
    return ["@nativescript/core", "@nativescript/android", "@nativescript/ios"];
  }, []);

  const outdatedPackages = useMemo(() => {
    return Object.entries(packageChecks)
      .filter(([, v]) => v.status === "outdated")
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));
  }, [packageChecks]);

  const packagesHealth = useMemo(() => {
    if (checkingPackages) return "checking";
    if (Object.keys(packageChecks).length === 0) return "unknown";
    if (outdatedPackages.length > 0) return "outdated";
    const anyErrors = Object.values(packageChecks).some(
      (v) => v.status === "error",
    );
    if (anyErrors) return "partial";
    return "healthy";
  }, [checkingPackages, packageChecks, outdatedPackages]);

  if (!props.projectPath) {
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
      <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-6 text-base-content/20">
        <FiPackage className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-black mb-2">No Project Selected</h2>
      <p className="text-base-content/50 max-w-xs mb-8">
        Select a project from the list to view its console and run actions.
      </p>
      <div className="dropdown">
        <div tabIndex={0} role="button" className="btn btn-primary px-8">
          Select Project
          <FiChevronDown className="ml-2" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content z-[100] menu p-1 shadow-2xl bg-base-100 border border-base-200 rounded-xl w-64 mt-2"
        >
          {props.projects.map((p) => (
            <li key={p.path}>
              <button onClick={() => props.setProjectPath(p.path)}>
                <FiPackage className="w-4 h-4" />
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header / Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-base-100 border border-base-200 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <FiPackage className="w-48 h-48" />
            </div>

            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary flex-shrink-0 overflow-hidden">
              {projectIcon ? (
                <img
                  src={projectIcon}
                  alt="Project Icon"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If image fails to load, hide it and fallback to icon
                    (e.target as HTMLImageElement).style.display = "none";
                    setProjectIcon(null);
                  }}
                />
              ) : (
                <FiPackage className="w-10 h-10" />
              )}
            </div>

            <div className="flex-1 space-y-4 z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black tracking-tight">
                    {activeProject?.name}
                  </h1>
                  <div className="badge badge-primary badge-outline font-bold uppercase text-[10px]">
                    {activeProject?.framework || "NativeScript"}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/40 font-medium w-full">
                  <FiFolder className="w-3 h-3 shrink-0" />
                  <span
                    className="break-all cursor-help"
                    title={props.projectPath || ""}
                  >
                    {props.projectPath}
                  </span>
                  <button
                    onClick={() => copyToClipboard(props.projectPath!)}
                    className="btn btn-ghost btn-xs btn-circle"
                    title="Copy Path"
                  >
                    <FiCopy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    Version
                  </div>
                  <div className="font-bold text-sm">
                    {activeProject?.version_name || "1.0.0"}
                  </div>
                </div>
                <div className="w-px h-8 bg-base-300 hidden sm:block"></div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    NativeScript
                  </div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    v{activeProject?.nativescript_version || "Latest"}
                    {isNsVersionOutdated && (
                      <div
                        className="tooltip tooltip-warning"
                        data-tip="Version outdated. Click update in Health section."
                      >
                        <FiAlertTriangle className="w-3 h-3 text-warning" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-px h-8 bg-base-300 hidden sm:block"></div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    Platforms
                  </div>
                  <div className="flex gap-2">
                    {projectPlatforms.length > 0 ? (
                      <>
                        {projectPlatforms.includes("android") && (
                          <SiAndroid className="w-4 h-4 opacity-60" />
                        )}
                        {projectPlatforms.includes("ios") && (
                          <SiApple className="w-4 h-4 opacity-60" />
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] opacity-40 font-medium">
                        No Platforms
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-200/50 border border-base-300 rounded-3xl">
              <div className="card-body p-6">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-4">
                  <FiPlay className="w-3 h-3" /> Development
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className="btn btn-outline border-base-300 hover:btn-primary justify-start gap-3 rounded-xl h-auto py-3"
                    disabled={props.running}
                    onClick={() => props.onRunAction("run-android")}
                  >
                    <SiAndroid className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Run Android</div>
                      <div className="text-[10px] opacity-50 font-normal">
                        Launch on emulator or device
                      </div>
                    </div>
                  </button>
                  <button
                    className="btn btn-outline border-base-300 hover:btn-primary justify-start gap-3 rounded-xl h-auto py-3"
                    disabled={props.running}
                    onClick={() => props.onRunAction("run-ios")}
                  >
                    <SiApple className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Run iOS</div>
                      <div className="text-[10px] opacity-50 font-normal">
                        Launch on simulator or device
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-200/50 border border-base-300 rounded-3xl">
              <div className="card-body p-6">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-4">
                  <FiZap className="w-3 h-3" /> Debugging
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className="btn btn-outline border-base-300 hover:btn-warning justify-start gap-3 rounded-xl h-auto py-3"
                    disabled={props.running}
                    onClick={() => props.onRunAction("debug-android")}
                  >
                    <SiAndroid className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Debug Android</div>
                      <div className="text-[10px] opacity-50 font-normal">
                        Inspect with Chrome DevTools
                      </div>
                    </div>
                  </button>
                  <button
                    className="btn btn-outline border-base-300 hover:btn-warning justify-start gap-3 rounded-xl h-auto py-3"
                    disabled={props.running}
                    onClick={() => props.onRunAction("debug-ios")}
                  >
                    <SiApple className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Debug iOS</div>
                      <div className="text-[10px] opacity-50 font-normal">
                        Inspect with Safari Web Inspector
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200/50 border border-base-300 rounded-3xl">
            <div className="card-body p-6">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-4">
                <FiBox className="w-3 h-3" /> Distribution
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  className="btn btn-primary justify-start gap-3 rounded-xl h-auto py-4"
                  disabled={props.running}
                  onClick={props.onOpenBuildModal}
                >
                  <FiPackage className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Build Project</div>
                    <div className="text-[10px] opacity-80 font-normal">
                      Generate APK/AAB or IPA for release
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200/50 border border-base-300 rounded-3xl">
            <div className="card-body p-6">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-4">
                <FiShield className="w-3 h-3" /> Maintenance & Diagnostics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  className="group btn btn-outline border-base-300 hover:bg-primary hover:border-primary hover:text-primary-content justify-start gap-3 rounded-xl h-auto py-3 transition-all duration-300"
                  disabled={props.running}
                  onClick={() => props.onRunAction("doctor")}
                >
                  <FiShield className="w-4 h-4 text-info group-hover:text-primary-content transition-colors" />
                  <div className="text-left">
                    <div className="font-bold text-[12px]">Doctor</div>
                    <div className="text-[9px] opacity-50 font-normal group-hover:opacity-100">
                      Check system configuration
                    </div>
                  </div>
                </button>
                <button
                  className="group btn btn-outline border-base-300 hover:bg-primary hover:border-primary hover:text-primary-content justify-start gap-3 rounded-xl h-auto py-3 transition-all duration-300"
                  disabled={props.running}
                  onClick={() => props.onRunAction("info")}
                >
                  <FiInfo className="w-4 h-4 text-primary group-hover:text-primary-content transition-colors" />
                  <div className="text-left">
                    <div className="font-bold text-[12px]">CLI Info</div>
                    <div className="text-[9px] opacity-50 font-normal group-hover:opacity-100">
                      Version information
                    </div>
                  </div>
                </button>
                <button
                  className="group btn btn-outline border-base-300 hover:bg-primary hover:border-primary hover:text-primary-content justify-start gap-3 rounded-xl h-auto py-3 transition-all duration-300"
                  disabled={props.running}
                  onClick={() => props.onRunAction("update")}
                >
                  <FiRefreshCw className="w-4 h-4 text-success group-hover:text-primary-content transition-colors" />
                  <div className="text-left">
                    <div className="font-bold text-[12px]">Update Project</div>
                    <div className="text-[9px] opacity-50 font-normal group-hover:opacity-100">
                      Update runtimes & modules
                    </div>
                  </div>
                </button>
                <button
                  className="group btn btn-outline border-base-300 hover:bg-primary hover:border-primary hover:text-primary-content justify-start gap-3 rounded-xl h-auto py-3 transition-all duration-300"
                  disabled={props.running}
                  onClick={() => props.onRunAction("migrate")}
                >
                  <FiArrowUpCircle className="w-4 h-4 text-warning group-hover:text-primary-content transition-colors" />
                  <div className="text-left">
                    <div className="font-bold text-[12px]">Migrate</div>
                    <div className="text-[9px] opacity-50 font-normal group-hover:opacity-100">
                      Migrate dependencies
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200/50 border border-base-300 rounded-3xl">
            <div className="card-body p-6">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-4">
                <FiSettings className="w-3 h-3" /> Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  className="group btn btn-outline border-base-300 hover:bg-primary hover:border-primary hover:text-primary-content justify-start gap-3 rounded-xl h-auto py-3 transition-all duration-300"
                  disabled={props.running}
                  onClick={() => props.onRunAction("package-manager")}
                >
                  <FiCommand className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:text-primary-content transition-all" />
                  <div className="text-left">
                    <div className="font-bold text-[12px]">Pkg Manager</div>
                    <div className="text-[9px] opacity-50 font-normal group-hover:opacity-100">
                      Current package manager
                    </div>
                  </div>
                </button>
                <button
                  className="group btn btn-outline border-base-300 hover:bg-primary hover:border-primary hover:text-primary-content justify-start gap-3 rounded-xl h-auto py-3 transition-all duration-300"
                  disabled={props.running}
                  onClick={() => props.onRunNpm(["config", "get", "proxy"])}
                >
                  <FiGlobe className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:text-primary-content transition-all" />
                  <div className="text-left">
                    <div className="font-bold text-[12px]">Proxy Settings</div>
                    <div className="text-[9px] opacity-50 font-normal group-hover:opacity-100">
                      Display proxy config
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Health & Utils */}
        <div className="space-y-6">
          <div className="bg-base-100 border border-base-200 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-40">
                Project Health
              </h3>
              <button
                onClick={checkProjectHealth}
                className={`btn btn-ghost btn-xs btn-circle ${checkingHealth ? "animate-spin" : ""}`}
              >
                <FiRefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-base-200/50">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${nodeModulesExist ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                >
                  {nodeModulesExist ? (
                    <FiCheckCircle className="w-5 h-5" />
                  ) : (
                    <FiAlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Dependencies</div>
                  <div className="text-[10px] opacity-50">
                    {nodeModulesExist
                      ? "node_modules found"
                      : "Missing node_modules"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-2xl bg-base-200/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiHash className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Plugins</div>
                  <div className="text-[10px] opacity-50">
                    {activeProject?.plugins_count || 0} installed plugins
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-2xl bg-base-200/50">
                <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
                  <FiCpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Target SDK</div>
                  <div className="text-[10px] opacity-50">
                    Android {activeProject?.target_sdk || "Not specified"}
                  </div>
                </div>
              </div>
            </div>

            {!nodeModulesExist && nodeModulesExist !== null && (
              <div className="mt-6 p-4 rounded-2xl bg-error/5 border border-error/10 text-error flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <FiInfo className="w-3 h-3" /> Action Required
                </div>
                <p className="text-[10px] leading-relaxed opacity-80 mb-2">
                  Run{" "}
                  <code className="bg-error/10 px-1 rounded">ns install</code>{" "}
                  in your project directory to install dependencies.
                </p>
                <button
                  onClick={async () => {
                    await onRunAction("install");
                    checkProjectHealth();
                  }}
                  disabled={running}
                  className="btn btn-error btn-xs w-fit text-[10px] h-7 min-h-0"
                >
                  {running && currentAction === "install" ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FiDownload className="w-3 h-3" />
                  )}
                  Install Dependencies
                </button>
              </div>
            )}

            {isNsVersionOutdated && (
              <div className="mt-4 p-4 rounded-2xl bg-warning/5 border border-warning/10 text-warning flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <FiAlertTriangle className="w-3 h-3" /> Update Recommended
                </div>
                <p className="text-[10px] leading-relaxed opacity-80 mb-2">
                  NativeScript CLI version is outdated. Update to the latest
                  version for better stability.
                </p>
                <button
                  onClick={() =>
                    onRunNpm(["install", "-g", "nativescript@latest"])
                  }
                  disabled={running}
                  className="btn btn-warning btn-xs w-fit text-[10px] h-7 min-h-0"
                >
                  {running && currentAction === "npm" ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FiRefreshCw className="w-3 h-3" />
                  )}
                  Update CLI
                </button>
              </div>
            )}
          </div>

          <div className="bg-base-100 border border-base-200 rounded-3xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">
              Project Info
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Last Opened
                </div>
                <div className="text-xs font-medium">{lastOpenedStr}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Created At
                </div>
                <div className="text-xs font-medium">{createdAtStr}</div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 border border-base-200 rounded-3xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">
              Utilities
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                className="btn btn-ghost bg-base-200/50 hover:bg-primary/10 hover:text-primary justify-start gap-3 rounded-2xl h-auto py-4 px-5 border-none"
                onClick={() => props.setRoute("app-resources")}
              >
                <FiLayers className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-bold text-xs">App Resources</div>
                  <div className="text-[10px] opacity-50 font-normal">
                    Icons, Splashscreens & Structure
                  </div>
                </div>
              </button>

              <button
                className="btn btn-ghost bg-base-200/50 hover:bg-error/10 hover:text-error justify-start gap-3 rounded-2xl h-auto py-4 px-5 border-none"
                disabled={props.running}
                onClick={async () => {
                  await props.onRunAction("clean");
                  checkProjectHealth();
                }}
              >
                {props.running && props.currentAction === "clean" ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <FiRefreshCw className="w-4 h-4" />
                )}
                <div className="text-left">
                  <div className="font-bold text-xs">Clean Project</div>
                  <div className="text-[10px] opacity-50 font-normal">
                    Remove platforms and node_modules
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-base-100 border border-base-200 rounded-3xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">
              Project Environment
            </h3>
            <div className="flex items-center justify-between text-xs mb-4">
              <span className="opacity-50">Packages</span>
              <span
                className={`badge badge-xs text-[9px] h-4 ${
                  packageJsonError
                    ? "badge-error"
                    : packagesHealth === "healthy"
                      ? "badge-success"
                      : packagesHealth === "outdated"
                        ? "badge-warning"
                        : packagesHealth === "partial"
                          ? "badge-info"
                          : "badge-ghost"
                }`}
              >
                {packageJsonError
                  ? "Error"
                  : packagesHealth === "checking"
                    ? "Checking"
                    : packagesHealth === "healthy"
                      ? "Healthy"
                      : packagesHealth === "outdated"
                        ? "Outdated"
                        : packagesHealth === "partial"
                          ? "Partial"
                          : "Unknown"}
              </span>
            </div>
            {packageJsonError && (
              <div className="text-[10px] opacity-60 bg-error/5 border border-error/10 rounded-xl px-3 py-2 mb-4">
                Failed to read package.json for this project.
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  Project Packages
                </div>
                <span className="text-[10px] opacity-40">
                  {Object.keys(projectPackages).length > 0
                    ? `${Object.keys(projectPackages).length} total`
                    : checkingPackages
                      ? "Loading…"
                      : "—"}
                </span>
              </div>

              <div className="space-y-2">
                {corePackages.map((name) => {
                  const currentRange = projectPackages[name] ?? null;
                  const check = packageChecks[name];
                  const isLoading =
                    checkingPackages || check?.status === "loading";
                  const isOutdated = check?.status === "outdated";
                  const isUpdating = updatingPackages[name] || false;
                  const disableUpdate =
                    props.running || isUpdating || bulkUpdatingPackages;

                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-2 bg-base-200/50 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold truncate">
                          {name}
                        </div>
                        <div className="text-[10px] opacity-60 font-mono truncate">
                          {currentRange ? (
                            isLoading ? (
                              "Checking…"
                            ) : check?.latest ? (
                              `${currentRange} → ${check.latest}`
                            ) : (
                              currentRange
                            )
                          ) : (
                            <span className="opacity-50">Not installed</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isLoading && currentRange ? (
                          <span className="loading loading-spinner loading-xs opacity-60"></span>
                        ) : currentRange ? (
                          <span
                            className={`badge badge-xs text-[9px] h-4 ${
                              check?.status === "upToDate"
                                ? "badge-success"
                                : check?.status === "outdated"
                                  ? "badge-warning"
                                  : check?.status === "error"
                                    ? "badge-error"
                                    : "badge-ghost"
                            }`}
                          >
                            {check?.status === "upToDate"
                              ? "OK"
                              : check?.status === "outdated"
                                ? "New"
                                : check?.status === "error"
                                  ? "Err"
                                  : "..."}
                          </span>
                        ) : (
                          <span className="badge badge-xs text-[9px] h-4 badge-ghost">
                            ---
                          </span>
                        )}

                        {isOutdated && currentRange && (
                          <button
                            type="button"
                            className="btn btn-xs btn-primary h-7 min-h-0 text-[10px]"
                            disabled={disableUpdate}
                            onClick={() => updateSinglePackage(name)}
                          >
                            {isUpdating ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Update"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(projectPackages).length > 0 && (
                <details className="rounded-xl bg-base-200/30 px-3 py-2">
                  <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest opacity-50 select-none">
                    Other Packages{" "}
                    {checkingPackages
                      ? "(checking)"
                      : `(${outdatedPackages.filter((n) => !corePackages.includes(n)).length} outdated)`}
                  </summary>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] opacity-60">
                        {checkingPackages
                          ? "Version check in progress"
                          : outdatedPackages.filter(
                                (n) => !corePackages.includes(n),
                              ).length > 0
                            ? "Some packages are not up to date"
                            : "All packages are up to date"}
                      </div>
                      {!checkingPackages &&
                        outdatedPackages.filter(
                          (n) => !corePackages.includes(n),
                        ).length > 0 && (
                          <button
                            type="button"
                            className="btn btn-xs btn-primary h-7 min-h-0 text-[10px]"
                            disabled={
                              props.running ||
                              bulkUpdatingPackages ||
                              outdatedPackages.filter(
                                (n) => !corePackages.includes(n),
                              ).length === 0
                            }
                            onClick={() =>
                              updateAllOutdatedPackages(
                                outdatedPackages.filter(
                                  (n) => !corePackages.includes(n),
                                ),
                              )
                            }
                          >
                            {bulkUpdatingPackages ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Update All"
                            )}
                          </button>
                        )}
                    </div>

                    <div className="max-h-40 overflow-auto space-y-2 pr-1">
                      {outdatedPackages
                        .filter((n) => !corePackages.includes(n))
                        .slice(0, 30)
                        .map((name) => {
                          const check = packageChecks[name];
                          const isUpdating = updatingPackages[name] || false;
                          const disableUpdate =
                            props.running || isUpdating || bulkUpdatingPackages;
                          return (
                            <div
                              key={name}
                              className="flex items-center justify-between gap-2 bg-base-100/70 border border-base-200 rounded-xl px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold truncate">
                                  {name}
                                </div>
                                <div className="text-[10px] opacity-60 font-mono truncate">
                                  {(projectPackages[name] ?? "?") +
                                    (check?.latest ? ` → ${check.latest}` : "")}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline h-7 min-h-0 text-[10px]"
                                disabled={disableUpdate}
                                onClick={() => updateSinglePackage(name)}
                              >
                                {isUpdating ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  "Update"
                                )}
                              </button>
                            </div>
                          );
                        })}

                      {!checkingPackages &&
                        outdatedPackages.filter(
                          (n) => !corePackages.includes(n),
                        ).length === 0 && (
                          <div className="text-[10px] opacity-40 italic py-2">
                            No outdated packages detected.
                          </div>
                        )}
                    </div>
                  </div>
                </details>
              )}
            </div>
            <button
              onClick={() => setShowSystemModal(true)}
              className="btn btn-ghost btn-block btn-xs mt-6 text-[10px] opacity-60 hover:opacity-100"
            >
              View Project Report
            </button>
          </div>
        </div>
      </div>

      {/* Log Console Section */}
      <div className="bg-base-100 border border-base-200 rounded-3xl overflow-hidden flex flex-col h-[400px]">
        <div className="bg-base-200/50 px-6 py-4 flex items-center justify-between border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
              <FiTerminal className="w-3 h-3" /> Console Output
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="form-control">
              <select
                className="select select-xs select-ghost bg-base-300/50 rounded-lg text-[10px] font-bold focus:select-primary transition-all"
                value={props.logFilter}
                onChange={(e) =>
                  props.setLogFilter(e.target.value as "all" | "errors")
                }
              >
                <option value="all">ALL LOGS</option>
                <option value="errors">ERRORS ONLY</option>
              </select>
            </div>
            <button
              onClick={() => copyToClipboard(props.logText)}
              className="btn btn-ghost btn-xs btn-square"
              title="Copy Logs"
            >
              <FiCopy className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 font-mono text-xs overflow-auto bg-black/5 dark:bg-black/20">
          {props.logText ? (
            <pre className="whitespace-pre-wrap break-all opacity-80 leading-relaxed">
              {props.logText}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-base-content/20 gap-3">
              <FiActivity className="w-8 h-8 opacity-20" />
              <p className="font-sans font-medium tracking-tight">
                Waiting for activity...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Project Environment Report Modal */}
      {showSystemModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden border border-base-300 shadow-2xl rounded-3xl">
            <div className="p-6 border-b border-base-200 flex items-center justify-between bg-base-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiPackage className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">
                    Project Environment Report
                  </h3>
                  <p className="text-xs opacity-50">
                    Package versions from package.json vs NPM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSystemModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                  <FiInfo className="w-3 h-3" /> Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-base-300/30 border border-base-300 rounded-2xl p-4">
                    <div className="text-[10px] opacity-50">Packages</div>
                    <div className="text-sm font-bold">
                      {Object.keys(projectPackages).length}
                    </div>
                  </div>
                  <div className="bg-base-300/30 border border-base-300 rounded-2xl p-4">
                    <div className="text-[10px] opacity-50">Outdated</div>
                    <div className="text-sm font-bold">
                      {outdatedPackages.length}
                    </div>
                  </div>
                  <div className="bg-base-300/30 border border-base-300 rounded-2xl p-4">
                    <div className="text-[10px] opacity-50">Status</div>
                    <div className="text-sm font-bold">
                      {packageJsonError
                        ? "Error"
                        : checkingPackages
                          ? "Checking"
                          : packagesHealth === "healthy"
                            ? "Healthy"
                            : packagesHealth === "outdated"
                              ? "Outdated"
                              : packagesHealth === "partial"
                                ? "Partial"
                                : "Unknown"}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                  <FiPackage className="w-3 h-3" /> Packages
                </h4>
                {packageJsonError ? (
                  <div className="bg-error/5 border border-error/10 rounded-2xl p-4 text-sm opacity-70">
                    Failed to read package.json for this project.
                  </div>
                ) : (
                  <>
                    {outdatedPackages.length > 0 && (
                      <div className="flex justify-end mb-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary rounded-xl"
                          disabled={
                            props.running ||
                            bulkUpdatingPackages ||
                            checkingPackages ||
                            outdatedPackages.length === 0
                          }
                          onClick={() =>
                            updateAllOutdatedPackages(outdatedPackages)
                          }
                        >
                          {bulkUpdatingPackages ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            <FiArrowUpCircle className="w-4 h-4" />
                          )}
                          Update All Outdated
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {Object.keys(projectPackages)
                        .sort((a, b) => a.localeCompare(b))
                        .map((name) => {
                          const currentRange = projectPackages[name] ?? null;
                          const check = packageChecks[name];
                          const isLoading =
                            checkingPackages || check?.status === "loading";
                          const isOutdated = check?.status === "outdated";
                          const isUpdating = updatingPackages[name] || false;
                          const disableUpdate =
                            props.running || isUpdating || bulkUpdatingPackages;

                          return (
                            <div
                              key={name}
                              className="flex items-center justify-between gap-3 bg-base-300/30 border border-base-300 rounded-2xl px-4 py-3"
                            >
                              <div className="min-w-0">
                                <div className="text-[12px] font-bold truncate">
                                  {name}
                                </div>
                                <div className="text-[11px] opacity-60 font-mono truncate">
                                  {currentRange ? (
                                    isLoading ? (
                                      "Checking…"
                                    ) : check?.latest ? (
                                      `${currentRange} → ${check.latest}`
                                    ) : (
                                      currentRange
                                    )
                                  ) : (
                                    <span className="opacity-50">
                                      Not installed
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isLoading && currentRange ? (
                                  <span className="loading loading-spinner loading-xs opacity-60"></span>
                                ) : currentRange ? (
                                  <span
                                    className={`badge badge-xs text-[9px] h-4 ${
                                      check?.status === "upToDate"
                                        ? "badge-success"
                                        : check?.status === "outdated"
                                          ? "badge-warning"
                                          : check?.status === "error"
                                            ? "badge-error"
                                            : "badge-ghost"
                                    }`}
                                  >
                                    {check?.status === "upToDate"
                                      ? "OK"
                                      : check?.status === "outdated"
                                        ? "New"
                                        : check?.status === "error"
                                          ? "Err"
                                          : "..."}
                                  </span>
                                ) : (
                                  <span className="badge badge-xs text-[9px] h-4 badge-ghost">
                                    ---
                                  </span>
                                )}

                                {isOutdated && currentRange && (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-primary h-7 min-h-0 text-[10px]"
                                    disabled={disableUpdate}
                                    onClick={() => updateSinglePackage(name)}
                                  >
                                    {isUpdating ? (
                                      <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                      "Update"
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </section>
            </div>
            <div className="p-6 border-t border-base-200 bg-base-200/30 flex justify-end">
              <button
                onClick={() => setShowSystemModal(false)}
                className="btn btn-primary rounded-xl px-8"
              >
                Close
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-base-900/60 backdrop-blur-sm"
            onClick={() => setShowSystemModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
}
