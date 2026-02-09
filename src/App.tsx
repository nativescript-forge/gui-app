import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import Database from "@tauri-apps/plugin-sql";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import "./App.css";

import type {
  Route,
  Theme,
  ProjectRow,
  ProjectAnalysis,
  CommandResult,
  RunConfig,
  BuildConfig,
} from "./app/types";
import { getBrandAssets } from "./app/brand";
import { redactCommand, formatDuration } from "./app/logging";
import { detectPlatforms, PlatformStatus } from "./app/platformDetection";

// Components
import { SplashScreen } from "./components/SplashScreen";
import { AppShell } from "./components/AppShell";
import { DiscoverModal } from "./components/DiscoverModal";
import { TitleBar } from "./components/TitleBar";

// Pages
import { HomePage } from "./pages/main/HomePage";
import { ProjectsPage } from "./pages/main/ProjectsPage";
import { PlatformConfigPage } from "./pages/app-mode/PlatformConfigPage";
import { DashboardPage } from "./pages/app-mode/DashboardPage";
import { PluginsPage } from "./pages/app-mode/PluginsPage";
import { PermissionsPage } from "./pages/app-mode/PermissionsPage";
import { ProjectConfigPage } from "./pages/app-mode/ProjectConfigPage";
import { ResourceConfigPage } from "./pages/app-mode/ResourceConfigPage";
import { SettingsPage } from "./pages/main/SettingsPage";
import { ActivityPage } from "./pages/main/ActivityPage";
import {
  CreateProjectPage,
  type ProjectConfig,
} from "./pages/main/CreateProjectPage";
import { SetupPage } from "./pages/setup/SetupPage";
import { BuildModal } from "./components/TitleBar/BuildModal";
import { RunModal } from "./components/TitleBar/RunModal";
import { GlobalTerminal } from "./components/GlobalTerminal";

