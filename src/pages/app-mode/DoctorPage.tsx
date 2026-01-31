import type { DoctorCheck } from "../../app/types";
import { FiPlay } from "react-icons/fi";

type DoctorPageProps = {
  checks: DoctorCheck[] | null;
  loading: boolean;
  onRunChecks: () => void;
};

function statusBadge(status: DoctorCheck["status"]) {
  if (status === "ok") return <span className="badge badge-success">OK</span>;
  if (status === "warning") return <span className="badge badge-warning">Warning</span>;
  if (status === "error") return <span className="badge badge-error">Error</span>;
  return <span className="badge badge-ghost">Skip</span>;
}

export function DoctorPage(props: DoctorPageProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="text-3xl font-extrabold">Forge Doctor</div>
          <div className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Check your development toolchain health
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={props.onRunChecks}
          disabled={props.loading}
        >
          <FiPlay className="h-4 w-4" />
          {props.loading ? "Checking…" : "Run Checks"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {!props.checks ? (
          <div className="alert">
            <span>Click “Run Checks” to start.</span>
          </div>
        ) : (
          props.checks.map((c) => (
            <div key={c.id} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{c.label}</div>
                      {statusBadge(c.status)}
                    </div>
                    <div className="text-sm opacity-70 mt-1">{c.summary}</div>
                  </div>
                </div>

                {(c.details || c.hint) && (
                  <div className="mt-3 space-y-2">
                    {c.hint ? (
                      <div className="alert alert-warning">
                        <span>{c.hint}</span>
                      </div>
                    ) : null}
                    {c.details ? (
                      <div className="mockup-code">
                        <pre className="px-4">
                          <code>{c.details}</code>
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

