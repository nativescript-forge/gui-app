import { FiPlay, FiRefreshCw } from "react-icons/fi";
import type { Route } from "../../app/types";

interface RunMenuProps {
  activeProject: any;
  setRoute: (route: Route) => void;
}

export function RunMenu({ activeProject, setRoute }: RunMenuProps) {
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
        Run
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-md w-52 mt-0 text-[12px]"
      >
        {!activeProject ? (
          <li className="disabled italic px-3 py-2 opacity-40">
            No active project
          </li>
        ) : (
          <>
            <li>
              <button
                onClick={(e) => {
                  setRoute("app-actions");
                  closeDropdown(e);
                }}
                className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
              >
                <FiPlay className="w-3.5 h-3.5 text-success opacity-80" /> Run
                Android
              </button>
            </li>
            <li>
              <button
                onClick={(e) => {
                  setRoute("app-actions");
                  closeDropdown(e);
                }}
                className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
              >
                <FiPlay className="w-3.5 h-3.5 text-success/70 opacity-80" />{" "}
                Run iOS
              </button>
            </li>
            <div className="divider my-1 opacity-10"></div>
            <li>
              <button
                onClick={(e) => {
                  setRoute("app-actions");
                  closeDropdown(e);
                }}
                className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
              >
                <FiRefreshCw className="w-3.5 h-3.5 text-warning opacity-80" />{" "}
                Clean Project
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
