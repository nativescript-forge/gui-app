import React, { useState, useEffect, useCallback } from "react";
import {
  FiImage,
  FiLayout,
  FiInfo,
  FiFile,
  FiSettings,
  FiCheckCircle,
  FiUploadCloud,
  FiAlertCircle,
  FiSmartphone,
} from "react-icons/fi";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";

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

  // const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAssets, setCurrentAssets] = useState<{
    icon: string | null;
    splash: string | null;
  }>({
    icon: null,
    splash: null,
  });

  const projectName = projectPath?.split(/[\\/]/).pop() || "Project";

  const checkCurrentAssets = useCallback(async () => {
    if (!projectPath) return;

    try {
      // Try backend helper first for icon (returns data URL if available)
      try {
        const b64Icon = await invoke<string>("get_project_icon", {
          path: projectPath,
        });
        if (b64Icon) {
          setCurrentAssets((prev) => ({ ...prev, icon: b64Icon }));
        }
      } catch {
        // ignore and fall back to manual checks
      }

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

      let foundIcon: string | null = null;
      for (const p of iconPaths) {
        const fullPath = await join(projectPath, p);
        try {
          const bytes = await readFile(fullPath);
          const blob = new Blob([bytes], { type: "image/png" });
          foundIcon = URL.createObjectURL(blob);
          break;
        } catch {
          try {
            foundIcon = convertFileSrc(fullPath) + `?t=${Date.now()}`;
            break;
          } catch {
            // continue
          }
        }
      }

      let foundSplash: string | null = null;
      for (const p of splashPaths) {
        const fullPath = await join(projectPath, p);
        try {
          const bytes = await readFile(fullPath);
          const blob = new Blob([bytes], { type: "image/png" });
          foundSplash = URL.createObjectURL(blob);
          break;
        } catch {
          try {
            foundSplash = convertFileSrc(fullPath) + `?t=${Date.now()}`;
            break;
          } catch {
            // continue
          }
        }
      }

      setCurrentAssets({ icon: foundIcon, splash: foundSplash });
    } catch (err) {
      console.error("Failed to check current assets:", err);
    }
  }, [projectPath]);

  // Initial and projectPath changes
  useEffect(() => {
    checkCurrentAssets();
  }, [projectPath, checkCurrentAssets]);

  // Refresh when resource-related action finishes
  useEffect(() => {
    if (
      !running &&
      (currentAction === "resources-generate-icons" ||
        currentAction === "resources-generate-splashes" ||
        currentAction === "resources-update")
    ) {
      checkCurrentAssets();
    }
  }, [running, currentAction, checkCurrentAssets]);

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

          {/* Right Column: Current Asset */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-6">
              <div className="card bg-base-100 border border-base-300 rounded-3xl overflow-hidden h-fit shadow-sm">
                <div className="p-6 bg-base-200/50 border-b border-base-300">
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <FiImage className="w-3 h-3" />
                    {selectedAction === "resources-generate-icons"
                      ? "Current Icon"
                      : selectedAction === "resources-generate-splashes"
                        ? "Current Splash"
                        : "Current Asset"}
                  </h3>
                </div>
                <div className="p-8 flex items-center justify-center min-h-[420px] bg-base-50/50">
                  {selectedAction === "resources-generate-icons" &&
                  currentAssets.icon ? (
                    <img
                      src={currentAssets.icon}
                      className="max-h-[380px] object-contain"
                      alt="Current Icon"
                    />
                  ) : selectedAction === "resources-generate-splashes" &&
                    currentAssets.splash ? (
                    <img
                      src={currentAssets.splash}
                      className="w-full max-h-[420px] object-contain"
                      alt="Current Splash"
                    />
                  ) : (
                    <div className="text-[11px] opacity-40">
                      No asset available for this action
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
