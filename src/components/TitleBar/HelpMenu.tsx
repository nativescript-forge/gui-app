import {
  FiHome,
  FiActivity,
  FiTerminal as FiDevTools,
  FiAlertCircle,
  FiHelpCircle,
  FiDownload,
  FiInfo,
} from "react-icons/fi";
import type { Route } from "../../app/types";

interface HelpMenuProps {
  setRoute: (route: Route) => void;
  onOpenDoctor: () => void;
  onShowAbout: () => void;
}

export function HelpMenu({
  setRoute,
  onOpenDoctor,
  onShowAbout,
}: HelpMenuProps) {
  return (
    <div className="dropdown dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        className="px-2.5 py-1 rounded hover:bg-white/5 cursor-default transition-colors focus:bg-white/10"
      >
        Help
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-lg w-56 mt-1 text-[12px]"
      >
        <li>
          <button onClick={() => setRoute("home")} className="py-2">
            <FiHome className="w-3.5 h-3.5" /> Welcome
          </button>
        </li>
        <li>
          <button onClick={() => onOpenDoctor()} className="py-2">
            <FiActivity className="w-3.5 h-3.5 text-info" /> Forge Doctor
          </button>
        </li>
        <div className="divider my-0 opacity-10"></div>
        <li>
          <button
            onClick={() => {
              // Tauri developer tools toggle logic
            }}
            className="py-2"
          >
            <FiDevTools className="w-3.5 h-3.5" /> Toggle Developer Tools
          </button>
        </li>
        <div className="divider my-0 opacity-10"></div>
        <li>
          <a
            href="https://github.com/kang-cahya/NS-Forge/issues"
            target="_blank"
            className="py-2"
          >
            <FiAlertCircle className="w-3.5 h-3.5" /> Report Issue
          </a>
        </li>
        <li>
          <a
            href="https://github.com/kang-cahya/NS-Forge"
            target="_blank"
            className="py-2"
          >
            <FiHelpCircle className="w-3.5 h-3.5" /> Help Documentation
          </a>
        </li>
        <div className="divider my-0 opacity-10"></div>
        <li>
          <button className="py-2 opacity-50">
            <FiDownload className="w-3.5 h-3.5" /> Check for Updates...
          </button>
        </li>
        <li>
          <button onClick={() => onShowAbout()} className="py-2">
            <FiInfo className="w-3.5 h-3.5" /> About
          </button>
        </li>
      </ul>
    </div>
  );
}
