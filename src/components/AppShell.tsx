import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiChevronLeft,
  FiFolderPlus,
  FiGrid,
  FiHome,
  FiKey,
  FiMenu,
  FiMoon,
  FiPackage,
  FiPlus,
  FiSettings,
  FiSun,
  FiTerminal,
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
          <div className="lg:hidden flex items-center justify-between p-4 bg-base-100 border-b border-base-200">
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

          <main className="flex-1 overflow-auto p-4 lg:p-8">
            {props.children}
          </main>
        </div>

        <div className="drawer-side">
          <label
            htmlFor="nsf-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          />
          <aside className="w-72 bg-base-100 border-r border-base-200 h-full flex flex-col">
            {/* Logo Section */}
            <div className="p-8 pb-4">
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
            <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
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
                    <select
                      className="select select-ghost select-sm w-full font-bold focus:bg-transparent"
                      value={props.activeProjectPath ?? ""}
                      onChange={(e) => props.onSelectProject(e.target.value)}
                    >
                      {props.projects.map((p) => (
                        <option key={p.path} value={p.path}>
                          {p.name}
                        </option>
                      ))}
                    </select>
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

            {/* Footer */}
            <div className="p-4 border-t border-base-200 bg-base-50/30">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] opacity-30 font-bold uppercase tracking-widest">
                  v1.0.0
                </span>
                <span className="text-[10px] opacity-30 font-bold uppercase tracking-widest">
                  NS-Forge
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
