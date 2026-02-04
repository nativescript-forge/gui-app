import { useEffect, useState, useMemo } from "react";
import type { ProjectRow } from "../../app/types";
import { parsePlatforms } from "../../app/platforms";
import { shortenPath } from "../../app/utils";
import {
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiExternalLink,
  FiFolderPlus,
  FiGithub,
  FiGlobe,
  FiGrid,
  FiMessageSquare,
  FiPlus,
  FiZap,
  FiSearch,
  FiX,
  FiSmartphone,
  FiPackage,
  FiCalendar,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiInfo,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";
import Database from "@tauri-apps/plugin-sql";

type HomePageProps = {
  logoSrc: string;
  projects: ProjectRow[];
  db: Database | null;
  systemReport: {
    info: string;
    doctor: string;
    packageManager: string;
  } | null;
  lastActivityTime?: number;
  onAddProject: () => void;
  onCreateProject: () => void;
  onOpenDoctor: () => void;
  onViewAllProjects: () => void;
  onViewAllActivities?: () => void;
  onOpenProject: (projectPath: string) => void;
  onOpenFolder: (projectPath: string) => void;
  onRunNpm?: (args: string[], cwd?: string) => Promise<void>;
  onRefreshSystemReport?: () => Promise<void>;
  isRefreshingSystemReport?: boolean;
};

export function HomePage(props: HomePageProps) {
  const [activeProjectPath, setActiveProjectPath] = useState<string | null>(
    null,
  );
  const [isHeroExpanded, setIsHeroExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem("ns-forge-hero-expanded");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const isRefreshing = props.isRefreshingSystemReport;

  const activeProject =
    activeProjectPath == null
      ? null
      : (props.projects.find((p) => p.path === activeProjectPath) ?? null);

  const [latestNpmVersion, setLatestNpmVersion] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestVersion() {
      try {
        const res = await fetch(
          "https://registry.npmjs.org/nativescript/latest",
        );
        if (res.ok) {
          const data = await res.json();
          setLatestNpmVersion(data.version);
        }
      } catch (err) {
        console.error("Failed to fetch latest NS version:", err);
      }
    }
    fetchLatestVersion();
  }, []);

  const versions = useMemo(() => {
    const info = props.systemReport?.info || "";
    const doctor = props.systemReport?.doctor || "";
    const combined = info + " " + doctor;

    // Default extraction
    let current =
      info.match(
        /(?:nativescript|cli)\s+(?:has\s+)?(?:version\s+)?([\d.]+)/i,
      )?.[1] ||
      info.match(/([\d.]+)/)?.[1] ||
      null;

    // Additional check for common patterns in 'ns info' or 'ns --version'
    if (!current && combined) {
      // Look for standalone version numbers like "8.8.6"
      const versionMatch = combined.match(
        /(?:\s|^)([\d]{1,2}\.[\d]{1,2}\.[\d]{1,3})(?:\s|$)/,
      );
      if (versionMatch) current = versionMatch[1];
    }

    // Try to find "X.X.X -> Y.Y.Y"
    const updateMatch = combined.match(/([\d.]+)\s*->\s*([\d.]+)/);
    let latest = latestNpmVersion || (updateMatch ? updateMatch[2] : null);

    if (updateMatch && !current) {
      current = updateMatch[1];
    }

    // Try to find "Update available X.X.X... latest is Y.Y.Y"
    const altMatch = combined.match(
      /update available.*?([\d.]+).*?latest.*?([\d.]+)/i,
    );
    if (altMatch) {
      if (!current) current = altMatch[1];
      if (!latest) latest = altMatch[2];
    }

    const hasUpdate =
      current === null ||
      (current && latest && current !== latest) ||
      doctor.toLowerCase().includes("update available") ||
      info.toLowerCase().includes("new version") ||
      combined.includes("->");

    return {
      current: current || "Not Installed",
      latest: latest,
      hasUpdate,
    };
  }, [props.systemReport, latestNpmVersion]);

  const hasUpdate = versions.hasUpdate;

  const isHealthy = useMemo(() => {
    if (isRefreshing) return false;
    if (!props.systemReport?.doctor) return false;
    const doc = props.systemReport.doctor.toLowerCase();

    // Positive indicators from 'ns doctor'
    const hasPositiveIndicator =
      doc.includes("no issues") ||
      doc.includes("setup and ready") ||
      doc.includes("is correctly configured") ||
      doc.includes("is up to date");

    // Negative indicators (common ns doctor error symbols and words)
    const hasNegativeIndicator =
      doc.includes("✘") ||
      doc.includes("error") ||
      doc.includes("warning") ||
      doc.includes("not installed") ||
      doc.includes("failed") ||
      doc.includes("requires");

    // It's healthy if:
    // 1. It explicitly says it's healthy and has no negative signs
    // 2. It's up to date and has no negative signs
    // 3. There are simply no negative signs at all (optimistic)
    if (hasPositiveIndicator && !hasNegativeIndicator) return true;
    if (!hasNegativeIndicator && !hasUpdate) return true;

    return false;
  }, [props.systemReport?.doctor, hasUpdate, isRefreshing]);

  const handleUpgrade = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    try {
      // Use npm as default for global upgrade or detect from systemReport
      const pmStr = props.systemReport?.packageManager?.toLowerCase() || "";
      const pm = pmStr.includes("pnpm")
        ? "pnpm"
        : pmStr.includes("yarn")
          ? "yarn"
          : pmStr.includes("bun")
            ? "bun"
            : "npm";

      let args = ["install", "-g", "nativescript@latest"];
      if (pm === "yarn") args = ["global", "add", "nativescript@latest"];
      if (pm === "pnpm") args = ["add", "-g", "nativescript@latest"];
      if (pm === "bun") args = ["add", "-g", "nativescript@latest"];

      if (props.onRunNpm) {
        // Run global upgrade. We can pass a dummy or specific path if needed,
        // but runNpm handles it if we pass cwd.
        await props.onRunNpm(args, "");

        // Refresh system report after successful upgrade
        if (props.onRefreshSystemReport) {
          await props.onRefreshSystemReport();
        }
      } else {
        console.warn("onRunNpm not provided to HomePage");
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
    } finally {
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(
      "ns-forge-hero-expanded",
      JSON.stringify(isHeroExpanded),
    );
  }, [isHeroExpanded]);

  const renderPlatforms = (platformsStr: string | null) => {
    const platforms = parsePlatforms(platformsStr);
    if (platforms.length === 0) return "No platforms";

    return (
      <div className="flex gap-2">
        {platforms.map((plat) => {
          const isAndroid = plat.toLowerCase().includes("android");
          const isIOS = plat.toLowerCase().includes("ios");
          return (
            <div
              key={plat}
              className="flex items-center gap-1 bg-base-300/50 px-1.5 py-0.5 rounded text-[10px] font-medium"
            >
              {isAndroid && <FaAndroid className="h-2.5 w-2.5" />}
              {isIOS && <FaApple className="h-2.5 w-2.5" />}
              {plat}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="card bg-base-100 shadow-none border border-base-200 overflow-hidden relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsHeroExpanded(!isHeroExpanded);
          }}
          className={`absolute right-4 z-10 opacity-40 hover:opacity-100 flex items-center justify-center transition-all ${
            isHeroExpanded ? "top-4" : "top-1/2 -translate-y-1/2"
          } w-7 h-7 rounded-lg bg-base-200 hover:bg-base-300 text-base-content`}
          title={isHeroExpanded ? "Collapse" : "Expand"}
        >
          {isHeroExpanded ? (
            <FiChevronUp className="h-4 w-4" />
          ) : (
            <FiChevronDown className="h-4 w-4" />
          )}
        </button>

        {isHeroExpanded ? (
          <div className="card-body p-6 md:p-14">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Welcome to <br className="sm:hidden" />
              <span className="text-primary">NativeScript Forge</span>
            </h1>
            <p className="text-sm md:text-base opacity-70 leading-relaxed mb-8 max-w-4xl">
              NativeScript Forge is a community-built development studio
              designed to simplify, visualize, and control the NativeScript
              development workflow. It provides developers with a unified
              graphical interface to manage projects, environments, plugins,
              builds, and platform configurations—without replacing the
              NativeScript CLI. NativeScript Forge focuses on transparency,
              safety, and productivity, helping developers reduce setup
              friction, avoid common pitfalls, and stay in control of complex
              NativeScript projects.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap justify-start gap-3 mb-10">
              <button
                type="button"
                className="btn btn-primary btn-md md:btn-lg flex-1 sm:flex-none"
                onClick={props.onCreateProject}
              >
                <FiPlus className="h-5 w-5" />
                Create Project
              </button>
              <button
                type="button"
                className="btn btn-neutral btn-md md:btn-lg flex-1 sm:flex-none"
                onClick={props.onAddProject}
              >
                <FiFolderPlus className="h-5 w-5" />
                Add Existing
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-base-200">
              <a
                href="https://nativescript.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <FiGlobe className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1">
                    Official Site{" "}
                    <FiExternalLink className="h-3 w-3 opacity-50" />
                  </div>
                  <div className="text-[10px] opacity-50 truncate">
                    nativescript.org
                  </div>
                </div>
              </a>

              <a
                href="https://github.com/dyazincahya/awesome-nativescript"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-base-content/10 text-base-content group-hover:bg-base-content group-hover:text-base-100 transition-all">
                  <FiGithub className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1">
                    Awesome Repo{" "}
                    <FiExternalLink className="h-3 w-3 opacity-50" />
                  </div>
                  <div className="text-[10px] opacity-50 truncate">
                    GitHub Resources
                  </div>
                </div>
              </a>

              <a
                href="https://nativescript.org/discord"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <FiMessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1">
                    Community <FiExternalLink className="h-3 w-3 opacity-50" />
                  </div>
                  <div className="text-[10px] opacity-50 truncate">
                    Discord Server
                  </div>
                </div>
              </a>
            </div>
          </div>
        ) : (
          <div
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-base-200/50 transition-colors"
            onClick={() => setIsHeroExpanded(true)}
          >
            <div className="flex items-center gap-4">
              <div className="text-sm font-bold">
                Welcome to{" "}
                <span className="text-primary">NativeScript Forge</span>
              </div>
              <div className="h-4 w-[1px] bg-base-content/20" />
              <div className="flex items-center gap-3">
                <a
                  href="https://nativescript.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                  title="Official Site"
                >
                  <FiGlobe className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://github.com/dyazincahya/awesome-nativescript"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-base-content/10 text-base-content hover:bg-base-content hover:text-base-100 transition-all"
                  title="Awesome Repo"
                >
                  <FiGithub className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://nativescript.org/discord"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all"
                  title="Discord Server"
                >
                  <FiMessageSquare className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Environment Section - Single Card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm mb-12 overflow-hidden mt-5">
        <div className="card-body p-0">
          <div className="flex flex-col md:flex-row items-stretch divide-y md:divide-y-0 md:divide-x divide-base-200">
            {/* CLI Version */}
            <div className="flex-1 p-4 flex items-center gap-4 hover:bg-base-200/20 transition-colors">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <FiPackage className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-0.5">
                  NS CLI Version
                </div>
                <div className="font-bold text-sm truncate flex items-center gap-2">
                  {isRefreshing ? (
                    <div className="flex items-center gap-2 text-primary/50 animate-pulse">
                      <span className="loading loading-spinner loading-xs"></span>
                    </div>
                  ) : versions.current === "Not Installed" ? (
                    <span className="text-error animate-pulse">
                      Not Installed
                    </span>
                  ) : hasUpdate && versions.latest ? (
                    <>
                      <span className="text-error line-through text-[11px]">
                        v{versions.current}
                      </span>
                      <FiArrowRight className="h-3 w-3 opacity-30" />
                      <span className="text-success">v{versions.latest}</span>
                    </>
                  ) : (
                    <span>v{versions.current}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Package Manager */}
            <div className="flex-1 p-4 flex items-center gap-4 hover:bg-base-200/20 transition-colors">
              <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                <FiCpu className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-0.5">
                  Package Manager
                </div>
                <div className="font-bold text-sm truncate uppercase">
                  {isRefreshing ? (
                    <div className="flex items-center gap-2 text-secondary/50 animate-pulse">
                      <span className="loading loading-spinner loading-xs"></span>
                    </div>
                  ) : (
                    (() => {
                      const pm =
                        props.systemReport?.packageManager?.trim() || "";
                      const match = pm.match(/(npm|yarn|pnpm|bun)/i);
                      if (match) return match[1];
                      // Fallback to simpler check if regex fails
                      if (pm.toLowerCase().includes("pnpm")) return "pnpm";
                      if (pm.toLowerCase().includes("yarn")) return "yarn";
                      if (pm.toLowerCase().includes("bun")) return "bun";
                      return "npm";
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* System Health */}
            <div
              className="group flex-1 p-4 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:bg-base-200/20 transition-colors cursor-pointer"
              onClick={() => setShowSystemModal(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowSystemModal(true);
                }
              }}
            >
              <div
                className={`p-3 rounded-2xl ${
                  isHealthy
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {isHealthy ? (
                  <FiCheckCircle className="h-5 w-5" />
                ) : (
                  <FiAlertCircle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-0.5">
                  System Health
                </div>
                <div
                  className={`font-bold text-sm leading-tight whitespace-normal break-words ${
                    isRefreshing
                      ? "text-warning/50 animate-pulse"
                      : isHealthy
                        ? "text-success"
                        : "text-warning"
                  }`}
                >
                  {isRefreshing ? (
                    <div className="flex items-center gap-2">
                      <span className="loading loading-spinner loading-xs"></span>
                    </div>
                  ) : isHealthy ? (
                    "Healthy"
                  ) : (
                    "Review Needed"
                  )}
                </div>
              </div>
              {/* <div className="hidden lg:block text-[10px] font-bold uppercase tracking-widest opacity-20 group-hover:opacity-60 transition-opacity shrink-0 self-end md:self-auto">
                View Report
              </div> */}
            </div>

            {/* Actions */}
            <div className="p-4 bg-base-200/30 flex flex-col sm:flex-row md:flex-col justify-center gap-2 min-w-[200px]">
              {isRefreshing ? (
                <div className="flex items-center justify-center py-2">
                  <span className="loading loading-spinner loading-md opacity-30"></span>
                </div>
              ) : hasUpdate ? (
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="btn btn-primary btn-sm flex-1 font-bold text-[11px] gap-2"
                >
                  {isUpgrading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FiRefreshCw className="h-3.5 w-3.5" />
                  )}
                  {versions.current === "Not Installed"
                    ? "Install CLI"
                    : "Upgrade CLI"}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-success text-[11px] font-bold uppercase tracking-wider bg-success/10 py-2 px-4 rounded-lg">
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  Up to Date
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 mt-12">
        <h2 className="text-2xl font-bold">Recent Projects</h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm gap-2"
          onClick={props.onViewAllProjects}
        >
          View Library
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div
          className={
            activeProject ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
          }
        >
          <div className="flex flex-col gap-4">
            {props.projects.length === 0 ? (
              <div className="card bg-base-100 border border-base-200 border-dashed shadow-sm p-12 md:p-20 text-center flex flex-col items-center gap-6">
                <div className="p-6 rounded-full bg-base-200/50">
                  <FiSearch className="h-12 w-12 opacity-10" />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-lg font-bold mb-1">No Projects Found</h3>
                  <p className="text-sm opacity-40 italic">
                    Your library is empty. Add an existing project or create a
                    new one to get started.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={props.onAddProject}
                  >
                    Add Project
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={props.onCreateProject}
                  >
                    Create New
                  </button>
                </div>
              </div>
            ) : (
              [...props.projects]
                .sort((a, b) => (b.last_opened || 0) - (a.last_opened || 0))
                .slice(0, 6)
                .map((p) => {
                  const isActive = p.path === activeProjectPath;
                  return (
                    <div
                      key={p.path}
                      className={`group card bg-base-100 border transition-all cursor-pointer overflow-hidden ${
                        isActive
                          ? "border-primary shadow-md"
                          : "border-base-200 hover:border-primary/50"
                      }`}
                      onClick={() => setActiveProjectPath(p.path)}
                    >
                      <div className="card-body p-0">
                        <div className="flex flex-col md:flex-row">
                          <div
                            className={`p-5 flex-1 transition-colors ${
                              isActive
                                ? "bg-primary/10"
                                : "group-hover:bg-primary/5"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`p-2 rounded-lg ${
                                  isActive
                                    ? "bg-primary text-white"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                <FiGrid className="h-5 w-5" />
                              </div>
                              <h3
                                className={`card-title text-lg transition-colors ${
                                  isActive
                                    ? "text-primary"
                                    : "group-hover:text-primary"
                                }`}
                              >
                                {p.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs opacity-50 font-mono min-w-0 mb-4">
                              <FiFolderPlus className="h-3 w-3 shrink-0" />
                              <span className="truncate" title={p.path}>
                                {shortenPath(p.path)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-auto pt-4 border-t border-base-200/50">
                              <div className="flex items-center gap-1.5">
                                <FiSmartphone className="h-3.5 w-3.5 opacity-40" />
                                {renderPlatforms(p.platforms)}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-60 bg-base-200 px-2 py-1 rounded">
                                <FiPackage className="h-3 w-3" />
                                NativeScript {p.nativescript_version || "N/A"}
                              </div>
                              <div className="flex flex-col items-end gap-0.5 ml-auto">
                                <div className="flex items-center gap-1.5 text-[9px] font-medium opacity-40">
                                  <FiClock className="h-2.5 w-2.5" />
                                  Opened:{" "}
                                  {p.last_opened
                                    ? new Date(p.last_opened).toLocaleString(
                                        undefined,
                                        {
                                          dateStyle: "short",
                                          timeStyle: "short",
                                        },
                                      )
                                    : "N/A"}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-medium opacity-40">
                                  <FiCalendar className="h-2.5 w-2.5" />
                                  Created:{" "}
                                  {p.created_at !== null &&
                                  p.created_at !== undefined
                                    ? new Date(
                                        p.created_at * 1000,
                                      ).toLocaleString(undefined, {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {activeProject && (
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="card bg-base-100 border border-base-200 shadow-sm lg:sticky lg:top-6">
              <div className="card-body">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="badge badge-primary badge-xs badge-outline"></div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                      Overviews
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => props.onOpenProject(activeProject.path)}
                      title="Open Project Actions"
                    >
                      <FiZap className="h-3.5 w-3.5" />
                      Open
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setActiveProjectPath(null)}
                      title="Close Overview"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">
                      Project Name
                    </div>
                    <div className="text-xl font-extrabold text-primary">
                      {activeProject.name}
                    </div>
                  </div>

                  <div className="card bg-base-200 border border-base-300">
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 flex items-center gap-2">
                          <FiSearch className="h-3 w-3" /> Location
                        </div>
                        <button
                          className="btn btn-ghost btn-xs text-[10px] opacity-50 hover:opacity-100"
                          onClick={() => props.onOpenFolder(activeProject.path)}
                        >
                          <FiExternalLink className="h-3 w-3" /> Reveal
                        </button>
                      </div>
                      <div className="text-[11px] font-mono break-all opacity-60">
                        {activeProject.path}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="card bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors">
                      <div className="card-body p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                          Flavor
                        </div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          <FiCpu className="h-3.5 w-3.5 opacity-50" />
                          {activeProject.framework ?? "Unknown"}
                        </div>
                      </div>
                    </div>
                    <div className="card bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors">
                      <div className="card-body p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                          NS Version
                        </div>
                        <div className="font-bold text-sm font-mono text-primary flex items-center gap-2">
                          <FiZap className="h-3.5 w-3.5 opacity-50" />
                          {activeProject.nativescript_version ?? "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="card bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors">
                      <div className="card-body p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 flex items-center gap-1.5">
                          Plugins
                        </div>
                        <div className="font-bold text-lg flex items-center gap-2">
                          <FiPackage className="h-4 w-4 text-primary" />
                          {activeProject.plugins_count ?? 0}
                        </div>
                      </div>
                    </div>
                    <div className="card bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors">
                      <div className="card-body p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 flex items-center gap-1.5">
                          Permissions
                        </div>
                        <div className="font-bold text-lg flex items-center gap-2">
                          <FiShield className="h-4 w-4 text-primary" />
                          {activeProject.permissions_count ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="card bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors">
                      <div className="card-body p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                          Version Name
                        </div>
                        <div className="font-bold text-sm">
                          {activeProject.version_name ?? "1.0.0"}
                        </div>
                      </div>
                    </div>
                    <div className="card bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors">
                      <div className="card-body p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                          Version Code
                        </div>
                        <div className="font-bold text-sm">
                          {activeProject.version_code ?? "1"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="card bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors">
                      <div className="card-body p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                          Target SDK
                        </div>
                        <div className="font-bold text-sm">
                          {activeProject.target_sdk ?? "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="card bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors">
                      <div className="card-body p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                          Minimum SDK
                        </div>
                        <div className="font-bold text-sm">
                          {activeProject.min_sdk ?? "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200 border border-base-300">
                    <div className="card-body p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-2">
                        Timestamps
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="opacity-50 flex items-center gap-1.5">
                            <FiClock className="h-3 w-3" /> Last Opened
                          </span>
                          <span className="font-medium">
                            {activeProject.last_opened
                              ? new Date(
                                  activeProject.last_opened,
                                ).toLocaleString()
                              : "Never"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="opacity-50 flex items-center gap-1.5">
                            <FiCalendar className="h-3 w-3" /> Created Date
                          </span>
                          <span className="font-medium">
                            {activeProject.created_at
                              ? new Date(
                                  activeProject.created_at * 1000,
                                ).toLocaleString()
                              : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200 border border-base-300">
                    <div className="card-body p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-2">
                        Target Platforms
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsePlatforms(activeProject.platforms).map((plat) => {
                          const isAndroid = plat
                            .toLowerCase()
                            .includes("android");
                          const isIOS = plat.toLowerCase().includes("ios");
                          return (
                            <div
                              key={plat}
                              className="badge badge-outline badge-primary text-[10px] gap-1"
                            >
                              {isAndroid && (
                                <FaAndroid className="h-2.5 w-2.5" />
                              )}
                              {isIOS && <FaApple className="h-2.5 w-2.5" />}
                              {plat}
                            </div>
                          );
                        }) || (
                          <span className="text-xs opacity-20 italic">
                            No platforms configured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {renderSystemModal()}
    </div>
  );

  function renderSystemModal() {
    if (!showSystemModal) return null;
    return (
      <div className="modal modal-open">
        <div className="modal-box w-11/12 max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden border border-base-300 shadow-2xl rounded-3xl">
          <div className="p-6 border-b border-base-200 flex items-center justify-between bg-base-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FiCpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg">
                  System Environment Report
                </h3>
                <p className="text-xs opacity-50">
                  NativeScript CLI Diagnostics
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
                <FiInfo className="w-3 h-3" /> CLI Information
              </h4>
              <pre className="bg-base-300/50 p-4 rounded-2xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed border border-base-300">
                {props.systemReport?.info || "No information available."}
              </pre>
            </section>

            <section>
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                <FiShield className="w-3 h-3" /> Doctor Results
              </h4>
              <pre className="bg-base-300/50 p-4 rounded-2xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed border border-base-300">
                {props.systemReport?.doctor || "No doctor results available."}
              </pre>
            </section>

            <section>
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                <FiPackage className="w-3 h-3" /> Package Manager
              </h4>
              <pre className="bg-base-300/50 p-4 rounded-2xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed border border-base-300">
                {props.systemReport?.packageManager ||
                  "No information available."}
              </pre>
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
    );
  }
}
