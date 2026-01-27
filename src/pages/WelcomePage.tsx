import type { ProjectRow } from "../app/types";
import { parsePlatforms } from "../app/platforms";
import {
  FiArrowRight,
  FiCalendar,
  FiCpu,
  FiExternalLink,
  FiFolderPlus,
  FiGithub,
  FiGlobe,
  FiGrid,
  FiMessageSquare,
  FiPlus,
  FiSmartphone,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";

type WelcomePageProps = {
  logoSrc: string;
  projects: ProjectRow[];
  onAddProject: () => void;
  onCreateProject: () => void;
  onOpenDoctor: () => void;
  onViewAllProjects: () => void;
  onOpenProject: (projectPath: string) => void;
};

export function WelcomePage(props: WelcomePageProps) {
  const renderPlatforms = (platformsStr: string | null) => {
    const platforms = parsePlatforms(platformsStr);
    if (platforms.length === 0) return "No platforms";

    return (
      <div className="flex gap-2">
        {platforms.map((plat) => {
          const isAndroid = plat.toLowerCase().includes("android");
          const isIOS = plat.toLowerCase().includes("ios");
          return (
            <div
              key={plat}
              className="flex items-center gap-1 bg-base-300/50 px-1.5 py-0.5 rounded text-[10px] font-medium"
            >
              {isAndroid && <FaAndroid className="h-2.5 w-2.5" />}
              {isIOS && <FaApple className="h-2.5 w-2.5" />}
              {plat}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="card bg-base-100 shadow-none border border-base-200 overflow-hidden">
        <div className="card-body p-6 md:p-14">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Welcome to <br className="sm:hidden" />
            <span className="text-primary">NativeScript Forge</span>
          </h1>
          <p className="text-lg md:text-xl opacity-70 leading-relaxed mb-8 max-w-3xl">
            Your ultimate desktop companion for NativeScript development.
            Effortlessly manage projects, maintain toolchain health, and execute
            CLI actions through a refined, high-performance interface.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap justify-start gap-3 mb-10">
            <button
              type="button"
              className="btn btn-primary btn-md md:btn-lg flex-1 sm:flex-none"
              onClick={props.onCreateProject}
            >
              <FiPlus className="h-5 w-5" />
              Create Project
            </button>
            <button
              type="button"
              className="btn btn-neutral btn-md md:btn-lg flex-1 sm:flex-none"
              onClick={props.onAddProject}
            >
              <FiFolderPlus className="h-5 w-5" />
              Add Existing
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-base-200">
            <a
              href="https://nativescript.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <FiGlobe className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1">
                  Official Site{" "}
                  <FiExternalLink className="h-3 w-3 opacity-50" />
                </div>
                <div className="text-[10px] opacity-50 truncate">
                  nativescript.org
                </div>
              </div>
            </a>

            <a
              href="https://github.com/dyazincahya/awesome-nativescript"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-base-content/10 text-base-content group-hover:bg-base-content group-hover:text-base-100 transition-all">
                <FiGithub className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1">
                  Awesome Repo <FiExternalLink className="h-3 w-3 opacity-50" />
                </div>
                <div className="text-[10px] opacity-50 truncate">
                  GitHub Resources
                </div>
              </div>
            </a>

            <a
              href="https://nativescript.org/discord"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <FiMessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1">
                  Community <FiExternalLink className="h-3 w-3 opacity-50" />
                </div>
                <div className="text-[10px] opacity-50 truncate">
                  Discord Server
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-bold">Recent Projects</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-2"
            onClick={props.onViewAllProjects}
          >
            View Library
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>

        {props.projects.length === 0 ? (
          <div className="alert bg-base-100 border-base-200 rounded-box p-6 shadow-sm flex flex-col items-center py-12 text-center">
            <FiFolderPlus className="h-12 w-12 opacity-10 mb-4" />
            <span className="opacity-60 italic text-sm">
              Your project library is empty. Click "Add Project" to begin your
              journey.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {props.projects.slice(0, 5).map((p) => (
              <div
                key={p.path}
                className="group card bg-base-100 border border-base-200 hover:border-primary/50 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                onClick={() => props.onOpenProject(p.path)}
              >
                <div className="card-body p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Left side: Basic info */}
                    <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-base-200 group-hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FiGrid className="h-5 w-5" />
                        </div>
                        <h3 className="card-title text-lg group-hover:text-primary transition-colors">
                          {p.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-60 font-mono truncate">
                        <FiFolderPlus className="h-3.5 w-3.5" />
                        {p.path}
                      </div>
                    </div>

                    {/* Right side: Detailed info */}
                    <div className="p-5 md:w-80 bg-base-200/30 flex flex-col justify-center gap-4">
                      <div className="flex flex-wrap gap-2">
                        {p.framework && (
                          <div className="badge badge-neutral gap-1.5 py-1 h-auto min-h-[0.25rem]">
                            <FiCpu className="h-3 w-3 shrink-0" />
                            <span className="leading-tight">{p.framework}</span>
                          </div>
                        )}
                        {p.nativescript_version && (
                          <div className="badge badge-primary gap-1.5 py-1 h-auto min-h-[0.25rem]">
                            <span className="text-[10px] opacity-70 font-bold shrink-0">
                              CLI
                            </span>
                            <span className="leading-tight">
                              v{p.nativescript_version.replace(/[^0-9.]/g, "")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs opacity-60">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <FiSmartphone className="h-3.5 w-3.5 shrink-0" />
                          {renderPlatforms(p.platforms)}
                        </div>
                        {p.last_opened && (
                          <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
                            <FiCalendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(p.last_opened).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
