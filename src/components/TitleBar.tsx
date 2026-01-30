import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getName, getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import {
  FiSun,
  FiMoon,
  FiPlay,
  FiCpu,
  FiLoader,
  FiSmartphone,
  FiChevronDown,
  FiRefreshCw,
  FiAlertCircle,
  FiPackage,
} from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import type { ProjectRow, Route, Theme, AdbDevice } from "../app/types";

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
    action: "run-android" | "run-ios" | "debug-android" | "debug-ios" | "build",
    deviceId?: string,
  ) => void;
  actionsRunning: boolean;
  brandIconSrc: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenBuildModal: () => void;
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
}: TitleBarProps) {
  const [devices, setDevices] = useState<AdbDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios">("android");

  const scanDevices = async () => {
    setScanning(true);
    try {
      const result = (await invoke("get_adb_devices")) as AdbDevice[];
      setDevices(result);
      if (result.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(result[0].id);
      }
    } catch (e) {
      console.error("Failed to scan devices:", e);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (currentRoute.startsWith("app-")) {
      scanDevices();
    }
  }, [currentRoute]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  const handleRun = () => {
    const action = platform === "android" ? "run-android" : "run-ios";
    onRunAction(action, selectedDeviceId || undefined);
  };

  const handleDebug = () => {
    const action = platform === "android" ? "debug-android" : "debug-ios";
    onRunAction(action, selectedDeviceId || undefined);
  };
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

  return (
    <div
      data-tauri-drag-region
      onClick={handleTitleBarClick}
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
            className="px-3 h-10 flex items-center hover:bg-white/5 cursor-default transition-colors text-[13px] text-white/80 hover:text-white"
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

      {/* Center: Global App Switching & Quick Actions */}
      <div
        className="flex-1 flex justify-center items-center h-full gap-4 max-w-[60%]"
        data-tauri-drag-region
      >
        {currentRoute.startsWith("app-") && (
          <div className="flex items-center gap-2" data-tauri-drag-region>
            {/* Quick Run Buttons */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-md p-0.5">
              <button
                onClick={handleRun}
                disabled={actionsRunning}
                className="px-2 py-1 hover:bg-white/10 rounded text-success transition-colors flex items-center gap-1.5 group disabled:opacity-30"
                title="Run Project"
              >
                {actionsRunning ? (
                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FiPlay className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline">
                  Run
                </span>
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-0.5"></div>
              <button
                onClick={handleDebug}
                disabled={actionsRunning}
                className="px-2 py-1 hover:bg-white/10 rounded text-info transition-colors flex items-center gap-1.5 group disabled:opacity-30"
                title="Debug Project"
              >
                <FiCpu className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline">
                  Debug
                </span>
              </button>
            </div>

            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

            {/* Platform & Device Selector */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md p-0.5">
              {/* Platform Toggle */}
              <div className="flex bg-black/20 rounded p-0.5">
                <button
                  onClick={() => setPlatform("android")}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
                    platform === "android"
                      ? "bg-success/20 text-success shadow-sm"
                      : "text-white/40 hover:text-white/60"
                  }`}
                  title="Android"
                >
                  <SiAndroid className="w-3 h-3" />
                  {platform === "android" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Android
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setPlatform("ios")}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
                    platform === "ios"
                      ? "bg-info/20 text-info shadow-sm"
                      : "text-white/40 hover:text-white/60"
                  }`}
                  title="iOS"
                >
                  <SiApple className="w-3 h-3" />
                  {platform === "ios" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      iOS
                    </span>
                  )}
                </button>
              </div>

              {/* Device Dropdown */}
              <div className="dropdown dropdown-bottom">
                <div
                  tabIndex={0}
                  role="button"
                  className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded transition-colors"
                >
                  <FiSmartphone
                    className={`w-3.5 h-3.5 ${
                      selectedDevice ? "text-success" : "text-white/40"
                    }`}
                  />
                  <div className="flex flex-col items-start max-w-[120px]">
                    <span className="text-[10px] font-medium truncate w-full">
                      {selectedDevice ? selectedDevice.model : "No Device"}
                    </span>
                    {selectedDevice && (
                      <span className="text-[8px] opacity-40 leading-none">
                        {selectedDevice.id}
                      </span>
                    )}
                  </div>
                  <FiChevronDown className="w-3 h-3 opacity-40" />
                </div>

                <ul
                  tabIndex={0}
                  className="dropdown-content z-[100] menu p-1 shadow-2xl bg-[#252525] border border-white/10 rounded-md w-64 mt-1 text-[12px]"
                >
                  <div className="px-3 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      Devices
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        scanDevices();
                      }}
                      className={`p-1 hover:bg-white/10 rounded ${
                        scanning ? "animate-spin" : ""
                      }`}
                    >
                      <FiRefreshCw className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="divider my-0 opacity-10"></div>

                  {devices.length === 0 ? (
                    <div className="p-4 flex flex-col items-center gap-2 text-center">
                      <FiAlertCircle className="w-6 h-6 text-warning/50" />
                      <p className="text-[11px] text-white/60">
                        No devices detected
                      </p>
                      <div className="text-[9px] text-white/30 bg-white/5 p-2 rounded border border-white/5">
                        Tip: Make sure ADB is installed and USB Debugging is
                        enabled.
                      </div>
                    </div>
                  ) : (
                    devices
                      .filter((d) => d.platform === platform)
                      .map((device) => (
                        <li key={device.id}>
                          <button
                            onClick={() => setSelectedDeviceId(device.id)}
                            className={`flex items-center justify-between py-2 ${
                              selectedDeviceId === device.id
                                ? "bg-primary/10 text-primary"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <FiSmartphone className="w-4 h-4" />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">
                                  {device.model}
                                </span>
                                <span className="text-[9px] opacity-50 uppercase tracking-tighter">
                                  {device.status} • {device.id}
                                </span>
                              </div>
                            </div>
                            {selectedDeviceId === device.id && (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--p),0.5)]" />
                            )}
                          </button>
                        </li>
                      ))
                  )}

                  {devices.filter((d) => d.platform === platform).length ===
                    0 &&
                    devices.length > 0 && (
                      <div className="p-3 text-center text-[10px] opacity-40 italic">
                        No {platform} devices available.
                      </div>
                    )}

                  <div className="divider my-1 opacity-10"></div>
                  <li>
                    <button
                      onClick={() => setRoute("app-doctor")}
                      className="text-[11px] text-primary hover:bg-primary/10 py-2"
                    >
                      ADB not found? Check Doctor
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

            {/* Build Button */}
            <button
              onClick={onOpenBuildModal}
              disabled={actionsRunning}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-md text-primary transition-all group active:scale-95 disabled:opacity-50"
              title="Configure Build"
            >
              <FiPackage className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline">
                Build
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Right side: Controls */}
      <div className="flex items-center h-full gap-1" data-tauri-drag-region>
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
