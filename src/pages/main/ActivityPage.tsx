import { useEffect, useState } from "react";
import {
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiSearch,
  FiFilter,
  FiActivity as FiAction,
  FiSettings,
  FiPlus,
  FiPackage,
  FiChevronDown,
} from "react-icons/fi";
import Database from "@tauri-apps/plugin-sql";
import type { ActivityLog } from "../../app/types";

type ActivityPageProps = {
  db: Database | null;
  lastActivityTime?: number;
};

export function ActivityPage(props: ActivityPageProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadActivities();
  }, [props.db, props.lastActivityTime]);

  const loadActivities = async () => {
    if (!props.db) return;
    try {
      const logs = await props.db.select<ActivityLog[]>(
        "SELECT * FROM activity_logs ORDER BY timestamp DESC",
      );
      setActivities(logs);
    } catch (err) {
      console.error("Failed to load activities:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "system":
        return <FiActivity className="text-blue-500" />;
      case "build":
        return <FiPackage className="text-purple-500" />;
      case "run":
        return <FiAction className="text-green-500" />;
      case "create-project":
        return <FiPlus className="text-yellow-500" />;
      case "project":
        return <FiSettings className="text-orange-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <div className="badge badge-success badge-sm gap-1">
            <FiCheckCircle className="w-3 h-3" /> success
          </div>
        );
      case "error":
        return (
          <div className="badge badge-error badge-sm gap-1">
            <FiAlertCircle className="w-3 h-3" /> error
          </div>
        );
      default:
        return (
          <div className="badge badge-ghost badge-sm gap-1">
            <FiInfo className="w-3 h-3" /> info
          </div>
        );
    }
  };

  const filteredActivities = activities.filter((a) => {
    const matchesFilter = filter === "all" || a.activity_type === filter;
    const matchesSearch =
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.activity_type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FiActivity className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Activity Log</h1>
          </div>
          <p className="opacity-50 text-sm ml-11">
            Monitoring and history of your NativeScript forge activities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="dropdown">
            <div
              tabIndex={0}
              role="button"
              className="select select-bordered select-sm pl-9 pr-8 flex items-center bg-base-100 rounded-xl min-w-[160px] relative font-medium"
            >
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 w-3.5 h-3.5" />
              <span className="truncate">
                {filter === "all"
                  ? "All Activities"
                  : filter === "system"
                    ? "Health Checks"
                    : filter === "build"
                      ? "Builds"
                      : filter === "run"
                        ? "App Runs"
                        : filter === "create-project"
                          ? "Creation"
                          : filter === "project"
                            ? "Management"
                            : "All Activities"}
              </span>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 w-3.5 h-3.5" />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[100] menu p-2 shadow-2xl bg-base-100 border border-base-200 rounded-xl w-52 mt-2"
            >
              <li>
                <button
                  onClick={() => setFilter("all")}
                  className={filter === "all" ? "active" : ""}
                >
                  All Activities
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilter("system")}
                  className={filter === "system" ? "active" : ""}
                >
                  Health Checks
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilter("build")}
                  className={filter === "build" ? "active" : ""}
                >
                  Builds
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilter("run")}
                  className={filter === "run" ? "active" : ""}
                >
                  App Runs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilter("create-project")}
                  className={filter === "create-project" ? "active" : ""}
                >
                  Creation
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilter("project")}
                  className={filter === "project" ? "active" : ""}
                >
                  Management
                </button>
              </li>
            </ul>
          </div>

          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity z-10 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              className="input input-bordered input-sm pl-10 focus:outline-none focus:border-primary bg-base-100 rounded-xl w-full md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary (Optional but nice) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
            Total Logs
          </div>
          <div className="text-2xl font-black">{activities.length}</div>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
            Success
          </div>
          <div className="text-2xl font-black text-success">
            {activities.filter((a) => a.status === "success").length}
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
            Errors
          </div>
          <div className="text-2xl font-black text-error">
            {activities.filter((a) => a.status === "error").length}
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
            Last Updated
          </div>
          <div className="text-xs font-bold opacity-70 mt-2">
            {activities.length > 0
              ? new Date(activities[0].timestamp).toLocaleTimeString()
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-200">
                <th className="bg-transparent text-[10px] uppercase tracking-widest font-bold opacity-50 py-4 pl-6">
                  Event
                </th>
                <th className="bg-transparent text-[10px] uppercase tracking-widest font-bold opacity-50 py-4">
                  Description
                </th>
                <th className="bg-transparent text-[10px] uppercase tracking-widest font-bold opacity-50 py-4">
                  Status
                </th>
                <th className="bg-transparent text-[10px] uppercase tracking-widest font-bold opacity-50 py-4 pr-6">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-base-200/30 transition-colors group"
                  >
                    <td className="pl-6">
                      <div className="p-2.5 rounded-xl bg-base-200 w-fit group-hover:bg-base-100 transition-colors">
                        {getIcon(log.activity_type)}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm text-base-content/90">
                          {log.description}
                        </span>
                        {log.metadata && (
                          <div className="group/meta relative">
                            <span className="text-[10px] opacity-40 font-mono block truncate max-w-md cursor-help">
                              {typeof log.metadata === "string"
                                ? log.metadata
                                : JSON.stringify(log.metadata)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td className="pr-6">
                      <div className="flex flex-col text-right md:text-left">
                        <span className="text-xs font-bold opacity-70">
                          {new Date(log.timestamp).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <span className="text-[10px] opacity-40 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-32 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto">
                      <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mb-4">
                        <FiActivity className="w-10 h-10 opacity-20" />
                      </div>
                      <h3 className="text-lg font-bold opacity-40">
                        No activities found
                      </h3>
                      <p className="text-sm opacity-30 mt-1">
                        Try adjusting your filters or search terms to find what
                        you're looking for.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
