import {
  FiPackage,
  FiDownload,
  FiCheckCircle,
  FiExternalLink,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";
import { cleanDescription } from "../../../shared/utils";

interface Plugin {
  name: string;
  packageName: string;
  description: string;
  url: string;
}

interface MarketPluginsListProps {
  plugins: Plugin[];
  installedPackages: Record<string, string>;
  processingPlugin: string | null;
  isRunning: boolean;
  onInstall: (name: string) => void;
  onUninstall: (name: string) => void;
}

export function MarketPluginsList({
  plugins,
  installedPackages,
  processingPlugin,
  isRunning,
  onInstall,
  onUninstall,
}: MarketPluginsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plugins.map((plugin) => {
        const isInstalled = Object.keys(installedPackages).some((name) => {
          const installed = name.toLowerCase();
          const pkgName = plugin.packageName.toLowerCase();

          return (
            installed === pkgName ||
            installed === pkgName.replace("nativescript-", "@nativescript/") ||
            pkgName === installed.replace("nativescript-", "@nativescript/") ||
            // Handle scoped packages
            installed.endsWith(`/${pkgName}`) ||
            pkgName.endsWith(`/${installed}`)
          );
        });
        const isCurrentProcessing = processingPlugin === plugin.packageName;

        return (
          <div
            key={plugin.url}
            className="group card bg-base-100 border border-base-200 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="card-body p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {plugin.name}
                    </h3>
                    {isInstalled && (
                      <div
                        className="tooltip tooltip-top"
                        data-tip="Already installed"
                      >
                        <FiCheckCircle className="w-4 h-4 text-success" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm opacity-60 line-clamp-2 min-h-[2.5rem]">
                    {cleanDescription(plugin.description)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border bg-red-500/10 text-red-500 border-red-500/20">
                    <FiPackage className="w-3 h-3" />
                    Market
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[9px] font-bold uppercase tracking-tighter">
                    <FiAlertCircle className="w-2.5 h-2.5" />
                    Uncurated
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-base-200 pt-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold opacity-30 uppercase">
                    Package
                  </span>
                  <span className="text-[11px] font-mono font-bold opacity-60">
                    {plugin.packageName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={plugin.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm btn-square opacity-40 hover:opacity-100"
                    title="View Source"
                  >
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() =>
                      isInstalled
                        ? onUninstall(plugin.packageName)
                        : onInstall(plugin.packageName)
                    }
                    disabled={isRunning}
                    className={`btn btn-sm px-4 rounded-lg transition-all ${
                      isInstalled
                        ? "btn-ghost text-error hover:bg-error/10"
                        : "btn-primary group-hover:shadow-lg group-hover:shadow-primary/20"
                    }`}
                  >
                    {isCurrentProcessing && isRunning ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : isInstalled ? (
                      <>
                        <FiTrash2 className="w-3 h-3 mr-1" /> Uninstall
                      </>
                    ) : (
                      <>
                        <FiDownload className="w-3 h-3 mr-1" /> Install
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
