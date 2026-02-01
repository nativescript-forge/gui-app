import { FiGithub, FiGlobe } from "react-icons/fi";

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
      <div className="modal-box bg-base-100 border border-base-300 max-w-sm text-base-content">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-base-200/50 flex items-center justify-center p-4 border border-base-300">
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
                Visual toolkit for NativeScript developers
              </p>
              <p className="text-[13px] opacity-50 italic">
                Created by Kang Cahya
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <a
                  href="https://www.kang-cahya.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] opacity-50 hover:opacity-100 transition-opacity"
                  title="Web / Blog"
                >
                  <FiGlobe className="w-3.5 h-3.5" />
                  <span>kang-cahya.com</span>
                </a>
                <a
                  href="https://github.com/dyazincahya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] opacity-50 hover:opacity-100 transition-opacity"
                  title="GitHub"
                >
                  <FiGithub className="w-3.5 h-3.5" />
                  <span>dyazincahya</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-action justify-center mt-8">
          <button
            className="btn btn-sm btn-primary px-8 rounded-full font-normal"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      <div
        className="modal-backdrop bg-base-900/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <button className="cursor-default">close</button>
      </div>
    </div>
  );
}
