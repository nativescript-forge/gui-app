import type { ProjectRow } from "../app/types";
import {
  FiActivity,
  FiArrowRight,
  FiFolderPlus,
  FiGrid,
  FiPlus,
  FiTerminal,
} from "react-icons/fi";

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
  return (
    <div className="mx-auto max-w-6xl">
      <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
        <div className="card-body p-10 md:p-14">
          <h1 className="card-title text-4xl md:text-6xl font-extrabold mb-4">
            Welcome to <span className="text-primary">NativeScript Forge</span>
          </h1>
          <p className="text-xl opacity-70 leading-relaxed mb-8 max-w-3xl">
            Your ultimate desktop companion for NativeScript development.
            Effortlessly manage projects, maintain toolchain health, and execute
            CLI actions through a refined, high-performance interface.
          </p>

          <div className="card-actions justify-start gap-4 mb-10">
            <button
              type="button"
              className="btn btn-primary btn-md md:btn-lg"
              onClick={props.onCreateProject}
            >
              <FiPlus className="h-5 w-5" />
              Create Project
            </button>
            <button
              type="button"
              className="btn btn-neutral btn-md md:btn-lg"
              onClick={props.onAddProject}
            >
              <FiFolderPlus className="h-5 w-5" />
              Add Existing
            </button>
            <button
              type="button"
              className="btn btn-outline btn-accent btn-md md:btn-lg"
              onClick={props.onOpenDoctor}
            >
              <FiActivity className="h-5 w-5" />
              Health Check
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-xl bg-base-100 text-primary">
                    <FiGrid className="h-6 w-6" />
                  </div>
                  <h2 className="card-title text-lg">Projects</h2>
                </div>
                <p className="text-sm opacity-60">
                  Centralized project management and discovery.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-xl bg-base-100 text-primary">
                    <FiActivity className="h-6 w-6" />
                  </div>
                  <h2 className="card-title text-lg">Doctor</h2>
                </div>
                <p className="text-sm opacity-60">
                  Validate Node, CLI, Java, and Android SDK health.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 sm:col-span-2 xl:col-span-1">
              <div className="card-body p-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-xl bg-base-100 text-primary">
                    <FiTerminal className="h-6 w-6" />
                  </div>
                  <h2 className="card-title text-lg">Actions</h2>
                </div>
                <p className="text-sm opacity-60">
                  Execute complex commands with real-time logging.
                </p>
              </div>
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {props.projects.slice(0, 4).map((p) => (
              <div
                key={p.path}
                className="card bg-base-100 border border-base-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => props.onOpenProject(p.path)}
              >
                <div className="card-body p-5">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="card-title text-base truncate">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      {p.framework ? (
                        <div className="badge badge-outline badge-sm opacity-70">
                          {p.framework}
                        </div>
                      ) : null}
                      {p.nativescript_version ? (
                        <div className="badge badge-primary badge-sm">
                          v{p.nativescript_version.replace(/[^0-9.]/g, "")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-50 font-mono truncate">
                    <FiFolderPlus className="h-3 w-3" />
                    {p.path}
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
