import { useState, useEffect, useCallback } from "react";
import {
  FiType,
  FiPlus,
  FiCopy,
  FiCheck,
  FiSearch,
  FiInfo,
  FiFileText,
  FiFolder,
  FiRefreshCw,
} from "react-icons/fi";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import type { CommandResult } from "../../shared/types";
import { readNsForgeData, saveNsForgeData } from "../../shared/projectConfig";

type FontInfo = {
  name: string;
  css: string;
  className: string;
};

type FontConfigPageProps = {
  projectPath: string | null;
  onRunAction?: (action: any) => Promise<string>;
};

export function FontConfigPage({
  projectPath,
  onRunAction,
}: FontConfigPageProps) {
  const [fonts, setFonts] = useState<FontInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFontsDir, setHasFontsDir] = useState<boolean>(false);
  const [fontsDirPath, setFontsDirPath] = useState<string | null>(null);
  const [frameworkFlavor, setFrameworkFlavor] = useState<
    "angular" | "react" | "solid" | "svelte" | "vue" | "core" | "unknown"
  >("unknown");

  const parseFontsOutput = (stdout: string): FontInfo[] => {
    // 1. Strip ANSI escape codes (those [39m, [31m, etc. artifacts)
    const stripAnsi = (str: string) =>
      str.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        "",
      );

    const cleanStdout = stripAnsi(stdout);
    const lines = cleanStdout.split("\n");
    const fonts: FontInfo[] = [];
    let currentFont: FontInfo | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for pipes which indicate table borders
      if (!trimmed.includes("│")) {
        continue;
      }

      // Handle the case where characters might be colored or have different pipe characters
      // NativeScript CLI sometimes uses different box-drawing characters
      const cleanLine = trimmed.replace(/[┌┐└┘├┤┬┴┼─]/g, "");
      if (!cleanLine.includes("│")) continue;

      const parts = cleanLine.split("│").map((p) => p.trim());

      // Typical parts for "│ Font │ CSS Properties │" would be ["", "Font", "CSS Properties", ""]
      if (parts.length >= 3) {
        const name = parts[1];
        const css = parts[2];

        // Skip header and empty names that aren't continuations
        if (
          name.toLowerCase() === "font" ||
          name.toLowerCase().includes("---") ||
          (name === "" && !currentFont)
        ) {
          continue;
        }

        if (name) {
          // New font entry
          const baseName = name.replace(/\.(ttf|otf)$/i, "");
          const className =
            "font-" + baseName.toLowerCase().replace(/[^a-z0-9]/g, "-");
          currentFont = { name, css, className };
          fonts.push(currentFont);
        } else if (currentFont && css) {
          // Continuation of CSS properties for current font (multi-line table cell)
          currentFont.css += " " + css;
        }
      }
    }
    return fonts;
  };

  const loadFonts = useCallback(
    async (forceRefresh = false) => {
      if (!projectPath) return;

      setLoading(true);
      setError(null);
      try {
        // Step 0: Resolve framework and fonts directory by flavor rules
        let flavor: typeof frameworkFlavor = "unknown";
        try {
          const pkgs = (await invoke("get_project_packages", {
            projectPath,
          })) as Record<string, string>;
          const has = (k: string) =>
            Object.prototype.hasOwnProperty.call(pkgs, k);
          if (has("@nativescript/angular")) {
            flavor = "angular";
          } else if (has("react-nativescript")) {
            flavor = "react";
          } else if (has("@nativescript-community/solid-js")) {
            flavor = "solid";
          } else if (has("@nativescript-community/svelte-native")) {
            flavor = "svelte";
          } else if (has("nativescript-vue")) {
            flavor = "vue";
          } else if (has("@nativescript/core")) {
            flavor = "core";
          } else {
            flavor = "unknown";
          }
        } catch {
          flavor = "unknown";
        }

        setFrameworkFlavor(flavor);

        let fontsDir = "";
        if (flavor === "angular") {
          fontsDir = await join(projectPath, "src", "app", "fonts");
        } else if (flavor === "react" || flavor === "solid") {
          fontsDir = await join(projectPath, "src", "fonts");
        } else if (
          flavor === "svelte" ||
          flavor === "vue" ||
          flavor === "core" ||
          flavor === "unknown"
        ) {
          fontsDir = await join(projectPath, "app", "fonts");
        }
        setFontsDirPath(fontsDir);

        // Ensure fonts directory exists according to flavor rules
        const dirExists = await invoke<boolean>("path_exists", {
          path: fontsDir,
        });
        if (!dirExists) {
          await invoke("create_dir", { path: fontsDir });
        }
        setHasFontsDir(true);

        // Step 1: Scan physical files in the resolved fonts directory
        const fontFiles = new Set<string>();
        try {
          const files = await invoke<string[]>("read_dir", { path: fontsDir });
          files.forEach((f) => {
            if (
              f.toLowerCase().endsWith(".ttf") ||
              f.toLowerCase().endsWith(".otf")
            ) {
              fontFiles.add(f);
            }
          });
        } catch {
          // ignore
        }

        // Step 2: Try to load from module-specific config in .nsforge
        const cachedFonts = await readNsForgeData<FontInfo[]>(
          projectPath,
          "configs/fonts.json",
        );

        let finalFonts: FontInfo[] = cachedFonts || [];

        // Step 3: If force refresh OR no cache, run "ns fonts"
        // Only run if there is at least one physical font file
        if (
          (forceRefresh || !cachedFonts || cachedFonts.length === 0) &&
          fontFiles.size > 0
        ) {
          let output = "";
          let success = false;

          if (onRunAction) {
            // Use onRunAction to trigger terminal UI
            await onRunAction("fonts");
            // After onRunAction, we still need to get the output for parsing.
            // Since onRunAction doesn't return stdout, we call run_ns silently.
            const result = (await invoke("run_ns", {
              projectPath,
              action: "fonts",
            })) as CommandResult;
            if (result.statusCode === 0) {
              output = result.stdout + "\n" + result.stderr;
              success = true;
            }
          } else {
            // Fallback to direct invoke
            const result = (await invoke("run_ns", {
              projectPath,
              action: "fonts",
            })) as CommandResult;
            if (result.statusCode === 0) {
              output = result.stdout + "\n" + result.stderr;
              success = true;
            }
          }

          if (success) {
            const parsedFonts = parseFontsOutput(output);
            if (parsedFonts.length > 0) {
              finalFonts = parsedFonts;
              await saveNsForgeData(
                projectPath,
                "configs/fonts.json",
                finalFonts,
              );
            }
          }
        }

        // Step 4: Reconcile with physical files (ensure all files in folder are in the list)
        // If a file is in the folder but not in finalFonts (from ns fonts), add it with default CSS
        const recognizedNames = new Set(finalFonts.map((f) => f.name));
        let hasNewPhysicalFiles = false;

        fontFiles.forEach((fileName) => {
          if (!recognizedNames.has(fileName)) {
            const baseName = fileName.replace(/\.(ttf|otf)$/i, "");
            finalFonts.push({
              name: fileName,
              css: `font-family: "${baseName}";`,
              className:
                "font-" + baseName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            });
            hasNewPhysicalFiles = true;
          }
        });

        if (hasNewPhysicalFiles) {
          await saveNsForgeData(projectPath, "configs/fonts.json", finalFonts);
        }

        setFonts(finalFonts);
      } catch (err) {
        console.error("Failed to load fonts:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    },
    [projectPath],
  );

  useEffect(() => {
    loadFonts(false);
  }, [loadFonts]);

  const handleAddFont = async () => {
    if (!projectPath) return;

    try {
      const selected = await openDialog({
        multiple: true,
        filters: [
          {
            name: "Fonts",
            extensions: ["ttf", "otf"],
          },
        ],
      });

      if (!selected) return;

      const filePaths = Array.isArray(selected) ? selected : [selected];

      // Determine font destination based on framework flavor rules
      let destDir = fontsDirPath;
      if (!destDir) {
        // fallback compute quickly
        const pkgs = (await invoke("get_project_packages", {
          projectPath,
        })) as Record<string, string>;
        const has = (k: string) =>
          Object.prototype.hasOwnProperty.call(pkgs, k);
        if (has("@nativescript/angular") || has("nativescript-angular")) {
          destDir = await join(projectPath, "src", "app", "fonts");
        } else if (has("@nativescript/react") || has("@nativescript/solid")) {
          destDir = await join(projectPath, "src", "fonts");
        } else {
          destDir = await join(projectPath, "app", "fonts");
        }
      }

      // Ensure directory exists
      const destExists = await invoke<boolean>("path_exists", {
        path: destDir,
      });
      if (!destExists) {
        await invoke("create_dir", { path: destDir });
      }

      for (const filePath of filePaths) {
        const fileName = filePath.split(/[\\/]/).pop()!;
        const destPath = await join(destDir, fileName);
        await invoke("copy_file", { src: filePath, dest: destPath });
      }

      // Refresh fonts list
      await loadFonts();
    } catch (err) {
      console.error("Failed to add font:", err);
      setError(String(err));
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllCSS = async () => {
    if (fonts.length === 0) return;
    const allCSS = fonts
      .map((f) => `.${f.className} {\n  ${f.css}\n}`)
      .join("\n\n");
    await writeText(allCSS);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const filteredFonts = fonts.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.className.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const projectName = projectPath?.split(/[\\/]/).pop() || "Project";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            <FiType className="text-primary" /> Font Config
          </h2>
          <p className="text-sm opacity-50 uppercase tracking-widest mt-1">
            Manage custom fonts for {projectName}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadFonts(true)}
            disabled={loading || !hasFontsDir}
            className={`btn btn-ghost border-base-300 rounded-2xl gap-2 ${loading ? "animate-pulse" : ""}`}
            title={
              hasFontsDir ? "Sync with ns fonts" : "No fonts directory found"
            }
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Sync Fonts</span>
          </button>
          <button
            onClick={handleCopyAllCSS}
            disabled={fonts.length === 0}
            className={`btn btn-ghost border-base-300 rounded-2xl gap-2 ${copiedAll ? "text-success" : ""}`}
            title="Generate & Copy All CSS Classes"
          >
            {copiedAll ? <FiCheck /> : <FiFileText />}
            <span className="hidden sm:inline">
              {copiedAll ? "Copied All!" : "Generate All CSS"}
            </span>
          </button>
          <button
            onClick={handleAddFont}
            disabled={loading}
            className="btn btn-primary rounded-2xl shadow-lg shadow-primary/20 gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add New Font
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="alert bg-base-100 border-base-300 rounded-3xl mb-8 shadow-sm">
        <FiInfo className="w-5 h-5 text-info" />
        <div>
          <h3 className="font-bold">How to add fonts</h3>
          <div className="text-xs opacity-70">
            Browse .ttf or .otf files. They will be copied to your project's
            fonts directory. We'll automatically generate CSS classes for you.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card bg-base-100 border border-base-300 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 bg-base-200/50 border-b border-base-300 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
            <FiFileText className="w-4 h-4" /> Project Fonts
          </h3>

          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
            <input
              type="text"
              placeholder="Search fonts..."
              className="input input-sm input-bordered w-full pl-10 rounded-xl bg-base-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading && fonts.length === 0 ? (
            <div className="p-12 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 opacity-50 font-bold">
                Scanning project fonts...
              </p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-error mb-2 font-bold">
                Error loading fonts
              </div>
              <p className="text-sm opacity-60 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => loadFonts()}
                className="btn btn-ghost btn-sm mt-4 text-primary"
              >
                Try Again
              </button>
            </div>
          ) : filteredFonts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="opacity-20 mb-4 flex justify-center">
                <FiType size={64} />
              </div>
              <h4 className="text-lg font-bold opacity-50">No fonts found</h4>
              <p className="text-sm opacity-40">Add fonts to see them here.</p>
            </div>
          ) : (
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200/50">
                  <th className="rounded-none border-0 text-[10px] uppercase tracking-widest opacity-50">
                    Font Name
                  </th>
                  <th className="border-0 text-[10px] uppercase tracking-widest opacity-50">
                    CSS Properties
                  </th>
                  <th className="border-0 text-[10px] uppercase tracking-widest opacity-50 text-right">
                    CSS Class (Click to copy)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFonts.map((font, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    <td className="font-bold text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-primary border border-base-300">
                          <FiType />
                        </div>
                        {font.name}
                      </div>
                    </td>
                    <td>
                      <code
                        className="text-xs bg-base-300/50 px-2 py-1 rounded-lg opacity-80 block max-w-xs truncate lg:max-w-md"
                        title={font.css}
                      >
                        {font.css}
                      </code>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() =>
                          handleCopy(
                            `.${font.className} {\n  ${font.css}\n}`,
                            font.className,
                          )
                        }
                        className={`btn btn-sm rounded-xl gap-2 normal-case transition-all ${
                          copiedId === font.className
                            ? "btn-success"
                            : "btn-ghost hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {copiedId === font.className ? (
                          <>
                            <FiCheck className="w-3 h-3" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <FiCopy className="w-3 h-3 opacity-50" />
                            <span className="font-mono text-xs">
                              .{font.className}
                            </span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        <div className="card bg-base-100 border border-base-300 rounded-3xl p-6">
          <h4 className="text-sm font-black uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
            <FiFolder className="w-4 h-4" /> Font Location
          </h4>
          <p className="text-xs opacity-70 mb-4">
            Fonts should be placed in your project's fonts directory to be
            correctly detected by NativeScript.
          </p>
          <div className="bg-base-200 p-3 rounded-xl font-mono text-xs break-all">
            {fontsDirPath || `${projectPath}/app/fonts`}
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 rounded-3xl p-6">
          <h4 className="text-sm font-black uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
            <FiCheck className="w-4 h-4" /> Pro Tip
          </h4>
          <p className="text-xs opacity-70">
            After adding fonts, you can use the generated CSS classes in your
            .css or .scss files to apply the fonts to your UI components.
          </p>
          <div className="mt-4 bg-base-200 p-3 rounded-xl font-mono text-[10px] opacity-80">
            {`.my-label {\n  @extend .${fonts[0]?.className || "font-name"};\n}`}
          </div>
        </div>
      </div>
    </div>
  );
}
