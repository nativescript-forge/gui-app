import { FiPackage, FiSearch } from "react-icons/fi";

export function PluginsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="text-3xl font-extrabold">Plugins</div>
          <div className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Install and manage NativeScript plugins
          </div>
        </div>
        <div className="join">
          <input
            className="input input-bordered join-item input-sm"
            placeholder="Search npm..."
          />
          <button className="btn btn-primary join-item btn-sm">
            <FiSearch className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body py-20 text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-base-200 opacity-50">
            <FiPackage className="h-12 w-12" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold">Plugin Manager Coming Soon</h3>
            <p className="text-sm opacity-50 mt-2">
              We are working on a powerful interface to browse, install, and update
              NativeScript plugins directly from npm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
