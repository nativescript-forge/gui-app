import {
  FiSettings,
  FiZap,
  FiTrash2,
  FiClock,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import type { RunConfig } from "../../../shared/types";

interface RunOptionsProps {
  runConfig: RunConfig;
  setRunConfig: (config: RunConfig | ((prev: RunConfig) => RunConfig)) => void;
  flavor?: string;
}

export function RunOptions({
  runConfig,
  setRunConfig,
  flavor,
}: RunOptionsProps) {
  const isAngular = flavor?.toLowerCase().includes("angular");

  const toggleOption = (key: keyof RunConfig) => {
    setRunConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const OptionItem = ({
    id,
    label,
    sublabel,
    checked,
    onChange,
    description,
    disabled = false,
    className = "",
  }: {
    id: string;
    label: string;
    sublabel: string;
    checked: boolean;
    onChange: () => void;
    description: string;
    disabled?: boolean;
    className?: string;
  }) => {
    return (
      <div
        className={`flex flex-col gap-1.5 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-primary/20 hover:bg-primary/5 group ${
          disabled
            ? "opacity-30 grayscale pointer-events-none"
            : "cursor-pointer"
        } ${className}`}
        onClick={() => !disabled && onChange()}
      >
        <div className="flex items-start gap-4">
          <div className="pt-1">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm rounded-lg border-2 transition-transform group-hover:scale-110"
              checked={checked}
              readOnly
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] font-black text-base-content/90 group-hover:text-primary transition-colors">
                {label}
              </span>
              <span className="text-[10px] font-mono font-bold opacity-30 group-hover:opacity-60 transition-opacity bg-base-content/5 px-2 py-0.5 rounded-md">
                {sublabel}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-base-content/60 group-hover:text-base-content/80 transition-colors font-medium">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 py-4 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-black text-base-content tracking-tight uppercase">
          Advanced Options
        </h3>
        <p className="text-[11px] text-base-content/40 font-bold uppercase tracking-[0.3em]">
          Configure {runConfig.platform} {runConfig.action} flags
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {/* Core Options */}
        <div className="space-y-5">
          <div className="flex items-center gap-4 px-2">
            <label className="text-[11px] font-black uppercase tracking-[0.25em] text-base-content/30 whitespace-nowrap">
              Core Settings
            </label>
            <div className="h-px flex-1 bg-gradient-to-r from-base-content/10 to-transparent" />
          </div>

          <div className="bg-base-200/30 p-2 rounded-[2rem] border border-base-300/50 flex flex-col gap-1">
            <OptionItem
              id="clean"
              label="Clean Build"
              sublabel="--clean"
              checked={!!runConfig.clean}
              onChange={() => toggleOption("clean")}
              description="Forces the complete rebuild of the native application."
            />
            <OptionItem
              id="noWatch"
              label="No Watch"
              sublabel="--no-watch"
              checked={!!runConfig.noWatch}
              onChange={() => toggleOption("noWatch")}
              description="Changes in your code will not be reflected during the execution of this command."
            />
            <OptionItem
              id="noHmr"
              label="Disable HMR"
              sublabel="--no-hmr"
              checked={!!runConfig.noHmr}
              onChange={() => toggleOption("noHmr")}
              description="Disables Hot Module Replacement (HMR). When a change in the code is applied, CLI will transfer the modified files and restart the application."
            />
            <OptionItem
              id="force"
              label="Force Build"
              sublabel="--force"
              checked={!!runConfig.force}
              onChange={() => toggleOption("force")}
              description="Skips the application compatibility checks and forces 'npm i' to ensure all dependencies are installed."
            />
          </div>
        </div>

        {/* Mode Specific Options */}
        <div className="space-y-5">
          <div className="flex items-center gap-4 px-2">
            <label className="text-[11px] font-black uppercase tracking-[0.25em] text-base-content/30 whitespace-nowrap">
              Platform & Debug
            </label>
            <div className="h-px flex-1 bg-gradient-to-r from-base-content/10 to-transparent" />
          </div>

          <div className="bg-base-200/30 p-2 rounded-[2rem] border border-base-300/50 flex flex-col gap-1">
            {runConfig.action === "debug" && (
              <>
                <OptionItem
                  id="debugBrk"
                  label="Break at Start"
                  sublabel="--debug-brk"
                  checked={!!runConfig.debugBrk}
                  onChange={() => toggleOption("debugBrk")}
                  description="Prepares, builds and deploys the application package on a device/emulator, generates a link for Chrome Developer Tools and stops at the first code statement."
                />
                <OptionItem
                  id="start"
                  label="Attach Only"
                  sublabel="--start"
                  checked={!!runConfig.start}
                  onChange={() => toggleOption("start")}
                  description="Attaches the debug tools to a deployed and running app."
                />
              </>
            )}

            {runConfig.platform === "android" && (
              <OptionItem
                id="aab"
                label="Android Bundle"
                sublabel="--aab"
                checked={!!runConfig.aab}
                onChange={() => toggleOption("aab")}
                description="Specifies that the command will produce and deploy an Android App Bundle."
              />
            )}

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiClock className="w-5 h-5 text-primary/70" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-base-content/50">
                    Timeout (Seconds)
                  </span>
                </div>
              </div>
              <div className="relative group/input">
                <input
                  type="number"
                  placeholder="90"
                  className="input input-bordered w-full bg-base-100/50 border-base-300 text-base h-12 rounded-xl font-bold tracking-tight focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all"
                  value={runConfig.timeout || ""}
                  onChange={(e) =>
                    setRunConfig((prev) => ({
                      ...prev,
                      timeout: parseInt(e.target.value) || undefined,
                    }))
                  }
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-base-content/30 uppercase tracking-[0.2em] group-focus-within/input:text-primary transition-colors pointer-events-none">
                  SEC
                </div>
              </div>
              <p className="text-[11px] text-base-content/40 leading-relaxed px-1">
                Sets the number of seconds that the NativeScript CLI will wait
                for the emulator/device to boot. Default is 90 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Env Flags */}
        <div className="space-y-5">
          <div className="flex items-center gap-4 px-2">
            <label className="text-[11px] font-black uppercase tracking-[0.25em] text-base-content/30 whitespace-nowrap">
              Optimization Flags (--env.*)
            </label>
            <div className="h-px flex-1 bg-gradient-to-r from-base-content/10 to-transparent" />
          </div>

          <div className="bg-base-200/30 p-2 rounded-[2rem] border border-base-300/50 flex flex-col gap-1">
            <OptionItem
              id="uglify"
              label="Uglify"
              sublabel="--env.uglify"
              checked={!!runConfig.uglify}
              onChange={() => toggleOption("uglify")}
              description="Provides basic obfuscation and smaller app size."
            />

            <OptionItem
              id="aot"
              label="AOT"
              sublabel="--env.aot"
              checked={!!runConfig.aot}
              disabled={!isAngular}
              onChange={() => toggleOption("aot")}
              description="Creates Ahead-Of-Time build (Angular only)."
            />

            <OptionItem
              id="sourceMap"
              label="SourceMap"
              sublabel="--env.sourceMap"
              checked={!!runConfig.sourceMap}
              onChange={() => toggleOption("sourceMap")}
              description="Creates inline source maps."
            />

            <OptionItem
              id="report"
              label="Report"
              sublabel="--env.report"
              checked={!!runConfig.report}
              onChange={() => toggleOption("report")}
              description="Creates a Webpack report inside a 'report' folder in the root folder."
            />

            {runConfig.platform === "android" && (
              <>
                <OptionItem
                  id="snapshot"
                  label="Snapshot"
                  sublabel="--env.snapshot"
                  checked={!!runConfig.snapshot}
                  onChange={() => toggleOption("snapshot")}
                  description="Creates a V8 Snapshot decreasing the app start time (only for release builds for Android)."
                />

                <OptionItem
                  id="v8cache"
                  label="V8 Cache"
                  sublabel="--env.v8cache"
                  checked={!!runConfig.v8cache}
                  onChange={() => toggleOption("v8cache")}
                  description="Compiles the static assets into .so files allowing the native build to split them per architecture."
                />
              </>
            )}
          </div>
        </div>

        <div className="form-control px-2 space-y-4">
          <div className="flex items-center gap-4 px-2">
            <label className="text-[11px] font-black uppercase tracking-[0.25em] text-base-content/30 whitespace-nowrap">
              Additional Options
            </label>
            <div className="h-px flex-1 bg-gradient-to-r from-base-content/10 to-transparent" />
          </div>
          <div className="relative group/input">
            <input
              type="text"
              placeholder="e.g. --no-hmr --env.customFlag"
              className="input input-bordered w-full bg-base-200/40 border-base-300/50 text-base h-16 rounded-[1.5rem] font-semibold tracking-tight focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all pl-14"
              value={runConfig.additionalOptions || ""}
              onChange={(e) =>
                setRunConfig((prev) => ({
                  ...prev,
                  additionalOptions: e.target.value,
                }))
              }
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2">
              <FiZap className="w-6 h-6 text-base-content/20 group-focus-within/input:text-primary transition-colors" />
            </div>
          </div>
          <p className="text-[11px] text-base-content/40 leading-relaxed px-2">
            Specify additional flags that the bundler or CLI may process. Can be
            passed multiple times.
          </p>
        </div>
      </div>
    </div>
  );
}
