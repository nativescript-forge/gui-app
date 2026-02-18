import { FiChevronDown, FiPlus } from "react-icons/fi";
import type { ProjectRow } from "../../shared/types";

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
  const closeDropdown = (e: React.MouseEvent) => {
    (e.currentTarget.closest(".dropdown") as HTMLElement)?.blur();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="dropdown dropdown-center">
      <div
        tabIndex={0}
        role="button"
        className="flex items-center gap-2 px-3 h-7 rounded bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 transition-colors group"
      >
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[11px] font-medium text-white/90 group-hover:text-white truncate max-w-[150px]">
            {activeProject ? activeProject.name : "Select Project"}
          </span>
        </div>
        <FiChevronDown className="w-3 h-3 opacity-40 group-hover:opacity-70" />
      </div>

      <ul
        tabIndex={0}
        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-md w-64 mt-1 text-[12px]"
      >
        <li className="menu-title px-3 py-1 text-[10px] opacity-40 uppercase tracking-wider">
          Projects
        </li>
        {projects.length === 0 ? (
          <li className="disabled italic px-3 py-2 opacity-30">
            No projects found
          </li>
        ) : (
          projects.map((p) => (
            <li key={p.path}>
              <button
                onClick={(e) => {
                  onSelectProject(p.path);
                  closeDropdown(e);
                }}
                className={`py-2 px-3 hover:bg-white/10 rounded flex justify-between items-center ${
                  activeProjectPath === p.path
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                  <span className="font-medium truncate w-full">{p.name}</span>
                  <span className="text-[9px] opacity-50 truncate w-full uppercase">
                    {p.framework}
                  </span>
                </div>
                {activeProjectPath === p.path && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--p),0.5)]"></div>
                )}
              </button>
            </li>
          ))
        )}
        <div className="divider my-1 opacity-10"></div>
        <li>
          <button
            onClick={(e) => {
              onAddProject();
              closeDropdown(e);
            }}
            className="py-2 px-3 hover:bg-white/10 rounded text-primary flex items-center gap-2"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Existing Project
          </button>
        </li>
      </ul>
    </div>
  );
}
