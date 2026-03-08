import { useMemo, useState, useEffect, useRef } from "react";
import type {
  ProjectRow,
  BuildConfig,
  RunConfig,
  Route,
} from "../../shared/types";
import { parsePlatforms } from "../../shared/platforms";
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
  FiFolder,
  FiActivity,
  FiRefreshCw,
  FiAlertTriangle,
  FiInfo,
  FiHash,
  FiShield,
  FiArrowUpCircle,
  FiLayers,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import { LuRocket } from "react-icons/lu";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  PlatformStatus,
  isAndroid,
  isIos,
} from "../../shared/platformDetection";
import { FlavorIcon } from "../../components/FlavorIcon";

export interface InstalledPlugin {
  name: string;
  version: string;
  type: "plugin" | "common module";
  source: "Dependencies" | "Dev Dependencies";
}

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
  onOpenRunModal: (
    platform: "android" | "ios" | null,
    action?: "run" | "debug",
  ) => void;
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
    config?: BuildConfig | RunConfig,
    sourcePath?: string,
    backgroundColor?: string,
  ) => Promise<string | void>;
  onRunNpm: (args: string[], cwd?: string) => Promise<void>;
  currentAction: string | null;
  setRoute: (route: Route) => void;
  onRouteToSetup?: () => void;
  onRefreshProject?: (path: string) => Promise<void>;
  isMac: boolean;
  platformStatus: PlatformStatus;
};

