import { FiMinus, FiCopy, FiSquare, FiX } from "react-icons/fi";

interface WindowControlsProps {
  handleMinimize: (e: React.MouseEvent) => void;
  handleMaximize: (e: React.MouseEvent) => void;
  handleClose: (e: React.MouseEvent) => void;
  isMaximized: boolean;
  maximizeDisabled?: boolean;
  minimizeDisabled?: boolean;
}

export function WindowControls({
  handleMinimize,
  handleMaximize,
  handleClose,
  isMaximized,
  maximizeDisabled = false,
  minimizeDisabled = false,
}: WindowControlsProps) {
  return (
    <div className="flex items-center h-full">
      <button
        onClick={handleMinimize}
        disabled={minimizeDisabled}
        className={`h-full px-4 transition-colors ${
          minimizeDisabled
            ? "opacity-20 cursor-not-allowed"
            : "hover:bg-white/10"
        }`}
      >
        <FiMinus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleMaximize}
        disabled={maximizeDisabled}
        className={`h-full px-4 transition-colors ${
          maximizeDisabled
            ? "opacity-20 cursor-not-allowed"
            : "hover:bg-white/10"
        }`}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <FiCopy className="w-3 h-3 rotate-180" />
        ) : (
          <FiSquare className="w-3 h-3" />
        )}
      </button>
      <button
        onClick={handleClose}
        className="h-full px-4 hover:bg-error/80 hover:text-white transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
}
