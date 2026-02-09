import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getName, getVersion } from "@tauri-apps/api/app";
import { FiSun, FiMoon, FiLoader, FiPackage, FiLogOut } from "react-icons/fi";
import { LuRocket } from "react-icons/lu";
import type { ProjectRow, Route, Theme } from "../app/types";

// Sub-components
import { FileMenu } from "./TitleBar/FileMenu";
import { RunMenu } from "./TitleBar/RunMenu";
import { HelpMenu } from "./TitleBar/HelpMenu";
import { WindowControls } from "./TitleBar/WindowControls";
import { AboutModal } from "./TitleBar/AboutModal";

const appWindow = getCurrentWindow();

interface TitleBarProps {
  projects: ProjectRow[];
  activeProjectPath: string | null;
  onSelectProject: (path: string) => void;
  onAddProject: () => void;
  onCreateProject: () => void;
  onOpenDoctor: () => void;
  setRoute: (route: Route) => void;
  currentRoute: Route;
  onRunAction: (
    action:
      | "run-android"
      | "run-ios"
      | "debug-android"
      | "debug-ios"
      | "build"
      | "clean"
      | "install"
      | "doctor"
      | "info"
      | "update"
      | "migrate"
      | "package-manager"
      | "resources-update"
      | "resources-generate-splashes"
      | "resources-generate-icons",
    deviceId?: string,
    buildConfig?: any,
    sourcePath?: string,
    backgroundColor?: string,
  ) => Promise<string | void>;
  actionsRunning: boolean;
  brandIconSrc: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenBuildModal: () => void;
  onOpenRunModal: (
    platform: "android" | "ios" | null,
    action?: "run" | "debug",
  ) => void;
  isMac: boolean;
}