function App() {
  const [bootStage, setBootStage] = useState<"splash" | "ready">("splash");
  const [route, setRoute] = useState<Route>("home");
  const [theme, setTheme] = useState<Theme>("dark");

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [activeProjectPath, setActiveProjectPath] = useState<string | null>(
    null,
  );
  const [actionsProjectPath, setActionsProjectPath] = useState<string | null>(
    null,
  );
  const [db, setDb] = useState<Database | null>(null);

  console.log(
    `[App] Render - bootStage: ${bootStage}, route: ${route}, theme: ${theme}`,
  );
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>({
    android: { available: false },
    ios: { available: false },
  });

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase();
    setIsMac(platform.includes("mac"));
  }, []);

  // Update platform status when project or route changes
  useEffect(() => {
    const checkPlatforms = async () => {
      if (!activeProjectPath) {
        setPlatformStatus({
          android: { available: false, reason: "No project selected" },
          ios: { available: false, reason: "No project selected" },
        });
        return;
      }

      try {
        const pkgs = (await invoke("get_project_packages", {
          projectPath: activeProjectPath,
        })) as Record<string, string>;

        const status = await detectPlatforms(activeProjectPath, pkgs, isMac);
        setPlatformStatus(status);
      } catch (err) {
        console.error("Failed to detect platforms in App:", err);
      }
    };

    checkPlatforms();
  }, [activeProjectPath, isMac]);

  const [runModalPlatform, setRunModalPlatform] = useState<
    "android" | "ios" | null
  >(null);
  const [runModalAction, setRunModalAction] = useState<"run" | "debug">("run");

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("ns-forge-theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    updateTheme(newTheme);
  };

  // Sync with System OS if no saved preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("ns-forge-theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
      setTheme(prefersDark.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem("ns-forge-theme")) {
          setTheme(e.matches ? "dark" : "light");
        }
      };

      prefersDark.addEventListener("change", handler);
      return () => prefersDark.removeEventListener("change", handler);
    }
  }, []);
  const [systemReport, setSystemReport] = useState<{
    info: string;
    doctor: string;
    packageManager: string;
  } | null>(null);
  const [isRefreshingSystemReport, setIsRefreshingSystemReport] =
    useState(false);

  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<ProjectAnalysis[]>([]);

  const [actionsRunning, setActionsRunning] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [buildOutputPath, setBuildOutputPath] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [logText, setLogText] = useState<string>("");
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [toast, setToast] = useState<{
    message: string;
    type: "info" | "success" | "error" | "warning";
  } | null>(null);

  const initStartedRef = useRef(false);

  const showToast = (
    message: string,
    type: "info" | "success" | "error" | "warning" = "info",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const appStartTimeRef = useRef<number>(Date.now());

  async function logActivity(
    type: string,
    description: string,
    status: string,
    metadata?: any,
  ) {
    if (!db) return;

    // Only log specific activities as requested:
    // - check healty (system)
    // - build (build)
    // - run app (run)
    // - create project (create-project)
    // - Import project (project)
    const allowedTypes = [
      "system",
      "build",
      "run",
      "create-project",
      "project",
    ];
    if (!allowedTypes.includes(type)) return;

    try {
      await db.execute(
        "INSERT INTO activity_logs (activity_type, description, status, metadata) VALUES ($1, $2, $3, $4)",
        [type, description, status, metadata ? JSON.stringify(metadata) : null],
      );
      setLastActivityTime(Date.now());
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  }

  // Handle Route change logging - REMOVED AS REQUESTED (only keep specific ones)
  /*
  useEffect(() => {
    if (route) {
      logActivity("navigation", `Visited ${route} page`, "success", { route });
    }
  }, [route]);
  */

  // Reset active project overview when entering projects page
  useEffect(() => {
    if (route === "projects") {
      setActiveProjectPath(null);
    }
  }, [route]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu only for input/textarea elements if needed,
      // but usually we prevent it globally for Tauri apps to feel native.
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const unlisten = listen<{ message: string }>(
      "create-project-log",
      (event) => {
        const message = event.payload.message;
        setLogText((prev) => prev + message);
        setIsTerminalVisible(true);

        // Detect build output path (APK, AAB, IPA, APP)
        // Matches typical NativeScript output: path/to/app.apk or path/to/app.aab
        const pathRegex =
          /([a-zA-Z]:\\[^:\n]+\.(?:apk|aab|ipa|app))|(\/[^\n]+\.(?:apk|aab|ipa|app))/gi;
        const matches = message.match(pathRegex);
        if (matches && matches.length > 0) {
          // Get the last match as it's usually the final output path
          const detectedPath = matches[matches.length - 1].trim();
          setBuildOutputPath(detectedPath);
        }
      },
    );

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const splashStartRef = useRef<number>(Date.now());

  const { logoSrc, iconSrc } = getBrandAssets(theme);

  async function refreshProjects(
    currentDb: Database,
    autoSelect: boolean = false,
  ) {
    const rows = (await currentDb.select(
      "SELECT id, name, path, nativescript_version, framework, platforms, last_opened, created_at, plugins_count, permissions_count, version_code, version_name, target_sdk, min_sdk, ks_path, ks_password, ks_alias, ks_alias_password FROM projects ORDER BY name ASC",
    )) as ProjectRow[];

    // Verify if folders still exist
    const validProjects: ProjectRow[] = [];
    const missingPaths: string[] = [];

    for (const project of rows) {
      const exists = await invoke("path_exists", {
        path: project.path,
      });
      if (exists) {
        // If created_at is missing, re-analyze to populate it
        if (!project.created_at) {
          try {
            const analysis = (await invoke("analyze_project", {
              projectPath: project.path,
            })) as ProjectAnalysis;
            // Update the DB but don't call refreshProjects again to avoid loop
            const platforms = JSON.stringify(analysis.platforms ?? []);
            await currentDb.execute(
              `UPDATE projects SET created_at = $1, nativescript_version = $2, framework = $3, platforms = $4, plugins_count = $5, permissions_count = $6, version_code = $7, version_name = $8, target_sdk = $9, min_sdk = $10 WHERE path = $11`,
              [
                analysis.createdAt,
                analysis.nativescriptVersion ?? null,
                analysis.framework ?? null,
                platforms,
                analysis.pluginsCount ?? 0,
                analysis.permissionsCount ?? 0,
                analysis.versionCode ?? null,
                analysis.versionName ?? null,
                analysis.targetSdk ?? null,
                analysis.minSdk ?? null,
                project.path,
              ],
            );
            project.created_at = analysis.createdAt;
          } catch (err) {
            console.error("Failed to auto-repair project metadata:", err);
          }
        }
        validProjects.push(project);
      } else {
        missingPaths.push(project.path);
      }
    }

    // Cleanup missing projects from DB
    if (missingPaths.length > 0) {
      console.log("Cleaning up missing projects:", missingPaths);
      for (const path of missingPaths) {
        await currentDb.execute("DELETE FROM projects WHERE path = $1", [path]);
        if (activeProjectPath === path) setActiveProjectPath(null);
        if (actionsProjectPath === path) setActionsProjectPath(null);
      }
    }

    setProjects(validProjects);

    if (autoSelect && validProjects.length > 0) {
      if (!activeProjectPath) {
        setActiveProjectPath(validProjects[0].path);
      }
      if (!actionsProjectPath) {
        setActionsProjectPath(validProjects[0].path);
      }
    }
  }

  async function removeProject(path: string) {
    if (!db) return;
    const projectName = path.split(/[\\/]/).pop() || "Project";
    try {
      await db.execute("DELETE FROM projects WHERE path = $1", [path]);
      if (activeProjectPath === path) {
        setActiveProjectPath(null);
      }
      if (actionsProjectPath === path) {
        setActionsProjectPath(null);
      }
      await refreshProjects(db);
      logActivity("project", `Removed project: ${projectName}`, "success", {
        path,
      });
    } catch (err) {
      console.error("Failed to remove project:", err);
      logActivity(
        "project",
        `Failed to remove project: ${projectName}`,
        "error",
        {
          path,
          error: String(err),
        },
      );
    }
  }

  async function runBackgroundChecks(currentDb: Database) {
    setIsRefreshingSystemReport(true);
    try {
      const report = await invoke<{
        info: string;
        doctor: string;
        packageManager: string;
      }>("get_ns_report");

      setSystemReport(report);

      const now = Date.now();
      await currentDb.execute(
        "INSERT INTO system_info (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        ["info", report.info, now],
      );
      await currentDb.execute(
        "INSERT INTO system_info (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        ["doctor", report.doctor, now],
      );
      await currentDb.execute(
        "INSERT INTO system_info (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        ["packageManager", report.packageManager, now],
      );

      logActivity("system", "System health checks completed", "success");
    } catch (err) {
      console.error("Background checks failed:", err);
      logActivity("system", "System health checks failed", "error", {
        error: String(err),
      });
    } finally {
      setIsRefreshingSystemReport(false);
    }
  }

  async function init() {
    if (initStartedRef.current) {
      console.log("[App] Initialization already started, skipping...");
      return;
    }
    initStartedRef.current = true;

    console.log("[App] Initializing application...");

    // Show window early to let user see the SplashScreen and prevent "blank" state
    try {
      console.log("[App] Showing window...");
      const win = getCurrentWindow();
      await win.show();
      await win.setFocus();
    } catch (err) {
      console.error("[App] Failed to show window early:", err);
    }

    try {
      console.log("[App] Loading database...");
      const currentDb = await Database.load("sqlite:nsforge.db");
      setDb(currentDb);
      console.log("[App] Database loaded, refreshing projects...");
      await refreshProjects(currentDb, false);

      // Load existing system report
      console.log("[App] Loading system report...");
      const savedReport = await currentDb.select<
        {
          key: string;
          value: string;
        }[]
      >("SELECT * FROM system_info");
      if (savedReport.length > 0) {
        const reportObj: any = {};
        savedReport.forEach((row) => {
          reportObj[row.key] = row.value;
        });
        setSystemReport(reportObj);
      }

      // Start background checks
      console.log("[App] Starting background checks...");
      runBackgroundChecks(currentDb);

      // Log App Startup
      logActivity("system", "Application Started", "success", {
        startup_time: new Date().toISOString(),
        platform: window.navigator.platform,
      });

      // Check if setup is completed
      const isSetup =
        localStorage.getItem("ns-forge-setup-completed") === "true";
      console.log("[App] Setup completed check:", isSetup);
      if (!isSetup) {
        setRoute("setup");
      }
    } catch (err) {
      console.error("[App] Failed to initialize core systems:", err);
    } finally {
      const minSplashMs = 1500; // Slightly longer for stability
      const elapsed = Date.now() - splashStartRef.current;
      const remaining = Math.max(0, minSplashMs - elapsed);
      console.log(`[App] Transitioning to 'ready' in ${remaining}ms`);
      window.setTimeout(() => {
        console.log("[App] Boot stage: ready");
        setBootStage("ready");
      }, remaining);
    }
  }

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    // Listen for window close to log session duration
    let unlistenClose: (() => void) | null = null;

    const setupCloseListener = async () => {
      const unlisten = await getCurrentWindow().onCloseRequested(
        async (event) => {
          if (db) {
            // Prevent immediate close to allow DB write
            event.preventDefault();

            const duration = Date.now() - appStartTimeRef.current;
            try {
              await logActivity(
                "system",
                `Session Ended (${formatDuration(duration)})`,
                "success",
                {
                  duration_ms: duration,
                  ended_at: new Date().toISOString(),
                },
              );
            } catch (e) {
              console.error("Failed to log session end:", e);
            }

            // Now close the window for real
            await getCurrentWindow().destroy();
          }
        },
      );
      unlistenClose = unlisten;
    };

    setupCloseListener();

    return () => {
      if (unlistenClose) unlistenClose();
    };
  }, [db]); // Added db dependency to ensure we can log on close if db is ready

  // Re-analyze project when switching to ensure fresh data
  useEffect(() => {
    if (actionsProjectPath) {
      reAnalyzeProject(actionsProjectPath);
    }
  }, [actionsProjectPath]);

  async function upsertProject(currentDb: Database, analysis: ProjectAnalysis) {
    const platforms = JSON.stringify(analysis.platforms ?? []);
    const lastOpened = Date.now();

    await currentDb.execute(
      `INSERT INTO projects (name, path, nativescript_version, framework, platforms, last_opened, created_at, plugins_count, permissions_count, version_code, version_name, target_sdk, min_sdk)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT(path) DO UPDATE SET
         name = excluded.name,
         nativescript_version = excluded.nativescript_version,
         framework = excluded.framework,
         platforms = excluded.platforms,
         last_opened = excluded.last_opened,
         created_at = excluded.created_at,
         plugins_count = excluded.plugins_count,
         permissions_count = excluded.permissions_count,
         version_code = excluded.version_code,
         version_name = excluded.version_name,
         target_sdk = excluded.target_sdk,
         min_sdk = excluded.min_sdk`,
      [
        analysis.name,
        analysis.path,
        analysis.nativescriptVersion ?? null,
        analysis.framework ?? null,
        platforms,
        lastOpened,
        analysis.createdAt,
        analysis.pluginsCount ?? 0,
        analysis.permissionsCount ?? 0,
        analysis.versionCode ?? null,
        analysis.versionName ?? null,
        analysis.targetSdk ?? null,
        analysis.minSdk ?? null,
      ],
    );
  }

  async function browseAndAddProject() {
    if (!db) return;

    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: "Select a NativeScript project folder",
    });

    const projectPath = typeof selected === "string" ? selected : null;
    if (!projectPath) return;

    try {
      const analysis = (await invoke("analyze_project", {
        projectPath,
      })) as ProjectAnalysis;

      await upsertProject(db, analysis);
      await refreshProjects(db);
      setActiveProjectPath(projectPath);
      setActionsProjectPath(projectPath);
      setRoute("app-actions"); // Go directly to app actions when adding
      logActivity("project", `Added project: ${analysis.name}`, "success", {
        path: projectPath,
      });
    } catch (err) {
      console.error("Failed to add project:", err);
      logActivity(
        "project",
        `Failed to add project from ${projectPath}`,
        "error",
        {
          error: String(err),
        },
      );
    }
  }

  async function scanAndDiscoverProjects() {
    if (!db) return;

    const root = await openDialog({
      directory: true,
      multiple: false,
      title: "Select a folder to scan for NativeScript projects",
    });
    const rootPath = typeof root === "string" ? root : null;
    if (!rootPath) return;

    setDiscoverOpen(true);
    setDiscoverLoading(true);
    const startTime = Date.now();
    try {
      const results = (await invoke("discover_projects", {
        rootPath,
        maxDepth: 4,
      })) as ProjectAnalysis[];
      setDiscoverResults(results);
      logActivity(
        "system",
        `Scanned for projects in ${rootPath} (${formatDuration(Date.now() - startTime)})`,
        "success",
        { rootPath, count: results.length },
      );
    } catch (err) {
      logActivity(
        "system",
        `Failed to scan for projects in ${rootPath}`,
        "error",
        { rootPath, error: String(err) },
      );
      console.error("Discovery failed:", err);
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function handleImportProject(analysis: ProjectAnalysis) {
    if (!db) return;
    try {
      await upsertProject(db, analysis);
      await refreshProjects(db);
      showToast(`Project ${analysis.name} imported successfully!`, "success");
      logActivity("project", `Imported project: ${analysis.name}`, "success", {
        path: analysis.path,
      });
    } catch (err) {
      console.error("Import failed:", err);
      logActivity("project", `Failed to import project`, "error", {
        error: String(err),
      });
    }
  }

  async function reAnalyzeProject(path: string) {
    if (!db) return;
    try {
      const analysis = (await invoke("analyze_project", {
        projectPath: path,
      })) as ProjectAnalysis;
      await upsertProject(db, analysis);
      await refreshProjects(db);
      logActivity(
        "project",
        `Re-analyzed project: ${analysis.name}`,
        "success",
        {
          path,
        },
      );
    } catch (err) {
      console.error("Re-analysis failed:", err);
      logActivity("project", `Failed to re-analyze project`, "error", {
        path,
        error: String(err),
      });
    }
  }

  async function clearLogs() {
    if (!db) return;
    try {
      await db.execute("DELETE FROM activity_logs");
      setLastActivityTime(Date.now());
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  }

  async function handleCreateProject(config: ProjectConfig) {
    if (!db) return;
    setCreateLoading(true);
    setLogText("Starting project creation process...\n");
    setIsTerminalVisible(true);
    const startTime = Date.now();

    try {
      const result = (await invoke("create_ns_project", {
        projectName: config.name,
        parentPath: config.parentPath,
        flavor: config.flavor,
        template: config.template,
        platform: config.platform,
      })) as CommandResult;

      const duration = Date.now() - startTime;
      const redactedCmd = redactCommand(result.command || "");

      if (result.statusCode === 0) {
        logActivity(
          "create-project",
          `Created project: ${config.name} (${formatDuration(duration)})`,
          "success",
          {
            duration_ms: duration,
            command: redactedCmd,
            config,
          },
        );
        setLogText((prev) => prev + "\nProject created successfully!\n");
        showToast("Project created successfully!", "success");

        // Success! Now analyze and add to DB
        const projectPath = `${config.parentPath}/${config.name}`;
        const analysis = (await invoke("analyze_project", {
          projectPath,
        })) as ProjectAnalysis;

        await upsertProject(db, analysis);
        await refreshProjects(db);
        setActiveProjectPath(projectPath);
        setActionsProjectPath(projectPath);
        setRoute("app-actions");
      } else {
        logActivity(
          "create-project",
          `Failed to create project: ${config.name} (${formatDuration(duration)})`,
          "error",
          {
            duration_ms: duration,
            command: redactedCmd,
            statusCode: result.statusCode,
          },
        );
        showToast("Failed to create project. Check terminal.", "error");
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      logActivity(
        "create-project",
        `Error creating project: ${config.name} (${formatDuration(duration)})`,
        "error",
        {
          duration_ms: duration,
          error: String(err),
        },
      );
      console.error("Create project failed:", err);
      const errMsg = String(err);
      if (errMsg.includes("Process was terminated")) {
        showToast("Process was terminated", "info");
      } else {
        showToast(`Error: ${errMsg}`, "error");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function runSettingsCommand(
    command: string,
    args: Record<string, any>,
  ) {
    setLogText("");
    setIsTerminalVisible(true);
    setActionsRunning(true);
    setCurrentAction("settings");
    try {
      await invoke(command, args);
    } catch (err) {
      console.error(`Command ${command} failed:`, err);
      setLogText((prev) => prev + `\nError: ${err}\n`);
    } finally {
      setActionsRunning(false);
      setCurrentAction(null);
    }
  }

  async function runDoctor() {
    setActionsRunning(true);
    setCurrentAction("doctor");
    const startTime = Date.now();
    // If we have an active project, go to app-platform-config, else maybe stay on home doctor if it existed?
    // User wants doctor in Application context.
    if (activeProjectPath) {
      setRoute("app-platform-config");
    } else {
      // Fallback for home context if needed, but user said doctor is in Application Page.
      // For now let's assume if they click doctor from home, it opens the last active or first project.
      if (projects.length > 0) {
        const path = activeProjectPath || projects[0].path;
        setActiveProjectPath(path);
        setActionsProjectPath(path);
        setRoute("app-platform-config");
      }
    }

    try {
      logActivity(
        "system",
        `Ran system doctor checks (${formatDuration(Date.now() - startTime)})`,
        "success",
      );
    } catch (err) {
      logActivity("system", "Failed to run doctor checks", "error", {
        error: String(err),
      });
      console.error("Doctor failed:", err);
    } finally {
      setActionsRunning(false);
      setCurrentAction(null);
    }
  }

  async function stopRunningAction() {
    try {
      await invoke("stop_ns_command");
      setLogText((prev) => prev + "\n\n[PROCESS TERMINATED BY USER]\n");
      logActivity("system", "Stopped running process", "info");
    } catch (e) {
      console.error("Failed to stop action:", e);
      logActivity("system", "Failed to stop process", "error", {
        error: String(e),
      });
    }
  }

  async function runAction(
    action:
      | "run-android"
      | "run-ios"
      | "debug-android"
      | "debug-ios"
      | "build"
      | "clean"
      | "install"
      | "doctor"
      | "info"
      | "update"
      | "migrate"
      | "package-manager"
      | "plugin-add"
      | "plugin-remove"
      | "resources-update"
      | "resources-generate-splashes"
      | "resources-generate-icons"
      | "platform-add-android"
      | "platform-add-ios",
    deviceId?: string,
    config?:
      | BuildConfig
      | RunConfig
      | { platform?: "android" | "ios"; [key: string]: any },
    sourcePath?: string,
    backgroundColor?: string,
  ): Promise<string> {
    if (!actionsProjectPath) return "";
    setActionsRunning(true);
    setCurrentAction(action);
    setBuildOutputPath(null);
    setLogText("");
    setIsTerminalVisible(true);

    const projectName = actionsProjectPath.split(/[\\/]/).pop() || "Project";
    const activityBaseDesc = `${action.replace("-", " ").toUpperCase()} on ${projectName}`;
    const startTime = Date.now();

    try {
      const result = (await invoke("run_ns", {
        projectPath: actionsProjectPath,
        action,
        deviceId,
        buildConfig: config,
        sourcePath,
        backgroundColor,
      })) as CommandResult;

      const duration = Date.now() - startTime;
      const redactedCmd = redactCommand(result.command || "");

      logActivity(
        action.startsWith("build")
          ? "build"
          : action.startsWith("run") || action.startsWith("debug")
            ? "run"
            : "system",
        `${activityBaseDesc} (${formatDuration(duration)})`,
        "success",
        {
          action,
          deviceId,
          duration_ms: duration,
          command: redactedCmd,
          platform:
            (config as any)?.platform ||
            (action.includes("android") ? "android" : "ios"),
        },
      );
      if (result.statusCode === 0) {
        showToast(`${action.toUpperCase()} completed successfully`, "success");
        // If it was a platform add, migrate, or update, we should refresh the project data
        if (
          action.startsWith("platform-add") ||
          action === "migrate" ||
          action === "update"
        ) {
          await reAnalyzeProject(actionsProjectPath);
        }
      } else {
        showToast(
          `${action.toUpperCase()} failed with exit code ${result.statusCode}`,
          "error",
        );
      }
      return action;
    } catch (e) {
      const duration = Date.now() - startTime;
      logActivity(
        action.startsWith("build")
          ? "build"
          : action.startsWith("run") || action.startsWith("debug")
            ? "run"
            : "system",
        `${activityBaseDesc} (${formatDuration(duration)})`,
        "error",
        {
          action,
          deviceId,
          duration_ms: duration,
          error: String(e),
          platform:
            (config as any)?.platform ||
            (action.includes("android") ? "android" : "ios"),
        },
      );
      setLogText((prev) => prev + `\nError: ${String(e)}`);
      const errMsg = String(e);
      if (errMsg.includes("Process was terminated")) {
        showToast("Process was terminated", "info");
      } else {
        showToast(`Error: ${errMsg}`, "error");
      }
      return "";
    } finally {
      setActionsRunning(false);
      setCurrentAction(null);
    }
  }

  async function runNpm(args: string[], cwd?: string) {
    if (!actionsProjectPath && !cwd) return;
    setActionsRunning(true);
    setCurrentAction("npm");
    setIsTerminalVisible(true);
    setLogText("");
    const path = cwd || actionsProjectPath || "";
    const projectName = path.split(/[\\/]/).pop() || "Project";
    const startTime = Date.now();

    try {
      const result = (await invoke("run_npm", {
        cwd: path,
        args,
      })) as CommandResult;

      const duration = Date.now() - startTime;
      logActivity(
        "system",
        `NPM ${args.join(" ")} on ${projectName} (${formatDuration(duration)})`,
        "success",
        {
          args,
          duration_ms: duration,
          command: result.command,
        },
      );
      if (result.statusCode === 0) {
        showToast(`NPM ${args[0]} completed successfully`, "success");
      } else {
        showToast(
          `NPM ${args[0]} failed with exit code ${result.statusCode}`,
          "error",
        );
      }
    } catch (e) {
      const duration = Date.now() - startTime;
      logActivity(
        "system",
        `NPM ${args.join(" ")} on ${projectName} (${formatDuration(duration)})`,
        "error",
        {
          args,
          duration_ms: duration,
          error: String(e),
        },
      );
      console.error("NPM failed:", e);
      showToast(`NPM failed: ${e}`, "error");
    } finally {
      setActionsRunning(false);
      setCurrentAction(null);
    }
  }

  async function handleSelectProject(path: string | null) {
    setActiveProjectPath(path);
    if (path) {
      setActionsProjectPath(path);
    }

    // Re-analyze on select to keep metadata fresh
    if (db && path) {
      try {
        const analysis = (await invoke("analyze_project", {
          projectPath: path,
        })) as ProjectAnalysis;
        await upsertProject(db, analysis);
        await refreshProjects(db);
      } catch (err) {
        console.error("Failed to re-analyze project on select:", err);
      }
    }
  }

  async function handleOpenActions(path: string) {
    setActiveProjectPath(path);
    setActionsProjectPath(path);
    setRoute("app-actions");

    // Update last_opened
    if (db) {
      try {
        const analysis = (await invoke("analyze_project", {
          projectPath: path,
        })) as ProjectAnalysis;
        await upsertProject(db, analysis);
        await refreshProjects(db);
      } catch (err) {
        console.error("Failed to update last_opened on open actions:", err);
      }
    }
  }

  if (bootStage === "splash") {
    return <SplashScreen theme={theme} logoSrc={logoSrc} />;
  }

  const activeProject = activeProjectPath
    ? projects.find((p) => p.path === activeProjectPath)
    : null;

  const isAppMode = route.startsWith("app-");

  return (
    <div data-theme={theme} className="flex flex-col h-screen overflow-hidden">
      <TitleBar
        projects={projects}
        activeProjectPath={activeProjectPath}
        onSelectProject={(path) => {
          setActiveProjectPath(path);
          setActionsProjectPath(path);
        }}
        onAddProject={browseAndAddProject}
        onCreateProject={() => {
          setLogText("");
          setRoute("create");
        }}
        onOpenDoctor={runDoctor}
        setRoute={setRoute}
        currentRoute={route}
        onRunAction={runAction}
        actionsRunning={actionsRunning}
        brandIconSrc={iconSrc}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenBuildModal={() => setIsBuildModalOpen(true)}
        onOpenRunModal={(platform, action) => {
          setRunModalPlatform(platform);
          setRunModalAction(action || "run");
          setIsRunModalOpen(true);
        }}
        isMac={isMac}
      />

      {route === "setup" ? (
        <div className="flex-1 overflow-auto">
          <SetupPage theme={theme} onComplete={() => setRoute("home")} />
        </div>
      ) : (
        <AppShell
          theme={theme}
          route={route}
          setRoute={setRoute}
          activeProjectPathLabel={
            activeProject ? activeProject.name : "No project selected"
          }
          brandIconSrc={iconSrc}
          onToggleTheme={toggleTheme}
          onAddProject={browseAndAddProject}
          onCreateProject={() => {
            setLogText("");
            setRoute("create");
          }}
          onOpenDoctor={runDoctor}
          isAppMode={isAppMode}
          projects={projects}
          activeProjectPath={activeProjectPath}
          onSelectProject={(path) => {
            setActiveProjectPath(path);
            setActionsProjectPath(path);
          }}
          onOpenBuildModal={() => setIsBuildModalOpen(true)}
        >
          {route === "home" && (
            <HomePage
              logoSrc={logoSrc}
              projects={projects}
              db={db}
              systemReport={systemReport}
              lastActivityTime={lastActivityTime}
              onAddProject={browseAndAddProject}
              onCreateProject={() => setRoute("create")}
              onOpenDoctor={runDoctor}
              onViewAllProjects={() => setRoute("projects")}
              onViewAllActivities={() => setRoute("activity")}
              onOpenProject={handleOpenActions}
              onOpenFolder={(path) => invoke("reveal_in_explorer", { path })}
              onRunNpm={runNpm}
              onRefreshSystemReport={async () => {
                if (db) await runBackgroundChecks(db);
              }}
              isRefreshingSystemReport={isRefreshingSystemReport}
            />
          )}

          {route === "projects" && (
            <ProjectsPage
              projects={projects}
              activeProjectPath={activeProjectPath}
              onSelectProject={handleSelectProject}
              onScanFolder={scanAndDiscoverProjects}
              onAddProject={browseAndAddProject}
              onCreateProject={() => setRoute("create")}
              onOpenFolder={(path) => invoke("reveal_in_explorer", { path })}
              onOpenActions={handleOpenActions}
              onRemoveProject={removeProject}
              onRefresh={() => db && refreshProjects(db)}
            />
          )}

          {route === "create" && (
            <CreateProjectPage
              onBack={() => setRoute("home")}
              onCreate={handleCreateProject}
              onProjectCreated={() => setRoute("app-actions")}
              isCreating={createLoading}
              logs={logText}
            />
          )}

          {route === "app-platform-config" && (
            <PlatformConfigPage projectPath={actionsProjectPath} />
          )}

          {route === "app-actions" && (
            <DashboardPage
              projects={projects}
              projectPath={actionsProjectPath}
              setProjectPath={setActionsProjectPath}
              running={actionsRunning}
              systemReport={systemReport}
              onOpenBuildModal={() => setIsBuildModalOpen(true)}
              onOpenRunModal={(platform, action) => {
                setRunModalPlatform(platform);
                setRunModalAction(action || "run");
                setIsRunModalOpen(true);
              }}
              onRunAction={async (action, deviceId, config) => {
                await runAction(action, deviceId, config);
              }}
              currentAction={currentAction}
              onRunNpm={runNpm}
              setRoute={setRoute}
              onRefreshProject={reAnalyzeProject}
              isMac={isMac}
              platformStatus={platformStatus}
            />
          )}

          {/* Application Tools */}
          {route === "app-plugins" && (
            <PluginsPage
              projectPath={actionsProjectPath}
              onInstall={(pluginName) =>
                runAction("plugin-add", undefined, undefined, pluginName)
              }
              onUninstall={(pluginName) =>
                runAction("plugin-remove", undefined, undefined, pluginName)
              }
              isRunning={actionsRunning}
            />
          )}
          {route === "app-resources" && (
            <ResourceConfigPage
              projectPath={actionsProjectPath}
              running={actionsRunning}
              currentAction={currentAction}
              onRunAction={async (action, sourcePath, backgroundColor) => {
                await runAction(
                  action,
                  undefined,
                  undefined,
                  sourcePath,
                  backgroundColor,
                );
              }}
            />
          )}
          {route === "app-permissions" && (
            <PermissionsPage
              projectPath={actionsProjectPath!}
              showToast={showToast}
            />
          )}
          {route === "app-config" && (
            <ProjectConfigPage projectPath={activeProjectPath} />
          )}
          {route === "settings" && (
            <SettingsPage
              systemReport={systemReport}
              isRefreshingSystemReport={isRefreshingSystemReport}
              onRefreshSystemReport={async () => {
                if (db) await runBackgroundChecks(db);
              }}
              onBack={() => setRoute("home")}
              onReSetup={() => setRoute("setup")}
              onClearLogs={clearLogs}
              onRunCommand={async (cmd, args) => {
                await runSettingsCommand(cmd, args);
              }}
              showToast={showToast}
              theme={theme}
            />
          )}

          {route === "activity" && (
            <ActivityPage db={db} lastActivityTime={lastActivityTime} />
          )}

          <DiscoverModal
            open={discoverOpen}
            loading={discoverLoading}
            results={discoverResults}
            projects={projects}
            db={db}
            onClose={() => setDiscoverOpen(false)}
            onImport={handleImportProject}
          />
        </AppShell>
      )}

      <BuildModal
        isOpen={isBuildModalOpen}
        onClose={() => setIsBuildModalOpen(false)}
        platform={
          route === "app-actions"
            ? (localStorage.getItem("ns-forge-platform") as
                | "android"
                | "ios") || "android"
            : "android"
        }
        onBuild={(config) => runAction("build", undefined, config)}
        projectPath={activeProjectPath || undefined}
        flavor={
          projects.find((p) => p.path === activeProjectPath)?.framework ||
          undefined
        }
        db={db}
        platformStatus={platformStatus}
        isMac={isMac}
      />

      <RunModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onRun={async (config) => {
          const action = `${config.action}-${config.platform}` as any;
          await runAction(action, config.deviceId, config);
        }}
        platform={runModalPlatform}
        initialAction={runModalAction}
        flavor={activeProject?.framework || undefined}
        platformStatus={platformStatus}
        isMac={isMac}
      />

      <GlobalTerminal
        logs={logText}
        isRunning={createLoading || actionsRunning}
        isVisible={isTerminalVisible}
        setIsVisible={setIsTerminalVisible}
        onStop={stopRunningAction}
        buildOutputPath={buildOutputPath}
      />

      {/* DaisyUI Toast */}
      {toast && (
        <div className="toast toast-end toast-bottom z-[100]">
          <div
            className={`alert ${
              toast.type === "success"
                ? "alert-success"
                : toast.type === "error"
                  ? "alert-error"
                  : toast.type === "warning"
                    ? "alert-warning"
                    : "alert-info"
            } shadow-lg border-none min-w-[300px] flex items-center gap-3 backdrop-blur-md bg-opacity-90 animate-in slide-in-from-right-full duration-300`}
          >
            <div className="flex-1">
              <span className="text-sm font-medium text-white">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="btn btn-ghost btn-xs btn-circle text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
