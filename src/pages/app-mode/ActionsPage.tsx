import { useMemo, useState } from "react";
import type { ProjectRow } from "../../app/types";
import { FiCopy, FiPlay, FiCheckCircle } from "react-icons/fi";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

type ActionsPageProps = {
  projects: ProjectRow[];
  projectPath: string | null;
  setProjectPath: (projectPath: string | null) => void;
  running: boolean;
  logText: string;
  logFilter: "all" | "errors";
  setLogFilter: (filter: "all" | "errors") => void;
  onRunAction: (
    action: "run-android" | "run-ios" | "debug-android" | "debug-ios" | "build",
    deviceId?: string
  ) => void;
};

export function ActionsPage(props: ActionsPageProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-bold">Forge Actions</div>
          <div className="text-sm opacity-70">
            Run NativeScript CLI commands and inspect logs
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select select-bordered select-sm max-w-[70vw]"
            value={props.projectPath ?? ""}
            onChange={(e) => props.setProjectPath(e.target.value || null)}
          >
            {props.projects.length === 0 ? (
              <option value="">No projects</option>
            ) : null}
            {props.projects.map((p) => (
              <option key={p.path} value={p.path}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="join">
            <button
              type="button"
              className="btn btn-outline btn-sm join-item"
              disabled={props.running || !props.projectPath}
              onClick={() => props.onRunAction("run-android")}
            >
              <FiPlay className="h-4 w-4" />
              ns run android
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm join-item hidden md:inline-flex"
              disabled={props.running || !props.projectPath}
              onClick={() => props.onRunAction("run-ios")}
            >
              <FiPlay className="h-4 w-4" />
              ns run ios
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm join-item"
              disabled={props.running || !props.projectPath}
              onClick={() => props.onRunAction("build")}
            >
              <FiPlay className="h-4 w-4" />
              ns build
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <FiPlay className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Ready to Run Commands</h3>
        <p className="text-sm opacity-60 max-w-md mb-6">
          Select a project and click one of the action buttons above. 
          The execution logs will appear in the global terminal at the bottom of the screen.
        </p>
        <div className="flex items-center gap-4 text-xs opacity-50">
          <div className="flex items-center gap-1">
            <kbd className="kbd kbd-xs">ns run android</kbd>
            <span>Run on Android device</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="kbd kbd-xs">ns build</kbd>
            <span>Build project</span>
          </div>
        </div>
      </div>
    </div>
  );
}
