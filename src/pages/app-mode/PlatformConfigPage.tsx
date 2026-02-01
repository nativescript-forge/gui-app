import { useState, useEffect } from "react";
import {
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiFileText,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";
import { join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

type PlatformConfigPageProps = {
  projectPath: string | null;
};

type Platform = "android" | "ios";

export function PlatformConfigPage({ projectPath }: PlatformConfigPageProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>("android");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Android State
  const [androidConfig, setAndroidConfig] = useState<string | null>(null);
  const [androidBeforePluginsConfig, setAndroidBeforePluginsConfig] = useState<
    string | null
  >(null);
  const [androidFileExists, setAndroidFileExists] = useState<{
    app: boolean;
    beforePlugins: boolean;
  }>({ app: true, beforePlugins: true });
  const [activeAndroidFile, setActiveAndroidFile] = useState<
    "app" | "before-plugins"
  >("app");

  // iOS State
  const [iosXcconfig, setIosXcconfig] = useState<string | null>(null);
  const [iosPlist, setIosPlist] = useState<string | null>(null);
  const [iosFileExists, setIosFileExists] = useState<{
    xcconfig: boolean;
    plist: boolean;
  }>({ xcconfig: true, plist: true });
  const [activeIosFile, setActiveIosFile] = useState<"xcconfig" | "plist">(
    "xcconfig",
  );

  useEffect(() => {
    if (projectPath) {
      loadConfigs();
    }
  }, [projectPath]);

  const loadConfigs = async () => {
    if (!projectPath) {
      console.warn("No project path provided to PlatformConfigPage");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    console.log("Loading platform configs for path:", projectPath);

    try {
      // Initialize states to empty strings so they are not null
      setAndroidConfig("");
      setAndroidBeforePluginsConfig("");
      setIosXcconfig("");
      setIosPlist("");

      // Load Android configs
      try {
        const androidPath = await join(
          projectPath,
          "App_Resources",
          "Android",
          "app.gradle",
        );
        const appExists = await invoke<boolean>("path_exists", {
          path: androidPath,
        });
        setAndroidFileExists((prev) => ({ ...prev, app: appExists }));
        if (appExists) {
          const content = await invoke<string>("read_text_file", {
            path: androidPath,
          });
          setAndroidConfig(content);
        }

        const beforePluginsPath = await join(
          projectPath,
          "App_Resources",
          "Android",
          "before-plugins.gradle",
        );
        const bpExists = await invoke<boolean>("path_exists", {
          path: beforePluginsPath,
        });
        setAndroidFileExists((prev) => ({ ...prev, beforePlugins: bpExists }));
        if (bpExists) {
          const content = await invoke<string>("read_text_file", {
            path: beforePluginsPath,
          });
          setAndroidBeforePluginsConfig(content);
        }
      } catch (e) {
        console.error("Error loading Android configs:", e);
      }

      // Load iOS build.xcconfig
      try {
        const xcconfigPath = await join(
          projectPath,
          "App_Resources",
          "iOS",
          "build.xcconfig",
        );
        const xcExists = await invoke<boolean>("path_exists", {
          path: xcconfigPath,
        });
        setIosFileExists((prev) => ({ ...prev, xcconfig: xcExists }));
        if (xcExists) {
          const content = await invoke<string>("read_text_file", {
            path: xcconfigPath,
          });
          setIosXcconfig(content);
        }
      } catch (e) {
        console.error("Error loading iOS xcconfig:", e);
      }

      // Load iOS Info.plist
      try {
        const plistPath = await join(
          projectPath,
          "App_Resources",
          "iOS",
          "Info.plist",
        );
        const plExists = await invoke<boolean>("path_exists", {
          path: plistPath,
        });
        setIosFileExists((prev) => ({ ...prev, plist: plExists }));
        if (plExists) {
          const content = await invoke<string>("read_text_file", {
            path: plistPath,
          });
          setIosPlist(content);
        }
      } catch (e) {
        console.error("Error loading iOS Info.plist:", e);
      }
    } catch (err) {
      console.error("Failed to load configs:", err);
      setError(`Failed to load configurations. Project path: ${projectPath}`);
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
      if (activePlatform === "android") {
        if (activeAndroidFile === "app") {
          const androidPath = await join(
            projectPath,
            "App_Resources",
            "Android",
            "app.gradle",
          );
          await invoke("write_text_file", {
            path: androidPath,
            content: androidConfig || "",
          });
          setAndroidFileExists((prev) => ({ ...prev, app: true }));
          setSuccess("Android app.gradle saved successfully!");
        } else {
          const beforePluginsPath = await join(
            projectPath,
            "App_Resources",
            "Android",
            "before-plugins.gradle",
          );
          await invoke("write_text_file", {
            path: beforePluginsPath,
            content: androidBeforePluginsConfig || "",
          });
          setAndroidFileExists((prev) => ({ ...prev, beforePlugins: true }));
          setSuccess("Android before-plugins.gradle saved successfully!");
        }
      } else {
        if (activeIosFile === "xcconfig") {
          const xcconfigPath = await join(
            projectPath,
            "App_Resources",
            "iOS",
            "build.xcconfig",
          );
          await invoke("write_text_file", {
            path: xcconfigPath,
            content: iosXcconfig || "",
          });
          setIosFileExists((prev) => ({ ...prev, xcconfig: true }));
          setSuccess("iOS build.xcconfig saved successfully!");
        } else {
          const plistPath = await join(
            projectPath,
            "App_Resources",
            "iOS",
            "Info.plist",
          );
          await invoke("write_text_file", {
            path: plistPath,
            content: iosPlist || "",
          });
          setIosFileExists((prev) => ({ ...prev, plist: true }));
          setSuccess("iOS Info.plist saved successfully!");
        }
      }
    } catch (err) {
      console.error("Failed to save config:", err);
      setError("Failed to save configuration. Please check file permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (!projectPath) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] opacity-50">
        <FiAlertCircle className="w-12 h-12 mb-4" />
        <p className="text-lg font-bold">No project selected</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            Platform Config
          </h2>
          <p className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Manage native platform settings and dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadConfigs}
            disabled={loading}
            className="btn btn-ghost btn-sm rounded-xl"
            title="Reload configs"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn btn-primary btn-sm rounded-xl px-6 gap-2"
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error rounded-2xl mb-6 shadow-sm border-none text-white">
          <FiAlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success rounded-2xl mb-6 shadow-sm border-none text-white">
          <FiCheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Navigation */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card bg-base-100 border border-base-300 rounded-3xl p-4 shadow-sm">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 mb-4 block">
              Select Platform
            </label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActivePlatform("android")}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${
                  activePlatform === "android"
                    ? "bg-primary text-primary-content shadow-md"
                    : "hover:bg-base-200 opacity-60 hover:opacity-100"
                }`}
              >
                <FaAndroid className="w-5 h-5" />
                Android
              </button>
              <button
                onClick={() => setActivePlatform("ios")}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${
                  activePlatform === "ios"
                    ? "bg-primary text-primary-content shadow-md"
                    : "hover:bg-base-200 opacity-60 hover:opacity-100"
                }`}
              >
                <FaApple className="w-5 h-5" />
                iOS
              </button>
            </div>
          </div>

          {activePlatform === "android" && (
            <div className="card bg-base-100 border border-base-300 rounded-3xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 mb-4 block">
                Android Files
              </label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveAndroidFile("app")}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs ${
                    activeAndroidFile === "app"
                      ? "bg-base-200 text-primary"
                      : "hover:bg-base-200/50 opacity-60"
                  }`}
                >
                  <FiFileText className="w-4 h-4" />
                  app.gradle
                </button>
                <button
                  onClick={() => setActiveAndroidFile("before-plugins")}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs ${
                    activeAndroidFile === "before-plugins"
                      ? "bg-base-200 text-primary"
                      : "hover:bg-base-200/50 opacity-60"
                  }`}
                >
                  <FiFileText className="w-4 h-4" />
                  before-plugins.gradle
                </button>
              </div>
            </div>
          )}

          {activePlatform === "ios" && (
            <div className="card bg-base-100 border border-base-300 rounded-3xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 mb-4 block">
                iOS Files
              </label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveIosFile("xcconfig")}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs ${
                    activeIosFile === "xcconfig"
                      ? "bg-base-200 text-primary"
                      : "hover:bg-base-200/50 opacity-60"
                  }`}
                >
                  <FiFileText className="w-4 h-4" />
                  build.xcconfig
                </button>
                <button
                  onClick={() => setActiveIosFile("plist")}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs ${
                    activeIosFile === "plist"
                      ? "bg-base-200 text-primary"
                      : "hover:bg-base-200/50 opacity-60"
                  }`}
                >
                  <FiFileText className="w-4 h-4" />
                  Info.plist
                </button>
              </div>
            </div>
          )}

          <div className="card bg-primary/5 border border-primary/10 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-primary mb-3">
              <FiInfo className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">
                Tip
              </span>
            </div>
            <p className="text-xs opacity-70 leading-relaxed">
              {activePlatform === "android"
                ? "Use app.gradle for native dependencies and SDK versions. Use before-plugins.gradle for custom Gradle configurations before plugins are applied."
                : "build.xcconfig is used for build settings, while Info.plist is for app metadata and permissions."}
            </p>
          </div>
        </div>

        {/* Right Column: Editor */}
        <div className="lg:col-span-9">
          <div className="card bg-base-100 border border-base-300 rounded-3xl overflow-hidden shadow-sm h-[70vh]">
            <div className="p-4 bg-base-200/50 border-b border-base-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${activePlatform === "android" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"}`}
                >
                  {activePlatform === "android" ? <FaAndroid /> : <FaApple />}
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    Editing File
                    {activePlatform === "android"
                      ? !androidFileExists[
                          activeAndroidFile === "app" ? "app" : "beforePlugins"
                        ] && (
                          <span className="badge badge-warning badge-xs gap-1">
                            New File
                          </span>
                        )
                      : !iosFileExists[
                          activeIosFile === "xcconfig" ? "xcconfig" : "plist"
                        ] && (
                          <span className="badge badge-warning badge-xs gap-1">
                            New File
                          </span>
                        )}
                  </div>
                  <div className="text-sm font-mono font-bold">
                    {activePlatform === "android"
                      ? activeAndroidFile === "app"
                        ? "App_Resources/Android/app.gradle"
                        : "App_Resources/Android/before-plugins.gradle"
                      : activeIosFile === "xcconfig"
                        ? "App_Resources/iOS/build.xcconfig"
                        : "App_Resources/iOS/Info.plist"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 relative bg-[#1e1e1e]">
              {((activePlatform === "android" &&
                activeAndroidFile === "app" &&
                androidConfig === null) ||
                (activePlatform === "android" &&
                  activeAndroidFile === "before-plugins" &&
                  androidBeforePluginsConfig === null) ||
                (activePlatform === "ios" &&
                  activeIosFile === "xcconfig" &&
                  iosXcconfig === null) ||
                (activePlatform === "ios" &&
                  activeIosFile === "plist" &&
                  iosPlist === null)) &&
              !loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-4">
                  <FiFileText className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium opacity-50">
                    File not found or empty
                  </p>
                  <button
                    onClick={loadConfigs}
                    className="btn btn-ghost btn-xs text-primary"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <textarea
                  className="absolute inset-0 w-full h-full p-6 bg-transparent text-gray-300 font-mono text-sm outline-none resize-none selection:bg-primary/30"
                  spellCheck={false}
                  value={
                    activePlatform === "android"
                      ? activeAndroidFile === "app"
                        ? androidConfig || ""
                        : androidBeforePluginsConfig || ""
                      : activeIosFile === "xcconfig"
                        ? iosXcconfig || ""
                        : iosPlist || ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activePlatform === "android") {
                      if (activeAndroidFile === "app") setAndroidConfig(val);
                      else setAndroidBeforePluginsConfig(val);
                    } else {
                      if (activeIosFile === "xcconfig") setIosXcconfig(val);
                      else setIosPlist(val);
                    }
                  }}
                />
              )}
              {loading && (
                <div className="absolute inset-0 bg-base-100/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
