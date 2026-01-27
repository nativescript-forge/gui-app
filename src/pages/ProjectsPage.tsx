import type { ProjectRow } from "../app/types";
import { parsePlatforms } from "../app/platforms";
import {
  FiExternalLink,
  FiFolderPlus,
  FiPlus,
  FiSearch,
  FiZap,
} from "react-icons/fi";

type ProjectsPageProps = {
  projects: ProjectRow[];
  activeProjectPath: string | null;
  onSelectProject: (projectPath: string) => void;
  onScanFolder: () => void;
  onAddProject: () => void;
  onCreateProject: () => void;
  onOpenFolder: (projectPath: string) => void;
  onOpenActions: (projectPath: string) => void;
};

export function ProjectsPage(props: ProjectsPageProps) {
  const activeProject =
    props.activeProjectPath == null
      ? null
      : (props.projects.find((p) => p.path === props.activeProjectPath) ??
        null);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-base-100 border border-base-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="uppercase text-[10px] tracking-widest opacity-50">
                      Project
                    </th>
                    <th className="uppercase text-[10px] tracking-widest opacity-50 hidden md:table-cell text-center">
                      Framework
                    </th>
                    <th className="uppercase text-[10px] tracking-widest opacity-50 hidden md:table-cell text-center">
                      Version
                    </th>
                    <th className="uppercase text-[10px] tracking-widest opacity-50 hidden lg:table-cell text-right">
                      Platforms
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {props.projects.map((p) => {
                    const isActive = p.path === props.activeProjectPath;
                    return (
                      <tr
                        key={p.path}
                        className={`hover cursor-pointer ${isActive ? "active" : ""}`}
                        onClick={() => props.onSelectProject(p.path)}
                      >
                        <td>
                          <div className="font-bold">{p.name}</div>
                          <div className="text-[10px] font-mono opacity-40 truncate max-w-[200px]">
                            {p.path}
                          </div>
                        </td>
                        <td className="hidden md:table-cell text-center">
                          {p.framework ? (
                            <div className="badge badge-ghost badge-sm opacity-70">
                              {p.framework}
                            </div>
                          ) : (
                            <span className="opacity-20">-</span>
                          )}
                        </td>
                        <td className="hidden md:table-cell text-center font-mono text-xs opacity-60">
                          {p.nativescript_version ?? "-"}
                        </td>
                        <td className="hidden lg:table-cell text-right">
                          <div className="flex flex-wrap gap-1 justify-end">
                            {parsePlatforms(p.platforms).map((plat) => (
                              <div
                                key={plat}
                                className="badge badge-primary badge-outline badge-xs"
                              >
                                {plat}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {props.projects.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <FiSearch className="h-12 w-12 opacity-5" />
                  <div className="text-sm opacity-30 italic">
                    No projects found in your library.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card bg-base-100 border border-base-200 shadow-sm sticky top-6">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="badge badge-primary badge-xs badge-outline"></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                    Dashboard
                  </div>
                </div>
                {activeProject ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => props.onOpenActions(activeProject.path)}
                  >
                    <FiZap className="h-3.5 w-3.5" />
                    Run Actions
                  </button>
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
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1 flex items-center gap-2">
                        <FiSearch className="h-3 w-3" /> Location
                      </div>
                      <div className="text-[11px] font-mono break-all opacity-60">
                        {activeProject.path}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="card bg-base-200 border border-base-300">
                      <div className="card-body p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">
                          Framework
                        </div>
                        <div className="font-bold text-sm">
                          {activeProject.framework ?? "Unknown"}
                        </div>
                      </div>
                    </div>
                    <div className="card bg-base-200 border border-base-300">
                      <div className="card-body p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">
                          NS Version
                        </div>
                        <div className="font-bold text-sm font-mono">
                          {activeProject.nativescript_version ?? "N/A"}
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
                        {parsePlatforms(activeProject.platforms).map((plat) => (
                          <div
                            key={plat}
                            className="badge badge-outline badge-primary text-[10px]"
                          >
                            {plat}
                          </div>
                        )) || (
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
    </div>
  );
}
