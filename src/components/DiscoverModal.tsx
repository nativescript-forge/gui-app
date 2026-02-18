import type { ProjectAnalysis, ProjectRow } from "../shared/types";
import type Database from "@tauri-apps/plugin-sql";
import { FiDownload, FiX, FiCpu, FiZap } from "react-icons/fi";
import { shortenPath } from "../shared/utils";

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
      <div className="modal-box max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Project discovery</div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={props.onClose}
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 text-sm opacity-70">
            Scan results show folders that look like NativeScript projects.
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <div>
            {props.loading ? (
              <div className="flex items-center gap-3">
                <span className="loading loading-spinner loading-md" />
                <span className="text-sm opacity-70">Scanning…</span>
              </div>
            ) : props.results.length === 0 ? (
              <div className="alert">
                <span>
                  No NativeScript projects found in the selected folder.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="sticky top-0 bg-base-100 z-10">Project</th>
                      <th className="hidden md:table-cell sticky top-0 bg-base-100 z-10 w-24">
                        Flavor
                      </th>
                      <th className="hidden md:table-cell sticky top-0 bg-base-100 z-10 w-28">
                        NS Version
                      </th>
                      <th className="sticky top-0 bg-base-100 z-10 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    {props.results.map((p) => {
                      const alreadySaved = props.projects.some(
                        (x) => x.path === p.path,
                      );
                      return (
                        <tr key={p.path}>
                          <td>
                            <div className="flex flex-col min-w-0">
                              <div
                                className="font-bold text-sm truncate"
                                title={p.name}
                              >
                                {p.name}
                              </div>
                              <div
                                className="text-[10px] opacity-50 truncate font-mono"
                                title={p.path}
                              >
                                {shortenPath(p.path, 2)}
                              </div>
                              {/* Mobile Info (Visible only on small screens) */}
                              <div className="flex md:hidden items-center gap-3 mt-1.5">
                                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider opacity-40">
                                  <FiCpu className="w-2.5 h-2.5" />
                                  {p.framework ?? "-"}
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider opacity-40">
                                  <FiZap className="w-2.5 h-2.5" />
                                  {p.nativescriptVersion ?? "-"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell">
                            {p.framework ?? "-"}
                          </td>
                          <td className="hidden md:table-cell">
                            {p.nativescriptVersion ?? "-"}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm min-w-[80px]"
                              disabled={alreadySaved || !props.db}
                              onClick={() => props.onImport(p)}
                            >
                              {alreadySaved ? (
                                "Saved"
                              ) : (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <FiDownload className="h-3.5 w-3.5" />
                                  <span>Import</span>
                                </div>
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
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={props.onClose}>
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
