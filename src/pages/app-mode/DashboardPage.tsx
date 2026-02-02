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
};

export function DashboardPage(props: DashboardPageProps) {
  const {
    running,
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

    // Check from database (analyzer results)
    if (activeProject?.platforms) {
      activeProject.platforms
        .split(",")
        .forEach((p) => platforms.add(p.trim().toLowerCase()));
    }

    // Check from package.json packages
    if (projectPackages["@nativescript/android"]) {
      platforms.add("android");
    }
    if (projectPackages["@nativescript/ios"]) {
      platforms.add("ios");
    }

    return Array.from(platforms);
  }, [activeProject, projectPackages]);

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
      <div className="bg-base-100 border border-base-200 rounded-[2rem] p-4 md:p-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-6 opacity-[0.01] pointer-events-none">
          <FiPackage className="w-24 h-24" />
        </div>

        <div className="flex items-center gap-4 z-10 w-full xl:w-auto group">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0 overflow-hidden border border-primary/10 shadow-inner">
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
              <FiPackage className="w-6 h-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-black tracking-tight truncate">
                {activeProject?.name}
              </h1>
              <div className="badge badge-primary badge-sm font-bold uppercase text-[8px] h-4 flex-shrink-0">
                {activeProject?.framework || "NativeScript"}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-base-content/40 font-medium group/path">
              <FiFolder className="w-2.5 h-2.5 shrink-0" />
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
                className="btn btn-ghost btn-xs btn-square h-4 w-4 min-h-0 opacity-0 group-hover/path:opacity-100 transition-opacity flex-shrink-0"
                title="Copy Path"
              >
                <FiCopy className="w-2 h-2" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 z-10 w-full xl:w-auto justify-start xl:justify-end pl-[72px] xl:pl-0">
          <div className="flex items-center gap-6">
            <div className="text-left xl:text-right">
              <div className="text-[8px] font-bold uppercase tracking-widest opacity-30">
                NativeScript
              </div>
              <div className="font-bold text-[11px] flex items-center xl:justify-end gap-1">
                v{activeProject?.nativescript_version || "Latest"}
                {isNsVersionOutdated && (
                  <FiAlertTriangle className="w-2.5 h-2.5 text-warning" />
                )}
              </div>
            </div>
            <div className="text-left xl:text-right">
              <div className="text-[8px] font-bold uppercase tracking-widest opacity-30">
                Platforms
              </div>
              <div className="flex gap-1 xl:justify-end">
                {projectPlatforms.includes("android") && (
                  <SiAndroid className="w-2.5 h-2.5 opacity-40" />
                )}
                {projectPlatforms.includes("ios") && (
                  <SiApple className="w-2.5 h-2.5 opacity-40" />
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:flex w-px h-6 bg-base-200 opacity-50"></div>

          <div className="flex items-center gap-6">
            <div className="text-left xl:text-right">
              <div className="text-[8px] font-bold uppercase tracking-widest opacity-30">
                Created
              </div>
              <div className="font-bold text-[11px] opacity-60 whitespace-nowrap">
                {createdAtStr}
              </div>
            </div>
            <div className="text-left xl:text-right">
              <div className="text-[8px] font-bold uppercase tracking-widest opacity-30">
                Last Open
              </div>
              <div className="font-bold text-[11px] opacity-60 whitespace-nowrap">
                {lastOpenedStr}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Column */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Action Grid - Organized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                  <FiZap className="w-3.5 h-3.5 text-warning" /> Debugging &
                  Development
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    className={`btn btn-xs rounded-lg px-2 gap-1.5 h-7 min-h-0 transition-all border-none ${
                      projectPlatforms.includes("android")
                        ? "btn-primary shadow-sm"
                        : "bg-base-200 text-base-content/20 cursor-not-allowed"
                    }`}
                    disabled={
                      props.running || !projectPlatforms.includes("android")
                    }
                    onClick={() => props.onRunAction("run-android")}
                  >
                    <SiAndroid
                      className={`w-3 h-3 ${projectPlatforms.includes("android") ? "text-white" : "opacity-20"}`}
                    />
                    <span className="text-[10px] font-bold whitespace-nowrap">
                      {projectPlatforms.includes("android")
                        ? "Run"
                        : "Not Available"}
                    </span>
                  </button>

                  <button
                    className={`btn btn-xs rounded-lg px-2 gap-1.5 h-7 min-h-0 transition-all border-none ${
                      projectPlatforms.includes("ios")
                        ? "btn-primary shadow-sm"
                        : "bg-base-200 text-base-content/20 cursor-not-allowed"
                    }`}
                    disabled={
                      props.running || !projectPlatforms.includes("ios")
                    }
                    onClick={() => props.onRunAction("run-ios")}
                  >
                    <SiApple
                      className={`w-3 h-3 ${projectPlatforms.includes("ios") ? "text-white" : "opacity-20"}`}
                    />
                    <span className="text-[10px] font-bold whitespace-nowrap">
                      {projectPlatforms.includes("ios")
                        ? "Run"
                        : "Not Available"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 flex-1">
                {projectPlatforms.includes("android") ? (
                  <button
                    className="btn btn-outline border-base-200 hover:bg-warning/10 hover:text-warning hover:border-warning/30 justify-start gap-3.5 rounded-2xl h-auto py-3 px-4 group transition-all w-full"
                    disabled={props.running}
                    onClick={() => props.onRunAction("debug-android")}
                  >
                    <div className="w-10 h-10 bg-base-200/50 group-hover:bg-warning/20 rounded-xl flex items-center justify-center transition-colors">
                      <SiAndroid className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">Debug Android</div>
                      <div className="text-[10px] opacity-40 font-normal">
                        Chrome DevTools & Inspector
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    className="btn btn-outline border-base-200 hover:bg-primary/10 hover:text-primary hover:border-primary/30 justify-start gap-3.5 rounded-2xl h-auto py-3 px-4 group transition-all w-full"
                    disabled={props.running}
                    onClick={() => props.onRunAction("platform-add-android")}
                  >
                    <div className="w-10 h-10 bg-base-200/50 group-hover:bg-primary/20 rounded-xl flex items-center justify-center transition-colors">
                      <SiAndroid className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">
                        Add Android Platform
                      </div>
                      <div className="text-[10px] text-primary font-medium animate-pulse">
                        Package @nativescript/android is required. Click to
                        install.
                      </div>
                    </div>
                  </button>
                )}
                {projectPlatforms.includes("ios") ? (
                  <button
                    className="btn btn-outline border-base-200 hover:bg-warning/10 hover:text-warning hover:border-warning/30 justify-start gap-3.5 rounded-2xl h-auto py-3 px-4 group transition-all w-full"
                    disabled={props.running}
                    onClick={() => props.onRunAction("debug-ios")}
                  >
                    <div className="w-10 h-10 bg-base-200/50 group-hover:bg-warning/20 rounded-xl flex items-center justify-center transition-colors">
                      <SiApple className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">Debug iOS</div>
                      <div className="text-[10px] opacity-40 font-normal">
                        Safari Web Inspector
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    className="btn btn-outline border-base-200 hover:bg-primary/10 hover:text-primary hover:border-primary/30 justify-start gap-3.5 rounded-2xl h-auto py-3 px-4 group transition-all w-full"
                    disabled={props.running}
                    onClick={() => props.onRunAction("platform-add-ios")}
                  >
                    <div className="w-10 h-10 bg-base-200/50 group-hover:bg-primary/20 rounded-xl flex items-center justify-center transition-colors">
                      <SiApple className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">Add iOS Platform</div>
                      <div className="text-[10px] text-primary font-medium animate-pulse">
                        Package @nativescript/ios is required. Click to install.
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 mb-5">
                <FiBox className="w-3.5 h-3.5 text-primary" /> App Distribution
              </h3>
              <div className="flex flex-col h-full justify-center">
                <button
                  className="btn btn-primary justify-start gap-4 rounded-3xl h-full min-h-[116px] py-5 px-6 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all group w-full"
                  disabled={props.running}
                  onClick={props.onOpenBuildModal}
                >
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiPackage className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-base">Build Project</div>
                    <div className="text-xs opacity-80 font-medium">
                      Generate APK/AAB or IPA release
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm md:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
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
                  },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    className={`btn btn-ghost bg-base-200/40 ${tool.bg} flex flex-col items-center justify-center gap-2 rounded-2xl h-24 border-none transition-all group w-full`}
                    disabled={props.running}
                    onClick={() => props.onRunAction(tool.id as any)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-base-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <tool.icon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[11px] font-black tracking-tight">
                      {tool.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Project Health Section */}
          <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
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
                  <div className="text-[11px] font-black">Dependencies</div>
                  <div className="text-[10px] opacity-40 font-medium">
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
                  <div className="text-[11px] font-black">Plugins</div>
                  <div className="text-[10px] opacity-40 font-medium">
                    {activeProject?.plugins_count || 0} packages installed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environment & Packages Section */}
          <div className="bg-base-100 border border-base-200 rounded-[2rem] p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
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
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-5 flex items-center gap-2">
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
                  <div className="font-black text-xs">App Resources</div>
                  <div className="text-[10px] opacity-40 font-medium">
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
                  <div className="font-black text-xs">Clean Project</div>
                  <div className="text-[10px] opacity-40 font-medium">
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
        <div className="modal modal-open bg-black/40 backdrop-blur-sm transition-all">
          <div className="modal-box w-11/12 max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden border border-base-200 shadow-2xl rounded-[2.5rem] bg-base-100">
            <div className="p-5 md:p-6 border-b border-base-200 flex items-center justify-between bg-base-200/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiPackage className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg">
                    Environment Report
                  </h3>
                  <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">
                    Package dependencies comparison
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSystemModal(false)}
                className="btn btn-ghost btn-sm btn-circle opacity-40 hover:opacity-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8">
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-4 flex items-center gap-2">
                  <FiInfo className="w-3.5 h-3.5" /> Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Total Packages",
                      value: Object.keys(projectPackages).length,
                    },
                    {
                      label: "Outdated",
                      value: outdatedPackages.length,
                      warning: outdatedPackages.length > 0,
                    },
                    {
                      label: "Health Status",
                      value: packagesHealth.toUpperCase(),
                      success: packagesHealth === "healthy",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-base-200/30 border border-base-200/50 rounded-2xl p-4 transition-all hover:bg-base-200/50"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">
                        {stat.label}
                      </div>
                      <div
                        className={`text-sm font-black ${stat.warning ? "text-warning" : stat.success ? "text-success" : ""}`}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                    <FiPackage className="w-3.5 h-3.5" /> Installed Packages
                  </h4>
                  {outdatedPackages.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-xs btn-primary rounded-xl px-3 h-8 gap-1.5 shadow-lg shadow-primary/20"
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
                        <FiArrowUpCircle className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px] font-bold uppercase">
                        Update All
                      </span>
                    </button>
                  )}
                </div>

                {packageJsonError ? (
                  <div className="bg-error/5 border border-error/10 rounded-2xl p-5 text-center">
                    <FiAlertTriangle className="w-6 h-6 text-error mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-error opacity-70">
                      Failed to read package.json
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
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
                            className="flex items-center justify-between gap-4 bg-base-200/30 border border-base-200/50 rounded-2xl px-4 py-3 group hover:bg-base-200/50 transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-black truncate mb-0.5">
                                {name}
                              </div>
                              <div className="text-[10px] opacity-40 font-mono flex items-center gap-1.5">
                                {currentRange ? (
                                  isLoading ? (
                                    <span className="flex items-center gap-1.5">
                                      <span className="loading loading-spinner loading-[10px]"></span>{" "}
                                      Checking…
                                    </span>
                                  ) : isOutdated ? (
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-error">
                                        {currentRange}
                                      </span>{" "}
                                      <FiArrowUpCircle className="w-2.5 h-2.5" />{" "}
                                      <span className="text-success font-bold">
                                        {check?.latest}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-2">
                                      <span className="opacity-40">
                                        {currentRange}
                                      </span>
                                      <span className="text-[8px] text-success/60 font-black uppercase tracking-wider flex items-center gap-1">
                                        <FiCheckCircle className="w-2.5 h-2.5" />{" "}
                                        Up to date
                                      </span>
                                    </span>
                                  )
                                ) : (
                                  "Not installed"
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {isOutdated && (
                                <button
                                  className="btn btn-primary btn-xs h-7 min-h-0 text-[9px] font-bold rounded-lg px-3 shadow-md shadow-primary/10"
                                  disabled={props.running || isUpdating}
                                  onClick={() => updateSinglePackage(name)}
                                >
                                  {isUpdating ? "..." : "UPDATE"}
                                </button>
                              )}
                              <span
                                className={`badge badge-xs text-[8px] h-4 font-bold border-none ${
                                  check?.status === "upToDate"
                                    ? "bg-success/10 text-success"
                                    : check?.status === "outdated"
                                      ? "bg-warning/10 text-warning"
                                      : check?.status === "error"
                                        ? "bg-error/10 text-error"
                                        : "bg-base-200 text-base-content/30"
                                } opacity-40 group-hover:opacity-100 transition-opacity`}
                              >
                                {check?.status === "loading"
                                  ? "…"
                                  : check?.status === "upToDate"
                                    ? "UPTODATE"
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
