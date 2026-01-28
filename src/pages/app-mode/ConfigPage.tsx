import { FiSettings, FiSliders } from "react-icons/fi";

export function ConfigPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="text-3xl font-extrabold">Project Config</div>
          <div className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Modify nativescript.config.ts and app properties
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold opacity-70">App ID</span>
                </label>
                <input type="text" disabled placeholder="org.nativescript.app" className="input input-bordered w-full" />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold opacity-70">Version Name</span>
                </label>
                <input type="text" disabled placeholder="1.0.0" className="input input-bordered w-full" />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold opacity-70">Version Code</span>
                </label>
                <input type="number" disabled placeholder="1" className="input input-bordered w-full" />
              </div>
            </div>
            
            <div className="bg-base-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-base-100 shadow-inner mb-4">
                <FiSliders className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="font-bold">Advanced Configuration</h3>
              <p className="text-sm opacity-50 mt-2">
                Visual editor for nativescript.config.ts is currently in development.
              </p>
            </div>
          </div>
          
          <div className="card-actions justify-end mt-8 border-t border-base-200 pt-6">
            <button className="btn btn-primary" disabled>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
