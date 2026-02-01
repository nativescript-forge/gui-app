import { useState, useEffect } from "react";
import {
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
  FiTerminal,
  FiGlobe,
  FiZap,
  FiEye,
  FiX,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";
import { invoke } from "@tauri-apps/api/core";
import { NativeScriptConfig } from "../../app/types";

type ProjectConfigPageProps = {
  projectPath: string | null;
};

const CONFIG_DESCRIPTIONS: Record<string, string> = {
  id: "App's bundle identifier (e.g., com.company.app). Unique for each app.",
  projectName: "Custom platform project name. Default is based on project directory basename.",
  appPath: "Path to the app source directory (usually 'src' or 'app').",
  appResourcesPath: "Path to App_Resources folder.",
  main: "App's main entry file (overrides package.json setting).",
  bundler: "The bundler tool to use for the project.",
  cssParser: "The default CSS parser NativeScript will use.",
  profiling: "Enable profiling (e.g., 'timeline') for performance analysis.",
  shared: "Indicates if this is a shared project.",
  logScriptLoading: "Enable runtime logging of script loading events.",
  showErrorDisplay: "Show a visual error screen when an uncaught JS exception occurs.",
  "android.v8Flags": "V8 runtime flags. '--expose_gc' is required for the runtime.",
  "android.markingMode": "'none' or 'full'. Controls how the GC identifies objects. 'full' is deprecated.",
  "android.gcThrottleTime": "Frequency in ms to automatically trigger garbage collection. 0 to disable.",
  "android.maxLogcatObjectSize": "Maximum size of a single output string in Logcat.",
  "android.codeCache": "Enable code caching to speed up application startup.",
  "android.handleTimeZoneChanges": "Allow the app to be notified of system time zone changes.",
  "android.forceLog": "Enable logging even in release builds.",
  "android.enableLineBreakpoints": "Used for advanced debugging with line-level breakpoints.",
  "android.enableMultithreadedJavascript": "Enable experimental multithreaded JS engine. Use with caution.",
  "android.memoryCheckInterval": "Frequency in ms for freeMemoryRatio check.",
  "android.freeMemoryRatio": "Percentage of memory (0.0 to 1.0) before forcing a GC.",
  "ios.id": "Override bundle identifier specifically for iOS.",
  "ios.discardUncaughtJsExceptions": "Prevent app crash on uncaught exceptions in production.",
  "cli.packageManager": "The package manager to use (npm, yarn, pnpm).",
  "security.allowRemoteModules": "Enable remote ES module loading (https://...). Disabled by default.",
};

const DEVELOPMENT_PRESET: NativeScriptConfig = {
  android: {
    discardUncaughtJsExceptions: false,
    codeCache: false,
    v8Flags: "--nolazy --expose_gc",
    markingMode: "none",
  },
  showErrorDisplay: true,
  logScriptLoading: true,
};

const PRODUCTION_PRESET: NativeScriptConfig = {
  android: {
    codeCache: true,
    v8Flags: "--optimize-for-size",
    gcThrottleTime: 1000,
    memoryCheckInterval: 1000,
    freeMemoryRatio: 0.45,
    discardUncaughtJsExceptions: true,
    forceLog: false,
    maxLogcatObjectSize: 512,
    markingMode: "none",
  },
  showErrorDisplay: false,
  logScriptLoading: false,
  security: {
    allowRemoteModules: false,
  },
};

export function ProjectConfigPage({ projectPath }: ProjectConfigPageProps) {
  const [config, setConfig] = useState<NativeScriptConfig>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "general" | "android" | "ios" | "cli" | "security" | "presets"
  >("general");

  // Preset Preview State
  const [previewPreset, setPreviewPreset] = useState<{
    name: string;
    data: NativeScriptConfig;
  } | null>(null);

  useEffect(() => {
    if (projectPath) {
      loadConfig();
    }
  }, [projectPath]);

  const parseConfig = (content: string): NativeScriptConfig => {
    try {
      const match = content.match(/export\s+default\s+([\s\S]+?)\s+as\s+NativeScriptConfig/);
      if (match) {
        let objectStr = match[1].trim();
        if (objectStr.endsWith(";")) objectStr = objectStr.slice(0, -1);
        return new Function(`return ${objectStr}`)();
      }
      return {};
    } catch (e) {
      console.error("Failed to parse config:", e);
      return {};
    }
  };

  const stringifyConfig = (config: NativeScriptConfig): string => {
    const cleanConfig = JSON.parse(JSON.stringify(config, (key, value) => {
      if (value === "none" || value === "" || value === null) return undefined;
      return value;
    }));

    const jsonStr = JSON.stringify(cleanConfig, null, 2)
      .replace(/"([^"]+)":/g, '$1:')
      .replace(/"/g, "'");

    return `import { NativeScriptConfig } from '@nativescript/core';\n\nexport default ${jsonStr} as NativeScriptConfig;`;
  };

  const loadConfig = async () => {
    if (!projectPath) return;
    setLoading(true);
    setError(null);
    try {
      const content = await invoke<string>("read_ns_config", { projectPath });
      const parsed = parseConfig(content);
      setConfig(parsed);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!projectPath) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const content = stringifyConfig(config);
      await invoke("write_ns_config", { projectPath, content });
      setSuccess("Configuration saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = () => {
    if (!previewPreset) return;
    
    const newConfig = { ...config };
    const presetData = previewPreset.data;

    // Deep merge preset into config, ignoring 'id'
    const merge = (target: any, source: any) => {
      for (const key in source) {
        if (key === 'id') continue;
        if (source[key] instanceof Object && key in target) {
          merge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };

    merge(newConfig, presetData);
    setConfig(newConfig);
    setPreviewPreset(null);
    setSuccess(`Preset '${previewPreset.name}' applied! Don't forget to save.`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const updateConfig = (path: string, value: any) => {
    const newConfig = { ...config };
    const keys = path.split(".");
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const renderInput = (label: string, path: string, type: "text" | "number" | "boolean" | "select", options?: string[]) => {
    const value = path.split(".").reduce((obj, key) => obj?.[key], config as any);
    const description = CONFIG_DESCRIPTIONS[path] || CONFIG_DESCRIPTIONS[label.toLowerCase()];
    
    return (
      <div className="form-control w-full">
        <label className="label py-1">
          <span className="label-text font-bold opacity-70 flex items-center gap-2">
            {label}
          </span>
        </label>
        {type === "boolean" ? (
          <input 
            type="checkbox" 
            className="toggle toggle-primary" 
            checked={!!value}
            onChange={(e) => updateConfig(path, e.target.checked)}
          />
        ) : type === "select" ? (
          <select 
            className="select select-bordered w-full select-sm"
            value={value || "none"}
            onChange={(e) => updateConfig(path, e.target.value)}
          >
            <option value="none">Not Set (None)</option>
            {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input 
            type={type} 
            className="input input-bordered w-full input-sm" 
            value={value || ""}
            placeholder="None"
            onChange={(e) => updateConfig(path, type === "number" ? Number(e.target.value) : e.target.value)}
          />
        )}
        {description && (
          <label className="label py-0">
            <span className="label-text-alt opacity-50 italic">{description}</span>
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="text-3xl font-extrabold flex items-center gap-3">
            <FiSettings className="text-primary" />
            Project Config
          </div>
          <div className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Modify nativescript.config.ts and app properties
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            className={`btn btn-ghost btn-sm ${loading ? "loading" : ""}`} 
            onClick={loadConfig}
            disabled={loading || saving}
          >
            {!loading && <FiRefreshCw />}
            Reload
          </button>
          <button 
            className={`btn btn-primary btn-sm ${saving ? "loading" : ""}`} 
            onClick={handleSave}
            disabled={loading || saving || !projectPath}
          >
            {!saving && <FiSave />}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6 shadow-lg py-2">
          <FiAlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-6 shadow-lg py-2">
          <FiCheckCircle className="w-5 h-5" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-1">
            <button 
              className={`btn btn-sm justify-start gap-3 ${activeTab === "general" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("general")}
            >
              <FiGlobe /> General
            </button>
            <button 
              className={`btn btn-sm justify-start gap-3 ${activeTab === "android" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("android")}
            >
              <FaAndroid /> Android
            </button>
            <button 
              className={`btn btn-sm justify-start gap-3 ${activeTab === "ios" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("ios")}
            >
              <FaApple /> iOS
            </button>
            <button 
              className={`btn btn-sm justify-start gap-3 ${activeTab === "cli" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("cli")}
            >
              <FiTerminal /> CLI
            </button>
            <button 
              className={`btn btn-sm justify-start gap-3 ${activeTab === "security" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("security")}
            >
              <FiShield /> Security
            </button>
            <div className="divider my-1"></div>
            <button 
              className={`btn btn-sm justify-start gap-3 ${activeTab === "presets" ? "btn-secondary text-white" : "btn-ghost"}`}
              onClick={() => setActiveTab("presets")}
            >
              <FiZap /> Presets
            </button>
          </div>
        </div>

        {/* Form Area */}
        <div className="lg:col-span-3">
          <div className="card bg-base-100 border border-base-200 shadow-sm min-h-[500px]">
            <div className="card-body p-6">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FiInfo className="text-primary" /> General Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {renderInput("App ID (Bundle ID)", "id", "text")}
                    {renderInput("Project Name", "projectName", "text")}
                    {renderInput("App Path", "appPath", "text")}
                    {renderInput("App Resources Path", "appResourcesPath", "text")}
                    {renderInput("Main Entry File", "main", "text")}
                    {renderInput("Bundler", "bundler", "select", ["webpack", "vite"])}
                    {renderInput("CSS Parser", "cssParser", "select", ["css-tree", "rework", "nativescript"])}
                    {renderInput("Profiling", "profiling", "select", ["timeline", "none"])}
                  </div>
                  <div className="divider text-xs opacity-40 uppercase tracking-widest">Global Options</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput("Shared Project", "shared", "boolean")}
                    {renderInput("Log Script Loading", "logScriptLoading", "boolean")}
                    {renderInput("Show Error Display", "showErrorDisplay", "boolean")}
                  </div>
                </div>
              )}

              {activeTab === "android" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FaAndroid className="text-success" /> Android Specific
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {renderInput("V8 Flags", "android.v8Flags", "text")}
                    {renderInput("Marking Mode", "android.markingMode", "select", ["none", "full"])}
                    {renderInput("GC Throttle Time (ms)", "android.gcThrottleTime", "number")}
                    {renderInput("Max Logcat Size", "android.maxLogcatObjectSize", "number")}
                  </div>
                  <div className="divider text-xs opacity-40 uppercase tracking-widest">Memory Management</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput("Check Interval (ms)", "android.memoryCheckInterval", "number")}
                    {renderInput("Free Memory Ratio", "android.freeMemoryRatio", "number")}
                  </div>
                  <div className="divider text-xs opacity-40 uppercase tracking-widest">Runtime Flags</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput("Code Cache", "android.codeCache", "boolean")}
                    {renderInput("Handle Timezone Changes", "android.handleTimeZoneChanges", "boolean")}
                    {renderInput("Force Log", "android.forceLog", "boolean")}
                    {renderInput("Enable Line Breakpoints", "android.enableLineBreakpoints", "boolean")}
                    {renderInput("Multithreaded JS", "android.enableMultithreadedJavascript", "boolean")}
                  </div>
                </div>
              )}

              {activeTab === "ios" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FaApple className="text-base-content" /> iOS Specific
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput("App ID Override", "ios.id", "text")}
                    {renderInput("Discard Uncaught Exceptions", "ios.discardUncaughtJsExceptions", "boolean")}
                  </div>
                </div>
              )}

              {activeTab === "cli" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FiTerminal className="text-warning" /> CLI Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput("Package Manager", "cli.packageManager", "select", ["npm", "yarn", "pnpm"])}
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FiShield className="text-error" /> Security
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput("Allow Remote Modules", "security.allowRemoteModules", "boolean")}
                  </div>
                </div>
              )}

              {activeTab === "presets" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                      <FiZap className="text-secondary" /> Configuration Presets
                    </h3>
                    <p className="text-sm opacity-60">
                      Quickly apply optimized settings for different stages of development. 
                      Changes will be visible in the form but won't be saved until you click "Save Changes".
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Development Preset Card */}
                    <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow border border-primary/20">
                      <div className="card-body p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="card-title text-primary">Development</h4>
                          <div className="badge badge-primary badge-outline">Debug</div>
                        </div>
                        <ul className="text-xs space-y-2 opacity-80 mb-6">
                          <li>• Detailed error displays enabled</li>
                          <li>• Script loading logs enabled</li>
                          <li>• No lazy loading for faster debugging</li>
                          <li>• Code cache disabled</li>
                        </ul>
                        <div className="card-actions justify-end mt-auto">
                          <button 
                            className="btn btn-primary btn-sm btn-outline gap-2"
                            onClick={() => setPreviewPreset({ name: "Development", data: DEVELOPMENT_PRESET })}
                          >
                            <FiEye /> Preview
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Production Preset Card */}
                    <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow border border-secondary/20">
                      <div className="card-body p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="card-title text-secondary">Production</h4>
                          <div className="badge badge-secondary badge-outline">Release</div>
                        </div>
                        <ul className="text-xs space-y-2 opacity-80 mb-6">
                          <li>• <b>Fast Startup</b>: Code cache enabled</li>
                          <li>• <b>Safety</b>: Discard uncaught exceptions</li>
                          <li>• <b>Memory</b>: Optimized for size & GC frequency</li>
                          <li>• <b>Security</b>: Remote modules disabled</li>
                        </ul>
                        <div className="card-actions justify-end mt-auto">
                          <button 
                            className="btn btn-secondary text-white btn-sm btn-outline gap-2"
                            onClick={() => setPreviewPreset({ name: "Production", data: PRODUCTION_PRESET })}
                          >
                            <FiEye /> Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preset Preview Modal */}
      {previewPreset && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl bg-base-100 border border-base-300 shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="font-bold text-2xl flex items-center gap-3">
                <FiZap className={previewPreset.name === "Production" ? "text-secondary" : "text-primary"} />
                Apply {previewPreset.name} Preset
              </h3>
              <button className="btn btn-ghost btn-circle btn-sm" onClick={() => setPreviewPreset(null)}>
                <FiX />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="alert alert-info bg-info/10 border-info/20 py-3">
                <FiInfo className="text-info" />
                <span className="text-sm">This will overwrite some current settings. The 'App ID' will not be changed.</span>
              </div>
              
              <div className="bg-base-300 rounded-xl p-4 overflow-auto max-h-80">
                <pre className="text-xs font-mono leading-relaxed">
                  {JSON.stringify(previewPreset.data, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-action flex gap-2">
              <button className="btn btn-ghost" onClick={() => setPreviewPreset(null)}>Cancel</button>
              <button 
                className={`btn ${previewPreset.name === "Production" ? "btn-secondary text-white" : "btn-primary"}`}
                onClick={applyPreset}
              >
                Apply Preset
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => setPreviewPreset(null)}></div>
        </div>
      )}
    </div>
  );
}
