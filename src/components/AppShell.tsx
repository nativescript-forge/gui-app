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
  FiSmartphone,
  FiChevronDown,
  FiLayers,
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

const getFrameworkColor = (framework: string | null) => {
  const f = framework?.toLowerCase() || "";
  if (f.includes("angular"))
    return "bg-red-500/10 text-red-500 border-red-500/20";
  if (f.includes("vue"))
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (f.includes("react"))
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (f.includes("svelte"))
    return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  return "bg-base-300 text-base-content/70 border-base-content/10";
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
    { id: "app-actions", label: "Dashboard", icon: FiGrid },
    { id: "app-resources", label: "Resource Config", icon: FiLayers },
    { id: "app-config", label: "Project Config", icon: FiSettings },
    { id: "app-platform-config", label: "Platform Config", icon: FiSmartphone },
    { id: "app-plugins", label: "Install Plugin", icon: FiPackage },
    { id: "app-permissions", label: "Manage Permission", icon: FiKey },
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
            <div className="flex-1 px-4 py-6 pb-24 space-y-8 overflow-y-auto overflow-x-hidden">
              {/* Context Switcher (Only in App Mode) */}
              {props.isAppMode && (
                <div className="space-y-3">
                  <button
                    onClick={() => props.setRoute("home")}
                    className="btn btn-ghost btn-sm w-full justify-start gap-2 text-primary hover:bg-primary/10 transition-colors duration-200"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                    <span className="font-bold">Back to Home</span>
                  </button>

                  <div className="p-3 rounded-2xl bg-base-200/50 border border-base-300">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-2 px-1">
                      Current Application
                    </div>
                    <div className="dropdown w-full">
                      <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-ghost btn-sm w-full font-bold flex items-center justify-between px-2 h-auto min-h-[2.5rem] bg-base-100 border-base-300 hover:bg-base-100 hover:border-primary/30"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--p),0.5)]" />
                          <div className="flex flex-col items-start truncate">
                            <span className="truncate text-xs">
                              {props.projects.find(
                                (p) => p.path === props.activeProjectPath,
                              )?.name || "Select Project"}
                            </span>
                            {props.activeProjectPath && (
                              <span
                                className={`text-[7px] font-black uppercase leading-none mt-0.5 px-1 py-[1px] rounded-[2px] border-[0.5px] tracking-wider ${getFrameworkColor(props.projects.find((p) => p.path === props.activeProjectPath)?.framework || null)}`}
                              >
                                {props.projects.find(
                                  (p) => p.path === props.activeProjectPath,
                                )?.framework || "Plain"}
                              </span>
                            )}
                          </div>
                        </div>
                        <FiChevronDown className="w-3 h-3 opacity-50 flex-shrink-0" />
                      </div>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[100] menu p-1 shadow-2xl bg-base-100 border border-base-200 rounded-xl w-[calc(100%+1.5rem)] -left-3 mt-2 animate-in fade-in zoom-in-95 duration-200"
                      >
                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-base-200 mb-1">
                          Select Application
                        </div>
                        {props.projects.map((p) => (
                          <li key={p.path}>
                            <button
                              onClick={(e) => {
                                props.onSelectProject(p.path);
                                (e.currentTarget.closest(".dropdown") as any)
                                  ?.querySelector("[tabindex='0']")
                                  ?.blur();
                              }}
                              className={`flex items-center gap-3 py-3 rounded-lg ${
                                props.activeProjectPath === p.path
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "hover:bg-base-200"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  props.activeProjectPath === p.path
                                    ? "bg-primary text-primary-content"
                                    : "bg-base-200 opacity-50"
                                }`}
                              >
                                <FiPackage className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col items-start overflow-hidden">
                                <span className="truncate text-sm w-full">
                                  {p.name}
                                </span>
                                <span
                                  className={`text-[7px] font-black px-2 py-[0px] rounded-[2px] border-[0.5px] uppercase tracking-wider mt-0.5 ${getFrameworkColor(p.framework)}`}
                                >
                                  {p.framework || "Plain"}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                        {props.projects.length === 0 && (
                          <li className="disabled text-xs p-4 text-center opacity-50 italic">
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
