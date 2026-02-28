import React from "react";
import { FaCopy, FaCheck } from "react-icons/fa";

interface CodeBlockProps {
  code: string;
  compact?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  compact = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group ${compact ? "mt-1.5" : "mt-4"}`}>
      <div
        className={`absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity`}
      >
        <button
          onClick={copyToClipboard}
          className={`btn btn-square ${compact ? "btn-xs" : "btn-sm"} btn-ghost bg-base-300/50 backdrop-blur-sm`}
          title="Copy to clipboard"
        >
          {copied ? <FaCheck className="text-success" /> : <FaCopy />}
        </button>
      </div>
      <pre
        className={`bg-[#0f1115] text-white ${compact ? "p-3 text-xs" : "p-6 text-sm"} rounded-xl overflow-x-auto font-mono leading-relaxed border border-white/5 shadow-2xl`}
      >
        <span className="opacity-40 mr-2 select-none">$</span>
        <code>{code}</code>
      </pre>
    </div>
  );
};
