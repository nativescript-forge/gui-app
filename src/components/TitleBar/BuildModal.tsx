import { FiPackage, FiX, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { useState, useEffect } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { BuildConfig, ProjectRow } from "../../app/types";
import type Database from "@tauri-apps/plugin-sql";
import { TargetSelection } from "./BuildWizard/TargetSelection";
import { LocalBuildFlow } from "./BuildWizard/LocalBuildFlow";
import { CloudBuildFlow } from "./BuildWizard/CloudBuildFlow";
import { BuildWizardPreview } from "./BuildWizard/BuildWizardPreview";
import type { PlatformStatus } from "../../app/platformDetection";

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuild: (config: BuildConfig) => void;
  platform: "android" | "ios" | null;
  projectPath?: string;
  flavor?: string;
  db: Database | null;
  platformStatus: PlatformStatus;
  isMac: boolean;
}

export function BuildModal({
  isOpen,
  onClose,
  onBuild,
  platform: initialPlatform,
  flavor,
  projectPath,
  db,
  platformStatus,
  isMac,
}: BuildModalProps) {
  const [wizardStep, setWizardStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [buildConfig, setBuildConfig] = useState<BuildConfig>({
    buildType: "local",
    platform:
      initialPlatform || (platformStatus.android.available ? "android" : "ios"),
    mode: "debug",
    format:
      (initialPlatform ||
        (platformStatus.android.available ? "android" : "ios")) === "android"
        ? "apk"
        : "ipa",
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
      if (buildConfig.v8cache) buildCmdParts.push("--env.v8cache");
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
        platform:
          initialPlatform ||
          (platformStatus.android.available ? "android" : "ios"),
        mode: "debug",
        format:
          (initialPlatform ||
            (platformStatus.android.available ? "android" : "ios")) ===
          "android"
            ? "apk"
            : "ipa",
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
  }, [initialPlatform, isOpen, db, projectPath, platformStatus]);

  if (!isOpen) return null;

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <TargetSelection
            buildConfig={buildConfig}
            setBuildConfig={setBuildConfig}
          />
        );
      case 2:
      case 3:
      case 4:
        if (buildConfig.buildType === "cloud") {
          return (
            <CloudBuildFlow
              wizardStep={wizardStep}
              buildConfig={buildConfig}
              setBuildConfig={setBuildConfig}
            />
          );
        }
        return (
          <LocalBuildFlow
            wizardStep={wizardStep}
            buildConfig={buildConfig}
            setBuildConfig={setBuildConfig}
            flavor={flavor}
            selectKeystore={selectKeystore}
            platformStatus={platformStatus}
            isMac={isMac}
          />
        );
      case 5:
        return (
          <BuildWizardPreview
            buildConfig={buildConfig}
            generateCommandPreview={generateCommandPreview}
            copied={copied}
            handleCopy={handleCopy}
          />
        );
      default:
        return null;
    }
  };

  const totalSteps = buildConfig.platform === "android" ? 5 : 4;
  const currentDisplayStep =
    buildConfig.platform === "android"
      ? wizardStep
      : wizardStep <= 2
        ? wizardStep
        : wizardStep - 1;

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
                <span className="opacity-20">•</span> Step {currentDisplayStep}{" "}
                of {totalSteps}
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
            {buildConfig.platform === "android" && (
              <li
                className={`step step-xs text-[10px] font-bold uppercase tracking-tighter ${wizardStep >= 3 ? "step-primary" : "text-base-content/30"}`}
              >
                Signing
              </li>
            )}
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
              buildConfig.buildType === "cloud"
                ? true
                : wizardStep === 2
                  ? !buildConfig.platform
                  : wizardStep === 3 &&
                      buildConfig.platform === "android" &&
                      buildConfig.mode === "release"
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
