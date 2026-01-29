import { FiPlay, FiRefreshCw } from "react-icons/fi";
import type { Route } from "../../app/types";

interface RunMenuProps {
  activeProject: any;
  setRoute: (route: Route) => void;
}

export function RunMenu({ activeProject, setRoute }: RunMenuProps) {
  return (
    <div className="dropdown dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        className="px-2.5 py-1 rounded hover:bg-white/5 cursor-default transition-colors focus:bg-white/10"
      >
        Run
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-lg w-52 mt-1 text-[12px]"
      >
        {!activeProject ? (
          <li className="disabled italic px-3 py-2 opacity-40">
            No active project
          </li>
        ) : (
          <>
            <li>
              <button onClick={() => setRoute("app-actions")} className="py-2">
                <FiPlay className="w-3.5 h-3.5 text-success" /> Run Android
              </button>
            </li>
            <li>
              <button onClick={() => setRoute("app-actions")} className="py-2">
                <FiPlay className="w-3.5 h-3.5 text-success/70" /> Run iOS
              </button>
            </li>
            <div className="divider my-0 opacity-10"></div>
            <li>
              <button onClick={() => setRoute("app-actions")} className="py-2">
                <FiRefreshCw className="w-3.5 h-3.5 text-warning" /> Clean
                Project
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
