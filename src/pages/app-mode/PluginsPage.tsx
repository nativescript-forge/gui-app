import { useState, useEffect, useMemo } from "react";
import {
  FiPackage,
  FiSearch,
  FiRefreshCw,
  FiTrash2,
  FiInfo,
  FiAlertCircle,
  FiShield,
  FiLayout,
  FiCpu,
  FiGlobe,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
import { AwesomePluginsList } from "./plugins/AwesomePluginsList";
import { MarketPluginsList } from "./plugins/MarketPluginsList";
import { NpmPluginsList } from "./plugins/NpmPluginsList";

interface AwesomePlugin {
  name: string;
  url: string;
  description: string;
  top: string;
  sub: string;
  path: string;
  domain: string;
  addedAt: string;
  meta?: {
    authorName?: string;
    authorUrl?: string;
  };
}

interface Plugin extends AwesomePlugin {
  packageName: string;
  category: string;
}

interface InstalledPlugin {
  name: string;
  version: string;
  type: "plugin" | "common module";
  source: "Dependencies" | "Dev Dependencies";
}

const DATA_URL =
  "https://dyazincahya.github.io/awesome-nativescript/assets/data.json";
const MARKET_API_URL = "https://market.nativescript.org/api/plugins.json";

/**
 * Helper to guess NPM package name from various URL patterns
 */
const extractPackageName = (item: AwesomePlugin): string => {
  const url = item.url.toLowerCase().trim();
  const name = item.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  // Pattern 1: NStudio Plugins (plugins.nstudio.io/name)
  if (url.includes("plugins.nstudio.io")) {
    const parts = url.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return `@nstudio/${lastPart}`;
  }

  // Pattern 2: GitHub with /packages/ (monorepo)
  if (url.includes("github.com") && url.includes("/packages/")) {
    const ownerMatch = url.match(/github\.com\/([^/]+)/);
    const packageMatch = url.match(/\/packages\/([^/]+)/);
    if (ownerMatch && packageMatch) {
      return `@${ownerMatch[1]}/${packageMatch[1]}`;
    }
  }

  // Pattern 3: GitHub standard repo
  if (url.includes("github.com")) {
    const parts = url.split("/").filter(Boolean);
    const owner = parts[parts.indexOf("github.com") + 1];
    const repo = parts[parts.indexOf("github.com") + 2];

    if (owner && repo) {
      if (owner === "nstudio") return `@nstudio/${repo}`;
      if (owner === "nativescript-community")
        return `@nativescript-community/${repo}`;
      if (owner === "nativescript") return `@nativescript/${repo}`;
      return repo;
    }
  }

  return name.startsWith("nativescript-") ? name : `nativescript-${name}`;
};

interface PluginsPageProps {
  projectPath: string | null;
  onInstall: (name: string) => void;
  onUninstall: (name: string) => void;
  isRunning: boolean;
}

export function PluginsPage({
  projectPath,
  onInstall,
  onUninstall,
  isRunning,
}: PluginsPageProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"marketplace" | "installed">(
    "marketplace",
  );
  const [pluginSource, setPluginSource] = useState<
    "awesome" | "market" | "npm"
  >("awesome");
  const [allMarketPlugins, setAllMarketPlugins] = useState<Plugin[]>([]);
  const [npmPlugins, setNpmPlugins] = useState<Plugin[]>([]);
  const [isSearchingNpm, setIsSearchingNpm] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [manualPackageName, setManualPackageName] = useState("");
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [pluginToUninstall, setPluginToUninstall] = useState<string | null>(
    null,
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Track which plugin is being processed
  const [processingPlugin, setProcessingPlugin] = useState<string | null>(null);
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>(
    [],
  );
  const [installedPackages, setInstalledPackages] = useState<
    Record<string, string>
  >({});
  const [installedSubTab, setInstalledSubTab] = useState<
    "plugins" | "common" | "dev"
  >("plugins");

  const fetchPlugins = async () => {
    setLoading(true);
    setError(null);
    try {
      const [awesomeRes, marketRes] = await Promise.all([
        fetch(DATA_URL),
        fetch(MARKET_API_URL),
      ]);

      if (!awesomeRes.ok) throw new Error("Failed to fetch awesome plugins");
      if (!marketRes.ok) throw new Error("Failed to fetch market plugins");

      const awesomeData = await awesomeRes.json();
      const marketData = await marketRes.json();

      // Process Awesome Plugins
      const awesomeItems = (awesomeData.items || [])
        .filter((item: AwesomePlugin) => item.top === "Plugins")
        .map((item: AwesomePlugin) => ({
          ...item,
          packageName: extractPackageName(item),
          category: item.sub.replace(" Plugins", ""),
        }))
        .sort((a: any, b: any) => {
          const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
          const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
          return dateB - dateA;
        });

      // Process Market Plugins (as uncurated/npm source)
      const marketItems: Plugin[] = (marketData || []).map((item: any) => ({
        name: item.name,
        packageName: item.name,
        description: item.description || "No description provided",
        url: item.links?.npm || `https://www.npmjs.com/package/${item.name}`,
        top: "Plugins",
        sub: "Market",
        category: "Market",
        domain: "market.nativescript.org",
        addedAt: item.date,
        meta: {
          authorName: item.publisher?.username || item.author?.name,
          authorUrl: item.links?.npm,
        },
      }));

      setPlugins(awesomeItems);
      setAllMarketPlugins(marketItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  const searchNpm = async (query: string) => {
    setIsSearchingNpm(true);

    if (!query || query.trim().length < 2) {
      setNpmPlugins([]);
      setIsSearchingNpm(false);
      return;
    }

    try {
      // Search NPM registry for NativeScript plugins
      // We append "nativescript" to the query to focus on NS plugins
      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(
          query + " nativescript",
        )}&size=30`,
      );

      if (!response.ok) throw new Error("NPM search failed");

      const data = await response.json();
      const results: Plugin[] = (data.objects || []).map((obj: any) => ({
        name: obj.package.name,
        packageName: obj.package.name,
        description: obj.package.description || "No description provided",
        url:
          obj.package.links.npm ||
          `https://www.npmjs.com/package/${obj.package.name}`,
        top: "Plugins",
        sub: "NPM",
        category: "NPM",
        domain: "npmjs.com",
        addedAt: obj.package.date,
        meta: {
          authorName:
            obj.package.publisher?.username || obj.package.author?.name,
          authorUrl: obj.package.links.npm,
        },
      }));

      setNpmPlugins(results);
    } catch (err) {
      console.error("NPM search error:", err);
      // Fallback to local search if NPM fails
      const q = query.toLowerCase();
      const filtered = allMarketPlugins
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.packageName.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q),
        )
        .slice(0, 50);
      setNpmPlugins(filtered);
    } finally {
      setIsSearchingNpm(false);
    }
  };

  useEffect(() => {
    if (pluginSource === "npm") {
      searchNpm(searchQuery);
    }
  }, [searchQuery, pluginSource, allMarketPlugins]);

  const scanPlugins = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const scannedPlugins = await invoke<InstalledPlugin[]>(
        "scan_ns_plugins",
        {
          projectPath,
        },
      );

      setInstalledPlugins(scannedPlugins);

      // Update legacy installedPackages for compatibility
      const allDeps: Record<string, string> = {};
      scannedPlugins.forEach((p) => {
        allDeps[p.name] = p.version;
      });
      setInstalledPackages(allDeps);
    } catch (err) {
      console.error("Failed to scan plugins:", err);
      setError("Failed to scan plugins: " + err);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledPlugins = async (forceScan = false) => {
    if (!projectPath) return;
    try {
      const configDir = await join(projectPath, ".nsforge", "configs");
      const pluginsJsonPath = await join(configDir, "plugins.json");

      if (!forceScan && (await exists(pluginsJsonPath))) {
        const content = await readTextFile(pluginsJsonPath);
        const data = JSON.parse(content);
        setInstalledPlugins(data);

        // Also update legacy installedPackages for compatibility
        const pkgPath = await join(projectPath, "package.json");
        const pkgContent = await readTextFile(pkgPath);
        const pkg = JSON.parse(pkgContent);
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
        };
        setInstalledPackages(allDeps);
      } else {
        await scanPlugins();
      }
    } catch (err) {
      console.error("Failed to load installed plugins:", err);
      await scanPlugins();
    }
  };

  const fetchAll = async () => {
    await Promise.all([fetchPlugins(), loadInstalledPlugins()]);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    // Add a small delay after command finishes to allow filesystem to sync
    const timer = setTimeout(() => {
      // If a command just finished, force a re-scan to get latest data
      loadInstalledPlugins(!isRunning);
    }, 500);
    return () => clearTimeout(timer);
  }, [projectPath, isRunning, activeTab]);

  // Reset processing plugin when isRunning becomes false
  useEffect(() => {
    if (!isRunning) {
      setProcessingPlugin(null);
    }
  }, [isRunning]);

  useEffect(() => {
    setCurrentPage(1);
    // Remove automatic search reset when switching tabs to allow searching in 'installed'
  }, [selectedCategory, pluginSource, activeTab]);

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(plugins.map((p) => p.category))),
    ].sort();
  }, [plugins]);

  const filteredMarketplace = useMemo(() => {
    if (pluginSource === "npm") {
      return npmPlugins;
    }

    if (pluginSource === "market") {
      return allMarketPlugins.filter((plugin) => {
        const matchesSearch =
          plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          plugin.packageName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });
    }

    return plugins.filter((plugin) => {
      const matchesSearch =
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.packageName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || plugin.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [
    pluginSource,
    plugins,
    npmPlugins,
    allMarketPlugins,
    searchQuery,
    selectedCategory,
  ]);

  const paginatedMarketplace = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMarketplace.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMarketplace, currentPage]);

  const totalPages = Math.ceil(filteredMarketplace.length / itemsPerPage);

  const installedPluginsList = useMemo(() => {
    let list = installedPlugins;
    if (installedSubTab === "plugins") {
      list = list.filter(
        (p) => p.type === "plugin" && p.source === "Dependencies",
      );
    } else if (installedSubTab === "common") {
      list = list.filter(
        (p) => p.type === "common module" && p.source === "Dependencies",
      );
    } else if (installedSubTab === "dev") {
      list = list.filter((p) => p.source === "Dev Dependencies");
    }

    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [installedPlugins, searchQuery, installedSubTab]);

  const handleInstall = (name: string) => {
    setProcessingPlugin(name);
    onInstall(name);
    setShowManualInstall(false);
    setManualPackageName("");
  };

  const handleUninstall = (name: string) => {
    setPluginToUninstall(name);
    setShowUninstallConfirm(true);
  };

  const confirmUninstall = () => {
    if (pluginToUninstall) {
      setProcessingPlugin(pluginToUninstall);
      onUninstall(pluginToUninstall);
      setShowUninstallConfirm(false);
      setPluginToUninstall(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes("ui")) return <FiLayout className="w-3 h-3" />;
    if (c.includes("ai") || c.includes("intelligence"))
      return <FiCpu className="w-3 h-3" />;
    if (c.includes("utility") || c.includes("storage"))
      return <FiPackage className="w-3 h-3" />;
    if (c.includes("media")) return <FiGlobe className="w-3 h-3" />;
    return <FiShield className="w-3 h-3" />;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold">Plugins</h2>
          <p className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Browse and manage NativeScript plugins
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowManualInstall(true)}
            className="btn btn-primary btn-outline btn-sm rounded-xl px-4 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Manual Install
          </button>
          <div className="tabs tabs-boxed bg-base-200/50 p-1 w-fit">
            <button
              className={`tab tab-sm md:tab-md px-6 rounded-lg transition-all mr-1 ${
                activeTab === "marketplace"
                  ? "tab-active !bg-primary !text-white"
                  : ""
              }`}
              onClick={() => setActiveTab("marketplace")}
            >
              Discover
            </button>
            <button
              className={`tab tab-sm md:tab-md px-6 rounded-lg transition-all ${
                activeTab === "installed"
                  ? "tab-active !bg-primary !text-white"
                  : ""
              }`}
              onClick={() => setActiveTab("installed")}
            >
              Installed ({installedPlugins.length})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-base-200/20 p-4 rounded-2xl border border-base-content/5 mb-8">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="flex-shrink-0">
            {activeTab === "marketplace" && (
              <div className="flex bg-base-200 p-1 rounded-xl w-full xl:w-auto overflow-x-auto">
                <button
                  onClick={() => setPluginSource("awesome")}
                  className={`flex-1 xl:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    pluginSource === "awesome"
                      ? "bg-base-100 shadow-sm text-primary"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  Awesome
                </button>
                <button
                  onClick={() => setPluginSource("market")}
                  className={`flex-1 xl:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    pluginSource === "market"
                      ? "bg-base-100 shadow-sm text-primary"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  Market
                </button>
                <button
                  onClick={() => setPluginSource("npm")}
                  className={`flex-1 xl:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    pluginSource === "npm"
                      ? "bg-base-100 shadow-sm text-primary"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  NPM
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto">
            {activeTab === "marketplace" && pluginSource === "awesome" && (
              <select
                className="select select-bordered select-sm rounded-xl bg-base-100 focus:border-primary/50 transition-all font-bold min-w-[130px] flex-shrink"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() =>
                activeTab === "installed"
                  ? loadInstalledPlugins(true)
                  : fetchAll()
              }
              disabled={loading}
              className="btn btn-ghost btn-sm btn-square rounded-xl bg-base-100 flex-shrink-0"
              title="Refresh all data"
            >
              <FiRefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            <div className="relative flex-1 xl:w-72 min-w-0">
              {loading || isSearchingNpm ? (
                <span className="loading loading-spinner loading-xs absolute left-3 top-1/2 -translate-y-1/2 opacity-30"></span>
              ) : (
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
              )}
              <input
                className="input input-bordered input-sm w-full pl-10 bg-base-100 rounded-xl focus:border-primary/50 transition-all"
                placeholder={
                  activeTab === "marketplace"
                    ? pluginSource === "awesome"
                      ? "Search awesome plugins..."
                      : "Search NativeScript market..."
                    : "Search installed plugins..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {activeTab === "marketplace" ? (
        <>
          {error ? (
            <div className="alert alert-error mb-8 rounded-2xl shadow-lg shadow-error/10">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button onClick={fetchPlugins} className="btn btn-sm btn-ghost">
                Retry
              </button>
            </div>
          ) : pluginSource === "awesome" ? (
            <div className="mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
              <FiShield className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm opacity-70">
                <p>
                  Source: <strong>Awesome NativeScript</strong>. Plugins in this
                  list are curated and verified for quality by the community.
                </p>
                <p className="mt-1 text-xs italic">
                  If you encounter any issues installing these curated plugins,
                  please report them by creating a new issue on the{" "}
                  <a
                    href="https://github.com/dyazincahya/awesome-nativescript"
                    target="_blank"
                    rel="noreferrer"
                    className="link link-primary font-bold"
                  >
                    Awesome NativeScript GitHub repository
                  </a>
                  .
                </p>
              </div>
            </div>
          ) : pluginSource === "market" ? (
            <div className="mb-8 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 flex items-start gap-3">
              <FiAlertCircle className="text-orange-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm opacity-70">
                <p>
                  Source: <strong>NativeScript Market</strong>. These plugins
                  are fetched from the official market and are{" "}
                  <strong>uncurated</strong>. Use with caution.
                </p>
                <p className="mt-1 text-xs italic">
                  Visit the official marketplace at{" "}
                  <a
                    href="https://market.nativescript.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="link link-primary font-bold"
                  >
                    market.nativescript.org
                  </a>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 flex items-center gap-3">
              <FiPackage className="text-red-500 w-5 h-5 flex-shrink-0" />
              <p className="text-sm opacity-70">
                Source: <strong>NPM Registry</strong>. Searching for
                NativeScript plugins directly on NPM.
              </p>
            </div>
          )}

          {loading ||
          (pluginSource === "npm" &&
            isSearchingNpm &&
            npmPlugins.length === 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="card bg-base-100 border border-base-200 h-48 animate-pulse"
                >
                  <div className="card-body">
                    <div className="h-6 bg-base-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-base-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-base-200 rounded w-3/4 mb-4"></div>
                    <div className="mt-auto h-8 bg-base-200 rounded w-1/4 self-end"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {paginatedMarketplace.length > 0 ? (
                <>
                  {pluginSource === "awesome" && (
                    <AwesomePluginsList
                      plugins={paginatedMarketplace}
                      installedPackages={installedPackages}
                      processingPlugin={processingPlugin}
                      isRunning={isRunning}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                      getCategoryIcon={getCategoryIcon}
                    />
                  )}
                  {pluginSource === "market" && (
                    <MarketPluginsList
                      plugins={paginatedMarketplace}
                      installedPackages={installedPackages}
                      processingPlugin={processingPlugin}
                      isRunning={isRunning}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                    />
                  )}
                  {pluginSource === "npm" && (
                    <NpmPluginsList
                      plugins={paginatedMarketplace}
                      installedPackages={installedPackages}
                      processingPlugin={processingPlugin}
                      isRunning={isRunning}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                    />
                  )}
                </>
              ) : (
                <div className="col-span-full py-20 text-center bg-base-100 rounded-3xl border border-dashed border-base-300">
                  <div className="p-4 rounded-full bg-base-200 inline-block opacity-50 mb-4">
                    <FiSearch className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-bold">
                    {pluginSource === "npm" && !searchQuery
                      ? "Start searching NPM"
                      : "No plugins found"}
                  </h3>
                  <p className="text-sm opacity-50 mt-2">
                    {pluginSource === "npm" && !searchQuery
                      ? "Enter a keyword to search for NativeScript plugins on NPM."
                      : "Try adjusting your search or category filter."}
                  </p>
                </div>
              )}
            </>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                className="btn btn-sm btn-ghost disabled:opacity-30"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <div className="flex items-center gap-1 mx-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show current page, first, last, and pages around current
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                    );
                  })
                  .map((p, i, arr) => (
                    <div key={p} className="flex items-center gap-1">
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="opacity-30">...</span>
                      )}
                      <button
                        className={`btn btn-sm btn-square ${
                          currentPage === p
                            ? "btn-primary shadow-lg shadow-primary/20"
                            : "btn-ghost"
                        }`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                className="btn btn-sm btn-ghost disabled:opacity-30"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-base-100/50 animate-pulse rounded-2xl border border-base-200"
            ></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "installed" && (
            <div className="flex items-center gap-1 bg-base-200/50 p-1 rounded-2xl border border-base-content/5 w-fit">
              <button
                className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                  installedSubTab === "plugins"
                    ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                    : "btn-ghost opacity-50 hover:opacity-100"
                }`}
                onClick={() => setInstalledSubTab("plugins")}
              >
                <FiPackage className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Plugins
                </span>
                <span
                  className={`badge badge-xs font-bold border-none px-1 ${
                    installedSubTab === "plugins"
                      ? "bg-primary-content/20 text-primary-content"
                      : "bg-base-300 text-base-content/40"
                  }`}
                >
                  {
                    installedPlugins.filter(
                      (p) => p.type === "plugin" && p.source === "Dependencies",
                    ).length
                  }
                </span>
              </button>
              <button
                className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                  installedSubTab === "common"
                    ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                    : "btn-ghost opacity-50 hover:opacity-100"
                }`}
                onClick={() => setInstalledSubTab("common")}
              >
                <FiLayout className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Modules
                </span>
                <span
                  className={`badge badge-xs font-bold border-none px-1 ${
                    installedSubTab === "common"
                      ? "bg-primary-content/20 text-primary-content"
                      : "bg-base-300 text-base-content/40"
                  }`}
                >
                  {
                    installedPlugins.filter(
                      (p) =>
                        p.type === "common module" &&
                        p.source === "Dependencies",
                    ).length
                  }
                </span>
              </button>
              <button
                className={`btn btn-sm rounded-xl px-4 h-9 gap-2 border-none transition-all ${
                  installedSubTab === "dev"
                    ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                    : "btn-ghost opacity-50 hover:opacity-100"
                }`}
                onClick={() => setInstalledSubTab("dev")}
              >
                <FiCpu className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Dev
                </span>
                <span
                  className={`badge badge-xs font-bold border-none px-1 ${
                    installedSubTab === "dev"
                      ? "bg-primary-content/20 text-primary-content"
                      : "bg-base-300 text-base-content/40"
                  }`}
                >
                  {
                    installedPlugins.filter(
                      (p) => p.source === "Dev Dependencies",
                    ).length
                  }
                </span>
              </button>
            </div>
          )}

          <div className="space-y-4">
            {installedPluginsList.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {installedPluginsList.map((pkg) => {
                  const isCurrentProcessing = processingPlugin === pkg.name;
                  return (
                    <div
                      key={pkg.name}
                      className="flex items-center justify-between p-4 bg-base-100 border border-base-200 rounded-2xl hover:border-primary/20 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${pkg.type === "plugin" ? "bg-primary/5 text-primary" : "bg-base-300 text-base-content/50"}`}
                        >
                          <FiPackage className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{pkg.name}</h4>
                          </div>
                          <div className="text-xs opacity-40 font-mono mt-0.5">
                            {pkg.version}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUninstall(pkg.name)}
                          disabled={isRunning}
                          className="btn btn-ghost btn-sm text-error hover:bg-error/10 px-4 rounded-lg"
                        >
                          {isCurrentProcessing && isRunning ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <>
                              <FiTrash2 className="w-3 h-3 mr-1" /> Uninstall
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {installedPluginsList.length === 0 && (
                  <div className="py-20 text-center bg-base-100 rounded-3xl border border-dashed border-base-300">
                    <div className="p-4 rounded-full bg-base-200 inline-block opacity-50 mb-4">
                      <FiSearch className="h-10 w-10" />
                    </div>
                    <h3 className="text-lg font-bold">No packages found</h3>
                    <p className="text-sm opacity-50 mt-2">
                      Try adjusting your search query or switch tabs.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center bg-base-100 rounded-3xl border border-dashed border-base-300">
                <div className="p-4 rounded-full bg-base-200 inline-block opacity-50 mb-4">
                  <FiPackage className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-bold">No plugins installed</h3>
                <p className="text-sm opacity-50 mt-2">
                  Go to Discover to find and install plugins.
                </p>
              </div>
            )}

            <div className="mt-8 p-6 bg-primary/5 rounded-3xl border border-primary/10 flex gap-4">
              <FiInfo className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-primary">About Uninstallation</h4>
                <p className="text-sm opacity-70 mt-1 leading-relaxed">
                  Only identified NativeScript plugins can be uninstalled from
                  this view to protect your project's core dependencies. If you
                  need to remove other packages, please use the terminal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uninstall Confirmation Modal */}
      {showUninstallConfirm && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl border border-base-content/10 shadow-2xl p-0 overflow-hidden max-w-md">
            <div className="bg-error/10 p-6 flex items-center justify-between border-b border-error/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-error/20 rounded-xl text-error">
                  <FiTrash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Uninstall Plugin</h3>
                  <p className="text-xs opacity-50 uppercase tracking-widest font-bold">
                    Confirm removal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUninstallConfirm(false)}
                className="btn btn-ghost btn-sm btn-square rounded-xl"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <p className="text-sm leading-relaxed opacity-70">
                Are you sure you want to uninstall{" "}
                <span className="font-bold text-base-content italic">
                  "{pluginToUninstall}"
                </span>
                ? This will permanently remove the package from your{" "}
                <code className="bg-base-300 px-1 rounded text-xs">
                  node_modules
                </code>{" "}
                and update your configuration.
              </p>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowUninstallConfirm(false)}
                  className="btn btn-ghost flex-1 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUninstall}
                  className="btn btn-error flex-[2] rounded-2xl font-bold text-white shadow-lg shadow-error/20"
                >
                  Uninstall Now
                </button>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop bg-base-content/20 backdrop-blur-sm"
            onClick={() => setShowUninstallConfirm(false)}
          ></div>
        </div>
      )}

      {/* Manual Install Modal */}
      {showManualInstall && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl border border-base-content/10 shadow-2xl p-0 overflow-hidden">
            <div className="bg-primary/10 p-6 flex items-center justify-between border-b border-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <FiPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Manual Install</h3>
                  <p className="text-xs opacity-50 uppercase tracking-widest font-bold">
                    Install any package from NPM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManualInstall(false)}
                className="btn btn-ghost btn-sm btn-square rounded-xl"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold opacity-50">
                    Package Name
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. lodash or @nativescript/core"
                  className="input input-bordered w-full rounded-2xl bg-base-200/50 focus:border-primary transition-all font-mono"
                  value={manualPackageName}
                  onChange={(e) => setManualPackageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualPackageName.trim()) {
                      handleInstall(manualPackageName.trim());
                    }
                  }}
                  autoFocus
                />
                <label className="label mt-2">
                  <span className="label-text-alt opacity-50 flex items-center gap-1">
                    <FiInfo className="w-3 h-3" />
                    Enter the exact package name as it appears on NPM.
                  </span>
                </label>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowManualInstall(false)}
                  className="btn btn-ghost flex-1 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleInstall(manualPackageName.trim())}
                  disabled={!manualPackageName.trim() || isRunning}
                  className="btn btn-primary flex-[2] rounded-2xl font-bold shadow-lg shadow-primary/20"
                >
                  {isRunning ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Install Package"
                  )}
                </button>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop bg-base-content/20 backdrop-blur-sm"
            onClick={() => setShowManualInstall(false)}
          ></div>
        </div>
      )}
    </div>
  );
}
