import { FiMinus, FiCopy, FiSquare, FiX } from "react-icons/fi";

interface WindowControlsProps {
  handleMinimize: (e: React.MouseEvent) => void;
  handleMaximize: (e: React.MouseEvent) => void;
  handleClose: (e: React.MouseEvent) => void;
  isMaximized: boolean;
}

export function WindowControls({
  handleMinimize,
  handleMaximize,
  handleClose,
  isMaximized,
}: WindowControlsProps) {
  return (
    <div className="flex items-center h-full">
      <button
        onClick={handleMinimize}
        className="h-full px-4 hover:bg-white/10 transition-colors"
      >
        <FiMinus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleMaximize}
        className="h-full px-4 hover:bg-white/10 transition-colors"
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
