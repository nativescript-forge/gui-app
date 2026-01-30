import { useMemo, useState, useEffect } from "react";
import type { ProjectRow, BuildConfig } from "../../app/types";
import {
  FiCopy,
  FiPlay,
  FiCheckCircle,
  FiChevronDown,
  FiPackage,
  FiCpu,
  FiZap,
  FiBox,
  FiFolder,
  FiActivity,
  FiHardDrive,
  FiRefreshCw,
  FiAlertTriangle,
  FiInfo,
  FiTerminal,
  FiHash,
} from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { invoke } from "@tauri-apps/api/core";

type ActionsPageProps = {
  projects: ProjectRow[];
  projectPath: string | null;
  setProjectPath: (projectPath: string | null) => void;
  running: boolean;
  logText: string;
  logFilter: "all" | "errors";
  setLogFilter: (filter: "all" | "errors") => void;
  onOpenBuildModal: () => void;
  onRunAction: (
    action:
      | "run-android"
      | "run-ios"
      | "debug-android"
      | "debug-ios"
      | "build"
      | "clean",
    deviceId?: string,
    buildConfig?: BuildConfig,
  ) => void;
};

export function ActionsPage(props: ActionsPageProps) {
  const [nodeModulesExist, setNodeModulesExist] = useState<boolean | null>(
    null,
  );
  const [checkingHealth, setCheckingHealth] = useState(false);

  const activeProject = useMemo(() => {
    return props.projects.find((p) => p.path === props.projectPath);
  }, [props.projects, props.projectPath]);

  const lastOpenedStr = useMemo(() => {
    if (!activeProject?.last_opened) return "Never";
    return new Date(activeProject.last_opened).toLocaleString();
  }, [activeProject]);

  const createdAtStr = useMemo(() => {
    if (!activeProject?.created_at) return "N/A";
    return new Date(activeProject.created_at).toLocaleString();
  }, [activeProject]);

  const checkProjectHealth = async () => {
    if (!props.projectPath) return;
    setCheckingHealth(true);
    try {
      // Check if node_modules exists
      const exists = (await invoke("check_directory_exists", {
        path: `${props.projectPath}/node_modules`,
      })) as boolean;
      setNodeModulesExist(exists);
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    if (props.projectPath) {
      checkProjectHealth();
    }
  }, [props.projectPath]);

  const copyToClipboard = async (text: string) => {
    await writeText(text);
  };

  const projectPlatforms = useMemo(() => {
    if (!activeProject?.platforms) return [];
    return activeProject.platforms
      .split(",")
      .map((p) => p.trim().toLowerCase());
  }, [activeProject]);

  if (!props.projectPath) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-6 text-base-content/20">
          <FiPackage className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black mb-2">No Project Selected</h2>
        <p className="text-base-content/50 max-w-xs mb-8">
          Select a project from the list to view its console and run actions.
        </p>
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-primary px-8">
            Select Project
            <FiChevronDown className="ml-2" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[100] menu p-1 shadow-2xl bg-base-100 border border-base-200 rounded-xl w-64 mt-2"
          >
            {props.projects.map((p) => (
              <li key={p.path}>
                <button onClick={() => props.setProjectPath(p.path)}>
                  <FiPackage className="w-4 h-4" />
                  <span className="truncate">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header / Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-base-100 border border-base-200 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <FiPackage className="w-48 h-48" />
            </div>

            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary flex-shrink-0">
              <FiPackage className="w-10 h-10" />
            </div>

            <div className="flex-1 space-y-4 z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black tracking-tight">
                    {activeProject?.name}
                  </h1>
                  <div className="badge badge-primary badge-outline font-bold uppercase text-[10px]">
                    {activeProject?.framework || "NativeScript"}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/40 font-medium">
                  <FiFolder className="w-3 h-3" />
                  <span className="truncate max-w-md">{props.projectPath}</span>
                  <button
                    onClick={() => copyToClipboard(props.projectPath!)}
                    className="btn btn-ghost btn-xs btn-circle"
                    title="Copy Path"
                  >
                    <FiCopy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    Version
                  </div>
                  <div className="font-bold text-sm">
                    {activeProject?.version_name || "1.0.0"}
                  </div>
                </div>
                <div className="w-px h-8 bg-base-300 hidden sm:block"></div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    NativeScript
                  </div>
                  <div className="font-bold text-sm">
                    v{activeProject?.nativescript_version || "Latest"}
                  </div>
                </div>
                <div className="w-px h-8 bg-base-300 hidden sm:block"></div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    Platforms
                  </div>
                  <div className="flex gap-2">
                    {projectPlatforms.includes("android") && (
                      <SiAndroid className="w-4 h-4 opacity-60" />
                    )}
                    {projectPlatforms.includes("ios") && (
                      <SiApple className="w-4 h-4 opacity-60" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-200/50 border border-base-300 rounded-3xl">
              <div className="card-body p-6">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-4">
                  <FiPlay className="w-3 h-3" /> Development
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className="btn btn-outline border-base-300 hover:btn-primary justify-start gap-3 rounded-xl h-auto py-3"
                    disabled={props.running}
                    onClick={() => props.onRunAction("run-android")}
                  >
                    <SiAndroid className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Run Android</div>
                      <div className="text-[10px] opacity-50 font-normal">
                        Launch on emulator or device
                      </div>
                    </div>
                  </button>
                  <button
                    className="btn btn-outline border-base-300 hover:btn-primary justify-start gap-3 rounded-xl h-auto py-3"
                    disabled={props.running}
                    onClick={() => props.onRunAction("run-ios")}
                  >
                    <SiApple className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Run iOS</div>
                      <div className="text-[10px] opacity-50 font-normal">
                        Launch on simulator or device
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-200/50 border border-base-300 rounded-3xl">
              <div className="card-body p-6">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-4">
                  <FiZap className="w-3 h-3" /> Debugging
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className="btn btn-outline border-base-300 hover:btn-warning justify-start gap-3 rounded-xl h-auto py-3"
                    disabled={props.running}
                    onClick={() => props.onRunAction("debug-android")}
                  >
                    <SiAndroid className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Debug Android</div>
                      <div className="text-[10px] opacity-50 font-normal">
                        Inspect with Chrome DevTools
                      </div>
                    </div>
                  </button>
                  <button
                    className="btn btn-outline border-base-300 hover:btn-warning justify-start gap-3 rounded-xl h-auto py-3"
                    disabled={props.running}
                    onClick={() => props.onRunAction("debug-ios")}
                  >
                    <SiApple className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Debug iOS</div>
                      <div className="text-[10px] opacity-50 font-normal">
                        Inspect with Safari Web Inspector
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200/50 border border-base-300 rounded-3xl">
            <div className="card-body p-6">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-4">
                <FiBox className="w-3 h-3" /> Distribution
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  className="btn btn-primary justify-start gap-3 rounded-xl h-auto py-4"
                  disabled={props.running}
                  onClick={props.onOpenBuildModal}
                >
                  <FiPackage className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Build Project</div>
                    <div className="text-[10px] opacity-80 font-normal">
                      Generate APK/AAB or IPA for release
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Health & Utils */}
        <div className="space-y-6">
          <div className="bg-base-100 border border-base-200 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-40">
                Project Health
              </h3>
              <button
                onClick={checkProjectHealth}
                className={`btn btn-ghost btn-xs btn-circle ${checkingHealth ? "animate-spin" : ""}`}
              >
                <FiRefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-base-200/50">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${nodeModulesExist ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                >
                  {nodeModulesExist ? (
                    <FiCheckCircle className="w-5 h-5" />
                  ) : (
                    <FiAlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Dependencies</div>
                  <div className="text-[10px] opacity-50">
                    {nodeModulesExist
                      ? "node_modules found"
                      : "Missing node_modules"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-2xl bg-base-200/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiHash className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Plugins</div>
                  <div className="text-[10px] opacity-50">
                    {activeProject?.plugins_count || 0} installed plugins
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-2xl bg-base-200/50">
                <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
                  <FiCpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Target SDK</div>
                  <div className="text-[10px] opacity-50">
                    Android {activeProject?.target_sdk || "Not specified"}
                  </div>
                </div>
              </div>
            </div>

            {!nodeModulesExist && nodeModulesExist !== null && (
              <div className="mt-6 p-4 rounded-2xl bg-error/5 border border-error/10 text-error flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <FiInfo className="w-3 h-3" /> Action Required
                </div>
                <p className="text-[10px] leading-relaxed opacity-80">
                  Run{" "}
                  <code className="bg-error/10 px-1 rounded">npm install</code>{" "}
                  in your project directory to install dependencies.
                </p>
              </div>
            )}
          </div>

          <div className="bg-base-100 border border-base-200 rounded-3xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">
              Project Info
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Last Opened
                </div>
                <div className="text-xs font-medium">{lastOpenedStr}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Created At
                </div>
                <div className="text-xs font-medium">{createdAtStr}</div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 border border-base-200 rounded-3xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">
              Utilities
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                className="btn btn-ghost bg-base-200/50 hover:bg-error/10 hover:text-error justify-start gap-3 rounded-2xl h-auto py-4 px-5 border-none"
                disabled={props.running}
                onClick={() => props.onRunAction("clean")}
              >
                <FiRefreshCw className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-bold text-xs">Clean Project</div>
                  <div className="text-[10px] opacity-50 font-normal">
                    Remove platforms and node_modules
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Console Section */}
      <div className="bg-base-100 border border-base-200 rounded-3xl overflow-hidden flex flex-col h-[400px]">
        <div className="bg-base-200/50 px-6 py-4 flex items-center justify-between border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
              <FiTerminal className="w-3 h-3" /> Console Output
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="select select-xs select-ghost bg-base-300/50 rounded-lg text-[10px] font-bold"
              value={props.logFilter}
              onChange={(e) =>
                props.setLogFilter(e.target.value as "all" | "errors")
              }
            >
              <option value="all">ALL LOGS</option>
              <option value="errors">ERRORS ONLY</option>
            </select>
            <button
              onClick={() => copyToClipboard(props.logText)}
              className="btn btn-ghost btn-xs btn-square"
              title="Copy Logs"
            >
              <FiCopy className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 font-mono text-xs overflow-auto bg-black/5 dark:bg-black/20">
          {props.logText ? (
            <pre className="whitespace-pre-wrap break-all opacity-80 leading-relaxed">
              {props.logText}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-base-content/20 gap-3">
              <FiActivity className="w-8 h-8 opacity-20" />
              <p className="font-sans font-medium tracking-tight">
                Waiting for activity...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
