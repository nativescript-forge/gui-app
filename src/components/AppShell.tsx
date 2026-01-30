import { useState, useEffect, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { getVersion, getName } from "@tauri-apps/api/app";
import {
  FiActivity,
  FiChevronLeft,
  FiFolderPlus,
  FiGrid,
  FiHome,
  FiKey,
  FiMenu,
  FiPackage,
  FiPlus,
  FiSettings,
  FiTerminal,
  FiChevronDown,
} from "react-icons/fi";
import type { ProjectRow, Route, Theme } from "../app/types";

interface SidebarItem {
  id: string;
  label: string;
  icon: IconType;
  onClick?: () => void;
}

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
  isAppMode: boolean;
  projects: ProjectRow[];
  activeProjectPath: string | null;
  onSelectProject: (path: string | null) => void;
  onOpenBuildModal: () => void;
};

export function AppShell(props: AppShellProps) {
  const [appInfo, setAppInfo] = useState({
    name: "NS-Forge",
    version: "0.1.0",
  });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const [name, version] = await Promise.all([getName(), getVersion()]);
        setAppInfo({ name, version });
      } catch (err) {
        console.error("Failed to fetch app info:", err);
      }
    };
    fetchInfo();
  }, []);

  const homeSidebarItems: SidebarItem[] = [
    { id: "home", label: "Home", icon: FiHome },
    { id: "create", label: "Create Project", icon: FiPlus },
    {
      id: "add",
      label: "Add Existing",
      icon: FiFolderPlus,
      onClick: props.onAddProject,
    },
    { id: "projects", label: "Projects", icon: FiGrid },
  ];

  const bottomSidebarItems: SidebarItem[] = [
    { id: "activity", label: "Activity", icon: FiActivity },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  const appSidebarItems: SidebarItem[] = [
    { id: "app-doctor", label: "Health Check", icon: FiActivity },
    { id: "app-actions", label: "Quick Action", icon: FiTerminal },
    { id: "app-plugins", label: "Install Plugin", icon: FiPackage },
    { id: "app-permissions", label: "Manage Permission", icon: FiKey },
    { id: "app-config", label: "Project Config", icon: FiSettings },
  ];

  const sidebarItems = props.isAppMode ? appSidebarItems : homeSidebarItems;

  return (
    <div
      data-theme={props.theme}
      className="flex-1 w-full bg-base-200 text-base-content overflow-hidden"
    >
      <div className="drawer lg:drawer-open h-full">
        <input id="nsf-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex flex-col h-full overflow-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-base-100 border-b border-base-200 shrink-0">
            <div className="flex items-center gap-2">
              <img src={props.brandIconSrc} className="w-6 h-6" alt="Logo" />
              <span className="font-black tracking-tighter text-lg">FORGE</span>
            </div>
            <label
              htmlFor="nsf-drawer"
              className="btn btn-ghost btn-sm drawer-button"
            >
              <FiMenu className="h-5 w-5" />
            </label>
          </div>

          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto pb-20 lg:pb-32">
              {props.children}
            </div>
          </main>
        </div>

        <div className="drawer-side h-full overflow-hidden">
          <label
            htmlFor="nsf-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          />
          <aside className="w-72 bg-base-100 border-r border-base-200 h-full flex flex-col transition-all duration-300 pt-2">
            {/* Logo Section */}
            <div className="p-8 pb-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-2xl bg-base-200 text-base-content border border-base-300 shadow-sm">
                  <img
                    src={props.brandIconSrc}
                    className="w-10 h-10 object-contain"
                    alt="Logo"
                  />
                </div>
                <div>
                  <div className="font-black tracking-tighter text-xl leading-none">
                    FORGE
                  </div>
                  <div className="text-[10px] opacity-40 font-bold tracking-[0.2em] uppercase mt-1">
                    NativeScript
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6 pb-24 space-y-8 overflow-y-auto">
              {/* Context Switcher (Only in App Mode) */}
              {props.isAppMode && (
                <div className="space-y-3">
                  <button
                    onClick={() => props.setRoute("home")}
                    className="btn btn-ghost btn-sm w-full justify-start gap-2 text-primary hover:bg-primary/10"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                  </button>

                  <div className="p-3 rounded-2xl bg-base-200/50 border border-base-300">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-2 px-1">
                      Current Application
                    </div>
                    <div className="dropdown w-full">
                      <div
                        tabIndex={0}
                        role="button"
                        className="select select-ghost select-sm w-full font-bold flex items-center justify-between px-2 h-auto min-h-[2rem]"
                      >
                        <span className="truncate pr-2">
                          {props.projects.find(
                            (p) => p.path === props.activeProjectPath,
                          )?.name || "Select Project"}
                        </span>
                        <FiChevronDown className="w-3 h-3 opacity-50 flex-shrink-0" />
                      </div>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-base-100 border border-base-200 rounded-xl w-64 mt-2"
                      >
                        {props.projects.map((p) => (
                          <li key={p.path}>
                            <button
                              onClick={() => props.onSelectProject(p.path)}
                              className={
                                props.activeProjectPath === p.path
                                  ? "active"
                                  : ""
                              }
                            >
                              <FiPackage className="w-4 h-4" />
                              <span className="truncate">{p.name}</span>
                            </button>
                          </li>
                        ))}
                        {props.projects.length === 0 && (
                          <li className="disabled text-xs p-2 text-center opacity-50 italic">
                            No projects added
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4">
                  {props.isAppMode ? "Project Tools" : "Main Navigation"}
                </div>
                <div className="space-y-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          props.setRoute(item.id as Route);
                        }
                      }}
                      className={`btn btn-ghost btn-block justify-start gap-3 rounded-xl transition-all duration-200 ${
                        props.route === item.id
                          ? "bg-primary/10 text-primary font-bold shadow-sm"
                          : "hover:bg-base-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${props.route === item.id ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Menu Section */}
            {!props.isAppMode && (
              <div className="px-4 pb-2 space-y-1">
                {bottomSidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        props.setRoute(item.id as Route);
                      }
                    }}
                    className={`btn btn-ghost btn-block justify-start gap-3 rounded-xl transition-all duration-200 ${
                      props.route === item.id
                        ? "bg-primary/10 text-primary font-bold shadow-sm"
                        : "hover:bg-base-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 ${props.route === item.id ? "text-primary" : ""}`}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-base-200 bg-base-50/30">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] opacity-30 font-bold uppercase tracking-widest">
                  v{appInfo.version}
                </span>
                <span className="text-[10px] opacity-30 font-bold uppercase tracking-widest">
                  {appInfo.name}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
