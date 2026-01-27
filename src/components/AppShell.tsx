import type { ReactNode } from "react";
import type { Route, Theme } from "../app/types";
import {
  FiActivity,
  FiFolderPlus,
  FiGrid,
  FiHome,
  FiMenu,
  FiMoon,
  FiPlus,
  FiSun,
  FiTerminal,
} from "react-icons/fi";

type AppShellProps = {
  theme: Theme;
  route: Route;
  setRoute: (route: Route) => void;
  activeProjectPathLabel: string;
  brandIconSrc: string;
  onToggleTheme: () => void;
  onAddProject: () => void;
  onCreateProject: () => void;
  children: ReactNode;
  onOpenDoctor: () => void;
};

export function AppShell(props: AppShellProps) {
  return (
    <div
      data-theme={props.theme}
      className="h-screen w-full bg-base-200 text-base-content overflow-hidden"
    >
      <div className="drawer lg:drawer-open h-full">
        <input id="nsf-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex flex-col h-full overflow-hidden">
          {/* Navbar - Fixed at top */}
          <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-30 min-h-[64px]">
            <div className="flex-none lg:hidden">
              <label htmlFor="nsf-drawer" className="btn btn-square btn-ghost">
                <FiMenu className="h-5 w-5" />
              </label>
            </div>

            <div className="flex-1 gap-3 px-4">
              <div className="hidden md:flex items-center gap-2 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-200 border border-base-300">
                  <FiGrid className="h-3.5 w-3.5 opacity-50" />
                  <span className="font-medium opacity-50 uppercase tracking-wider text-[10px]">
                    Active Project
                  </span>
                  <div className="divider divider-horizontal m-0 h-4 self-center"></div>
                  <span className="truncate max-w-[30vw] font-mono opacity-70 italic">
                    {props.activeProjectPathLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-none gap-2 px-2">
              <div
                className="tooltip tooltip-bottom"
                data-tip={
                  props.theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-square"
                  onClick={props.onToggleTheme}
                >
                  {props.theme === "dark" ? (
                    <FiSun className="h-4 w-4" />
                  ) : (
                    <FiMoon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm gap-2"
                onClick={props.onCreateProject}
              >
                <FiPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </button>
              <button
                type="button"
                className="btn btn-neutral btn-sm gap-2"
                onClick={props.onAddProject}
              >
                <FiFolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Existing</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {props.children}
          </div>
        </div>

        <div className="drawer-side">
          <label
            htmlFor="nsf-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          />
          <aside className="w-72 bg-base-100 border-r border-base-200 h-full flex flex-col">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-12 rounded-xl bg-base-200 p-2 border border-base-300">
                    <img src={props.brandIconSrc} alt="NativeScript Forge" />
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg leading-tight">
                    NativeScript Forge
                  </div>
                  <div className="text-[10px] uppercase tracking-widest opacity-40">
                    Development
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 px-4">
              <ul className="menu w-full p-0 gap-1">
                <li className="menu-title uppercase text-[10px] tracking-widest font-bold opacity-50 px-4 py-2">
                  Main Navigation
                </li>
                <li>
                  <button
                    type="button"
                    className={`gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${props.route === "welcome" ? "active" : ""}`}
                    onClick={() => props.setRoute("welcome")}
                  >
                    <FiHome className="h-4 w-4" />
                    Welcome
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${props.route === "create" ? "active" : ""}`}
                    onClick={() => props.setRoute("create")}
                  >
                    <FiPlus className="h-4 w-4" />
                    Create New
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${props.route === "projects" ? "active" : ""}`}
                    onClick={() => props.setRoute("projects")}
                  >
                    <FiGrid className="h-4 w-4" />
                    Library
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${props.route === "doctor" ? "active" : ""}`}
                    onClick={() => props.setRoute("doctor")}
                  >
                    <FiActivity className="h-4 w-4" />
                    Health Check
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${props.route === "actions" ? "active" : ""}`}
                    onClick={() => props.setRoute("actions")}
                  >
                    <FiTerminal className="h-4 w-4" />
                    Quick Actions
                  </button>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
