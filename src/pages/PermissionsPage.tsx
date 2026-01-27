import { FiKey, FiShield } from "react-icons/fi";

export function PermissionsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="text-3xl font-extrabold">Permissions</div>
          <div className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Manage Android & iOS application permissions
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <FiShield className="h-5 w-5" />
              <h3 className="font-bold uppercase tracking-wider text-xs">Android Manifest</h3>
            </div>
            <div className="py-12 text-center opacity-40 italic text-sm">
              Permission editor coming soon
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4 text-secondary">
              <FiKey className="h-5 w-5" />
              <h3 className="font-bold uppercase tracking-wider text-xs">iOS Info.plist</h3>
            </div>
            <div className="py-12 text-center opacity-40 italic text-sm">
              Usage descriptions editor coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
