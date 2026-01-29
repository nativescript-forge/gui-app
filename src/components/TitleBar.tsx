import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getName, getVersion } from "@tauri-apps/api/app";
import { FiSearch, FiSun, FiMoon } from "react-icons/fi";
import type { ProjectRow, Route, Theme } from "../app/types";

// Sub-components
import { FileMenu } from "./TitleBar/FileMenu";
import { RunMenu } from "./TitleBar/RunMenu";
import { HelpMenu } from "./TitleBar/HelpMenu";
import { ProjectSelector } from "./TitleBar/ProjectSelector";
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
  brandIconSrc: string;
  theme: Theme;
  onToggleTheme: () => void;
}

export function TitleBar({
  projects,
  activeProjectPath,
  onSelectProject,
  onAddProject,
  onCreateProject,
  onOpenDoctor,
  setRoute,
  brandIconSrc,
  theme,
  onToggleTheme,
}: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
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

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await appWindow.close();
    } catch (err) {
      console.error("Failed to close window:", err);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 bg-[#1e1e1e] flex items-center justify-between select-none border-b border-white/5 text-white/70"
    >
      {/* Left side: Logo and Menus */}
      <div
        className="flex items-center h-full px-3 gap-2"
        data-tauri-drag-region
      >
        <div
          className="flex items-center gap-1 mr-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setRoute("home")}
          data-tauri-drag-region
        >
          <img
            src={brandIconSrc}
            alt="Logo"
            className="w-6 h-6 object-contain pointer-events-none"
          />
        </div>

        <div
          className="flex items-center h-full text-[12px]"
          data-tauri-drag-region
        >
          <FileMenu
            onCreateProject={onCreateProject}
            onAddProject={onAddProject}
            onSelectProject={onSelectProject}
            projects={projects}
          />

          <RunMenu activeProject={activeProject} setRoute={setRoute} />

          {/* Terminal */}
          <button
            onClick={() => setRoute("app-actions")}
            className="px-2.5 py-1 rounded hover:bg-white/5 cursor-default transition-colors"
          >
            Terminal
          </button>

          <HelpMenu
            setRoute={setRoute}
            onOpenDoctor={onOpenDoctor}
            onShowAbout={() => setShowAboutModal(true)}
          />
        </div>
      </div>

      {/* Center: Project Selector */}
      <ProjectSelector
        projects={projects}
        activeProject={activeProject}
        activeProjectPath={activeProjectPath}
        onSelectProject={onSelectProject}
        onAddProject={onAddProject}
      />

      {/* Right side: Search and Controls */}
      <div className="flex items-center h-full gap-1" data-tauri-drag-region>
        <div className="flex items-center bg-white/5 border border-white/10 rounded px-2 py-0.5 mr-2 group focus-within:bg-white/10 transition-colors">
          <FiSearch className="w-3 h-3 opacity-30 group-focus-within:opacity-70" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-[11px] px-2 w-32 focus:w-48 transition-all"
          />
        </div>

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
        />
      </div>

      {/* About Modal */}
      <AboutModal
        show={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        brandIconSrc={brandIconSrc}
        appInfo={appInfo}
      />
    </div>
  );
}
