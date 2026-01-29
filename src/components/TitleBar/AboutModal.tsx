interface AboutModalProps {
  show: boolean;
  onClose: () => void;
  brandIconSrc: string;
  appInfo: { name: string; version: string };
}

export function AboutModal({
  show,
  onClose,
  brandIconSrc,
  appInfo,
}: AboutModalProps) {
  if (!show) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-[#1e1e1e] border border-white/10 max-w-sm">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center p-4 border border-white/5">
            <img
              src={brandIconSrc}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-bold text-xl tracking-tight">{appInfo.name}</h3>
            <p className="text-xs opacity-40 mt-1 uppercase tracking-widest font-semibold">
              Version {appInfo.version}
            </p>

            <div className="mt-6 space-y-2">
              <p className="text-sm opacity-80">
                A professional IDE for NativeScript development.
              </p>
              <p className="text-[13px] opacity-50 italic">
                Created by Kang Cahya
              </p>
            </div>
          </div>
        </div>
        <div className="modal-action justify-center mt-8">
          <button
            className="btn btn-sm px-8 rounded-full bg-white/5 hover:bg-white/10 border-white/10 text-white font-normal"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      <div
        className="modal-backdrop bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <button className="cursor-default">close</button>
      </div>
    </div>
  );
}
