import { useRef } from "react";
import type { ProjectRow } from "../app/types";
import { shortenPath } from "../app/utils";
import { parsePlatforms } from "../app/platforms";
import {
  FiCalendar,
  FiCpu,
  FiExternalLink,
  FiFolderPlus,
  FiGrid,
  FiPlus,
  FiSearch,
  FiSmartphone,
  FiTrash2,
  FiZap,
  FiPackage,
  FiShield,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";

type ProjectsPageProps = {
  projects: ProjectRow[];
  activeProjectPath: string | null;
  onSelectProject: (projectPath: string) => void;
  onScanFolder: () => void;
  onAddProject: () => void;
  onCreateProject: () => void;
  onOpenFolder: (projectPath: string) => void;
  onOpenActions: (projectPath: string) => void;
  onRemoveProject: (projectPath: string) => void;
};

export function ProjectsPage(props: ProjectsPageProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const activeProject =
    props.activeProjectPath == null
      ? null
      : (props.projects.find((p) => p.path === props.activeProjectPath) ??
        null);

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
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8 px-2">
        <div>
          <h1 className="text-3xl font-extrabold">Project Library</h1>
          <p className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Management Console
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={props.onCreateProject}
          >
            <FiPlus className="h-4 w-4" />
            Create New
          </button>
          <button
            type="button"
            className="btn btn-neutral btn-sm"
            onClick={props.onAddProject}
          >
            <FiFolderPlus className="h-4 w-4" />
            Add Existing
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={props.onScanFolder}
          >
            <FiSearch className="h-4 w-4" />
            Scan Folder
          </button>
          {activeProject ? (
            <div className="divider divider-horizontal h-8 mx-2 hidden sm:flex"></div>
          ) : null}
          {activeProject ? (
            <button
              type="button"
              className="btn btn-ghost btn-square"
              onClick={() => props.onOpenFolder(activeProject.path)}
              title="Open Folder"
            >
              <FiExternalLink className="h-4 w-4 opacity-70" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 xl:col-span-8">
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
              props.projects.map((p) => {
                const isActive = p.path === props.activeProjectPath;
                return (
                  <div
                    key={p.path}
                    className={`group card bg-base-100 border transition-all cursor-pointer overflow-hidden ${
                      isActive
                        ? "border-primary shadow-md"
                        : "border-base-200 hover:border-primary/50"
                    }`}
                    onClick={() => props.onSelectProject(p.path)}
                  >
                    <div className="card-body p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Left side: Basic info */}
                        <div
                          className={`p-5 flex-1 border-b md:border-b-0 md:border-r border-base-200 transition-colors ${
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
                          <div className="flex items-center gap-2 text-xs opacity-50 font-mono min-w-0">
                            <FiFolderPlus className="h-3 w-3 shrink-0" />
                            <span className="truncate" title={p.path}>
                              {shortenPath(p.path)}
                            </span>
                          </div>
                        </div>

                        {/* Right side: Detailed info */}
                        <div
                          className={`p-5 lg:w-48 xl:w-64 flex flex-col justify-center gap-4 ${
                            isActive ? "bg-primary/5" : "bg-base-200/30"
                          }`}
                        >
                          <div className="flex flex-wrap gap-2">
                            {p.framework && (
                              <div className="badge badge-neutral gap-1.5 py-1 h-auto min-h-[0.25rem]">
                                <FiCpu className="h-3 w-3 shrink-0" />
                                <span className="leading-tight">
                                  {p.framework}
                                </span>
                              </div>
                            )}
                            {p.nativescript_version && (
                              <div className="badge badge-primary gap-1.5 py-1 h-auto min-h-[0.25rem]">
                                <span className="text-[10px] opacity-70 font-bold shrink-0">
                                  CLI
                                </span>
                                <span className="leading-tight">
                                  v
                                  {p.nativescript_version.replace(
                                    /[^0-9.]/g,
                                    "",
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs opacity-60">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <FiSmartphone className="h-3.5 w-3.5 shrink-0" />
                              {renderPlatforms(p.platforms)}
                            </div>
                            {p.last_opened && (
                              <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
                                <FiCalendar className="h-3.5 w-3.5" />
                                <span>
                                  {new Date(p.last_opened).toLocaleDateString()}
                                </span>
                              </div>
                            )}
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

        <div className="lg:col-span-5 xl:col-span-4">
          <div className="card bg-base-100 border border-base-200 shadow-sm sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="badge badge-primary badge-xs badge-outline"></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                    Overviews
                  </div>
                </div>
                {activeProject ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => props.onOpenActions(activeProject.path)}
                      title="Open Project Actions"
                    >
                      <FiZap className="h-3.5 w-3.5" />
                      Open
                    </button>
                    <button
                      type="button"
                      className="btn btn-error btn-outline btn-xs"
                      onClick={() => modalRef.current?.showModal()}
                      title="Remove from Library"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>

              {!activeProject ? (
                <div className="py-12 text-center">
                  <div className="p-4 rounded-full bg-base-200 w-fit mx-auto mb-4 opacity-50">
                    <FiSearch className="h-8 w-8" />
                  </div>
                  <p className="text-sm opacity-40 italic">
                    Select a project to view metrics.
                  </p>
                </div>
              ) : (
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
                          Framework
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DaisyUI Confirmation Modal */}
      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box border border-base-300 shadow-2xl">
          <div className="flex items-center gap-4 mb-4 text-error">
            <div className="p-3 rounded-full bg-error/10">
              <FiTrash2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">Remove Project</h3>
          </div>
          <p className="py-2 opacity-70">
            Are you sure you want to remove{" "}
            <span className="font-bold text-base-content">
              "{activeProject?.name}"
            </span>{" "}
            from your library? This action only removes it from the list, not
            from your disk.
          </p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button className="btn btn-ghost btn-sm">Cancel</button>
              <button
                className="btn btn-error btn-sm"
                onClick={() => {
                  if (activeProject) {
                    props.onRemoveProject(activeProject.path);
                  }
                }}
              >
                Remove
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
