import {
  FiHome,
  FiActivity,
  FiTerminal as FiDevTools,
  FiAlertCircle,
  FiHelpCircle,
  FiDownload,
  FiInfo,
} from "react-icons/fi";
import type { Route } from "../../shared/types";

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
        Help
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-md w-56 mt-0 text-[12px]"
      >
        <li>
          <button
            onClick={(e) => {
              setRoute("home");
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
          >
            <FiHome className="w-3.5 h-3.5 opacity-70" /> Welcome
          </button>
        </li>
        <li>
          <button
            onClick={(e) => {
              onOpenDoctor();
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
          >
            <FiActivity className="w-3.5 h-3.5 text-info opacity-80" /> Forge
            Doctor
          </button>
        </li>
        <div className="divider my-1 opacity-10"></div>
        <li>
          <button
            onClick={(e) => {
              // Tauri developer tools toggle logic
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
          >
            <FiDevTools className="w-3.5 h-3.5 opacity-70" /> Toggle Developer
            Tools
          </button>
        </li>
        <div className="divider my-1 opacity-10"></div>
        <li>
          <a
            href="https://github.com/nativescript-forge/gui-app/issues"
            target="_blank"
            onClick={closeDropdown}
            className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
          >
            <FiAlertCircle className="w-3.5 h-3.5 opacity-70" /> Report Issue
          </a>
        </li>
        <li>
          <a
            href="https://github.com/nativescript-forge/gui-app"
            target="_blank"
            onClick={closeDropdown}
            className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
          >
            <FiHelpCircle className="w-3.5 h-3.5 opacity-70" /> Help
            Documentation
          </a>
        </li>
        <div className="divider my-1 opacity-10"></div>
        <li>
          <button className="py-1.5 opacity-30 cursor-not-allowed flex items-center gap-2">
            <FiDownload className="w-3.5 h-3.5" /> Check for Updates...
          </button>
        </li>
        <li>
          <button
            onClick={(e) => {
              onShowAbout();
              closeDropdown(e);
            }}
            className="py-1.5 hover:bg-white/10 rounded flex items-center gap-2"
          >
            <FiInfo className="w-3.5 h-3.5 opacity-70" /> About
          </button>
        </li>
      </ul>
    </div>
  );
}
