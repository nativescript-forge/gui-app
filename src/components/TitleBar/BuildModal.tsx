import {
  FiPackage,
  FiX,
  FiArrowRight,
  FiArrowLeft,
  FiCpu,
  FiCloud,
  FiSmartphone,
  FiZap,
  FiBox,
  FiKey,
  FiFolder,
  FiCheckCircle,
  FiTerminal,
  FiSettings,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import { useState, useEffect } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { BuildConfig } from "../../app/types";

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuild: (config: BuildConfig) => void;
  platform: "android" | "ios";
  projectPath?: string;
  flavor?: string;
}

export function BuildModal({
  isOpen,
  onClose,
  onBuild,
  platform: initialPlatform,
  flavor,
}: BuildModalProps) {
  const [wizardStep, setWizardStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [buildConfig, setBuildConfig] = useState<BuildConfig>({
    buildType: "local",
    platform: initialPlatform,
    mode: "debug",
    format: initialPlatform === "android" ? "apk" : "ipa",
    clean: false,
    aot: false,
    snapshot: false,
    compileSnapshot: false,
    uglify: true,
    report: false,
    sourceMap: false,
    hiddenSourceMap: false,
    force: false,
  });

  const handleNext = () => setWizardStep((s) => s + 1);
  const handleBack = () => setWizardStep((s) => s - 1);

  const selectKeystore = async () => {
    const selected = await openDialog({
      multiple: false,
      filters: [{ name: "Keystore", extensions: ["keystore", "jks"] }],
    });
    if (selected && typeof selected === "string") {
      setBuildConfig((prev) => ({
        ...prev,
        keyStorePath: selected,
      }));
    }
  };

  const generateCommandPreview = () => {
    const buildCmdParts = ["ns build", buildConfig.platform];

    if (buildConfig.mode === "release") {
      buildCmdParts.push("--release");
    }

    if (buildConfig.platform === "android") {
      if (buildConfig.format === "aab") {
        buildCmdParts.push("--aab");
      }

      // Flags
      if (buildConfig.uglify) buildCmdParts.push("--env.uglify");
      if (buildConfig.aot && flavor?.toLowerCase().includes("angular"))
        buildCmdParts.push("--env.aot");
      if (buildConfig.snapshot) buildCmdParts.push("--env.snapshot");
      if (buildConfig.compileSnapshot)
        buildCmdParts.push("--env.compileSnapshot");
      if (buildConfig.report) buildCmdParts.push("--env.report");
      if (buildConfig.sourceMap) buildCmdParts.push("--env.sourceMap");
      if (buildConfig.hiddenSourceMap)
        buildCmdParts.push("--env.hiddenSourceMap");
      if (buildConfig.force) buildCmdParts.push("--force");

      if (buildConfig.compileSdk) {
        buildCmdParts.push("--compileSdk");
        buildCmdParts.push(buildConfig.compileSdk);
      }

      if (buildConfig.copyTo) {
        buildCmdParts.push("--copyTo");
        buildCmdParts.push(`"${buildConfig.copyTo}"`);
      }

      if (buildConfig.mode === "release") {
        if (buildConfig.keyStorePath) {
          buildCmdParts.push("--key-store-path");
          buildCmdParts.push(`"${buildConfig.keyStorePath}"`);
        }
        if (buildConfig.keyStorePassword) {
          buildCmdParts.push("--key-store-password");
          buildCmdParts.push(buildConfig.keyStorePassword);
        }
        if (buildConfig.keyStoreAlias) {
          buildCmdParts.push("--key-store-alias");
          buildCmdParts.push(buildConfig.keyStoreAlias);
        }
        if (buildConfig.keyStoreAliasPassword) {
          buildCmdParts.push("--key-store-alias-password");
          buildCmdParts.push(buildConfig.keyStoreAliasPassword);
        }
      }
    } else if (buildConfig.platform === "ios") {
      if (buildConfig.buildType === "simulator") {
        buildCmdParts.push("--emulator");
      }
    }

    if (buildConfig.additionalOptions) {
      buildCmdParts.push(buildConfig.additionalOptions);
    }

    const buildCommand = buildCmdParts.join(" ");

    if (buildConfig.clean) {
      return `ns clean && ${buildCommand}`;
    }

    return buildCommand;
  };

  const handleCopy = () => {
    const command = generateCommandPreview();
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuild = () => {
    onBuild(buildConfig);
    onClose();
    setWizardStep(1);
  };

  useEffect(() => {
    if (isOpen) {
      setBuildConfig({
        buildType: "local",
        platform: initialPlatform,
        mode: "debug",
        format: initialPlatform === "android" ? "apk" : "ipa",
        clean: false,
        aot: false,
        snapshot: false,
        compileSnapshot: false,
        uglify: true,
        report: false,
        sourceMap: false,
        hiddenSourceMap: false,
        force: false,
      });
      setWizardStep(1);
    }
  }, [initialPlatform, isOpen]);

  if (!isOpen) return null;

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-4 py-2">
            <div className="text-center mb-4">
              <h3 className="text-base font-bold text-base-content">
                Select Build Target
              </h3>
              <p className="text-xs text-base-content/60">
                Choose how you want to build your application
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                  buildConfig.buildType === "local"
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-base-300 hover:border-primary/50 bg-base-200/50"
                }`}
                onClick={() =>
                  setBuildConfig({ ...buildConfig, buildType: "local" })
                }
              >
                <div
                  className={`p-3 rounded-full ${buildConfig.buildType === "local" ? "bg-primary text-primary-content" : "bg-base-300 opacity-50"}`}
                >
                  <FiCpu className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm text-base-content">
                    Local Build
                  </div>
                  <div className="text-[11px] text-base-content/60 mt-1 text-balance">
                    Build using your local machine resources and SDKs
                  </div>
                </div>
              </button>

              {buildConfig.platform === "ios" ? (
                <button
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    buildConfig.buildType === "simulator"
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-base-300 hover:border-primary/50 bg-base-200/50"
                  }`}
                  onClick={() =>
                    setBuildConfig({ ...buildConfig, buildType: "simulator" })
                  }
                >
                  <div
                    className={`p-3 rounded-full ${buildConfig.buildType === "simulator" ? "bg-primary text-primary-content" : "bg-base-300 opacity-50"}`}
                  >
                    <FiSmartphone className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm text-base-content">
                      Simulator Build
                    </div>
                    <div className="text-[11px] text-base-content/60 mt-1 text-balance">
                      Build specifically for iOS Simulator
                    </div>
                  </div>
                </button>
              ) : (
                <div className="relative group">
                  <button
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-base-300 bg-base-200/20 opacity-50 cursor-not-allowed w-full h-full"
                    disabled
                  >
                    <div className="p-3 rounded-full bg-base-300 opacity-50">
                      <FiCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm text-base-content">
                        Cloud Build
                      </div>
                      <div className="text-[11px] text-base-content/60 mt-1 text-balance">
                        Build on Norrix Cloud Infrastructure
                      </div>
                    </div>
                  </button>
                  <div className="absolute top-2 right-2 badge badge-warning badge-[10px] font-bold shadow-sm h-4">
                    Soon
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 py-1">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2 block px-1">
                Platform Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`btn btn-md h-auto py-2 flex flex-col gap-1 rounded-xl ${buildConfig.platform === "android" ? "btn-primary" : "btn-ghost bg-base-200/50 border-base-300"}`}
                  onClick={() =>
                    setBuildConfig({
                      ...buildConfig,
                      platform: "android",
                      format: "apk",
                    })
                  }
                >
                  <SiAndroid className="w-5 h-5" />
                  <span className="text-xs">Android</span>
                </button>
                <button
                  className={`btn btn-md h-auto py-2 flex flex-col gap-1 rounded-xl ${buildConfig.platform === "ios" ? "btn-primary" : "btn-ghost bg-base-200/50 border-base-300"}`}
                  onClick={() =>
                    setBuildConfig({
                      ...buildConfig,
                      platform: "ios",
                      format: "ipa",
                    })
                  }
                >
                  <SiApple className="w-5 h-5" />
                  <span className="text-xs">iOS</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2 block px-1">
                Build Mode
              </label>
              <div className="grid grid-cols-2 gap-2 bg-base-300/30 p-1 rounded-xl border border-base-300">
                <button
                  className={`btn btn-xs h-8 ${buildConfig.mode === "debug" ? "btn-primary shadow-lg" : "btn-ghost"}`}
                  onClick={() =>
                    setBuildConfig({ ...buildConfig, mode: "debug" })
                  }
                >
                  <FiZap className="w-3 h-3 mr-1" />
                  Debug
                </button>
                <button
                  className={`btn btn-xs h-8 ${buildConfig.mode === "release" ? "btn-warning shadow-lg text-warning-content" : "btn-ghost"}`}
                  onClick={() =>
                    setBuildConfig({ ...buildConfig, mode: "release" })
                  }
                >
                  <FiCheckCircle className="w-3 h-3 mr-1" />
                  Release
                </button>
              </div>
              <p className="text-[10px] text-base-content/60 mt-1 px-1">
                {buildConfig.mode === "release"
                  ? "Requires keystore configuration in the next step."
                  : "Produces a debug build for testing."}
              </p>
            </div>

            {buildConfig.platform === "android" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2 block px-1">
                  Output Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all ${
                      buildConfig.format === "apk"
                        ? "border-primary bg-primary/5"
                        : "border-base-300 hover:border-primary/30 bg-base-200/30"
                    }`}
                    onClick={() =>
                      setBuildConfig({ ...buildConfig, format: "apk" })
                    }
                  >
                    <div className="p-2 bg-base-300/50 rounded-lg">
                      <FiBox className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-base-content">
                        APK
                      </div>
                      <div className="text-[10px] text-base-content/60">
                        Standard Package
                      </div>
                    </div>
                  </button>
                  <button
                    className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all ${
                      buildConfig.format === "aab"
                        ? "border-primary bg-primary/5"
                        : "border-base-300 hover:border-primary/30 bg-base-200/30"
                    }`}
                    onClick={() =>
                      setBuildConfig({ ...buildConfig, format: "aab" })
                    }
                  >
                    <div className="p-2 bg-base-300/50 rounded-lg">
                      <FiBox className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-base-content">
                        AAB
                      </div>
                      <div className="text-[10px] text-base-content/60">
                        App Bundle
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-base-300/20 p-3 rounded-xl border border-base-300/50">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3 p-0 mb-0.5">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-xs rounded-lg"
                    checked={buildConfig.clean}
                    onChange={(e) =>
                      setBuildConfig({
                        ...buildConfig,
                        clean: e.target.checked,
                      })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <span className="label-text font-bold text-xs">
                      Clean Build (Fresh Start)
                    </span>
                    <div className="badge badge-primary badge-outline text-[9px] h-4 px-1 leading-none">
                      RECOMMENDED
                    </div>
                  </div>
                </label>
                <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                  Removes old build artifacts and cache. Highly recommended when
                  switching platforms or encountering unexpected build errors.
                </p>
              </div>
            </div>
          </div>
        );
      case 3:
        if (buildConfig.mode === "debug") {
          return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <FiZap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                Debug Build
              </h3>
              <p className="text-xs text-base-content/60 max-w-xs mt-2 leading-relaxed">
                Debug builds use default debug certificates. No signing
                configuration is required.
              </p>
            </div>
          );
        }
        return (
          <div className="space-y-4 py-1">
            <div className="flex items-center gap-2 text-warning mb-1 px-1">
              <FiKey className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Keystore Configuration
              </span>
            </div>

            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text font-bold text-xs text-base-content/60">
                  Keystore File Path
                </span>
              </label>
              <div className="join w-full">
                <div className="join-item bg-base-300/50 flex items-center px-3 border border-base-300 border-r-0 rounded-l-xl flex-1 h-9">
                  <FiFolder className="w-3.5 h-3.5 text-base-content/20 mr-2" />
                  <span className="text-xs truncate max-w-[400px] text-base-content/60">
                    {buildConfig.keyStorePath || "Select keystore file..."}
                  </span>
                </div>
                <button
                  className="btn btn-xs h-9 join-item rounded-r-xl px-4"
                  onClick={selectKeystore}
                >
                  Browse
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text font-bold text-xs text-base-content/60">
                    Keystore Password
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    className="input input-bordered input-xs h-9 w-full pl-9 rounded-xl bg-base-200/50 border-base-300"
                    value={buildConfig.keyStorePassword || ""}
                    onChange={(e) =>
                      setBuildConfig({
                        ...buildConfig,
                        keyStorePassword: e.target.value,
                      })
                    }
                  />
                  <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/20 w-3.5 h-3.5" />
                </div>
              </div>
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text font-bold text-xs text-base-content/60">
                    Key Alias
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Alias Name"
                    className="input input-bordered input-xs h-9 w-full pl-9 rounded-xl bg-base-200/50 border-base-300"
                    value={buildConfig.keyStoreAlias || ""}
                    onChange={(e) =>
                      setBuildConfig({
                        ...buildConfig,
                        keyStoreAlias: e.target.value,
                      })
                    }
                  />
                  <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/20 w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text font-bold text-xs text-base-content/60">
                  Key Alias Password
                </span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Alias Password"
                  className="input input-bordered input-xs h-9 w-full pl-9 rounded-xl bg-base-200/50 border-base-300"
                  value={buildConfig.keyStoreAliasPassword || ""}
                  onChange={(e) =>
                    setBuildConfig({
                      ...buildConfig,
                      keyStoreAliasPassword: e.target.value,
                    })
                  }
                />
                <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/20 w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center gap-2 text-primary mb-2 px-1">
              <FiSettings className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">
                Additional Build Options
              </span>
            </div>

            <div className="space-y-4">
              {/* Optimization Section */}
              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-4 px-1">
                  Optimization & Performance
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-xs rounded-lg"
                          checked={buildConfig.uglify}
                          onChange={(e) =>
                            setBuildConfig({
                              ...buildConfig,
                              uglify: e.target.checked,
                            })
                          }
                        />
                        <span className="label-text font-bold text-xs">
                          Uglify (Minify)
                        </span>
                        <div className="badge badge-primary badge-outline text-[9px] h-4 px-1 leading-none">
                          RECOMMENDED
                        </div>
                      </div>
                    </label>
                    <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                      Provides basic obfuscation and smaller app size.
                    </p>
                  </div>
                  <div
                    className={`form-control ${!flavor?.toLowerCase().includes("angular") ? "opacity-40 grayscale pointer-events-none" : ""}`}
                  >
                    <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-xs rounded-lg"
                        checked={buildConfig.aot}
                        disabled={!flavor?.toLowerCase().includes("angular")}
                        onChange={(e) =>
                          setBuildConfig({
                            ...buildConfig,
                            aot: e.target.checked,
                          })
                        }
                      />
                      <span className="label-text font-bold text-xs">
                        AOT Compilation
                      </span>
                      {!flavor?.toLowerCase().includes("angular") && (
                        <div className="badge badge-ghost text-[9px] font-bold h-4 px-1 leading-none">
                          ANGULAR ONLY
                        </div>
                      )}
                    </label>
                    <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                      Creates Ahead-Of-Time build (Angular only).
                    </p>
                  </div>
                  {buildConfig.platform === "android" && (
                    <>
                      <div
                        className={`form-control ${buildConfig.mode !== "release" ? "opacity-40 grayscale pointer-events-none" : ""}`}
                      >
                        <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-xs rounded-lg"
                              checked={
                                buildConfig.snapshot &&
                                buildConfig.mode === "release"
                              }
                              disabled={buildConfig.mode !== "release"}
                              onChange={(e) =>
                                setBuildConfig({
                                  ...buildConfig,
                                  snapshot: e.target.checked,
                                })
                              }
                            />
                            <span className="label-text font-bold text-xs">
                              V8 Snapshot
                            </span>
                            {buildConfig.mode !== "release" && (
                              <div className="badge badge-ghost text-[9px] font-bold h-4 px-1 leading-none">
                                RELEASE ONLY
                              </div>
                            )}
                          </div>
                        </label>
                        <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                          Decreases app start time (Android Release only).
                        </p>
                      </div>
                      <div
                        className={`form-control ${buildConfig.format !== "aab" ? "opacity-40 grayscale pointer-events-none" : ""}`}
                      >
                        <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-xs rounded-lg"
                              checked={
                                buildConfig.compileSnapshot &&
                                buildConfig.format === "aab"
                              }
                              disabled={buildConfig.format !== "aab"}
                              onChange={(e) =>
                                setBuildConfig({
                                  ...buildConfig,
                                  compileSnapshot: e.target.checked,
                                })
                              }
                            />
                            <span className="label-text font-bold text-xs">
                              Compile Snapshot
                            </span>
                            {buildConfig.format !== "aab" && (
                              <div className="badge badge-ghost text-[9px] font-bold h-4 px-1 leading-none">
                                AAB ONLY
                              </div>
                            )}
                          </div>
                        </label>
                        <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                          Compiles assets into .so files (reduces size with
                          AAB).
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Build & Debug Section */}
              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-4 px-1">
                  Build & Debugging
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-xs rounded-lg"
                        checked={buildConfig.force}
                        onChange={(e) =>
                          setBuildConfig({
                            ...buildConfig,
                            force: e.target.checked,
                          })
                        }
                      />
                      <span className="label-text font-bold text-xs">
                        Force Rebuild
                      </span>
                    </label>
                    <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                      Skips compatibility checks and forces dependency install.
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-xs rounded-lg"
                        checked={buildConfig.report}
                        onChange={(e) =>
                          setBuildConfig({
                            ...buildConfig,
                            report: e.target.checked,
                          })
                        }
                      />
                      <span className="label-text font-bold text-xs">
                        Build Report
                      </span>
                    </label>
                    <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                      Creates a Webpack report in the root folder.
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-xs rounded-lg"
                        checked={buildConfig.sourceMap}
                        onChange={(e) =>
                          setBuildConfig({
                            ...buildConfig,
                            sourceMap: e.target.checked,
                          })
                        }
                      />
                      <span className="label-text font-bold text-xs">
                        Source Maps
                      </span>
                    </label>
                    <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                      Creates inline source maps for debugging.
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-xs rounded-lg"
                        checked={buildConfig.hiddenSourceMap}
                        onChange={(e) =>
                          setBuildConfig({
                            ...buildConfig,
                            hiddenSourceMap: e.target.checked,
                          })
                        }
                      />
                      <span className="label-text font-bold text-xs">
                        Hidden Source Maps
                      </span>
                    </label>
                    <p className="text-[10px] text-base-content/60 pl-7 leading-tight">
                      Creates source maps in root (useful for Crashlytics).
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Section */}
              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-4 px-1">
                  Advanced Configuration
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-base-content/60">
                        Compile SDK (Android)
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 34"
                      className="input input-bordered input-xs w-full rounded-lg bg-base-200/50 border-base-300"
                      value={buildConfig.compileSdk || ""}
                      onChange={(e) =>
                        setBuildConfig({
                          ...buildConfig,
                          compileSdk: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-base-content/60 mt-1 px-1">
                      Android API Level (e.g. 33, 34). Min 28.
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-base-content/60">
                        Copy To Path
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ./dist"
                      className="input input-bordered input-xs w-full rounded-lg bg-base-200/50 border-base-300"
                      value={buildConfig.copyTo || ""}
                      onChange={(e) =>
                        setBuildConfig({
                          ...buildConfig,
                          copyTo: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-base-content/60 mt-1 px-1">
                      Path where the built file will be copied.
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Flags Section */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs uppercase tracking-widest text-base-content/40 px-1">
                    Custom Flags & Arguments
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. --env.production --no-hmr"
                    className="input input-bordered input-xs w-full pl-10 rounded-xl bg-base-200/50 border-base-300 font-mono text-xs"
                    value={buildConfig.additionalOptions || ""}
                    onChange={(e) =>
                      setBuildConfig({
                        ...buildConfig,
                        additionalOptions: e.target.value,
                      })
                    }
                  />
                  <FiTerminal className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/20 w-4 h-4" />
                </div>
                <p className="text-[10px] text-base-content/60 mt-1 px-1">
                  Specifies additional flags that the bundler may process.
                </p>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 py-2">
            <div className="text-center mb-4">
              <h3 className="text-base font-bold text-base-content">
                Review & Preview
              </h3>
              <p className="text-xs text-base-content/60">
                Verify settings and see the final command
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-base-200 border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-0.5">
                  Target Platform
                </div>
                <div className="font-bold capitalize flex items-center gap-2 text-xs text-base-content">
                  <FiSmartphone className="text-primary w-3.5 h-3.5" />
                  {buildConfig.platform}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-base-200 border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-0.5">
                  Build Mode
                </div>
                <div className="font-bold capitalize flex items-center gap-2 text-xs text-base-content">
                  {buildConfig.mode === "debug" ? (
                    <FiZap className="text-primary w-3.5 h-3.5" />
                  ) : (
                    <FiCheckCircle className="text-warning w-3.5 h-3.5" />
                  )}
                  {buildConfig.mode}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/40">
                  Command Preview
                </div>
                <button
                  className={`btn btn-xs h-6 gap-1.5 rounded-lg border-none ${copied ? "bg-success/20 text-success" : "bg-base-300/50 hover:bg-base-300 text-base-content/60"}`}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <FiCheck className="w-3 h-3" />
                      <span className="text-[10px] font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-3 h-3" />
                      <span className="text-[10px] font-bold">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/90 p-4 rounded-2xl border border-white/10 relative group">
                <div className="font-mono text-xs text-green-400 break-all leading-relaxed pr-20">
                  <span className="text-white/30 mr-2">$</span>
                  {generateCommandPreview()}
                </div>
                <div className="absolute top-3 right-3">
                  <div className="badge badge-outline border-white/10 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                    Preview Only
                  </div>
                </div>
              </div>
            </div>

            <div className="alert bg-primary/5 border-primary/10 text-xs py-2 px-3 rounded-xl text-base-content/60 leading-relaxed">
              <FiZap className="text-primary w-3.5 h-3.5 flex-shrink-0" />
              <span>
                The build process will start in the background. You can monitor
                progress in the console output.
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 border border-base-300 shadow-2xl w-full max-w-4xl overflow-hidden rounded-3xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-base-200/50 py-3 px-6 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <FiPackage className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-base-content leading-none mb-1">
                Build Configuration
              </h2>
              <div className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-2">
                Target: {buildConfig.platform}{" "}
                <span className="opacity-20">•</span> Step {wizardStep} of 5
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
            onClick={onClose}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-8 pt-4">
          <ul className="steps w-full">
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 1 ? "step-primary" : "text-base-content/20"}`}
            >
              Type
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 2 ? "step-primary" : "text-base-content/20"}`}
            >
              Config
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 3 ? "step-primary" : "text-base-content/20"}`}
            >
              Signing
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 4 ? "step-primary" : "text-base-content/20"}`}
            >
              Options
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 5 ? "step-primary" : "text-base-content/20"}`}
            >
              Review
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">{renderWizardStep()}</div>

        {/* Footer */}
        <div className="bg-base-200/50 py-3 px-6 border-t border-base-300 flex items-center justify-between">
          <button
            className={`btn btn-sm btn-ghost gap-2 rounded-xl ${wizardStep === 1 ? "invisible" : ""}`}
            onClick={handleBack}
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {wizardStep < 5 ? (
            <button
              className="btn btn-sm btn-primary px-6 rounded-xl shadow-lg shadow-primary/20 gap-2"
              onClick={handleNext}
              disabled={
                (wizardStep === 2 && !buildConfig.platform) ||
                (wizardStep === 3 &&
                  buildConfig.mode === "release" &&
                  (!buildConfig.keyStorePath ||
                    !buildConfig.keyStorePassword ||
                    !buildConfig.keyStoreAlias ||
                    !buildConfig.keyStoreAliasPassword))
              }
            >
              Next Step <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              className="btn btn-sm btn-primary px-8 rounded-xl shadow-lg shadow-primary/20 gap-2"
              onClick={handleBuild}
            >
              Start Build Process <FiPackage className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
