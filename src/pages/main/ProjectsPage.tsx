import { useRef, useState, useEffect } from "react";
import type { ProjectRow } from "../../shared/types";
import { parsePlatforms } from "../../shared/platforms";
import { invoke } from "@tauri-apps/api/core";
import { ProjectDetailsModal } from "../../components/ProjectDetailsModal";
import {
  FiExternalLink,
  FiFolderPlus,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiZap,
  FiPackage,
  FiRefreshCw,
  FiInfo,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";

type ProjectsPageProps = {
  projects: ProjectRow[];
  activeProjectPath: string | null;
  onSelectProject: (projectPath: string | null) => void;
  onScanFolder: () => void;
  onAddProject: () => void;
  onCreateProject: () => void;
  onOpenFolder: (projectPath: string) => void;
  onOpenActions: (projectPath: string) => void;
  onRemoveProject: (projectPath: string) => void;
  onRefresh: () => void;
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
      try {
        const iconData = await invoke<string>("get_project_icon", {
          path: project.path,
        });
        setIcon(iconData);
      } catch (err) {
        // Fallback to default
      }
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

      <div className="w-full text-center">
        <h3 className="font-bold text-sm truncate w-full" title={project.name}>
          {project.name}
        </h3>
        <div className="text-[10px] opacity-50 mt-1 font-medium uppercase tracking-wider">
          {project.framework || "NativeScript"}
        </div>
      </div>

      <div className="absolute top-2 right-2 flex gap-1">
        {parsePlatforms(project.platforms).map((plat) => {
          const isAndroid = plat.toLowerCase().includes("android");
          const isIOS = plat.toLowerCase().includes("ios");
          if (!isAndroid && !isIOS) return null;
          return (
            <div
              key={plat}
              className={`p-1 rounded-md text-[8px] ${
                isActive ? "bg-primary text-white" : "bg-base-200 opacity-40"
              }`}
            >
              {isAndroid && <FaAndroid />}
              {isIOS && <FaApple />}
            </div>
          );
        })}
      </div>

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

export function ProjectsPage(props: ProjectsPageProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [propertyProject, setPropertyProject] = useState<ProjectRow | null>(
    null,
  );
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onSelectProject(null);
        setPropertyProject(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [props]);

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
    <div
      className="w-full min-h-[calc(100vh-10rem)] pb-10"
      onClick={() => props.onSelectProject(null)}
    >
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
              className="btn btn-outline btn-sm"
              onClick={props.onRefresh}
              title="Refresh list and check existence"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
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
          </div>
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
                  .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
                  .map((p) => (
                    <ProjectCard
                      key={p.path}
                      project={p}
                      isActive={p.path === props.activeProjectPath}
                      onSelect={(path) =>
                        props.onSelectProject(
                          props.activeProjectPath === path ? null : path,
                        )
                      }
                      onOpen={props.onOpenActions}
                      onRemove={props.onRemoveProject}
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
    </div>
  );
}
