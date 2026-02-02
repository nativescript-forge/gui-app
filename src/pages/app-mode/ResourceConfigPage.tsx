import React, { useState, useEffect } from "react";
import {
  FiImage,
  FiLayout,
  FiInfo,
  FiFile,
  FiSettings,
  FiCheckCircle,
  FiUploadCloud,
  FiAlertCircle,
  FiClock,
  FiWifi,
  FiBattery,
  FiSmartphone,
} from "react-icons/fi";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { exists, readFile } from "@tauri-apps/plugin-fs";

type ActionType =
  | "resources-update"
  | "resources-generate-splashes"
  | "resources-generate-icons";

type ResourceConfigPageProps = {
  projectPath: string | null;
  running: boolean;
  currentAction: string | null;
  onRunAction: (
    action: ActionType,
    sourcePath?: string,
    backgroundColor?: string,
  ) => Promise<string | void>;
};

export function ResourceConfigPage({
  projectPath,
  running,
  currentAction,
  onRunAction,
}: ResourceConfigPageProps) {
  const [iconSourcePath, setIconSourcePath] = useState<string>("");
  const [splashSourcePath, setSplashSourcePath] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("#000000");
  const [selectedAction, setSelectedAction] = useState<ActionType>(
    "resources-generate-icons",
  );

  const sourcePath =
    selectedAction === "resources-generate-icons"
      ? iconSourcePath
      : selectedAction === "resources-generate-splashes"
        ? splashSourcePath
        : "";

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAssets, setCurrentAssets] = useState<{
    icon: string | null;
    splash: string | null;
  }>({
    icon: null,
    splash: null,
  });

  const projectName = projectPath?.split(/[\\/]/).pop() || "Project";

  // Fetch current assets from project
  useEffect(() => {
    const checkCurrentAssets = async () => {
      if (!projectPath) return;

      try {
        const iconPaths = [
          "App_Resources/Android/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
          "App_Resources/Android/src/main/res/mipmap-xxhdpi/ic_launcher.png",
          "App_Resources/iOS/Assets.xcassets/AppIcon.appiconset/icon-1024.png",
        ];

        const splashPaths = [
          "App_Resources/Android/src/main/res/drawable-xxxhdpi/logo.png",
          "App_Resources/Android/src/main/res/drawable-xxhdpi/logo.png",
          "App_Resources/iOS/Assets.xcassets/LaunchScreen.aspectfill.imageset/launch_screen.png",
        ];

        let foundIcon = null;
        for (const p of iconPaths) {
          const fullPath = await join(projectPath, p);
          if (await exists(fullPath)) {
            foundIcon = convertFileSrc(fullPath);
            break;
          }
        }

        let foundSplash = null;
        for (const p of splashPaths) {
          const fullPath = await join(projectPath, p);
          if (await exists(fullPath)) {
            foundSplash = convertFileSrc(fullPath);
            break;
          }
        }

        setCurrentAssets({ icon: foundIcon, splash: foundSplash });
      } catch (err) {
        console.error("Failed to check current assets:", err);
      }
    };

    checkCurrentAssets();
  }, [projectPath]);

  useEffect(() => {
    const loadPreview = async () => {
      if (sourcePath) {
        try {
          // Using readFile and creating a blob URL is more reliable than convertFileSrc
          // when dealing with arbitrary system paths on Windows due to protocol permissions.
          const contents = await readFile(sourcePath);
          const blob = new Blob([contents], { type: "image/png" }); // Assuming PNG for icons
          const url = URL.createObjectURL(blob);

          console.log("Source Path:", sourcePath);
          console.log("Preview URL (Blob):", url);

          setPreviewUrl(url);
          setError(null);

          // Clean up the blob URL when path changes or component unmounts
          return () => URL.revokeObjectURL(url);
        } catch (err) {
          console.error("Failed to load preview image:", err);
          // Fallback to convertFileSrc if readFile fails
          try {
            const url = convertFileSrc(sourcePath);
            setPreviewUrl(url);
          } catch (e) {
            setPreviewUrl(null);
          }
        }
      } else {
        setPreviewUrl(null);
      }
    };

    loadPreview();
  }, [sourcePath]);

  const handlePickFile = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg"],
          },
        ],
      });
      if (selected && typeof selected === "string") {
        if (selectedAction === "resources-generate-icons") {
          setIconSourcePath(selected);
        } else if (selectedAction === "resources-generate-splashes") {
          setSplashSourcePath(selected);
        }
      }
    } catch (err) {
      console.error("Failed to open dialog:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedAction !== "resources-update" && !sourcePath) {
      setError("Please select a source image path first.");
      return;
    }

    await onRunAction(selectedAction, sourcePath, backgroundColor);
  };

  const getActionTitle = () => {
    switch (selectedAction) {
      case "resources-update":
        return "Update Structure";
      case "resources-generate-splashes":
        return "Generate Splashes";
      case "resources-generate-icons":
        return "Generate Icons";
    }
  };

  const getActionDescription = () => {
    switch (selectedAction) {
      case "resources-update":
        return "Updates the App_Resources folder structure to conform to modern Android Studio and Xcode projects.";
      case "resources-generate-splashes":
        return "Generates all splashscreens for Android and iOS platforms from your source image.";
      case "resources-generate-icons":
        return "Generates all app icons for Android and iOS platforms from your source image.";
    }
  };

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            Resource Config
          </h2>
          <p className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Manage assets and structure for {projectName}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card bg-base-100 border border-base-300 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 bg-base-200/50 border-b border-base-300">
                <h3 className="text-sm font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                  <FiSettings className="w-3 h-3" /> Resource Configuration
                </h3>
              </div>

              <div className="p-6 space-y-8">
                {/* Action Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1 flex items-center gap-2">
                    <FiSmartphone className="w-3 h-3" /> Choose Action
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "resources-generate-icons",
                        label: "Icons",
                        icon: FiImage,
                      },
                      {
                        id: "resources-generate-splashes",
                        label: "Splashes",
                        icon: FiImage,
                      },
                      {
                        id: "resources-update",
                        label: "Structure",
                        icon: FiLayout,
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedAction(item.id as ActionType)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group ${
                          selectedAction === item.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-base-300 bg-base-100 hover:border-base-content/20"
                        }`}
                      >
                        <item.icon
                          className={`w-6 h-6 ${
                            selectedAction === item.id
                              ? "scale-110"
                              : "opacity-40 group-hover:opacity-100"
                          } transition-all`}
                        />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedAction !== "resources-update" && (
                  <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Source Image */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">
                        Source Image Path
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 group">
                          <input
                            type="text"
                            className="input input-bordered w-full rounded-2xl bg-base-200/50 pl-10 text-[11px] font-mono border-base-300 focus:border-primary transition-all"
                            placeholder="Select a high-res PNG/JPG..."
                            value={sourcePath}
                            readOnly
                            onClick={handlePickFile}
                          />
                          <FiFile className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <button
                          type="button"
                          onClick={handlePickFile}
                          className="btn btn-primary rounded-2xl px-6"
                        >
                          <FiUploadCloud className="w-4 h-4 mr-2" />
                          <span className="text-xs">Browse</span>
                        </button>
                      </div>
                    </div>

                    {selectedAction === "resources-generate-splashes" && (
                      /* Background Color */
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">
                          Splash Background Color
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              className="input input-bordered w-full rounded-2xl bg-base-200/50 pl-12 text-xs font-mono uppercase border-base-300"
                              placeholder="#000000"
                              value={backgroundColor}
                              onChange={(e) =>
                                setBackgroundColor(e.target.value)
                              }
                            />
                            <div
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border border-base-content/10 shadow-sm"
                              style={{ backgroundColor }}
                            />
                          </div>
                          <div className="relative">
                            <input
                              type="color"
                              className="w-12 h-12 p-1 rounded-2xl bg-base-200 border border-base-300 cursor-pointer overflow-hidden"
                              value={backgroundColor}
                              onChange={(e) =>
                                setBackgroundColor(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Assets Display */}
                {(currentAssets.icon || currentAssets.splash) && (
                  <div className="p-4 rounded-2xl bg-base-200/30 border border-base-300 space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 px-1">
                      Current Project Assets
                    </label>
                    <div className="flex gap-4">
                      {currentAssets.icon && (
                        <div className="flex items-center gap-3 p-2 pr-4 bg-base-100 rounded-xl border border-base-200 shadow-sm">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-base-200">
                            <img
                              src={currentAssets.icon}
                              className="w-full h-full object-cover"
                              alt="Current Icon"
                            />
                          </div>
                          <div>
                            <div className="text-[10px] font-black">
                              Current Icon
                            </div>
                            <div className="text-[9px] opacity-40 uppercase">
                              mipmap-xxxhdpi
                            </div>
                          </div>
                        </div>
                      )}
                      {currentAssets.splash && (
                        <div className="flex items-center gap-3 p-2 pr-4 bg-base-100 rounded-xl border border-base-200 shadow-sm">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-base-200 bg-black/5">
                            <img
                              src={currentAssets.splash}
                              className="w-full h-full object-contain p-1"
                              alt="Current Splash"
                            />
                          </div>
                          <div>
                            <div className="text-[10px] font-black">
                              Current Splash
                            </div>
                            <div className="text-[9px] opacity-40 uppercase">
                              drawable-xxxhdpi
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                  <h4 className="text-xs font-bold flex items-center gap-2 text-primary">
                    <FiInfo className="w-3.5 h-3.5" /> {getActionTitle()}
                  </h4>
                  <p className="text-[11px] opacity-70 leading-relaxed">
                    {getActionDescription()}
                  </p>
                </div>

                {error && (
                  <div className="alert alert-error text-xs py-3 rounded-2xl animate-shake">
                    <FiAlertCircle className="w-4 h-4" />
                    <span className="font-bold">{error}</span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-base-200/50 border-t border-base-300">
                <button
                  type="submit"
                  className="btn btn-primary w-full rounded-2xl gap-3 h-14 text-sm font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  disabled={running}
                >
                  {running && currentAction === selectedAction ? (
                    <span className="loading loading-spinner loading-md"></span>
                  ) : (
                    <FiCheckCircle className="w-5 h-5" />
                  )}
                  {running ? "Processing Assets..." : `Run ${getActionTitle()}`}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-6">
              <div className="card bg-base-100 border border-base-300 rounded-3xl overflow-hidden h-fit shadow-sm">
                <div className="p-6 bg-base-200/50 border-b border-base-300 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <FiImage className="w-3 h-3" /> Live Preview
                  </h3>
                  {previewUrl && (
                    <span className="badge badge-success badge-sm font-bold text-[9px] uppercase tracking-widest">
                      New Asset
                    </span>
                  )}
                </div>
                <div className="p-8 flex flex-col items-center justify-center min-h-[500px] bg-base-50/50">
                  {selectedAction === "resources-update" ? (
                    <div className="flex flex-col items-center text-center space-y-4 opacity-20">
                      <FiLayout className="w-32 h-32 stroke-[1]" />
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-tighter">
                          Structure Update
                        </p>
                        <p className="text-[10px] max-w-[200px]">
                          No visual preview for folder structure changes.
                        </p>
                      </div>
                    </div>
                  ) : previewUrl ? (
                    <div className="space-y-12 w-full animate-in zoom-in-95 duration-500">
                      {/* Icon Preview */}
                      {selectedAction === "resources-generate-icons" && (
                        <div className="flex flex-col items-center gap-8">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-40 h-40 rounded-[24%] overflow-hidden border-4 border-white">
                              <img
                                src={previewUrl}
                                className="w-full h-full object-cover"
                                alt="Icon Preview"
                              />
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-base-200 text-[10px] font-black uppercase tracking-widest opacity-60">
                              iOS Squircle
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white">
                              <img
                                src={previewUrl}
                                className="w-full h-full object-cover"
                                alt="Icon Preview"
                              />
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-base-200 text-[10px] font-black uppercase tracking-widest opacity-60">
                              Android Circle
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Splash Preview - REAL SIMULATION */}
                      {selectedAction === "resources-generate-splashes" && (
                        <div className="flex flex-col items-center gap-6">
                          {/* Device Frame */}
                          <div className="relative group">
                            {/* Device Outer Frame */}
                            <div className="w-[280px] h-[580px] rounded-[3rem] bg-slate-900 p-3 shadow-[0_40px_100px_rgba(0,0,0,0.3)] ring-1 ring-white/10 relative">
                              {/* Inner Screen */}
                              <div
                                className="w-full h-full rounded-[2.2rem] shadow-inner overflow-hidden relative flex flex-col transition-colors duration-500"
                                style={{ backgroundColor }}
                              >
                                {/* Status Bar Simulation */}
                                <div className="h-10 w-full flex justify-between items-center px-8 z-20">
                                  <div className="text-[11px] font-bold text-white/80 flex items-center gap-1">
                                    <FiClock className="w-2.5 h-2.5" /> 9:41
                                  </div>
                                  <div className="flex items-center gap-1.5 text-white/80">
                                    <FiWifi className="w-3 h-3" />
                                    <FiBattery className="w-3.5 h-3.5" />
                                  </div>
                                </div>

                                {/* Dynamic Island / Notch */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-30" />

                                {/* Logo Centering Area */}
                                <div className="flex-1 flex items-center justify-center p-12 z-10">
                                  <div className="w-full max-w-[160px] animate-in fade-in zoom-in-75 duration-700">
                                    <img
                                      src={previewUrl}
                                      className="w-full h-auto object-contain"
                                      alt="Splash Preview"
                                    />
                                  </div>
                                </div>

                                {/* Bottom Indicator */}
                                <div className="h-8 w-full flex items-end justify-center pb-2 z-20">
                                  <div className="w-32 h-1.5 bg-white/30 rounded-full" />
                                </div>
                              </div>
                            </div>

                            {/* Device Side Buttons Mockup */}
                            <div className="absolute top-24 -right-1 w-1 h-16 bg-slate-800 rounded-l-md" />
                            <div className="absolute top-20 -left-1 w-1 h-12 bg-slate-800 rounded-r-md" />
                            <div className="absolute top-36 -left-1 w-1 h-16 bg-slate-800 rounded-r-md" />
                            <div className="absolute top-56 -left-1 w-1 h-16 bg-slate-800 rounded-r-md" />
                          </div>
                          <div className="px-6 py-2 rounded-full bg-base-200 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                            Mobile Simulation
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-6 opacity-20">
                      <div className="w-32 h-32 rounded-3xl border-4 border-dashed border-base-content/20 flex items-center justify-center">
                        <FiUploadCloud className="w-12 h-12" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest">
                          No Asset Selected
                        </p>
                        <p className="text-[10px] max-w-[200px]">
                          Select a source image to visualize the generated
                          results.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePickFile}
                        className="btn btn-ghost btn-sm text-xs font-bold border border-base-content/10"
                      >
                        Choose Image Source
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-base-200/50 border-t border-base-300">
                  <p className="text-[9px] text-center opacity-40 font-medium italic">
                    * Simulation is a high-fidelity mockup. Actual appearance
                    may vary by device and OS version.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
