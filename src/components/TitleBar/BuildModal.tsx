import {
  FiPackage,
  FiX,
  FiCheckCircle,
  FiInfo,
  FiCopy,
  FiCode,
  FiFolder,
  FiLock,
  FiKey,
} from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuild: (config: BuildConfig) => void;
  platform: "android" | "ios";
  projectPath?: string;
}

export interface BuildConfig {
  platform: "android" | "ios";
  mode: "debug" | "release";
  type: "apk" | "aab" | "ipa" | "simulator";
  clean: boolean;
  provisioningProfile?: string;
  keyStorePath?: string;
  keyStorePassword?: string;
  keyStoreAlias?: string;
  keyStoreAliasPassword?: string;
  // New flags
  aot?: boolean;
  snapshot?: boolean;
  compileSnapshot?: boolean;
  uglify?: boolean;
  report?: boolean;
  sourceMap?: boolean;
  hiddenSourceMap?: boolean;
  force?: boolean;
  compileSdk?: string;
  copyTo?: string;
}

export function BuildModal({
  isOpen,
  onClose,
  onBuild,
  platform: initialPlatform,
  projectPath,
}: BuildModalProps) {
  const [mode, setMode] = useState<"debug" | "release">("release");
  const [currentPlatform, setCurrentPlatform] = useState<"android" | "ios">(
    initialPlatform,
  );
  const [type, setType] = useState<"apk" | "aab" | "ipa" | "simulator">(
    initialPlatform === "android" ? "apk" : "simulator",
  );
  const [clean, setClean] = useState(false);
  const [copied, setCopied] = useState(false);
  const [framework, setFramework] = useState<string | null>(null);

  // New flags states
  const [aot, setAot] = useState(false);
  const [snapshot, setSnapshot] = useState(false);
  const [compileSnapshot, setCompileSnapshot] = useState(false);
  const [uglify, setUglify] = useState(true); // Default recommended
  const [report, setReport] = useState(false);
  const [sourceMap, setSourceMap] = useState(false);
  const [hiddenSourceMap, setHiddenSourceMap] = useState(false);
  const [force, setForce] = useState(false);
  const [compileSdk, setCompileSdk] = useState("");
  const [copyTo, setCopyTo] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  // Keystore states
  const [keyStorePath, setKeyStorePath] = useState("");
  const [keyStorePassword, setKeyStorePassword] = useState("");
  const [keyStoreAlias, setKeyStoreAlias] = useState("");
  const [keyStoreAliasPassword, setKeyStoreAliasPassword] = useState("");

  useEffect(() => {
    setCurrentPlatform(initialPlatform);
    setType(initialPlatform === "android" ? "apk" : "simulator");
  }, [initialPlatform, isOpen]);

  useEffect(() => {
    if (isOpen && projectPath) {
      const fetchAnalysis = async () => {
        try {
          const analysis: any = await invoke("analyze_project", {
            projectPath,
          });
          setFramework(analysis.framework);
          // If not angular, make sure AOT is off
          if (analysis.framework !== "Angular") {
            setAot(false);
          }
        } catch (err) {
          console.error("Failed to analyze project:", err);
        }
      };
      fetchAnalysis();
    }
  }, [isOpen, projectPath]);

  if (!isOpen) return null;

  const handlePlatformChange = (p: "android" | "ios") => {
    setCurrentPlatform(p);
    setType(p === "android" ? "apk" : "simulator");
  };

  const handleBrowseKeystore = async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [
          {
            name: "Keystore",
            extensions: ["keystore", "jks"],
          },
        ],
      });
      if (selected && typeof selected === "string") {
        setKeyStorePath(selected);
      }
    } catch (err) {
      console.error("Browse failed:", err);
    }
  };

  const getBuildCommand = () => {
    let buildCmd = `ns build ${currentPlatform}`;
    if (mode === "release") {
      buildCmd += " --release";
    }

    if (currentPlatform === "android") {
      if (type === "aab") buildCmd += " --aab";
      if (aot) buildCmd += " --env.aot";
      if (snapshot) buildCmd += " --env.snapshot";
      if (compileSnapshot) buildCmd += " --env.compileSnapshot";
      if (uglify) buildCmd += " --env.uglify";
      if (report) buildCmd += " --env.report";
      if (sourceMap) buildCmd += " --env.sourceMap";
      if (hiddenSourceMap) buildCmd += " --env.hiddenSourceMap";
      if (force) buildCmd += " --force";
      if (compileSdk) buildCmd += ` --compileSdk ${compileSdk}`;
      if (copyTo) buildCmd += ` --copy-to "${copyTo}"`;

      // Android Keystore flags
      if (mode === "release") {
        if (keyStorePath) buildCmd += ` --key-store-path "${keyStorePath}"`;
        if (keyStorePassword)
          buildCmd += ` --key-store-password ${keyStorePassword}`;
        if (keyStoreAlias) buildCmd += ` --key-store-alias ${keyStoreAlias}`;
        if (keyStoreAliasPassword)
          buildCmd += ` --key-store-alias-password ${keyStoreAliasPassword}`;
      }
    }

    if (currentPlatform === "ios") {
      if (type === "simulator") {
        buildCmd += " --emulator";
      }
    }

    if (clean) {
      return `ns clean && ${buildCmd}`;
    }

    return buildCmd;
  };

  const handleCopyCommand = async () => {
    try {
      await writeText(getBuildCommand());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const isKeystoreValid = () => {
    if (currentPlatform === "android" && mode === "release") {
      return (
        keyStorePath.trim() !== "" &&
        keyStorePassword.trim() !== "" &&
        keyStoreAlias.trim() !== "" &&
        keyStoreAliasPassword.trim() !== ""
      );
    }
    return true;
  };

  const handleBuild = () => {
    if (!isKeystoreValid()) {
      setShowErrors(true);
      return;
    }

    onBuild({
      platform: currentPlatform,
      mode,
      type,
      clean,
      keyStorePath: keyStorePath || undefined,
      keyStorePassword: keyStorePassword || undefined,
      keyStoreAlias: keyStoreAlias || undefined,
      keyStoreAliasPassword: keyStoreAliasPassword || undefined,
      aot,
      snapshot,
      compileSnapshot,
      uglify,
      report,
      sourceMap,
      hiddenSourceMap,
      force,
      compileSdk: compileSdk || undefined,
      copyTo: copyTo || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FiPackage className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Build Configuration
              </h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                Target: {currentPlatform === "android" ? "Android" : "iOS"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Platform Selector */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              Platform Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-lg border border-white/5">
              <button
                onClick={() => handlePlatformChange("android")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-medium transition-all ${
                  currentPlatform === "android"
                    ? "bg-success/20 text-success shadow-sm"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <SiAndroid className="w-3.5 h-3.5" />
                Android
              </button>
              <button
                onClick={() => handlePlatformChange("ios")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-medium transition-all ${
                  currentPlatform === "ios"
                    ? "bg-info/20 text-info shadow-sm"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <SiApple className="w-3.5 h-3.5" />
                iOS
              </button>
            </div>
          </div>

          {/* Build Mode */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              Build Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-lg border border-white/5">
              <button
                onClick={() => setMode("debug")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-medium transition-all ${
                  mode === "debug"
                    ? "bg-white/10 text-white shadow-lg"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {mode === "debug" && <FiCheckCircle className="w-3.5 h-3.5" />}
                Debug
              </button>
              <button
                onClick={() => setMode("release")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-medium transition-all ${
                  mode === "release"
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {mode === "release" && (
                  <FiCheckCircle className="w-3.5 h-3.5" />
                )}
                Release
              </button>
            </div>
          </div>

          {/* Build Type */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
              Output Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {currentPlatform === "android" ? (
                <>
                  <button
                    onClick={() => setType("apk")}
                    className={`flex flex-col items-start p-3 rounded-lg border transition-all ${
                      type === "apk"
                        ? "bg-success/5 border-success/30 text-success"
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      APK
                    </span>
                    <span className="text-[9px] opacity-60">
                      Standard Android Package
                    </span>
                  </button>
                  <button
                    onClick={() => setType("aab")}
                    className={`flex flex-col items-start p-3 rounded-lg border transition-all ${
                      type === "aab"
                        ? "bg-success/5 border-success/30 text-success"
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      AAB
                    </span>
                    <span className="text-[9px] opacity-60">
                      Android App Bundle
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setType("simulator")}
                    className={`flex flex-col items-start p-3 rounded-lg border transition-all ${
                      type === "simulator"
                        ? "bg-info/5 border-info/30 text-info"
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Simulator
                    </span>
                    <span className="text-[9px] opacity-60">
                      x86_64 / arm64
                    </span>
                  </button>
                  <button
                    onClick={() => setType("ipa")}
                    className={`flex flex-col items-start p-3 rounded-lg border transition-all ${
                      type === "ipa"
                        ? "bg-info/5 border-info/30 text-info"
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      IPA
                    </span>
                    <span className="text-[9px] opacity-60">
                      iOS App Store Package
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Android Keystore Configuration (Only for Android Release) */}
          {currentPlatform === "android" && mode === "release" && (
            <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-bold text-success uppercase tracking-widest flex items-center gap-2">
                <FiKey className="w-3 h-3" />
                Keystore Configuration
              </label>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Keystore Path */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] text-white/40 font-medium flex items-center justify-between">
                    <span>Keystore File Path</span>
                    {showErrors && !keyStorePath && (
                      <span className="text-[9px] text-error font-bold uppercase">
                        Required
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <FiFolder
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${showErrors && !keyStorePath ? "text-error" : "text-white/20 group-focus-within:text-success"} transition-colors`}
                      />
                      <input
                        type="text"
                        value={keyStorePath}
                        onChange={(e) => setKeyStorePath(e.target.value)}
                        placeholder="C:\path\to\your.keystore"
                        className={`w-full bg-black/40 border ${showErrors && !keyStorePath ? "border-error/50 focus:border-error" : "border-white/10 focus:border-success/50"} rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all`}
                      />
                    </div>
                    <button
                      onClick={handleBrowseKeystore}
                      className={`px-3 bg-white/5 hover:bg-white/10 border ${showErrors && !keyStorePath ? "border-error/30 text-error" : "border-white/10"} rounded-lg text-xs font-medium transition-colors flex items-center gap-2`}
                    >
                      Browse
                    </button>
                  </div>
                </div>

                {/* Keystore Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 font-medium flex items-center justify-between">
                    <span>Keystore Password</span>
                    {showErrors && !keyStorePassword && (
                      <span className="text-[9px] text-error font-bold uppercase">
                        Required
                      </span>
                    )}
                  </label>
                  <div className="relative group">
                    <FiLock
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${showErrors && !keyStorePassword ? "text-error" : "text-white/20 group-focus-within:text-success"} transition-colors`}
                    />
                    <input
                      type="password"
                      value={keyStorePassword}
                      onChange={(e) => setKeyStorePassword(e.target.value)}
                      placeholder="Password"
                      className={`w-full bg-black/40 border ${showErrors && !keyStorePassword ? "border-error/50 focus:border-error" : "border-white/10 focus:border-success/50"} rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all`}
                    />
                  </div>
                </div>

                {/* Key Alias */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 font-medium flex items-center justify-between">
                    <span>Key Alias</span>
                    {showErrors && !keyStoreAlias && (
                      <span className="text-[9px] text-error font-bold uppercase">
                        Required
                      </span>
                    )}
                  </label>
                  <div className="relative group">
                    <FiKey
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${showErrors && !keyStoreAlias ? "text-error" : "text-white/20 group-focus-within:text-success"} transition-colors`}
                    />
                    <input
                      type="text"
                      value={keyStoreAlias}
                      onChange={(e) => setKeyStoreAlias(e.target.value)}
                      placeholder="Alias Name"
                      className={`w-full bg-black/40 border ${showErrors && !keyStoreAlias ? "border-error/50 focus:border-error" : "border-white/10 focus:border-success/50"} rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all`}
                    />
                  </div>
                </div>

                {/* Key Alias Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 font-medium flex items-center justify-between">
                    <span>Key Alias Password</span>
                    {showErrors && !keyStoreAliasPassword && (
                      <span className="text-[9px] text-error font-bold uppercase">
                        Required
                      </span>
                    )}
                  </label>
                  <div className="relative group">
                    <FiLock
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${showErrors && !keyStoreAliasPassword ? "text-error" : "text-white/20 group-focus-within:text-success"} transition-colors`}
                    />
                    <input
                      type="password"
                      value={keyStoreAliasPassword}
                      onChange={(e) => setKeyStoreAliasPassword(e.target.value)}
                      placeholder="Alias Password"
                      className={`w-full bg-black/40 border ${showErrors && !keyStoreAliasPassword ? "border-error/50 focus:border-error" : "border-white/10 focus:border-success/50"} rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Additional Options (Only for Android) */}
          {currentPlatform === "android" && (
            <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-bold text-success uppercase tracking-widest flex items-center gap-2">
                <FiCode className="w-3 h-3" />
                Additional Options
              </label>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Compile SDK */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 font-medium">
                    --compileSdk
                  </label>
                  <input
                    type="text"
                    value={compileSdk}
                    onChange={(e) => setCompileSdk(e.target.value)}
                    placeholder="e.g. 33, 34"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-success/50 transition-all"
                  />
                  <p className="text-[9px] text-white/30 px-1">
                    Sets the Android SDK used to build the project.
                  </p>
                </div>

                {/* Copy To */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 font-medium">
                    --copy-to
                  </label>
                  <input
                    type="text"
                    value={copyTo}
                    onChange={(e) => setCopyTo(e.target.value)}
                    placeholder="Path to copy .apk/.aab"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-success/50 transition-all"
                  />
                  <p className="text-[9px] text-white/30 px-1">
                    Path where the built .apk/.aab will be copied.
                  </p>
                </div>

                {/* Checkboxes Grid */}
                <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  {/* Uglify (Recommended) */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={uglify}
                      onChange={(e) => setUglify(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-success border-white/20"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/80 group-hover:text-white transition-colors font-mono">
                          --env.uglify
                        </span>
                        <span className="badge badge-success badge-outline text-[8px] h-auto py-0.1 font-bold uppercase tracking-tighter">
                          Recommended
                        </span>
                      </div>
                      <span className="text-[9px] text-white/40 leading-tight">
                        Provides basic obfuscation and smaller app size.
                      </span>
                    </div>
                  </label>

                  {/* AOT */}
                  <label
                    className={`flex items-center gap-3 cursor-pointer group ${
                      framework !== "Angular"
                        ? "opacity-40 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={aot}
                      disabled={framework !== "Angular"}
                      onChange={(e) => setAot(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-primary border-white/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-white/80 group-hover:text-white transition-colors font-mono">
                        --env.aot
                      </span>
                      <span className="text-[9px] text-white/40 leading-tight">
                        {framework === "Angular"
                          ? "Creates Ahead-Of-Time build."
                          : "Creates Ahead-Of-Time build (Angular only)."}
                      </span>
                    </div>
                  </label>

                  {/* Snapshot */}
                  <label
                    className={`flex items-center gap-3 cursor-pointer group ${
                      mode !== "release" ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={snapshot}
                      disabled={mode !== "release"}
                      onChange={(e) => setSnapshot(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-primary border-white/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-white/80 group-hover:text-white transition-colors font-mono">
                        --env.snapshot
                      </span>
                      <span className="text-[9px] text-white/40 leading-tight">
                        V8 Snapshot (Release only).
                      </span>
                    </div>
                  </label>

                  {/* Compile Snapshot */}
                  <label
                    className={`flex items-center gap-3 cursor-pointer group ${
                      mode !== "release" ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={compileSnapshot}
                      disabled={mode !== "release"}
                      onChange={(e) => setCompileSnapshot(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-primary border-white/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-white/80 group-hover:text-white transition-colors font-mono">
                        --env.compileSnapshot
                      </span>
                      <span className="text-[9px] text-white/40 leading-tight">
                        Splits snapshot per architecture.
                      </span>
                    </div>
                  </label>

                  {/* Force */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={force}
                      onChange={(e) => setForce(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-warning border-white/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-white/80 group-hover:text-white transition-colors font-mono">
                        --force
                      </span>
                      <span className="text-[9px] text-white/40 leading-tight">
                        Skips compatibility checks and forces npm install.
                      </span>
                    </div>
                  </label>

                  {/* Report */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={report}
                      onChange={(e) => setReport(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-primary border-white/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-white/80 group-hover:text-white transition-colors font-mono">
                        --env.report
                      </span>
                      <span className="text-[9px] text-white/40 leading-tight">
                        Creates a Webpack report in 'report' folder.
                      </span>
                    </div>
                  </label>

                  {/* Source Maps */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={sourceMap}
                      onChange={(e) => setSourceMap(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-primary border-white/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-white/80 group-hover:text-white transition-colors font-mono">
                        --env.sourceMap
                      </span>
                      <span className="text-[9px] text-white/40 leading-tight">
                        Creates inline source maps.
                      </span>
                    </div>
                  </label>

                  {/* Hidden Source Maps */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hiddenSourceMap}
                      onChange={(e) => setHiddenSourceMap(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-primary border-white/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-white/80 group-hover:text-white transition-colors font-mono">
                        --env.hiddenSourceMap
                      </span>
                      <span className="text-[9px] text-white/40 leading-tight">
                        Source maps in root (useful for Crashlytics).
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={clean}
                  onChange={(e) => setClean(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:bg-primary transition-colors"></div>
                <div className="absolute left-1 w-2 h-2 bg-white/40 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80 group-hover:text-white transition-colors">
                    Clean Build
                  </span>
                  <span className="badge badge-success badge-outline text-[8px] h-auto py-0.1 font-bold uppercase tracking-tighter">
                    Recommended
                  </span>
                </div>
                <span className="text-[9px] text-white/40 italic">
                  Cleaner build process, but it may be slightly slower
                </span>
              </div>
            </label>
          </div>

          {/* Command Preview Card (Similar to CreateProjectPage) */}
          <div className="card bg-black/40 border border-white/5 shadow-inner overflow-hidden">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                  Command Preview
                </h2>
                <button
                  className={`btn btn-ghost btn-xs gap-1 h-auto py-1 ${copied ? "text-success" : "text-primary hover:bg-primary/10"}`}
                  onClick={handleCopyCommand}
                >
                  {copied ? (
                    <>
                      <FiCheckCircle className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-white/5 group relative">
                <code className="text-[10px] font-mono block break-all text-white/70 leading-relaxed">
                  {getBuildCommand()}
                </code>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiCode className="text-white/10 w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/40">
            <FiInfo className="w-3.5 h-3.5" />
            <span className="text-[10px]">Build time may vary</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBuild}
              className="px-6 py-2 bg-primary hover:bg-primary-focus text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Generate {type.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
