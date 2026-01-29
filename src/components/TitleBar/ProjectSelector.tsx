import { FiChevronDown, FiPlus } from "react-icons/fi";
import type { ProjectRow } from "../../app/types";

interface ProjectSelectorProps {
  projects: ProjectRow[];
  activeProject: ProjectRow | undefined;
  activeProjectPath: string | null;
  onSelectProject: (path: string) => void;
  onAddProject: () => void;
}

export function ProjectSelector({
  projects,
  activeProject,
  activeProjectPath,
  onSelectProject,
  onAddProject,
}: ProjectSelectorProps) {
  return (
    <div
      className="flex-1 flex justify-center items-center h-full gap-4 max-w-[40%]"
      data-tauri-drag-region
    >
      <div
        className="dropdown dropdown-bottom w-full flex justify-center"
        data-tauri-drag-region
      >
        <div
          tabIndex={0}
          role="button"
          className="flex items-center gap-2 px-4 py-1 rounded-md hover:bg-white/5 cursor-default border border-white/10 text-[12px] font-medium transition-all min-w-[120px] justify-between group focus:bg-white/10"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className={`w-2 h-2 rounded-full ${activeProject ? "bg-success" : "bg-white/20"}`}
            ></div>
            <span className="truncate opacity-90">
              {activeProject ? activeProject.name : "Select Project"}
            </span>
          </div>
          <FiChevronDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-70 transition-opacity" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-lg w-64 mt-1 text-[12px]"
        >
          {projects.length === 0 ? (
            <li className="disabled italic px-3 py-2 opacity-40">
              No projects found
            </li>
          ) : (
            projects.map((p) => (
              <li key={p.path}>
                <button
                  onClick={() => onSelectProject(p.path)}
                  className={`py-2 flex justify-between ${activeProjectPath === p.path ? "bg-primary/10 text-primary" : ""}`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[10px] opacity-40">{p.framework}</span>
                </button>
              </li>
            ))
          )}
          <div className="divider my-0 opacity-10"></div>
          <li>
            <button
              onClick={() => onAddProject()}
              className="py-2 text-primary"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Project
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
