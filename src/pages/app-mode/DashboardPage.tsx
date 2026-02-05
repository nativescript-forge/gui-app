import { useMemo, useState, useEffect, useRef } from "react";
import type { ProjectRow, BuildConfig, Route } from "../../app/types";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";
import {
  FiCopy,
  FiCheckCircle,
  FiChevronDown,
  FiPackage,
  FiCpu,
  FiZap,
  FiBox,
  FiFolder,
  FiActivity,
  FiRefreshCw,
  FiAlertTriangle,
  FiInfo,
  FiHash,
  FiDownload,
  FiShield,
  FiArrowUpCircle,
  FiCommand,
  FiLayers,
  FiX,
  FiPlay,
  FiChevronRight,
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
      | "resources-generate-icons"
      | "platform-add-android"
      | "platform-add-ios",
    deviceId?: string,
    buildConfig?: BuildConfig,
    sourcePath?: string,
    backgroundColor?: string,
  ) => Promise<string | void>;
  onRunNpm: (args: string[], cwd?: string) => Promise<void>;
  currentAction: string | null;
  setRoute: (route: Route) => void;
  onRefreshProject?: (path: string) => Promise<void>;
};

export function DashboardPage(props: DashboardPageProps) {
  const { running, onRunAction, onRunNpm, currentAction } = props;
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

      try {
        const iconData = await invoke<string>("get_project_icon", {
          path: props.projectPath,
        });
        if (iconData) {
          setProjectIcon(iconData);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch icon from backend:", err);
      }

      // Fallback manual check
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
          const exists = await invoke<boolean>("path_exists", {
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
    const date = new Date(activeProject.last_opened);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [activeProject]);

  const createdAtStr = useMemo(() => {
    if (!activeProject?.created_at) return "N/A";
    const date = new Date(activeProject.created_at);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [activeProject]);

  const checkProjectHealth = async () => {
    if (!props.projectPath) return;
    setCheckingHealth(true);
    try {
      // Check if node_modules exists
      const exists = (await invoke("path_exists", {
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
    const platforms = new Set<string>();
    const isWindows = navigator.userAgent.toLowerCase().includes("win");

    // Primary check: from package.json packages (most accurate for "installed" status)
    if (projectPackages["@nativescript/android"]) {
      platforms.add("android");
    }
    if (projectPackages["@nativescript/ios"] && !isWindows) {
      platforms.add("ios");
    }

    // Secondary check: if no packages found (maybe node_modules not installed), check database
    // We only use this if NO packages were detected at all to avoid double icons
    if (platforms.size === 0 && activeProject?.platforms) {
      activeProject.platforms.split(",").forEach((p) => {
        const platform = p.trim().toLowerCase();
        if (platform) {
          if (platform === "ios" && isWindows) return;
          platforms.add(platform);
        }
      });
    }

    return Array.from(platforms);
  }, [activeProject, projectPackages]);

  const [migrating, setMigrating] = useState(false);

  const getLatestCliVersion = async () => {
    try {
      return await getLatestFromRegistry("nativescript");
    } catch (err) {
      console.error("Failed to fetch latest nativescript version:", err);
      return null;
    }
  };

  const globalNsMajor = useMemo(() => {
    if (!props.systemReport?.info) return null;
    // ns info output: "NativeScript CLI version: 8.6.2" or similar
    // match "8.6.2" or "v8.6.2" anywhere in the string if "CLI version" is found
    const match = props.systemReport.info.match(/CLI version:?\s*v?(\d+)/i);
    if (match) return parseInt(match[1], 10);

    // Fallback: search for any standalone version pattern if the standard label fails
    const fallbackMatch = props.systemReport.info.match(
      /(?:^|\s)v?(\d+)\.\d+\.\d+/,
    );
    return fallbackMatch ? parseInt(fallbackMatch[1], 10) : null;
  }, [props.systemReport]);

  const isMigrationRequired = useMemo(() => {
    if (!activeProject?.nativescript_version || globalNsMajor === null)
      return false;

    // Handle semver prefixes like ^, ~, or v
    const currentMatch =
      activeProject.nativescript_version.match(/[^\d]*(\d+)/);
    if (!currentMatch) return false;
    const currentMajor = parseInt(currentMatch[1], 10);

    // Aktif jika versi major global dan core berbeda (biasanya global > core)
    return currentMajor !== globalNsMajor;
  }, [activeProject, globalNsMajor]);

  const runMigration = async () => {
    if (!props.projectPath || props.running || migrating) return;

    setMigrating(true);
    try {
      const pm = props.systemReport?.packageManager || "npm";
      const isGlobalLatest = true; // Placeholder: we should ideally check this

      // 1. Install latest CLI global if needed
      if (!isGlobalLatest) {
        await onRunNpm(["install", "-g", "nativescript@latest"]);
      }

      // 2. ns migrate
      await onRunAction("migrate");

      // 3. ns clean
      await onRunAction("clean");

      // 4. install latest core
      await onRunNpm(
        ["install", "@nativescript/core@latest"],
        props.projectPath,
      );

      // 5. install latest android if exists
      if (projectPlatforms.includes("android")) {
        await onRunNpm(
          ["install", "@nativescript/android@latest"],
          props.projectPath,
        );
      }

      // 6. install latest ios if exists
      if (projectPlatforms.includes("ios")) {
        await onRunNpm(
          ["install", "@nativescript/ios@latest"],
          props.projectPath,
        );
      }

      // 7. install latest webpack
      await onRunNpm(
        ["install", "@nativescript/webpack@latest"],
        props.projectPath,
      );

      await loadAndCheckProjectPackages(props.projectPath);
      if (props.onRefreshProject) {
        await props.onRefreshProject(props.projectPath);
      }
    } catch (err) {
      console.error("Migration failed:", err);
    } finally {
      setMigrating(false);
    }
  };

  const isNsVersionOutdated = useMemo(() => {
    if (!activeProject?.nativescript_version || globalNsMajor === null)
      return false;

    // Handle semver prefixes like ^, ~, or v
    const match = activeProject.nativescript_version.match(/[^\d]*(\d+)/);
    if (!match) return false;
    const currentMajor = parseInt(match[1], 10);

    // Outdated if project version major is less than global CLI major
    return currentMajor < globalNsMajor;
  }, [activeProject, globalNsMajor]);

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
    return (
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Compact Header & Quick Actions */}
      <div className="bg-base-100 border border-base-200 rounded-[2.5rem] p-6 md:p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <FiPackage className="w-32 h-32" />
        </div>

        <div className="flex items-center gap-5 z-10 w-full xl:w-auto group">
          <div className="w-20 h-20 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary flex-shrink-0 overflow-hidden border border-primary/10 shadow-inner">
            {projectIcon ? (
              <img
                src={projectIcon}
                alt="Project Icon"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  setProjectIcon(null);
                }}
              />
            ) : (
              <FiPackage className="w-8 h-8 opacity-20" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-3xl font-extrabold tracking-tight truncate">
                {activeProject?.name}
              </h1>
              <div className="badge badge-primary badge-sm font-black uppercase text-[9px] h-5 px-2 flex-shrink-0">
                {activeProject?.framework || "NativeScript"}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-base-content/40 font-medium group/path">
              <FiFolder className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span
                className="truncate cursor-help max-w-[200px] md:max-w-md lg:max-w-xl"
                title={props.projectPath || ""}
              >
                {props.projectPath}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (props.projectPath) copyToClipboard(props.projectPath);
                }}
                className="btn btn-ghost btn-xs btn-square h-5 w-5 min-h-0 opacity-0 group-hover/path:opacity-100 transition-opacity flex-shrink-0"
                title="Copy Path"
              >
                <FiCopy className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-10 gap-y-4 z-10 w-full xl:w-auto justify-start xl:justify-end mt-4 xl:mt-0">
          <div className="flex items-center gap-10">
            <div className="text-left xl:text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1.5">
                NativeScript
              </div>
              <div className="font-extrabold text-sm flex items-center xl:justify-end gap-1.5">
                <span
                  className={
                    isNsVersionOutdated ? "text-warning" : "text-base-content"
                  }
                >
                  v{activeProject?.nativescript_version || "Latest"}
                </span>
                {isNsVersionOutdated && (
                  <FiAlertTriangle className="w-3.5 h-3.5 text-warning animate-pulse" />
                )}
              </div>
            </div>
            <div className="text-left xl:text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1.5">
                Platforms
              </div>
              <div className="flex items-center xl:justify-end gap-2.5">
                {projectPlatforms.length === 0 ? (
                  <span className="text-xs font-bold opacity-30">None</span>
                ) : (
                  projectPlatforms.map((p) => (
                    <div
                      key={p}
                      className="tooltip tooltip-bottom"
                      data-tip={p.toUpperCase()}
                    >
                      {p === "android" ? (
                        <SiAndroid className="w-4 h-4 text-success/70" />
                      ) : (
                        <SiApple className="w-4 h-4 text-base-content/70" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="hidden xl:flex w-px h-10 bg-base-200 opacity-50"></div>

          <div className="flex items-center gap-10">
            <div className="text-left xl:text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1.5">
                Created
              </div>
              <div className="font-bold text-sm text-base-content/80 whitespace-nowrap">
                {createdAtStr}
              </div>
            </div>
            <div className="text-left xl:text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1.5">
                Last Open
              </div>
              <div className="font-bold text-sm text-base-content/80 whitespace-nowrap">
                {lastOpenedStr}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Column */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Action Grid - 3 Columns for Run, Debug, and Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Run Section */}
            <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2 mb-5">
                <FiPlay className="w-3.5 h-3.5 text-success" /> Run Project
              </h3>
              <div className="grid grid-cols-1 gap-2.5 flex-1">
                <button
                  className={`btn h-auto py-3 px-4 rounded-2xl border-none transition-all flex items-center justify-between group ${
                    projectPlatforms.includes("android")
                      ? "bg-success/10 text-success hover:bg-success hover:text-white shadow-sm hover:shadow-md"
                      : "bg-base-200 text-base-content/20 cursor-not-allowed"
                  }`}
                  disabled={
                    props.running || !projectPlatforms.includes("android")
                  }
                  onClick={() => props.onRunAction("run-android")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        projectPlatforms.includes("android")
                          ? "bg-success/20 group-hover:bg-white/20"
                          : "bg-base-300"
                      }`}
                    >
                      <SiAndroid className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-sm">Run Android</div>
                      <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">
                        {projectPlatforms.includes("android")
                          ? "Emulator/Device"
                          : "Not Available"}
                      </div>
                    </div>
                  </div>
                  <FiChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>

                <button
                  className={`btn h-auto py-3 px-4 rounded-2xl border-none transition-all flex items-center justify-between group ${
                    projectPlatforms.includes("ios")
                      ? "bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-sm hover:shadow-md"
                      : "bg-base-200 text-base-content/20 cursor-not-allowed"
                  }`}
                  disabled={props.running || !projectPlatforms.includes("ios")}
                  onClick={() => props.onRunAction("run-ios")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        projectPlatforms.includes("ios")
                          ? "bg-primary/20 group-hover:bg-white/20"
                          : "bg-base-300"
                      }`}
                    >
                      <SiApple className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-sm">Run iOS</div>
                      <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">
                        {projectPlatforms.includes("ios")
                          ? "Simulator/Device"
                          : "Not Available"}
                      </div>
                    </div>
                  </div>
                  <FiChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </div>
            </div>

            {/* Debugging & Development */}
            <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2 mb-5">
                <FiZap className="w-3.5 h-3.5 text-warning" /> Debugging &
                Development
              </h3>
              <div className="grid grid-cols-1 gap-2.5 flex-1">
                <button
                  className={`btn btn-outline border-base-200 justify-start gap-3.5 rounded-2xl h-auto py-3 px-4 group transition-all w-full ${
                    projectPlatforms.includes("android")
                      ? "hover:bg-warning/10 hover:text-warning hover:border-warning/30"
                      : "opacity-50 cursor-not-allowed bg-base-200/30"
                  }`}
                  disabled={
                    props.running || !projectPlatforms.includes("android")
                  }
                  onClick={() => props.onRunAction("debug-android")}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      projectPlatforms.includes("android")
                        ? "bg-base-200/50 group-hover:bg-warning/20"
                        : "bg-base-300"
                    }`}
                  >
                    <SiAndroid
                      className={`w-5 h-5 ${projectPlatforms.includes("android") ? "opacity-40 group-hover:opacity-100" : "opacity-20"}`}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm">Debug Android</div>
                    <div className="text-[10px] opacity-50 font-medium">
                      {projectPlatforms.includes("android")
                        ? "Chrome DevTools"
                        : "Platform Not Available"}
                    </div>
                  </div>
                </button>

                <button
                  className={`btn btn-outline border-base-200 justify-start gap-3.5 rounded-2xl h-auto py-3 px-4 group transition-all w-full ${
                    projectPlatforms.includes("ios")
                      ? "hover:bg-warning/10 hover:text-warning hover:border-warning/30"
                      : "opacity-50 cursor-not-allowed bg-base-200/30"
                  }`}
                  disabled={props.running || !projectPlatforms.includes("ios")}
                  onClick={() => props.onRunAction("debug-ios")}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      projectPlatforms.includes("ios")
                        ? "bg-base-200/50 group-hover:bg-warning/20"
                        : "bg-base-300"
                    }`}
                  >
                    <SiApple
                      className={`w-5 h-5 ${projectPlatforms.includes("ios") ? "opacity-40 group-hover:opacity-100" : "opacity-20"}`}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm">Debug iOS</div>
                    <div className="text-[10px] opacity-50 font-medium">
                      {projectPlatforms.includes("ios")
                        ? "Safari Web Inspector"
                        : "Platform Not Available"}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* App Distribution */}
            <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col md:col-span-2 xl:col-span-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2 mb-5">
                <FiBox className="w-3.5 h-3.5 text-primary" /> App Distribution
              </h3>
              <div className="flex flex-col h-full gap-4">
                <button
                  className="btn btn-primary bg-gradient-to-br from-primary to-primary-focus border-none justify-start gap-4 rounded-2xl h-auto py-4 px-5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all group w-full"
                  disabled={props.running}
                  onClick={props.onOpenBuildModal}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiPackage className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm text-white">
                      Build Project
                    </div>
                    <div className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                      Generate APK/AAB/IPA
                    </div>
                  </div>
                </button>
                <p className="text-[12px] leading-relaxed opacity-50 font-medium">
                  Prepare your application for release. Building will generate
                  installation files (APK/AAB for Android or IPA for iOS) ready
                  for distribution to app stores or internal testing.
                </p>
              </div>
            </div>
          </div>

          {/* Maintenance & Tools Section */}
          <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <FiShield className="w-3.5 h-3.5 text-info" /> Maintenance &
                Tools
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  id: "doctor",
                  icon: FiShield,
                  label: "Doctor",
                  color: "info",
                  bg: "hover:bg-info/10 hover:text-info",
                },
                {
                  id: "info",
                  icon: FiInfo,
                  label: "CLI Info",
                  color: "primary",
                  bg: "hover:bg-primary/10 hover:text-primary",
                },
                {
                  id: "update",
                  icon: FiRefreshCw,
                  label: "Update",
                  color: "success",
                  bg: "hover:bg-success/10 hover:text-success",
                },
                {
                  id: "migrate",
                  icon: FiArrowUpCircle,
                  label: "Migrate",
                  color: "warning",
                  bg: "hover:bg-warning/10 hover:text-warning",
                  disabled: !isMigrationRequired || migrating,
                  onClick: runMigration,
                  loading: migrating,
                },
              ].map((tool) => (
                <button
                  key={tool.id}
                  className={`btn btn-ghost bg-base-200/40 ${tool.bg} flex flex-col items-center justify-center gap-2 rounded-2xl h-24 border-none transition-all group w-full`}
                  disabled={props.running || tool.disabled}
                  onClick={
                    tool.onClick || (() => props.onRunAction(tool.id as any))
                  }
                >
                  <div className="w-10 h-10 rounded-xl bg-base-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                    {tool.loading ? (
                      <span className="loading loading-spinner loading-xs text-warning"></span>
                    ) : (
                      <tool.icon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <span className="text-[11px] font-black tracking-tight">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Project Health Section */}
          <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <FiActivity className="w-3.5 h-3.5" /> Project Health
              </h3>
              <button
                onClick={checkProjectHealth}
                className={`btn btn-ghost btn-xs btn-circle h-7 w-7 min-h-0 ${checkingHealth ? "animate-spin" : "opacity-30 hover:opacity-100 bg-base-200/50"}`}
              >
                <FiRefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-base-200/30 border border-base-200/50 group transition-all hover:bg-base-200/50">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all ${nodeModulesExist ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                >
                  {nodeModulesExist ? (
                    <FiCheckCircle className="w-5 h-5" />
                  ) : (
                    <FiAlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider">
                    Dependencies
                  </div>
                  <div className="text-[10px] opacity-50 font-bold">
                    {nodeModulesExist
                      ? "Ready to build"
                      : "Missing node_modules"}
                  </div>
                </div>
              </div>

              {!nodeModulesExist && nodeModulesExist !== null && (
                <div className="p-4 rounded-2xl bg-error/5 border border-error/10 text-error flex flex-col gap-3">
                  <p className="text-[10px] leading-relaxed font-bold">
                    Dependencies not found.
                  </p>
                  <button
                    onClick={() => onRunAction("install")}
                    disabled={running}
                    className="btn btn-error btn-sm w-full text-[10px] rounded-xl h-8 font-black"
                  >
                    {running && currentAction === "install" ? (
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                    ) : (
                      <FiDownload className="w-3.5 h-3.5 mr-2" />
                    )}
                    RUN INSTALL
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-base-200/30 border border-base-200/50 group transition-all hover:bg-base-200/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm transition-all">
                  <FiHash className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider">
                    Plugins
                  </div>
                  <div className="text-[10px] opacity-50 font-bold">
                    {activeProject?.plugins_count || 0} packages installed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environment & Packages Section */}
          <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <FiCpu className="w-3.5 h-3.5" /> Environment
              </h3>
              <div
                className={`badge badge-sm text-[8px] h-4 font-bold border-none ${
                  packageJsonError
                    ? "bg-error/10 text-error"
                    : packagesHealth === "healthy"
                      ? "bg-success/10 text-success"
                      : packagesHealth === "outdated"
                        ? "bg-warning/10 text-warning"
                        : "bg-base-200 text-base-content/30"
                }`}
              >
                {packageJsonError ? "ERROR" : packagesHealth.toUpperCase()}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                {corePackages.map((name) => {
                  const currentRange = projectPackages[name] ?? null;
                  const check = packageChecks[name];
                  const isLoading =
                    checkingPackages || check?.status === "loading";
                  const isOutdated = check?.status === "outdated";

                  return (
                    <div
                      key={name}
                      className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-base-200/30 border border-base-200/50 group transition-all hover:bg-base-200/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black truncate opacity-60">
                          {name.replace("@nativescript/", "")}
                        </span>
                        {isOutdated && (
                          <button
                            className="btn btn-primary btn-xs h-5 min-h-0 text-[8px] rounded-lg px-2 font-black"
                            disabled={props.running || updatingPackages[name]}
                            onClick={() => updateSinglePackage(name)}
                          >
                            {updatingPackages[name] ? "..." : "UPDATE"}
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] font-mono font-bold truncate flex items-center gap-1.5">
                        {isLoading ? (
                          <span className="opacity-40">Checking...</span>
                        ) : !currentRange ? (
                          <span className="opacity-40">Not installed</span>
                        ) : isOutdated ? (
                          <>
                            <span className="text-error">{currentRange}</span>
                            <span className="opacity-20">→</span>
                            <span className="text-success">
                              {check?.latest}
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="opacity-40">{currentRange}</span>
                            <div className="flex items-center gap-1 text-[8px] text-success/60 font-black uppercase tracking-wider">
                              <FiCheckCircle className="w-2.5 h-2.5" />
                              Up to date
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowSystemModal(true)}
                className="btn btn-ghost btn-block btn-xs text-[9px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 mt-2 h-8 rounded-xl bg-base-200/30 border-none transition-all"
              >
                Full Package Report
              </button>
            </div>
          </div>

          {/* Utilities Section */}
          <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-5 flex items-center gap-2">
              <FiCommand className="w-3.5 h-3.5" /> Quick Tools
            </h3>
            <div className="flex flex-col gap-2.5">
              <button
                className="btn btn-ghost bg-base-200/40 hover:bg-primary/10 hover:text-primary justify-start gap-4 rounded-2xl h-auto py-3 px-4 border-none group transition-all"
                onClick={() => props.setRoute("app-resources")}
              >
                <div className="w-10 h-10 rounded-xl bg-base-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <FiLayers className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-left">
                  <div className="font-black text-sm">App Resources</div>
                  <div className="text-[10px] opacity-50 font-bold">
                    Icons & Splash Screens
                  </div>
                </div>
              </button>

              <button
                className="btn btn-ghost bg-base-200/40 hover:bg-error/10 hover:text-error justify-start gap-4 rounded-2xl h-auto py-3 px-4 border-none group transition-all"
                disabled={props.running}
                onClick={async () => {
                  await props.onRunAction("clean");
                  checkProjectHealth();
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-base-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <FiRefreshCw
                    className={`w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity ${props.running && props.currentAction === "clean" ? "animate-spin" : ""}`}
                  />
                </div>
                <div className="text-left">
                  <div className="font-black text-sm">Clean Project</div>
                  <div className="text-[10px] opacity-50 font-bold">
                    Wipe build artifacts
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Project Environment Report Modal */}
      {showSystemModal && (
        <div className="modal modal-open bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="modal-box w-11/12 max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden border border-base-200 shadow-2xl rounded-[2.5rem] bg-base-100">
            {/* Header */}
            <div className="px-8 py-6 border-b border-base-200 flex items-center justify-between bg-base-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <FiPackage className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-2xl tracking-tight text-base-content">
                    Environment Report
                  </h3>
                  <p className="text-[10px] text-base-content/40 font-black uppercase tracking-[0.2em] mt-1.5">
                    Package Dependencies Comparison
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSystemModal(false)}
                className="btn btn-ghost btn-md btn-circle hover:bg-base-200 transition-colors"
              >
                <FiX className="w-6 h-6 opacity-40" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <section>
                <h4 className="text-lg font-bold text-base-content flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FiInfo className="w-4 h-4" />
                  </div>
                  Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Total Packages",
                      value: Object.keys(projectPackages).length,
                      icon: <FiPackage className="w-4 h-4" />,
                      color: "primary",
                    },
                    {
                      label: "Outdated",
                      value: outdatedPackages.length,
                      icon: <FiAlertTriangle className="w-4 h-4" />,
                      color:
                        outdatedPackages.length > 0 ? "warning" : "success",
                      warning: outdatedPackages.length > 0,
                    },
                    {
                      label: "Health Status",
                      value: packagesHealth.toUpperCase(),
                      icon: <FiCheckCircle className="w-4 h-4" />,
                      color:
                        packagesHealth === "healthy" ? "success" : "warning",
                      success: packagesHealth === "healthy",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-base-200/40 border border-base-200/60 rounded-2xl p-5 transition-all hover:bg-base-200/70 hover:shadow-md group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg bg-${stat.color}/10 text-${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}
                        >
                          {stat.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/30">
                          {stat.label}
                        </span>
                      </div>
                      <div
                        className={`text-xl font-black tracking-tight ${stat.warning ? "text-warning" : stat.success ? "text-success" : stat.color === "primary" ? "text-primary" : "text-base-content"}`}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h4 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FiPackage className="w-4 h-4" />
                    </div>
                    Installed Packages
                  </h4>
                  {outdatedPackages.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary rounded-xl px-4 h-10 gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                      disabled={
                        props.running ||
                        bulkUpdatingPackages ||
                        checkingPackages
                      }
                      onClick={() =>
                        updateAllOutdatedPackages(outdatedPackages)
                      }
                    >
                      {bulkUpdatingPackages ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <FiArrowUpCircle className="w-4 h-4" />
                      )}
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Update All Outdated
                      </span>
                    </button>
                  )}
                </div>

                {packageJsonError ? (
                  <div className="bg-error/5 border border-error/10 rounded-2xl p-6 text-center">
                    <FiAlertTriangle className="w-8 h-8 text-error mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-bold text-error opacity-70">
                      Failed to read package.json
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {Object.keys(projectPackages)
                      .sort((a, b) => a.localeCompare(b))
                      .map((name) => {
                        const currentRange = projectPackages[name] ?? null;
                        const check = packageChecks[name];
                        const isLoading =
                          checkingPackages || check?.status === "loading";
                        const isOutdated = check?.status === "outdated";
                        const isUpdating = updatingPackages[name] || false;

                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between gap-4 bg-base-200/40 border border-base-200/60 rounded-2xl px-5 py-4 group hover:bg-base-200/70 hover:border-primary/30 transition-all hover:shadow-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold truncate mb-1 text-base-content/90">
                                {name}
                              </div>
                              <div className="text-xs font-mono flex items-center gap-2">
                                {currentRange ? (
                                  isLoading ? (
                                    <span className="flex items-center gap-2 text-primary font-medium">
                                      <span className="loading loading-spinner loading-[12px]"></span>
                                      Checking…
                                    </span>
                                  ) : isOutdated ? (
                                    <span className="flex items-center gap-2">
                                      <span className="text-warning font-medium line-through decoration-warning/30">
                                        {currentRange}
                                      </span>
                                      <FiArrowUpCircle className="w-3 h-3 text-success" />
                                      <span className="text-success font-bold bg-success/20 px-1.5 py-0.5 rounded text-[10px]">
                                        {check?.latest}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-2 text-base-content/60">
                                      <span className="font-medium">
                                        {currentRange}
                                      </span>
                                      <span className="text-[10px] text-success font-black uppercase tracking-wider flex items-center gap-1 bg-success/20 px-1.5 py-0.5 rounded">
                                        <FiCheckCircle className="w-3 h-3" />
                                        latest
                                      </span>
                                    </span>
                                  )
                                ) : (
                                  <span className="text-base-content/30 font-medium italic text-xs">
                                    N/A
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {isOutdated && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary rounded-xl px-4 h-9 gap-2 shadow-lg shadow-primary/30 hover:scale-105 transition-all"
                                  disabled={
                                    props.running ||
                                    isUpdating ||
                                    bulkUpdatingPackages
                                  }
                                  onClick={() => updateSinglePackage(name)}
                                >
                                  {isUpdating ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <FiArrowUpCircle className="w-4 h-4" />
                                  )}
                                  <span className="text-[10px] font-black uppercase tracking-wider">
                                    Update
                                  </span>
                                </button>
                              )}
                              <span
                                className={`badge badge-sm font-black border-none px-2.5 py-3 rounded-lg text-[10px] ${
                                  check?.status === "upToDate"
                                    ? "bg-success/20 text-success"
                                    : check?.status === "outdated"
                                      ? "bg-warning/20 text-warning"
                                      : check?.status === "error"
                                        ? "bg-error/20 text-error"
                                        : "bg-base-300 text-base-content/60"
                                } opacity-80 group-hover:opacity-100 transition-opacity shadow-sm`}
                              >
                                {check?.status === "loading"
                                  ? "…"
                                  : check?.status === "upToDate"
                                    ? "UP TO DATE"
                                    : (check?.status || "WAIT").toUpperCase()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </section>
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
