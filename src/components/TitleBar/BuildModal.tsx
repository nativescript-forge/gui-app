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
import type { BuildConfig, ProjectRow } from "../../app/types";
import type Database from "@tauri-apps/plugin-sql";

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuild: (config: BuildConfig) => void;
  platform: "android" | "ios";
  projectPath?: string;
  flavor?: string;
  db: Database | null;
}

export function BuildModal({
  isOpen,
  onClose,
  onBuild,
  platform: initialPlatform,
  flavor,
  projectPath,
  db,
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

  const handleNext = () => {
    if (wizardStep === 2 && buildConfig.platform !== "android") {
      setWizardStep(4);
    } else {
      setWizardStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (wizardStep === 4 && buildConfig.platform !== "android") {
      setWizardStep(2);
    } else {
      setWizardStep((s) => s - 1);
    }
  };

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

  const handleBuild = async () => {
    // Save signing info to DB if it's a release build and projectPath is available
    if (
      db &&
      projectPath &&
      buildConfig.platform === "android" &&
      buildConfig.mode === "release"
    ) {
      try {
        await db.execute(
          `UPDATE projects SET 
            ks_path = $1, 
            ks_password = $2, 
            ks_alias = $3, 
            ks_alias_password = $4 
           WHERE path = $5`,
          [
            buildConfig.keyStorePath,
            buildConfig.keyStorePassword,
            buildConfig.keyStoreAlias,
            buildConfig.keyStoreAliasPassword,
            projectPath,
          ],
        );
      } catch (err) {
        console.error("Failed to save signing info to DB:", err);
      }
    }

    onBuild(buildConfig);
    onClose();
    setWizardStep(1);
  };

  useEffect(() => {
    const loadSavedSigningInfo = async () => {
      if (db && projectPath && initialPlatform === "android") {
        try {
          const projects = (await db.select(
            "SELECT ks_path, ks_password, ks_alias, ks_alias_password FROM projects WHERE path = $1",
            [projectPath],
          )) as ProjectRow[];

          if (projects.length > 0) {
            const p = projects[0];
            if (p.ks_path) {
              setBuildConfig((prev) => ({
                ...prev,
                keyStorePath: p.ks_path || undefined,
                keyStorePassword: p.ks_password || undefined,
                keyStoreAlias: p.ks_alias || undefined,
                keyStoreAliasPassword: p.ks_alias_password || undefined,
              }));
            }
          }
        } catch (err) {
          console.error("Failed to load signing info from DB:", err);
        }
      }
    };

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
      loadSavedSigningInfo();
    }
  }, [initialPlatform, isOpen, db, projectPath]);

  if (!isOpen) return null;

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-3 py-1">
            <div className="text-center mb-3">
              <h3 className="text-base font-bold text-base-content">
                Select Build Target
              </h3>
              <p className="text-xs text-base-content/60">
                Choose how you want to build your application
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                  buildConfig.buildType === "local"
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-base-300 hover:border-primary/50 bg-base-200/50"
                }`}
                onClick={() =>
                  setBuildConfig({ ...buildConfig, buildType: "local" })
                }
              >
                <div
                  className={`p-2.5 rounded-full ${buildConfig.buildType === "local" ? "bg-primary text-primary-content" : "bg-base-300 opacity-50"}`}
                >
                  <FiCpu className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-xs text-base-content">
                    Local Build
                  </div>
                  <div className="text-[10px] text-base-content/60 mt-0.5 text-balance">
                    Build using your local machine resources
                  </div>
                </div>
              </button>

              {buildConfig.platform === "ios" ? (
                <button
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                    buildConfig.buildType === "simulator"
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-base-300 hover:border-primary/50 bg-base-200/50"
                  }`}
                  onClick={() =>
                    setBuildConfig({ ...buildConfig, buildType: "simulator" })
                  }
                >
                  <div
                    className={`p-2.5 rounded-full ${buildConfig.buildType === "simulator" ? "bg-primary text-primary-content" : "bg-base-300 opacity-50"}`}
                  >
                    <FiSmartphone className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xs text-base-content">
                      Simulator Build
                    </div>
                    <div className="text-[10px] text-base-content/60 mt-0.5 text-balance">
                      Build specifically for iOS Simulator
                    </div>
                  </div>
                </button>
              ) : (
                <div className="relative group">
                  <button
                    className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 border-base-300 bg-base-200/20 opacity-50 cursor-not-allowed w-full h-full"
                    disabled
                  >
                    <div className="p-2.5 rounded-full bg-base-300 opacity-50">
                      <FiCloud className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-xs text-base-content">
                        Cloud Build
                      </div>
                      <div className="text-[10px] text-base-content/60 mt-0.5 text-balance">
                        Build on Norrix Cloud Infrastructure
                      </div>
                    </div>
                  </button>
                  <div className="absolute top-2 right-2 badge badge-warning badge-[9px] font-bold shadow-sm h-3.5 px-1.5 leading-none">
                    Soon
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3 py-1">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-1.5 block px-1">
                Platform Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${buildConfig.platform === "android" ? "btn-primary border-primary shadow-md" : "btn-ghost bg-base-200/50 border-base-300 opacity-60 hover:opacity-100"}`}
                  onClick={() =>
                    setBuildConfig({
                      ...buildConfig,
                      platform: "android",
                      format: "apk",
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <SiAndroid className="w-4 h-4" />
                    <span className="text-xs font-bold">Android</span>
                  </div>
                  <span className="text-[10px] font-medium opacity-60">
                    Build for Android devices
                  </span>
                </button>
                <button
                  className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${buildConfig.platform === "ios" ? "btn-primary border-primary shadow-md" : "btn-ghost bg-base-200/50 border-base-300 opacity-60 hover:opacity-100"}`}
                  onClick={() =>
                    setBuildConfig({
                      ...buildConfig,
                      platform: "ios",
                      format: "ipa",
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <SiApple className="w-4 h-4" />
                    <span className="text-xs font-bold">iOS</span>
                  </div>
                  <span className="text-[10px] font-medium opacity-60">
                    Build for iOS devices
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-1.5 block px-1">
                Build Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${buildConfig.mode === "debug" ? "btn-primary border-primary shadow-md" : "btn-ghost bg-base-200/50 border-base-300 opacity-70 hover:opacity-100"}`}
                  onClick={() =>
                    setBuildConfig({ ...buildConfig, mode: "debug" })
                  }
                >
                  <div className="flex items-center gap-2">
                    <FiZap className="w-4 h-4" />
                    <span className="text-xs font-bold">Debug</span>
                  </div>
                  <span className="text-[10px] font-medium opacity-60">
                    Faster build for testing
                  </span>
                </button>
                <button
                  className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${buildConfig.mode === "release" ? "btn-warning border-warning shadow-md text-warning-content" : "btn-ghost bg-base-200/50 border-base-300 opacity-70 hover:opacity-100"}`}
                  onClick={() =>
                    setBuildConfig({ ...buildConfig, mode: "release" })
                  }
                >
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">Release</span>
                  </div>
                  <span className="text-[10px] font-medium opacity-60">
                    Optimized for production
                  </span>
                </button>
              </div>
            </div>

            {buildConfig.platform === "android" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-1.5 block px-1">
                  Output Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${buildConfig.format === "apk" ? "btn-primary border-primary shadow-md" : "btn-ghost bg-base-200/50 border-base-300 opacity-60 hover:opacity-100"}`}
                    onClick={() =>
                      setBuildConfig({ ...buildConfig, format: "apk" })
                    }
                  >
                    <div className="flex items-center gap-2">
                      <FiBox className="w-4 h-4" />
                      <span className="text-xs font-bold">APK</span>
                    </div>
                    <span className="text-[10px] font-medium opacity-60">
                      Standard package file
                    </span>
                  </button>
                  <button
                    className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${buildConfig.format === "aab" ? "btn-primary border-primary shadow-md" : "btn-ghost bg-base-200/50 border-base-300 opacity-60 hover:opacity-100"}`}
                    onClick={() =>
                      setBuildConfig({ ...buildConfig, format: "aab" })
                    }
                  >
                    <div className="flex items-center gap-2">
                      <FiBox className="w-4 h-4" />
                      <span className="text-xs font-bold">AAB</span>
                    </div>
                    <span className="text-[10px] font-medium opacity-60">
                      Android App Bundle
                    </span>
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
                    <span className="label-text font-bold text-sm">
                      Clean Build (Fresh Start)
                    </span>
                    <div className="badge badge-primary badge-outline text-[9px] h-4 px-1 leading-none">
                      RECOMMENDED
                    </div>
                  </div>
                </label>
                <p className="text-xs text-base-content/60 pl-7 leading-tight">
                  Removes old build artifacts and cache. Highly recommended when
                  switching platforms or encountering unexpected build errors.
                </p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3 py-1">
            <div className="text-center mb-3">
              <h3 className="text-base font-bold text-base-content">
                Android Signing
              </h3>
              <p className="text-xs text-base-content/60">
                {buildConfig.mode === "release"
                  ? "Configure your release certificate"
                  : "Signing is optional for debug builds"}
              </p>
            </div>

            {buildConfig.mode === "debug" && (
              <div className="alert bg-primary/10 border-primary/20 text-xs py-2 px-3 rounded-xl text-primary flex items-center gap-3">
                <FiZap className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Debug Mode:</strong> Android uses a default debug
                  keystore. You can skip this or provide a custom one.
                </span>
              </div>
            )}

            {buildConfig.mode === "release" ? (
              <>
                <div className="bg-base-200/50 p-3.5 rounded-2xl border border-base-300 space-y-3">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs uppercase tracking-widest text-base-content/60">
                        Keystore File
                      </span>
                    </label>
                    <div className="join w-full shadow-sm">
                      <div className="join-item bg-base-300/50 flex items-center px-3 border border-base-300 border-r-0 h-9">
                        <FiKey className="w-3.5 h-3.5 text-base-content/60" />
                      </div>
                      <input
                        type="text"
                        placeholder="Path to .keystore or .jks"
                        className="input input-bordered join-item w-full bg-base-200/50 border-base-300 text-xs h-9 focus:outline-none"
                        value={buildConfig.keyStorePath || ""}
                        readOnly
                      />
                      <button
                        className="btn btn-primary join-item px-4 h-9 min-h-0 text-[10px] font-bold uppercase tracking-widest"
                        onClick={selectKeystore}
                      >
                        Browse
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text font-bold text-xs uppercase tracking-widest text-base-content/60">
                          Password
                          <span className="ml-1 text-[10px] opacity-80 lowercase font-medium">
                            (--key-store-password)
                          </span>
                        </span>
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="input input-bordered w-full bg-base-200/50 border-base-300 text-xs h-9"
                        value={buildConfig.keyStorePassword || ""}
                        onChange={(e) =>
                          setBuildConfig({
                            ...buildConfig,
                            keyStorePassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text font-bold text-xs uppercase tracking-widest text-base-content/60">
                          Alias
                          <span className="ml-1 text-[10px] opacity-80 lowercase font-medium">
                            (--key-store-alias)
                          </span>
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. upload"
                        className="input input-bordered w-full bg-base-200/50 border-base-300 text-xs h-9"
                        value={buildConfig.keyStoreAlias || ""}
                        onChange={(e) =>
                          setBuildConfig({
                            ...buildConfig,
                            keyStoreAlias: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs uppercase tracking-widest text-base-content/60">
                        Alias Password
                        <span className="ml-1 text-[10px] opacity-80 lowercase font-medium">
                          (--key-store-alias-password)
                        </span>
                      </span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full bg-base-200/50 border-base-300 text-xs h-9"
                      value={buildConfig.keyStoreAliasPassword || ""}
                      onChange={(e) =>
                        setBuildConfig({
                          ...buildConfig,
                          keyStoreAliasPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="alert bg-warning/5 border-warning/10 text-xs py-2 px-3 rounded-xl text-base-content/70 leading-tight">
                  <FiCheckCircle className="text-warning w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Make sure you use the same keystore used for previous
                    releases of this app.
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4 bg-base-200/30 rounded-3xl border-2 border-dashed border-base-300">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <FiZap className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base-content">
                    Debug Mode Active
                  </h4>
                  <p className="text-xs text-base-content/60 max-w-xs mx-auto">
                    Android builds use a default debug keystore. You don't need
                    to provide any signing information for this build.
                  </p>
                </div>
                <div className="badge badge-primary badge-outline font-bold py-3 px-4 h-auto">
                  Ready to proceed
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-3 py-1">
            <div className="text-center mb-3">
              <h3 className="text-base font-bold text-base-content">
                Advanced Options
              </h3>
              <p className="text-xs text-base-content/60">
                Fine-tune your build process
              </p>
            </div>

            <div className="space-y-3">
              {/* Build Optimizations Section */}
              <div className="bg-base-200/50 p-3.5 rounded-2xl border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-3 px-1">
                  Build Optimizations
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                        <div className="badge badge-primary badge-outline text-[10px] h-4 px-1 leading-none">
                          RECOMMENDED
                        </div>
                      </div>
                    </label>
                    <p className="text-xs text-base-content/70 pl-7 leading-tight">
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
                        <div className="badge badge-ghost text-[10px] font-bold h-4 px-1 leading-none">
                          ANGULAR ONLY
                        </div>
                      )}
                    </label>
                    <p className="text-xs text-base-content/70 pl-7 leading-tight">
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
                              <div className="badge badge-ghost text-[10px] font-bold h-4 px-1 leading-none">
                                RELEASE ONLY
                              </div>
                            )}
                          </div>
                        </label>
                        <p className="text-xs text-base-content/70 pl-7 leading-tight">
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
                              <div className="badge badge-ghost text-[10px] font-bold h-4 px-1 leading-none">
                                AAB ONLY
                              </div>
                            )}
                          </div>
                        </label>
                        <p className="text-xs text-base-content/70 pl-7 leading-tight">
                          Compiles assets into .so files (AAB only).
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Build & Debug Section */}
              <div className="bg-base-200/50 p-3.5 rounded-2xl border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-3 px-1">
                  Build & Debugging
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                    <p className="text-xs text-base-content/70 pl-7 leading-tight">
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
                    <p className="text-xs text-base-content/70 pl-7 leading-tight">
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
                    <p className="text-xs text-base-content/70 pl-7 leading-tight">
                      Generates .map files for debugging.
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
                    <p className="text-xs text-base-content/70 pl-7 leading-tight">
                      Source maps without reference in bundle.
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Section */}
              <div className="bg-base-200/50 p-3.5 rounded-2xl border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-3 px-1">
                  Advanced Configuration
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-base-content/60">
                        Compile SDK (Android)
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 34"
                      className="input input-bordered input-xs h-8 w-full rounded-lg bg-base-200/50 border-base-300"
                      value={buildConfig.compileSdk || ""}
                      onChange={(e) =>
                        setBuildConfig({
                          ...buildConfig,
                          compileSdk: e.target.value,
                        })
                      }
                    />
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
                      className="input input-bordered input-xs h-8 w-full rounded-lg bg-base-200/50 border-base-300"
                      value={buildConfig.copyTo || ""}
                      onChange={(e) =>
                        setBuildConfig({
                          ...buildConfig,
                          copyTo: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Custom Flags Section */}
              <div className="form-control px-1">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs uppercase tracking-widest text-base-content/60">
                    Custom Flags & Arguments
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. --env.production --no-hmr"
                    className="input input-bordered input-xs h-8 w-full pl-9 rounded-xl bg-base-200/50 border-base-300 font-mono text-xs"
                    value={buildConfig.additionalOptions || ""}
                    onChange={(e) =>
                      setBuildConfig({
                        ...buildConfig,
                        additionalOptions: e.target.value,
                      })
                    }
                  />
                  <FiTerminal className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/20 w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-3 py-1">
            <div className="text-center mb-3">
              <h3 className="text-base font-bold text-base-content">
                Review & Preview
              </h3>
              <p className="text-xs text-base-content/60">
                Verify settings and see the final command
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-2xl bg-base-200 border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-0.5">
                  Output Format
                </div>
                <div className="font-bold uppercase flex items-center gap-2 text-sm text-base-content">
                  <FiBox className="text-primary w-3.5 h-3.5" />
                  {buildConfig.format}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-base-200 border border-base-300">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-0.5">
                  Clean Build
                </div>
                <div className="font-bold flex items-center gap-2 text-sm text-base-content">
                  <FiPackage
                    className={`${buildConfig.clean ? "text-primary" : "text-base-content/20"} w-3.5 h-3.5`}
                  />
                  {buildConfig.clean ? "Yes" : "No"}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-bold uppercase tracking-widest text-base-content/60">
                  Command Preview
                </div>
                <button
                  className={`btn btn-xs h-6 gap-1.5 rounded-lg border-none ${copied ? "bg-success/20 text-success" : "bg-base-300/50 hover:bg-base-300 text-base-content/60"}`}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <FiCheck className="w-3 h-3" />
                      <span className="text-[11px] font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-3 h-3" />
                      <span className="text-[11px] font-bold">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/90 p-3.5 rounded-2xl border border-white/10 relative group">
                <div className="font-mono text-xs text-green-400 break-all leading-relaxed pr-20">
                  <span className="text-white/30 mr-2">$</span>
                  {generateCommandPreview()}
                </div>
                <div className="absolute top-3 right-3">
                  <div className="badge badge-outline border-white/10 text-[9px] text-white/30 font-bold uppercase tracking-widest">
                    Preview
                  </div>
                </div>
              </div>
            </div>

            <div className="alert bg-primary/5 border-primary/10 text-xs py-1.5 px-3 rounded-xl text-base-content/70 leading-relaxed">
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
      <div className="bg-base-100 border border-base-300 shadow-2xl w-full max-w-2xl overflow-hidden rounded-3xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-base-200/50 py-2.5 px-6 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-xl text-primary">
              <FiPackage className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-base-content leading-none mb-0.5">
                Build Configuration
              </h2>
              <div className="text-[10px] font-bold text-base-content/60 uppercase tracking-widest flex items-center gap-2">
                Target: {buildConfig.platform}{" "}
                <span className="opacity-20">•</span> Step {wizardStep} of 5
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
            onClick={onClose}
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-8 pt-3">
          <ul className="steps w-full">
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 1 ? "step-primary" : "text-base-content/30"}`}
            >
              Type
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 2 ? "step-primary" : "text-base-content/30"}`}
            >
              Config
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 3 ? "step-primary" : "text-base-content/30"}`}
            >
              Signing
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 4 ? "step-primary" : "text-base-content/30"}`}
            >
              Options
            </li>
            <li
              className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 5 ? "step-primary" : "text-base-content/30"}`}
            >
              Review
            </li>
          </ul>
        </div>

        {/* Modal Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {renderWizardStep()}
        </div>

        {/* Footer */}
        <div className="bg-base-200/50 p-3 px-6 border-t border-base-300 flex items-center justify-between">
          <button
            className={`btn btn-sm btn-ghost gap-2 rounded-xl text-xs font-bold uppercase tracking-widest ${wizardStep === 1 ? "invisible" : ""}`}
            onClick={handleBack}
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            className="btn btn-sm btn-primary px-6 gap-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            onClick={wizardStep === 5 ? handleBuild : handleNext}
            disabled={
              wizardStep === 2
                ? !buildConfig.platform
                : wizardStep === 3 && buildConfig.mode === "release"
                  ? !buildConfig.keyStorePath ||
                    !buildConfig.keyStorePassword ||
                    !buildConfig.keyStoreAlias ||
                    !buildConfig.keyStoreAliasPassword
                  : false
            }
          >
            {wizardStep === 5 ? "Start Build" : "Next Step"}
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
