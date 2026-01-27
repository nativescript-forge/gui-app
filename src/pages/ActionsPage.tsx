import { useMemo } from "react";
import type { ProjectRow } from "../app/types";
import { FiCopy, FiPlay } from "react-icons/fi";

type ActionsPageProps = {
  projects: ProjectRow[];
  projectPath: string | null;
  setProjectPath: (projectPath: string | null) => void;
  running: boolean;
  logText: string;
  logFilter: "all" | "errors";
  setLogFilter: (filter: "all" | "errors") => void;
  onRunAction: (action: "run-android" | "run-ios" | "build") => void;
};

export function ActionsPage(props: ActionsPageProps) {
  const filteredLogLines = useMemo(() => {
    const lines = props.logText.split(/\r?\n/);
    if (props.logFilter === "all") return lines;
    const re = /(error|failed|exception|traceback)/i;
    return lines.filter((l) => re.test(l));
  }, [props.logFilter, props.logText]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-bold">Forge Actions</div>
          <div className="text-sm opacity-70">Run NativeScript CLI commands and inspect logs</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select select-bordered select-sm max-w-[70vw]"
            value={props.projectPath ?? ""}
            onChange={(e) => props.setProjectPath(e.target.value || null)}
          >
            {props.projects.length === 0 ? <option value="">No projects</option> : null}
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

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-sm lg:col-span-1">
          <div className="card-body">
            <div className="font-semibold">Log Viewer</div>
            <div className="text-sm opacity-70">Filter errors and copy output</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="join">
                <button
                  type="button"
                  className={`btn btn-sm join-item ${props.logFilter === "all" ? "btn-active" : ""}`}
                  onClick={() => props.setLogFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn btn-sm join-item ${props.logFilter === "errors" ? "btn-active" : ""}`}
                  onClick={() => props.setLogFilter("errors")}
                >
                  Errors
                </button>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigator.clipboard.writeText(props.logText)}
                disabled={!props.logText}
              >
                <FiCopy className="h-4 w-4" />
                Copy
              </button>
            </div>

            {props.running ? (
              <div className="mt-4 flex items-center gap-3">
                <span className="loading loading-spinner loading-md" />
                <span className="text-sm opacity-70">Running command…</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm lg:col-span-2">
          <div className="card-body">
            <div className="mockup-code max-h-[55vh] overflow-auto">
              {filteredLogLines.length === 0 ? (
                <pre className="px-4">
                  <code>Logs will appear here…</code>
                </pre>
              ) : (
                filteredLogLines.map((line, idx) => {
                  const isError = /(error|failed|exception|traceback)/i.test(line);
                  return (
                    <pre key={idx} className={`px-4 ${isError ? "text-error" : ""}`}>
                      <code>{line || " "}</code>
                    </pre>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

