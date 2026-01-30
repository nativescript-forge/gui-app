import { FiPlus, FiFolder } from "react-icons/fi";
import type { ProjectRow } from "../../app/types";

interface FileMenuProps {
  onCreateProject: () => void;
  onAddProject: () => void;
  onSelectProject: (path: string) => void;
  projects: ProjectRow[];
}

export function FileMenu({
  onCreateProject,
  onAddProject,
  onSelectProject,
  projects,
}: FileMenuProps) {
  const closeDropdown = (e: React.MouseEvent) => {
    (e.currentTarget.closest(".dropdown") as HTMLElement)?.blur();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="dropdown dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        className="px-3 h-10 flex items-center hover:bg-white/5 focus:bg-white/10 cursor-default transition-colors text-[13px] text-white/80 hover:text-white"
      >
        File
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-md w-52 mt-0 text-[12px]"
      >
        <li>
          <button
            onClick={(e) => {
              onCreateProject();
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
          >
            <FiPlus className="w-3.5 h-3.5 opacity-70" /> New Project
          </button>
        </li>
        <li>
          <button
            onClick={(e) => {
              onAddProject();
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
          >
            <FiFolder className="w-3.5 h-3.5 opacity-70" /> Open Project...
          </button>
        </li>
        {projects.length > 0 && (
          <>
            <div className="divider my-1 opacity-10"></div>
            <li className="menu-title px-3 py-1 text-[10px] opacity-40 uppercase tracking-wider">
              Recent
            </li>
            {projects.slice(0, 5).map((p) => (
              <li key={p.path}>
                <button
                  onClick={(e) => {
                    onSelectProject(p.path);
                    closeDropdown(e);
                  }}
                  className="py-1.5 hover:bg-white/10 rounded opacity-80 hover:opacity-100"
                >
                  {p.name}
                </button>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
}