export function TitleBar({
  projects,
  activeProjectPath,
  onSelectProject,
  onAddProject,
  onCreateProject,
  onOpenDoctor,
  setRoute,
  currentRoute,
  onRunAction,
  actionsRunning,
  brandIconSrc,
  theme,
  onToggleTheme,
  onOpenBuildModal,
  onOpenRunModal,
  isMac,
}: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [appInfo, setAppInfo] = useState({
    name: "NS Forge",
    version: "1.0.0",
  });

  const activeProject = projects.find((p) => p.path === activeProjectPath);

  useEffect(() => {
    const fetchAppInfo = async () => {
      try {
        const [name, version] = await Promise.all([getName(), getVersion()]);
        const formattedName = name
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        setAppInfo({ name: formattedName, version });
      } catch (err) {
        console.error("Failed to fetch app info:", err);
      }
    };

    fetchAppInfo();

    const updateMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    updateMaximized();

    const unlisten = appWindow.onResized(() => {
      updateMaximized();
    });

    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await appWindow.minimize();
    } catch (err) {
      console.error("Failed to minimize window:", err);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await appWindow.toggleMaximize();
    } catch (err) {
      console.error("Failed to toggle maximize:", err);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowExitModal(true);
  };

  const confirmExit = async () => {
    try {
      const win = getCurrentWindow();
      // First try a graceful close
      await win.close();

      // If the window is still alive (some OS/conditions), force destroy
      // This is a safety measure if close() is ignored or blocked
      setTimeout(async () => {
        try {
          await win.destroy();
        } catch (e) {
          // ignore error if already closed
        }
      }, 300);
    } catch (err) {
      console.error("Failed to close window:", err);
      // Fallback to direct destroy if close() throws
      try {
        await getCurrentWindow().destroy();
      } catch (e) {}
    }
  };

  const handleTitleBarClick = (e: React.MouseEvent) => {
    // Blur any active dropdown when clicking on non-interactive parts of the title bar
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, a, input, [role="button"]');

    if (!isInteractive) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  const dragProps =
    currentRoute === "setup" ? {} : { "data-tauri-drag-region": true };

  return (
    <div
      {...dragProps}
      onClick={handleTitleBarClick}
      className="h-10 bg-[#1e1e1e] flex items-center justify-between select-none border-b border-white/5 text-white/70"
    >
      {/* Left side: Logo and Menus */}
      <div className="flex items-center h-full px-3 gap-2" {...dragProps}>
        <div
          className="flex items-center gap-1 mr-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setRoute("home")}
          {...dragProps}
        >
          <img
            src={brandIconSrc}
            alt="Logo"
            className="w-6 h-6 object-contain pointer-events-none"
          />
        </div>

        <div className="flex items-center h-full text-[12px]" {...dragProps}>
          {currentRoute !== "setup" && (
            <>
              <FileMenu
                onCreateProject={onCreateProject}
                onAddProject={onAddProject}
                onSelectProject={onSelectProject}
                projects={projects}
                onOpenSettings={() => setRoute("settings")}
              />

              <RunMenu activeProject={activeProject} setRoute={setRoute} />

              <HelpMenu
                setRoute={setRoute}
                onOpenDoctor={onOpenDoctor}
                onShowAbout={() => setShowAboutModal(true)}
              />
            </>
          )}
        </div>
      </div>

      {/* Center: Dashboard Actions */}
      <div
        className="flex-1 flex justify-center items-center h-full gap-3 max-w-[60%]"
        {...dragProps}
      >
        {currentRoute.startsWith("app-") && (
          <div className="flex items-center gap-2" {...dragProps}>
            {/* Launch App Button */}
            <div
              className="tooltip tooltip-bottom"
              data-tip={
                actionsRunning ? "Action already running" : "Launch Application"
              }
            >
              <button
                onClick={() => onOpenRunModal(null)}
                disabled={actionsRunning}
                className="flex items-center gap-2 px-3 py-1.5 bg-success/10 hover:bg-success/20 border border-success/20 rounded-md text-success transition-all group active:scale-95 disabled:opacity-50"
              >
                {actionsRunning ? (
                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LuRocket className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline">
                  Launch App
                </span>
              </button>
            </div>

            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

            {/* Build Button */}
            <div
              className="tooltip tooltip-bottom"
              data-tip={
                actionsRunning
                  ? "Action already running"
                  : "Build & Package Application"
              }
            >
              <button
                onClick={onOpenBuildModal}
                disabled={actionsRunning}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-md text-primary transition-all group active:scale-95 disabled:opacity-50"
              >
                <FiPackage className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline">
                  Build
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Actions & Controls */}
      <div className="flex items-center h-full gap-1" {...dragProps}>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded hover:bg-white/10 transition-colors mr-2 group"
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          {theme === "dark" ? (
            <FiSun className="w-3.5 h-3.5 text-warning/70 group-hover:text-warning" />
          ) : (
            <FiMoon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
          )}
        </button>

        <WindowControls
          handleMinimize={handleMinimize}
          handleMaximize={handleMaximize}
          handleClose={handleClose}
          isMaximized={isMaximized}
          maximizeDisabled={currentRoute === "setup"}
          minimizeDisabled={false}
        />
      </div>

      {/* About Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        brandIconSrc={brandIconSrc}
        appInfo={appInfo}
      />
      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="modal-box border border-white/10 bg-[#1e1e1e] shadow-2xl max-w-sm">
            <div className="flex items-center gap-4 mb-4 text-error">
              <div className="p-3 rounded-full bg-error/10">
                <FiLogOut className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Exit Application</h3>
            </div>
            <p className="py-2 text-white/70">
              Are you sure you want to close{" "}
              <b className="text-white">NativeScript Forge</b>?
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm text-white/50 hover:text-white"
                onClick={() => setShowExitModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm px-6"
                onClick={confirmExit}
              >
                Exit
              </button>
            </div>
          </div>
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setShowExitModal(false)}
          />
        </div>
      )}
    </div>
  );
}
