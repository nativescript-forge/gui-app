import {
  FiZap,
  FiBox,
  FiKey,
  FiCheckCircle,
  FiTerminal,
  FiInfo,
} from "react-icons/fi";
import { SiAndroid, SiApple } from "react-icons/si";
import type { BuildConfig } from "../../../shared/types";
import type { PlatformStatus } from "../../../shared/platformDetection";

interface LocalBuildFlowProps {
  wizardStep: number;
  buildConfig: BuildConfig;
  setBuildConfig: (
    config: BuildConfig | ((prev: BuildConfig) => BuildConfig),
  ) => void;
  flavor?: string;
  selectKeystore: () => Promise<void>;
  platformStatus: PlatformStatus;
}

export function LocalBuildFlow({
  wizardStep,
  buildConfig,
  setBuildConfig,
  flavor,
  selectKeystore,
  platformStatus,
}: LocalBuildFlowProps) {
  switch (wizardStep) {
    case 2:
      return (
        <div className="space-y-3 py-1">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-1.5 block px-1">
              Platform Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${
                  buildConfig.platform === "android"
                    ? "btn-primary border-primary shadow-md"
                    : !platformStatus.android.available
                      ? "btn-ghost bg-base-200/50 border-base-300 opacity-40 cursor-not-allowed grayscale"
                      : "btn-ghost bg-base-200/50 border-base-300 opacity-60 hover:opacity-100"
                }`}
                onClick={() =>
                  platformStatus.android.available &&
                  setBuildConfig({
                    ...buildConfig,
                    platform: "android",
                    format: "apk",
                  })
                }
                disabled={!platformStatus.android.available}
              >
                <div className="flex items-center gap-2">
                  <SiAndroid className="w-4 h-4" />
                  <span className="text-xs font-bold">Android</span>
                </div>
                <span className="text-[10px] font-medium opacity-60">
                  Build for Android devices
                </span>
                {!platformStatus.android.available && (
                  <div className="text-[8px] text-error font-bold leading-tight mt-0.5">
                    {platformStatus.android.reason || "Not available"}
                  </div>
                )}
              </button>
              <button
                className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${
                  buildConfig.platform === "ios"
                    ? "btn-primary border-primary shadow-md"
                    : !platformStatus.ios.available
                      ? "btn-ghost bg-base-200/50 border-base-300 opacity-40 cursor-not-allowed grayscale"
                      : "btn-ghost bg-base-200/50 border-base-300 opacity-60 hover:opacity-100"
                }`}
                onClick={() =>
                  platformStatus.ios.available &&
                  setBuildConfig({
                    ...buildConfig,
                    platform: "ios",
                    format: "ipa",
                  })
                }
                disabled={!platformStatus.ios.available}
              >
                <div className="flex items-center gap-2">
                  <SiApple className="w-4 h-4" />
                  <span className="text-xs font-bold">iOS</span>
                </div>
                <span className="text-[10px] font-medium opacity-60">
                  Build for iOS devices
                </span>
                {!platformStatus.ios.available && (
                  <div className="text-[8px] text-error font-bold leading-tight mt-0.5">
                    {platformStatus.ios.reason || "Not available"}
                  </div>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-1.5 block px-1">
              Build Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative group">
                <button
                  className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all w-full ${buildConfig.mode === "debug" ? "btn-primary border-primary shadow-md" : "btn-ghost bg-base-200/50 border-base-300 opacity-70 hover:opacity-100"}`}
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
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-base-300 text-base-content text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-base-content/10">
                  <strong>Debug Mode:</strong> Run the application with
                  debugging and hot reload enabled.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-base-300"></div>
                </div>
              </div>

              <div className="relative group">
                <button
                  className={`btn btn-sm h-auto py-2.5 flex flex-col items-center gap-1 rounded-xl border-2 transition-all w-full ${buildConfig.mode === "release" ? "btn-warning border-warning shadow-md text-warning-content" : "btn-ghost bg-base-200/50 border-base-300 opacity-70 hover:opacity-100"}`}
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
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-base-300 text-base-content text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-base-content/10">
                  <strong>Release Mode:</strong> Run the application in
                  production mode without debugging.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-base-300"></div>
                </div>
              </div>
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
              <div className="flex items-center justify-between group">
                <label className="label cursor-pointer justify-start gap-3 p-0 mb-0.5 flex-1">
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
                <div className="dropdown dropdown-left dropdown-hover">
                  <label
                    tabIndex={0}
                    className="btn btn-ghost btn-xs btn-circle text-base-content/20 group-hover:text-info hover:bg-info/10 transition-all"
                  >
                    <FiInfo className="w-3.5 h-3.5" />
                  </label>
                  <div
                    tabIndex={0}
                    className="dropdown-content z-[2] card card-compact w-64 p-4 shadow-2xl bg-base-100 border border-base-200"
                  >
                    <div className="font-bold mb-1.5 text-primary text-sm">
                      Clean Build
                    </div>
                    <p className="text-xs opacity-70 leading-relaxed">
                      Menghapus folder platforms dan node_modules sebelum build
                      untuk memastikan lingkungan bersih dan menghindari error
                      cache. Sangat disarankan saat berpindah platform.
                    </p>
                  </div>
                </div>
              </div>
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
                        Keystore Password
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
                        Key Alias
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
                  Make sure you use the same keystore used for previous releases
                  of this app.
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
                  Android builds use a default debug keystore. You don't need to
                  provide any signing information for this build.
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
                  <div className="flex items-center justify-between group">
                    <label className="label cursor-pointer justify-start gap-3 p-0 mb-1 flex-1">
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
                    <div className="dropdown dropdown-left dropdown-hover">
                      <label
                        tabIndex={0}
                        className="btn btn-ghost btn-xs btn-circle text-base-content/20 group-hover:text-info hover:bg-info/10 transition-all"
                      >
                        <FiInfo className="w-3.5 h-3.5" />
                      </label>
                      <div
                        tabIndex={0}
                        className="dropdown-content z-[2] card card-compact w-64 p-4 shadow-2xl bg-base-100 border border-base-200"
                      >
                        <div className="font-bold mb-1.5 text-primary text-sm">
                          Uglify (Minify)
                        </div>
                        <p className="text-xs opacity-70 leading-relaxed">
                          Mengurangi ukuran file JavaScript dengan menghapus
                          spasi, komentar, dan menyingkat nama variabel.
                          Memberikan obfuscation dasar.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-base-content/70 pl-7 leading-tight">
                    Provides basic obfuscation and smaller app size.
                  </p>
                </div>
                <div
                  className={`form-control ${!flavor?.toLowerCase().includes("angular") ? "opacity-40 grayscale pointer-events-none" : ""}`}
                >
                  <div className="flex items-center justify-between group">
                    <label className="label cursor-pointer justify-start gap-3 p-0 mb-1 flex-1">
                      <div className="flex items-center gap-2">
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
                      </div>
                    </label>
                    <div className="dropdown dropdown-left dropdown-hover">
                      <label
                        tabIndex={0}
                        className="btn btn-ghost btn-xs btn-circle text-base-content/20 group-hover:text-info hover:bg-info/10 transition-all"
                      >
                        <FiInfo className="w-3.5 h-3.5" />
                      </label>
                      <div
                        tabIndex={0}
                        className="dropdown-content z-[2] card card-compact w-64 p-4 shadow-2xl bg-base-100 border border-base-200"
                      >
                        <div className="font-bold mb-1.5 text-primary text-sm">
                          AOT Compilation
                        </div>
                        <p className="text-xs opacity-70 leading-relaxed">
                          Ahead-of-Time compilation mengonversi template Angular
                          ke kode eksekusi saat build, mempercepat rendering
                          awal aplikasi.
                        </p>
                      </div>
                    </div>
                  </div>
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
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3 p-0 mb-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-xs rounded-lg"
                            checked={!!buildConfig.v8cache}
                            onChange={(e) =>
                              setBuildConfig({
                                ...buildConfig,
                                v8cache: e.target.checked,
                              })
                            }
                          />
                          <span className="label-text font-bold text-xs">
                            V8 Cache
                          </span>
                        </div>
                      </label>
                      <p className="text-xs text-base-content/70 pl-7 leading-tight">
                        Enable V8 code caching for faster execution.
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
    default:
      return null;
  }
}
