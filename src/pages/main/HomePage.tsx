import { useEffect, useState, useMemo } from "react";
import Database from "@tauri-apps/plugin-sql";
import type { ProjectRow } from "../../shared/types";
import { parsePlatforms } from "../../shared/platforms";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";
import {
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiExternalLink,
  FiFolderPlus,
  FiGithub,
  FiGlobe,
  FiMessageSquare,
  FiPlus,
  FiZap,
  FiSearch,
  FiX,
  FiPackage,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiInfo,
  FiTrash2,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";
import { isAndroid, isIos } from "../../shared/platformDetection";
import { ProjectDetailsModal } from "../../components/ProjectDetailsModal";
import { FlavorIcon } from "../../components/FlavorIcon";

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
  onRemoveProject?: (projectPath: string) => void;
};

function ProjectCard({
  project,
  isActive,
  onSelect,
  onOpen,
  onRemove,
  onOpenFolder,
  onShowProperties,
}: {
  project: ProjectRow;
  isActive: boolean;
  onSelect: (path: string) => void;
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onShowProperties: (project: ProjectRow) => void;
  renderPlatforms: (platforms: string | null) => React.ReactNode;
}) {
  const [icon, setIcon] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    async function loadIcon() {
      if (!project.path) return;

      try {
        const iconData = await invoke<string>("get_project_icon", {
          path: project.path,
        });
        if (iconData) {
          setIcon(iconData);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch icon from backend:", err);
      }

      // Fallback manual check (same as DashboardPage)
      const iconPaths = [
        "App_Resources/Android/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
        "App_Resources/Android/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        "App_Resources/Android/src/main/res/drawable-xxxhdpi/logo.png",
        "App_Resources/Android/src/main/res/drawable-xxhdpi/logo.png",
        "App_Resources/iOS/Assets.xcassets/AppIcon.appiconset/icon-1024.png",
      ];

      for (const relPath of iconPaths) {
        try {
          const fullPath = await join(project.path, relPath);
          const exists = await invoke<boolean>("path_exists", {
            path: fullPath,
          }).catch(() => false);

          if (exists) {
            try {
              const contents = await readFile(fullPath);
              const blob = new Blob([contents], { type: "image/png" });
              const assetUrl = URL.createObjectURL(blob);
              setIcon(assetUrl);
              return;
            } catch (readErr) {
              const assetUrl = convertFileSrc(fullPath);
              setIcon(assetUrl);
              return;
            }
          }
        } catch (e) {
          // ignore
        }
      }
      setIcon(null);
    }
    loadIcon();
  }, [project.path]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuWidth = 192; // w-48 = 12rem = 192px
    const menuHeight = 200; // Estimated max height
    let x = e.clientX;
    let y = e.clientY;

    // Flip horizontally if overflow
    if (x + menuWidth > window.innerWidth) {
      x = x - menuWidth;
    }

    // Flip vertically if overflow
    if (y + menuHeight > window.innerHeight) {
      y = y - menuHeight;
    }

    setContextMenu({ x, y });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", handleClick);
    }
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  return (
    <div
      className={`group relative flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg ${
        isActive
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-base-200 bg-base-100 hover:border-primary/40"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(project.path);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen(project.path);
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Icon Section */}
      <div className="relative w-16 h-16 mb-3 flex items-center justify-center bg-base-200 rounded-2xl overflow-hidden transition-transform group-hover:scale-105">
        {icon ? (
          <img
            src={icon}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FiPackage className="w-8 h-8 opacity-20" />
        )}
      </div>

      {/* Info Section */}
      <div className="w-full text-center flex flex-col items-center">
        <h3 className="font-bold text-sm truncate w-full" title={project.name}>
          {project.name}
        </h3>
        <div className="mt-1">
          <FlavorIcon
            framework={project.framework}
            iconClassName="w-3.5 h-3.5"
            className="flex items-center gap-1.5 justify-center"
          />
        </div>
      </div>

      {/* Platforms Overlay (Top Right) */}
      <div className="absolute top-2 right-2 flex gap-1">
        {parsePlatforms(project.platforms).map((plat) => {
          const android = isAndroid(plat);
          const ios = isIos(plat);
          if (!android && !ios) return null;
          return (
            <div
              key={plat}
              className={`p-1 rounded-md text-[8px] ${
                isActive ? "bg-primary text-white" : "bg-base-200 opacity-40"
              }`}
            >
              {android && <FaAndroid />}
              {ios && <FaApple />}
            </div>
          );
        })}
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[100] w-48 bg-base-100 border border-base-200 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-xs hover:bg-primary hover:text-white flex items-center gap-2"
            onClick={() => {
              onOpen(project.path);
              setContextMenu(null);
            }}
          >
            <FiZap className="w-3.5 h-3.5" />
            Open Project
          </button>
          <button
            className="w-full px-4 py-2 text-left text-xs hover:bg-primary hover:text-white flex items-center gap-2"
            onClick={() => {
              onOpenFolder(project.path);
              setContextMenu(null);
            }}
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Reveal in Explorer
          </button>
          <div className="h-px bg-base-200 my-1" />
          <button
            className="w-full px-4 py-2 text-left text-xs hover:bg-primary hover:text-white flex items-center gap-2"
            onClick={() => {
              onShowProperties(project);
              setContextMenu(null);
            }}
          >
            <FiInfo className="w-3.5 h-3.5" />
            Properties
          </button>
          <div className="h-px bg-base-200 my-1" />
          <button
            className="w-full px-4 py-2 text-left text-xs text-error hover:bg-error hover:text-white flex items-center gap-2"
            onClick={() => {
              onRemove(project.path);
              setContextMenu(null);
            }}
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            Remove from Library
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [propertyProject, setPropertyProject] = useState<ProjectRow | null>(
    null,
  );

  const isRefreshing = props.isRefreshingSystemReport;

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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveProjectPath(null);
        setPropertyProject(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const versions = useMemo(() => {
    const info = props.systemReport?.info || "";
    const doctor = props.systemReport?.doctor || "";
    const combined = info + " " + doctor;

    // Default extraction
    const semverRegex = /(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)/;
    const nsVersionRegex =
      /(?:nativescript|cli)\s+(?:has\s+)?(?:version\s+)?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)/i;

    let current =
      info.match(nsVersionRegex)?.[1] || info.match(semverRegex)?.[1] || null;

    // Additional check for common patterns in 'ns info' or 'ns --version'
    if (!current && combined) {
      // Look for standalone version numbers like "8.8.6"
      const versionMatch = combined.match(
        /(?:\s|^)(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)(?:\s|$)/,
      );
      if (versionMatch) current = versionMatch[1];
    }

    // Try to find "X.X.X -> Y.Y.Y"
    const updateMatch = combined.match(
      /(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)\s*->\s*(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)/,
    );
    let latest = latestNpmVersion || (updateMatch ? updateMatch[2] : null);

    if (updateMatch && !current) {
      current = updateMatch[1];
    }

    // Try to find "Update available X.X.X... latest is Y.Y.Y"
    const altMatch = combined.match(
      /update available.*?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?).*?latest.*?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)/i,
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

    if (hasUpdate) return false;

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
    <div
      className="w-full min-h-[calc(100vh-10rem)]"
      onClick={() => setActiveProjectPath(null)}
    >
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
                      Community{" "}
                      <FiExternalLink className="h-3 w-3 opacity-50" />
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
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden mt-5">
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
          <div className="lg:col-span-12">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...props.projects]
                  .sort((a, b) => (b.last_opened || 0) - (a.last_opened || 0))
                  .slice(0, 12)
                  .map((p) => (
                    <ProjectCard
                      key={p.path}
                      project={p}
                      isActive={p.path === activeProjectPath}
                      onSelect={(path) =>
                        setActiveProjectPath(
                          activeProjectPath === path ? null : path,
                        )
                      }
                      onOpen={props.onOpenProject}
                      onRemove={props.onRemoveProject || (() => {})}
                      onOpenFolder={props.onOpenFolder}
                      onShowProperties={setPropertyProject}
                      renderPlatforms={renderPlatforms}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        <ProjectDetailsModal
          project={propertyProject}
          isOpen={!!propertyProject}
          onClose={() => setPropertyProject(null)}
          onOpenFolder={props.onOpenFolder}
        />

        {renderSystemModal()}
      </div>
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
