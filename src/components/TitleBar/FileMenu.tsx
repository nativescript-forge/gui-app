import {
  FiPlus,
  FiFolder,
  FiSettings,
  FiRefreshCw,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";
import type { ProjectRow } from "../../shared/types";

interface FileMenuProps {
  onCreateProject: () => void;
  onAddProject: () => void;
  onSelectProject: (path: string) => void;
  onOpenSettings: () => void;
  onOpenSync: () => void;
  projects: ProjectRow[];
}

export function FileMenu({
  onCreateProject,
  onAddProject,
  onSelectProject,
  onOpenSettings,
  onOpenSync,
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
        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-base-200 border border-base-content/10 rounded-md w-56 mt-0 text-[12px] text-base-content"
      >
        <li>
          <button
            onClick={(e) => {
              onCreateProject();
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-base-content/10 rounded flex items-center gap-2"
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
            className="py-1.5 hover:bg-base-content/10 rounded flex items-center gap-2"
          >
            <FiFolder className="w-3.5 h-3.5 opacity-70" /> Open Project...
          </button>
        </li>
        {projects.length > 0 && (
          <li>
            <div className="flex items-center justify-between w-full py-2 px-3 hover:bg-base-content/10 rounded group cursor-default transition-colors relative">
              <div className="flex items-center gap-2">
                <FiClock className="w-3.5 h-3.5 opacity-70" />
                <span>Open Recent</span>
              </div>
              <FiChevronRight className="w-3 h-3 opacity-30 group-hover:opacity-70 transition-opacity" />

              <ul className="menu p-1.5 shadow-2xl bg-base-200 border border-base-content/15 rounded-md w-72 absolute left-[100%] top-0 ml-1.5 hidden group-hover:block z-[200]">
                <li className="menu-title px-3 py-1 text-[10px] opacity-40 uppercase tracking-widest font-black">
                  Recent Projects
                </li>
                {projects.slice(0, 10).map((p) => (
                  <li key={p.path} className="mt-0.5 w-full overflow-hidden">
                    <button
                      onClick={(e) => {
                        onSelectProject(p.path);
                        closeDropdown(e);
                      }}
                      className="py-1.5 px-3 hover:bg-primary/10 rounded flex flex-col items-start gap-0 w-full overflow-hidden group/item transition-colors"
                    >
                      <span className="font-bold text-[13px] truncate w-full text-left group-hover/item:text-primary block">
                        {p.name}
                      </span>
                      <span className="text-[10px] opacity-40 truncate w-full font-mono text-left block">
                        {p.path}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        )}
        <div className="divider my-1 opacity-10"></div>
        <li>
          <button
            onClick={(e) => {
              onOpenSync();
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-base-content/10 rounded flex items-center gap-2"
          >
            <FiRefreshCw className="w-3.5 h-3.5 opacity-70" /> Sync Data…
          </button>
        </li>
        <div className="divider my-1 opacity-10"></div>
        <li>
          <button
            onClick={(e) => {
              onOpenSettings();
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-base-content/10 rounded flex items-center gap-2"
          >
            <FiSettings className="w-3.5 h-3.5 opacity-70" /> Settings
          </button>
        </li>
      </ul>
    </div>
  );
}