export function DashboardPage(props: DashboardPageProps) {
  const { running, onRunAction, onRunNpm, platformStatus } = props;
  const [nodeModulesExist, setNodeModulesExist] = useState<boolean | null>(
    null,
  );
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showMaintenanceActions, setShowMaintenanceActions] = useState(false);
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
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>(
    [],
  );
  const [modalTab, setModalTab] = useState<"plugins" | "common" | "dev">(
    "plugins",
  );
  const [useLegacyPeerDeps, setUseLegacyPeerDeps] = useState(false);
  const [useForce, setUseForce] = useState(false);
  const [selectedOutdated, setSelectedOutdated] = useState<Set<string>>(
    new Set(),
  );

  const togglePackageSelection = (pkgName: string) => {
    setSelectedOutdated((prev) => {
      const next = new Set(prev);
      if (next.has(pkgName)) next.delete(pkgName);
      else next.add(pkgName);
      return next;
    });
  };

  const toggleAllOutdated = (allOutdated: string[]) => {
    if (
      selectedOutdated.size === allOutdated.length &&
      allOutdated.length > 0
    ) {
      setSelectedOutdated(new Set());
    } else {
      setSelectedOutdated(new Set(allOutdated));
    }
  };

  // Keep selection clean when packages change
  useEffect(() => {
    setSelectedOutdated((prev) => {
      const next = new Set(prev);
      let changed = false;
      const validOutdated = Object.entries(packageChecks)
        .filter(([, v]) => v.status === "outdated")
        .map(([name]) => name);
      for (const item of next) {
        if (!validOutdated.includes(item)) {
          next.delete(item);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [packageChecks]);

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

    // Initial small delay to let page transition finish
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (packageCheckRunIdRef.current !== runId) return;

    try {
      // Use scan_ns_plugins for better data consistency with PluginsPage
      // Always call scan_ns_plugins to ensure we get the latest data from package.json/node_modules
      let scannedPlugins: InstalledPlugin[] = [];

      try {
        scannedPlugins = await invoke<InstalledPlugin[]>("scan_ns_plugins", {
          projectPath: path,
        });
      } catch (err) {
        console.error("Failed to fetch plugins from scan_ns_plugins:", err);
        // Fallback to basic package retrieval if scan fails
        const basicPackages = (await invoke("get_project_packages", {
          projectPath: path,
        })) as Record<string, string>;
        scannedPlugins = Object.entries(basicPackages).map(
          ([name, version]) => ({
            name,
            version,
            type: "common module",
            source: "Dependencies",
          }),
        );
      }

      setInstalledPlugins(scannedPlugins);

      // Map to Record<string, string> for compatibility with existing check logic
      const all: Record<string, string> = {};
      scannedPlugins.forEach((p) => {
        all[p.name] = p.version;
      });
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
      // Process in smaller batches
      for (let i = 0; i < queue.length; i += 4) {
        if (packageCheckRunIdRef.current !== runId) return;
        const batch = queue.slice(i, i + 4);
        await Promise.all(
          batch.map(async (name) => {
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
          }),
        );
        // Small yield between batches to keep UI responsive
        await new Promise((r) => setTimeout(r, 50));
      }
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
      const args = ["install", `${packageName}@latest`];
      if (useLegacyPeerDeps) args.push("--legacy-peer-deps");
      if (useForce) args.push("--force");
      await onRunNpm(args, props.projectPath);
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
          const args = ["install", `${name}@latest`];
          if (useLegacyPeerDeps) args.push("--legacy-peer-deps");
          if (useForce) args.push("--force");
          await onRunNpm(args, props.projectPath);
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
    return parsePlatforms(activeProject?.platforms || null);
  }, [activeProject]);

  const [migrating, setMigrating] = useState(false);

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
        ["install", "@nativescript/core@latest", "--legacy-peer-deps"],
        props.projectPath,
      );

      // 5. install latest android if exists
      if (projectPlatforms.includes("android")) {
        await onRunNpm(
          ["install", "@nativescript/android@latest", "--legacy-peer-deps"],
          props.projectPath,
        );
      }

      // 6. install latest ios if exists
      if (projectPlatforms.includes("ios")) {
        await onRunNpm(
          ["install", "@nativescript/ios@latest", "--legacy-peer-deps"],
          props.projectPath,
        );
      }

      // 7. install latest webpack
      await onRunNpm(
        ["install", "@nativescript/webpack@latest", "--legacy-peer-deps"],
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

  const renderPackageRow = (pkg: InstalledPlugin) => {
    const currentRange = projectPackages[pkg.name] ?? null;
    const check = packageChecks[pkg.name];
    const isLoading = checkingPackages || check?.status === "loading";
    const isOutdated = check?.status === "outdated";
    const isUpdating = updatingPackages[pkg.name] || false;

    return (
      <div
        key={pkg.name}
        className={`flex items-center justify-between gap-4 bg-base-200/40 border ${isOutdated && selectedOutdated.has(pkg.name) ? "border-primary/50 bg-primary/5" : "border-base-200/60"} rounded-2xl px-5 py-4 group hover:bg-base-200/70 hover:border-primary/30 transition-all hover:shadow-sm`}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {isOutdated && (
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary rounded shrink-0 transition-transform hover:scale-110"
              checked={selectedOutdated.has(pkg.name)}
              disabled={props.running || isUpdating || bulkUpdatingPackages}
              onChange={() => togglePackageSelection(pkg.name)}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-bold truncate text-base-content/90">
                {pkg.name}
              </div>
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
                    <span className="font-medium">{currentRange}</span>
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
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isOutdated && (
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-xl px-4 h-9 gap-2 shadow-lg shadow-primary/30 hover:scale-105 transition-all"
              disabled={props.running || isUpdating || bulkUpdatingPackages}
              onClick={() => updateSinglePackage(pkg.name)}
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
  };

  const renderPackageRowReadOnly = (pkg: InstalledPlugin) => {
    const currentRange = projectPackages[pkg.name] ?? null;
    const check = packageChecks[pkg.name];
    const isLoading = checkingPackages || check?.status === "loading";
    const isOutdated = check?.status === "outdated";

    return (
      <div
        key={pkg.name}
        className={`flex items-center justify-between gap-4 bg-base-200/40 border ${
          isOutdated ? "border-warning/30" : "border-base-200/60"
        } rounded-2xl px-5 py-4 group hover:bg-base-200/70 transition-all hover:shadow-sm`}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-bold truncate text-base-content/90">
                {pkg.name}
              </div>
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
                    <span className="font-medium">{currentRange}</span>
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
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
  };

  // Detect if project uses a flavor that may have 'overrides' in package.json
  const hasOverridesWarning = useMemo(() => {
    const flavor = activeProject?.framework?.toLowerCase() ?? "";
    return flavor.includes("react") || flavor.includes("svelte");
  }, [activeProject]);

  // Manage Package Manager section tab
  const [pmTab, setPmTab] = useState<"plugins" | "common" | "dev">("plugins");

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
      <div className="bg-base-100 border border-base-200 rounded-[2.5rem] p-6 md:p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative shadow-sm">
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
              <div className="flex-shrink-0">
                <FlavorIcon
                  framework={activeProject?.framework}
                  showLabel={true}
                  iconClassName="w-3.5 h-3.5"
                  className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                />
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
                  <span className="text-sm font-bold opacity-30">None</span>
                ) : (
                  projectPlatforms.map((p) => {
                    const status = isAndroid(p)
                      ? platformStatus.android
                      : platformStatus.ios;
                    return (
                      <div
                        key={p}
                        className="tooltip tooltip-left before:text-[10px] before:font-bold z-20"
                        data-tip={
                          status.available
                            ? `Platform ${p} is ready to use.`
                            : status.reason || `Platform ${p} is not available.`
                        }
                      >
                        {isAndroid(p) ? (
                          <SiAndroid
                            className={`w-5 h-5 transition-colors ${status.available ? "text-success" : "text-error opacity-40"}`}
                          />
                        ) : isIos(p) ? (
                          <SiApple
                            className={`w-5 h-5 transition-colors ${status.available ? "text-base-content" : "text-error opacity-40"}`}
                          />
                        ) : null}
                      </div>
                    );
                  })
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

      <div className="grid grid-cols-1 gap-5">
        {/* Main Column */}
        <div className="flex flex-col gap-5">
          {/* Quick Actions - Combined Launch and Build */}
          <div className="bg-base-100 border border-base-200 rounded-[2.5rem] p-4 sm:p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <FiZap className="w-3.5 h-3.5 text-primary" /> Quick Actions
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {/* Launch Button */}
              <div className="relative group/launch flex">
                <button
                  className="btn h-full py-5 px-6 rounded-2xl border-none transition-all flex items-center justify-between group w-full bg-gradient-to-r from-success/10 to-primary/5 text-base-content hover:from-success/20 hover:to-primary/10 shadow-sm hover:shadow-md active:scale-[0.98] disabled:bg-base-200 disabled:text-base-content/20"
                  disabled={props.running}
                  onClick={() => props.onOpenRunModal(null, "run")}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all bg-success text-white shadow-lg shadow-success/20 group-disabled:bg-base-300 group-disabled:shadow-none">
                      <LuRocket className="w-6 h-6" />
                    </div>
                    <div className="text-left truncate">
                      <div className="font-bold text-lg tracking-tight truncate">
                        Launch App
                      </div>
                      <div className="text-[10px] opacity-50 font-black uppercase tracking-wider mt-0.5 truncate">
                        Run on Device
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex -space-x-2">
                      {platformStatus.android.available && (
                        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center border-2 border-base-100 shadow-sm">
                          <SiAndroid className="w-3 h-3 text-success" />
                        </div>
                      )}
                      {platformStatus.ios.available && (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-base-100 shadow-sm">
                          <SiApple className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                    <FiChevronRight className="w-5 h-5 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              </div>

              {/* Build Button */}
              <div className="relative group/build flex">
                <button
                  className="btn h-full py-5 px-6 rounded-2xl border-none bg-gradient-to-r from-primary/10 to-primary/5 text-base-content hover:from-primary/20 hover:to-primary/10 shadow-sm hover:shadow-md transition-all flex items-center justify-between group w-full"
                  disabled={props.running}
                  onClick={props.onOpenBuildModal}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                      <FiPackage className="w-6 h-6" />
                    </div>
                    <div className="text-left truncate">
                      <div className="font-bold text-lg tracking-tight text-base-content truncate">
                        Build Project
                      </div>
                      <div className="text-[10px] opacity-50 font-black uppercase tracking-wider mt-0.5 truncate">
                        Generate APK/AAB/IPA
                      </div>
                    </div>
                  </div>
                  <FiChevronRight className="w-5 h-5 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Project Health Section */}
          <div className="bg-base-100 border border-base-200 rounded-[2.5rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <FiActivity className="w-3.5 h-3.5 text-success" /> Project
                Health & Status
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[9px] font-bold opacity-40">
                  <span>
                    {installedPlugins.filter((p) => p.type === "plugin").length}{" "}
                    plugins
                  </span>
                  <span className="opacity-30">·</span>
                  <span>
                    {
                      installedPlugins.filter((p) => p.type === "common module")
                        .length
                    }{" "}
                    modules
                  </span>
                </div>
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
            </div>

            <div className="mt-6 pt-5 border-t border-base-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {corePackages.map((name) => {
                  const currentRange = projectPackages[name] ?? null;
                  const check = packageChecks[name];
                  const isLoading =
                    checkingPackages || check?.status === "loading";
                  const isOutdated = check?.status === "outdated";

                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-base-200/30 border border-base-200/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isLoading
                              ? "bg-base-300 animate-pulse"
                              : !currentRange
                                ? "bg-base-300"
                                : isOutdated
                                  ? "bg-warning"
                                  : "bg-success"
                          }`}
                        />
                        <span className="text-xs font-bold truncate">
                          {name.replace("@nativescript/", "")}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono font-bold truncate flex items-center gap-1.5 flex-shrink-0">
                        {isLoading ? (
                          <span className="opacity-40">Checking...</span>
                        ) : !currentRange ? (
                          <span className="opacity-30 text-[9px]">
                            Not installed
                          </span>
                        ) : isOutdated ? (
                          <>
                            <span className="text-error line-through opacity-60">
                              {currentRange}
                            </span>
                            <span className="text-success font-black">
                              {check?.latest}
                            </span>
                          </>
                        ) : (
                          <span className="opacity-50">{currentRange}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setShowSystemModal(true)}
                className="btn btn-ghost btn-block btn-xs text-[9px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 mt-3 h-8 rounded-xl bg-base-200/30 border-none transition-all"
              >
                Full Environment Report
              </button>
            </div>
          </div>

          {/* Maintenance & Package Manager Section */}
          <div className="bg-base-100 border border-base-200 rounded-[2.5rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <FiPackage className="w-3.5 h-3.5" /> Maintenance & Package
                Manager
              </h3>
            </div>

            {/* Maintenance Actions Banner */}
            <div className="bg-info/5 border border-info/10 rounded-2xl p-4 flex items-center justify-between mb-8 group transition-all hover:bg-info/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center shadow-sm">
                  <FiShield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-black tracking-tight">
                    Maintenance Actions
                  </div>
                  <div className="text-[10px] opacity-60 font-bold leading-relaxed">
                    Doctor, Updates, Migration & Clean Project
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowMaintenanceActions(true)}
                disabled={running}
                className="btn btn-info btn-sm rounded-xl font-black shadow-lg shadow-info/20 text-[10px] uppercase tracking-wider pt-0"
              >
                Open Maintenance
              </button>
            </div>

            <div className="border-t border-base-200 pt-6">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                  <FiPackage className="w-3.5 h-3.5" /> Project Dependencies
                </h4>
                {outdatedPackages.length > 0 && (
                  <div className="badge badge-sm text-[8px] h-4 font-bold border-none bg-warning/10 text-warning">
                    {outdatedPackages.length} OUTDATED
                  </div>
                )}
              </div>

              {/* Overrides Warning Banner */}
              {hasOverridesWarning && outdatedPackages.length > 0 && (
                <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 mb-5 flex items-start gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-xs text-base-content/70 leading-relaxed">
                    <span className="font-black text-warning">
                      Overrides Detected
                    </span>
                    <span className="mx-1">{"\u2014"}</span>
                    NativeScript React/Svelte templates include an{" "}
                    <code className="bg-base-200 px-1 py-0.5 rounded text-[10px] font-mono font-bold">
                      "overrides"
                    </code>{" "}
                    block in{" "}
                    <code className="bg-base-200 px-1 py-0.5 rounded text-[10px] font-mono font-bold">
                      package.json
                    </code>{" "}
                    to lock dependency versions. If updates fail with{" "}
                    <span className="font-bold text-error">EOVERRIDE</span>{" "}
                    error, please manually edit the{" "}
                    <code className="bg-base-200 px-1 py-0.5 rounded text-[10px] font-mono font-bold">
                      "overrides"
                    </code>{" "}
                    section in your project{"'"}s{" "}
                    <code className="bg-base-200 px-1 py-0.5 rounded text-[10px] font-mono font-bold">
                      package.json
                    </code>{" "}
                    to match the new version, or remove it entirely.
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-base-200/50 p-1 rounded-2xl border border-base-200/80 mb-5 w-fit">
                <button
                  className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                    pmTab === "plugins"
                      ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                      : "btn-ghost opacity-50 hover:opacity-100"
                  }`}
                  onClick={() => setPmTab("plugins")}
                >
                  <FiPackage className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Plugins
                  </span>
                  <span
                    className={`badge badge-xs font-bold border-none px-1 ${
                      pmTab === "plugins"
                        ? "bg-primary-content/20 text-primary-content"
                        : "bg-base-300 text-base-content/40"
                    }`}
                  >
                    {
                      installedPlugins.filter(
                        (p) =>
                          p.type === "plugin" && p.source === "Dependencies",
                      ).length
                    }
                  </span>
                </button>
                <button
                  className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                    pmTab === "common"
                      ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                      : "btn-ghost opacity-50 hover:opacity-100"
                  }`}
                  onClick={() => setPmTab("common")}
                >
                  <FiLayers className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Modules
                  </span>
                  <span
                    className={`badge badge-xs font-bold border-none px-1 ${
                      pmTab === "common"
                        ? "bg-primary-content/20 text-primary-content"
                        : "bg-base-300 text-base-content/40"
                    }`}
                  >
                    {
                      installedPlugins.filter(
                        (p) =>
                          p.type === "common module" &&
                          p.source === "Dependencies",
                      ).length
                    }
                  </span>
                </button>
                <button
                  className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                    pmTab === "dev"
                      ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                      : "btn-ghost opacity-50 hover:opacity-100"
                  }`}
                  onClick={() => setPmTab("dev")}
                >
                  <FiCpu className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Dev
                  </span>
                  <span
                    className={`badge badge-xs font-bold border-none px-1 ${
                      pmTab === "dev"
                        ? "bg-primary-content/20 text-primary-content"
                        : "bg-base-300 text-base-content/40"
                    }`}
                  >
                    {
                      installedPlugins.filter(
                        (p) => p.source === "Dev Dependencies",
                      ).length
                    }
                  </span>
                </button>
              </div>

              {/* Package List */}
              {packageJsonError ? (
                <div className="bg-error/5 border border-error/10 rounded-2xl p-6 text-center">
                  <FiAlertTriangle className="w-8 h-8 text-error mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-bold text-error opacity-70">
                    Failed to read package.json
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                  {pmTab === "plugins" && (
                    <>
                      {installedPlugins
                        .filter(
                          (p) =>
                            p.type === "plugin" && p.source === "Dependencies",
                        )
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((pkg) => renderPackageRow(pkg))}
                      {installedPlugins.filter(
                        (p) =>
                          p.type === "plugin" && p.source === "Dependencies",
                      ).length === 0 && (
                        <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest italic">
                          No NativeScript Plugins found
                        </div>
                      )}
                    </>
                  )}
                  {pmTab === "common" && (
                    <>
                      {installedPlugins
                        .filter(
                          (p) =>
                            p.type === "common module" &&
                            p.source === "Dependencies",
                        )
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((pkg) => renderPackageRow(pkg))}
                      {installedPlugins.filter(
                        (p) =>
                          p.type === "common module" &&
                          p.source === "Dependencies",
                      ).length === 0 && (
                        <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest italic">
                          No Modules found
                        </div>
                      )}
                    </>
                  )}
                  {pmTab === "dev" && (
                    <>
                      {installedPlugins
                        .filter((p) => p.source === "Dev Dependencies")
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((pkg) => renderPackageRow(pkg))}
                      {installedPlugins.filter(
                        (p) => p.source === "Dev Dependencies",
                      ).length === 0 && (
                        <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest italic">
                          No Development Modules found
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Footer Action Bar */}
              {outdatedPackages.length > 0 && (
                <div className="mt-5 pt-5 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 mr-auto">
                    <label className="label cursor-pointer flex items-center gap-3 px-0 py-0 opacity-90 hover:opacity-100 transition-opacity group">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary rounded border-base-300 group-hover:border-primary"
                        checked={
                          selectedOutdated.size === outdatedPackages.length &&
                          outdatedPackages.length > 0
                        }
                        onChange={() => toggleAllOutdated(outdatedPackages)}
                        disabled={
                          props.running ||
                          bulkUpdatingPackages ||
                          checkingPackages
                        }
                      />
                      <span className="label-text text-sm font-black tracking-widest pl-1">
                        SELECT ALL ({selectedOutdated.size}/
                        {outdatedPackages.length})
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap justify-end">
                    <div className="flex bg-base-200/50 rounded-xl px-4 py-2 gap-5 border border-base-200">
                      <label className="label cursor-pointer flex items-center gap-2 px-0 py-0 opacity-70 hover:opacity-100 transition-opacity">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs checkbox-primary rounded"
                          checked={useLegacyPeerDeps}
                          onChange={(e) =>
                            setUseLegacyPeerDeps(e.target.checked)
                          }
                          disabled={
                            props.running ||
                            bulkUpdatingPackages ||
                            checkingPackages
                          }
                        />
                        <span className="label-text text-[10px] font-bold tracking-widest font-mono">
                          --legacy-peer-deps
                        </span>
                      </label>
                      <label className="label cursor-pointer flex items-center gap-2 px-0 py-0 opacity-70 hover:opacity-100 transition-opacity">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs checkbox-warning rounded border-warning/50"
                          checked={useForce}
                          onChange={(e) => setUseForce(e.target.checked)}
                          disabled={
                            props.running ||
                            bulkUpdatingPackages ||
                            checkingPackages
                          }
                        />
                        <span className="label-text text-[10px] font-bold tracking-widest text-warning font-mono">
                          --force
                        </span>
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary rounded-xl px-8 h-12 gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                      disabled={
                        props.running ||
                        bulkUpdatingPackages ||
                        checkingPackages ||
                        selectedOutdated.size === 0
                      }
                      onClick={() =>
                        updateAllOutdatedPackages(Array.from(selectedOutdated))
                      }
                    >
                      {bulkUpdatingPackages ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <FiArrowUpCircle className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                      )}
                      <span className="text-sm font-black uppercase tracking-widest">
                        Update Selected
                      </span>
                    </button>
                  </div>
                </div>
              )}
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
                  <p className="text-[10px] text-base-content/40 font-black uppercase tracking-[0.2em] mt-1.5 leading-relaxed">
                    Comparison of NativeScript Plugins and Modules
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
                <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
                  <div className="flex items-center gap-1 bg-base-200/50 p-1 rounded-2xl border border-base-200/80">
                    <button
                      className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                        modalTab === "plugins"
                          ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                          : "btn-ghost opacity-50 hover:opacity-100"
                      }`}
                      onClick={() => setModalTab("plugins")}
                    >
                      <FiPackage className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        Plugins
                      </span>
                      <span
                        className={`badge badge-xs font-bold border-none px-1 ${
                          modalTab === "plugins"
                            ? "bg-primary-content/20 text-primary-content"
                            : "bg-base-300 text-base-content/40"
                        }`}
                      >
                        {
                          installedPlugins.filter(
                            (p) =>
                              p.type === "plugin" &&
                              p.source === "Dependencies",
                          ).length
                        }
                      </span>
                    </button>
                    <button
                      className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                        modalTab === "common"
                          ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                          : "btn-ghost opacity-50 hover:opacity-100"
                      }`}
                      onClick={() => setModalTab("common")}
                    >
                      <FiLayers className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        Modules
                      </span>
                      <span
                        className={`badge badge-xs font-bold border-none px-1 ${
                          modalTab === "common"
                            ? "bg-primary-content/20 text-primary-content"
                            : "bg-base-300 text-base-content/40"
                        }`}
                      >
                        {
                          installedPlugins.filter(
                            (p) =>
                              p.type === "common module" &&
                              p.source === "Dependencies",
                          ).length
                        }
                      </span>
                    </button>
                    <button
                      className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                        modalTab === "dev"
                          ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                          : "btn-ghost opacity-50 hover:opacity-100"
                      }`}
                      onClick={() => setModalTab("dev")}
                    >
                      <FiCpu className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        Dev
                      </span>
                      <span
                        className={`badge badge-xs font-bold border-none px-1 ${
                          modalTab === "dev"
                            ? "bg-primary-content/20 text-primary-content"
                            : "bg-base-300 text-base-content/40"
                        }`}
                      >
                        {
                          installedPlugins.filter(
                            (p) => p.source === "Dev Dependencies",
                          ).length
                        }
                      </span>
                    </button>
                  </div>
                </div>

                {packageJsonError ? (
                  <div className="bg-error/5 border border-error/10 rounded-2xl p-6 text-center">
                    <FiAlertTriangle className="w-8 h-8 text-error mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-bold text-error opacity-70">
                      Failed to read package.json
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {/* group 1: dep plugin */}
                    {modalTab === "plugins" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2.5">
                          {installedPlugins
                            .filter(
                              (p) =>
                                p.type === "plugin" &&
                                p.source === "Dependencies",
                            )
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((pkg) => renderPackageRowReadOnly(pkg))}
                          {installedPlugins.filter(
                            (p) =>
                              p.type === "plugin" &&
                              p.source === "Dependencies",
                          ).length === 0 && (
                            <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest italic">
                              No NativeScript Plugins found
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* group 2: dep common module */}
                    {modalTab === "common" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2.5">
                          {installedPlugins
                            .filter(
                              (p) =>
                                p.type === "common module" &&
                                p.source === "Dependencies",
                            )
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((pkg) => renderPackageRowReadOnly(pkg))}
                          {installedPlugins.filter(
                            (p) =>
                              p.type === "common module" &&
                              p.source === "Dependencies",
                          ).length === 0 && (
                            <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest italic">
                              No Modules found
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* group 3: dev module */}
                    {modalTab === "dev" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2.5">
                          {installedPlugins
                            .filter((p) => p.source === "Dev Dependencies")
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((pkg) => renderPackageRowReadOnly(pkg))}
                          {installedPlugins.filter(
                            (p) => p.source === "Dev Dependencies",
                          ).length === 0 && (
                            <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest italic">
                              No Development Modules found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
      {/* Maintenance Actions Modal */}
      {showMaintenanceActions && (
        <div className="modal modal-open bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="modal-box w-11/12 max-w-2xl flex flex-col p-0 overflow-hidden border border-base-200 shadow-2xl rounded-[2.5rem] bg-base-100">
            {/* Header */}
            <div className="px-8 py-6 border-b border-base-200 flex items-center justify-between bg-base-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-info/10 text-info flex items-center justify-center shadow-inner">
                  <FiShield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-2xl tracking-tight text-base-content">
                    Maintenance Actions
                  </h3>
                  <p className="text-[10px] text-base-content/40 font-black uppercase tracking-[0.2em] mt-1.5 leading-relaxed">
                    Diagnose, Update, and Clean Your Project
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMaintenanceActions(false)}
                className="btn btn-ghost btn-md btn-circle hover:bg-base-200 transition-colors"
              >
                <FiX className="w-6 h-6 opacity-40" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 bg-base-100/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "doctor",
                    icon: FiShield,
                    label: "Doctor",
                    desc: "Diagnose project issues and check environment compatibility",
                    color: "info",
                    bg: "hover:bg-info/10 hover:text-info",
                  },
                  {
                    id: "info",
                    icon: FiInfo,
                    label: "CLI Info",
                    desc: "Show installed CLI version, runtime versions, and config",
                    color: "primary",
                    bg: "hover:bg-primary/10 hover:text-primary",
                  },
                  {
                    id: "update",
                    icon: FiRefreshCw,
                    label: "Update",
                    desc: "Update NativeScript project config and tooling to latest standards",
                    color: "success",
                    bg: "hover:bg-success/10 hover:text-success",
                  },
                  {
                    id: "migrate",
                    icon: FiArrowUpCircle,
                    label: "Migrate",
                    desc: isMigrationRequired
                      ? "Upgrade project to the latest NativeScript major version"
                      : "No migration needed \u2014 project is up to date",
                    color: "warning",
                    bg: "hover:bg-warning/10 hover:text-warning",
                    disabled: !isMigrationRequired || props.running,
                    onClick: runMigration,
                    loading: migrating,
                  },
                  {
                    id: "clean",
                    icon: FiActivity,
                    label: "Clean Project",
                    desc: "Wipe build artifacts and node_modules for a fresh start",
                    color: "error",
                    bg: "hover:bg-error/10 hover:text-error",
                    onClick: async () => {
                      setShowMaintenanceActions(false);
                      await props.onRunAction("clean");
                      checkProjectHealth();
                    },
                  },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    className={`btn btn-ghost bg-base-200/40 ${tool.bg} flex flex-col items-center justify-center gap-3 rounded-2xl h-32 border-none transition-all group w-full text-center px-4`}
                    disabled={props.running || tool.disabled}
                    onClick={() => {
                      if (!tool.loading) {
                        setShowMaintenanceActions(false);
                        if (tool.onClick) {
                          tool.onClick();
                        } else {
                          props.onRunAction(tool.id as any);
                        }
                      }
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-base-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      {tool.loading ? (
                        <span className="loading loading-spinner loading-md text-warning"></span>
                      ) : (
                        <tool.icon className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black tracking-tight">
                        {tool.label}
                      </div>
                      <div className="text-[9px] opacity-50 font-bold leading-tight mt-1 px-2 line-clamp-2">
                        {tool.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop bg-base-900/60 backdrop-blur-sm"
            onClick={() => setShowMaintenanceActions(false)}
          ></div>
        </div>
      )}
    </div>
  );
}
