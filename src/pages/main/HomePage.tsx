import { useEffect, useState } from "react";
import type { ProjectRow, ActivityLog } from "../../app/types";
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
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";
import Database from "@tauri-apps/plugin-sql";

type HomePageProps = {
  logoSrc: string;
  projects: ProjectRow[];
  db: Database | null;
  lastActivityTime?: number;
  onAddProject: () => void;
  onCreateProject: () => void;
  onOpenDoctor: () => void;
  onViewAllProjects: () => void;
  onViewAllActivities?: () => void;
  onOpenProject: (projectPath: string) => void;
  onOpenFolder: (projectPath: string) => void;
};

export function HomePage(props: HomePageProps) {
  const [activeProjectPath, setActiveProjectPath] = useState<string | null>(
    null,
  );
  const [isHeroExpanded, setIsHeroExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem("ns-forge-hero-expanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const activeProject =
    activeProjectPath == null
      ? null
      : (props.projects.find((p) => p.path === activeProjectPath) ?? null);

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
          onClick={() => setIsHeroExpanded(!isHeroExpanded)}
          className="btn btn-ghost btn-xs absolute top-4 right-4 z-10 opacity-40 hover:opacity-100"
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
            <p className="text-lg md:text-xl opacity-70 leading-relaxed mb-8 max-w-3xl">
              Your ultimate desktop companion for NativeScript development.
              Effortlessly manage projects, maintain toolchain health, and
              execute CLI actions through a refined, high-performance interface.
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
          {props.projects.length === 0 ? (
            <div className="alert bg-base-100 border-base-200 rounded-box p-6 shadow-sm flex flex-col items-center py-12 text-center">
              <FiFolderPlus className="h-12 w-12 opacity-10 mb-4" />
              <span className="opacity-60 italic text-sm">
                Your project library is empty. Click "Add Project" to begin your
                journey.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {[...props.projects]
                .sort((a, b) => (b.last_opened || 0) - (a.last_opened || 0))
                .slice(0, 5)
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
                          {/* Project Info */}
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
                            <div className="flex items-center gap-2 text-sm opacity-60 font-mono min-w-0 mb-4">
                              <FiFolderPlus className="h-3.5 w-3.5 shrink-0" />
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
                })}
            </div>
          )}
        </div>

        {activeProject && (
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="card bg-base-100 border border-base-200 shadow-sm sticky top-6">
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
    </div>
  );
}
