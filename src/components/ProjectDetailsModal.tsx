import { useEffect, useState } from "react";
import {
  FiX,
  FiCpu,
  FiZap,
  FiPackage,
  FiShield,
  FiClock,
  FiCalendar,
  FiExternalLink,
  FiSearch,
} from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";
import { invoke } from "@tauri-apps/api/core";
import type { ProjectRow } from "../app/types";
import { parsePlatforms } from "../app/platforms";

type ProjectDetailsModalProps = {
  project: ProjectRow | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFolder: (path: string) => void;
};

export function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  onOpenFolder,
}: ProjectDetailsModalProps) {
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    if (project && isOpen) {
      async function loadIcon() {
        try {
          const iconData = await invoke<string>("get_project_icon", {
            path: project!.path,
          });
          setIcon(iconData);
        } catch (err) {
          setIcon(null);
        }
      }
      loadIcon();
    } else {
      setIcon(null);
    }
  }, [project?.path, isOpen]);

  if (!project || !isOpen) return null;

  const platforms = parsePlatforms(project.platforms);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-base-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center overflow-hidden border border-base-300">
              {icon ? (
                <img
                  src={icon}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiPackage className="w-6 h-6 opacity-20" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold leading-none">{project.name}</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1 font-bold">
                Project Properties
              </p>
            </div>
          </div>
          <button className="btn btn-sm btn-ghost btn-circle" onClick={onClose}>
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Path Card */}
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 flex items-center gap-2">
                  <FiSearch className="h-3 w-3" /> Location
                </div>
                <button
                  className="btn btn-ghost btn-xs text-[10px] opacity-50 hover:opacity-100"
                  onClick={() => onOpenFolder(project.path)}
                >
                  <FiExternalLink className="h-3 w-3" /> Reveal in Explorer
                </button>
              </div>
              <div className="text-[11px] font-mono break-all opacity-60">
                {project.path}
              </div>
            </div>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Flavor
                </div>
                <div className="font-bold text-sm flex items-center gap-2">
                  <FiCpu className="h-3.5 w-3.5 opacity-50" />
                  {project.framework ?? "Unknown"}
                </div>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  NS Version
                </div>
                <div className="font-bold text-sm font-mono text-primary flex items-center gap-2">
                  <FiZap className="h-3.5 w-3.5 opacity-50" />
                  {project.nativescript_version ?? "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Plugins
                </div>
                <div className="font-bold text-lg flex items-center gap-2">
                  <FiPackage className="h-4 w-4 text-primary" />
                  {project.plugins_count ?? 0}
                </div>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Permissions
                </div>
                <div className="font-bold text-lg flex items-center gap-2">
                  <FiShield className="h-4 w-4 text-primary" />
                  {project.permissions_count ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Version
                </div>
                <div className="font-bold text-sm">
                  {project.version_name ?? "1.0.0"} (
                  {project.version_code ?? "1"})
                </div>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  SDK (Min / Target)
                </div>
                <div className="font-bold text-sm">
                  {project.min_sdk ?? "N/A"} / {project.target_sdk ?? "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">
                Target Platforms
              </div>
              <div className="flex gap-2">
                {platforms.length === 0 ? (
                  <span className="text-xs opacity-50 italic">
                    No platforms configured
                  </span>
                ) : (
                  platforms.map((plat) => {
                    const isAndroid = plat.toLowerCase().includes("android");
                    const isIOS = plat.toLowerCase().includes("ios");
                    return (
                      <div
                        key={plat}
                        className="flex items-center gap-2 bg-base-200 px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        {isAndroid && <FaAndroid className="h-3.5 w-3.5" />}
                        {isIOS && <FaApple className="h-3.5 w-3.5" />}
                        {plat}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-base-200/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="opacity-50 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <FiClock className="h-3 w-3" /> Last Opened
              </span>
              <span className="font-medium">
                {project.last_opened
                  ? new Date(project.last_opened).toLocaleString()
                  : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="opacity-50 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <FiCalendar className="h-3 w-3" /> Created Date
              </span>
              <span className="font-medium">
                {project.created_at
                  ? new Date(project.created_at * 1000).toLocaleString()
                  : "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-200 bg-base-100 flex justify-end">
          <button className="btn btn-neutral btn-sm px-6" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
}
