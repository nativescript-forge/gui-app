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
  return (
    <div className="dropdown dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        className="px-2.5 py-1 rounded hover:bg-white/5 cursor-default transition-colors focus:bg-white/10"
      >
        File
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-lg w-52 mt-1 text-[12px]"
      >
        <li>
          <button onClick={() => onCreateProject()} className="py-2">
            <FiPlus className="w-3.5 h-3.5" /> New Project
          </button>
        </li>
        <li>
          <button onClick={() => onAddProject()} className="py-2">
            <FiFolder className="w-3.5 h-3.5" /> Open Project...
          </button>
        </li>
        {projects.length > 0 && (
          <>
            <div className="divider my-0 opacity-10"></div>
            <li className="menu-title px-3 py-1 text-[10px] opacity-40 uppercase">
              Recent
            </li>
            {projects.slice(0, 5).map((p) => (
              <li key={p.path}>
                <button
                  onClick={() => onSelectProject(p.path)}
                  className="py-1.5 opacity-80"
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
