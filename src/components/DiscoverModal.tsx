import type { ProjectAnalysis, ProjectRow } from "../app/types";
import type Database from "@tauri-apps/plugin-sql";
import { FiDownload, FiX } from "react-icons/fi";

type DiscoverModalProps = {
  open: boolean;
  loading: boolean;
  results: ProjectAnalysis[];
  projects: ProjectRow[];
  db: Database | null;
  onClose: () => void;
  onImport: (project: ProjectAnalysis) => Promise<void>;
};

export function DiscoverModal(props: DiscoverModalProps) {
  return (
    <dialog className="modal" open={props.open}>
      <div className="modal-box max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-semibold">Project discovery</div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={props.onClose}>
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 text-sm opacity-70">
          Scan results show folders that look like NativeScript projects.
        </div>

        <div className="mt-4">
          {props.loading ? (
            <div className="flex items-center gap-3">
              <span className="loading loading-spinner loading-md" />
              <span className="text-sm opacity-70">Scanning…</span>
            </div>
          ) : props.results.length === 0 ? (
            <div className="alert">
              <span>No NativeScript projects found in the selected folder.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th className="hidden md:table-cell">Framework</th>
                    <th className="hidden md:table-cell">NS</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {props.results.map((p) => {
                    const alreadySaved = props.projects.some((x) => x.path === p.path);
                    return (
                      <tr key={p.path}>
                        <td>
                          <div className="font-semibold truncate max-w-[52vw]">{p.name}</div>
                          <div className="text-xs opacity-70 truncate max-w-[52vw]">{p.path}</div>
                        </td>
                        <td className="hidden md:table-cell">{p.framework ?? "-"}</td>
                        <td className="hidden md:table-cell">{p.nativescriptVersion ?? "-"}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={alreadySaved || !props.db}
                            onClick={() => props.onImport(p)}
                          >
                            {alreadySaved ? (
                              "Saved"
                            ) : (
                              <>
                                <FiDownload className="h-4 w-4" />
                                Import
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={props.onClose}>
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
