import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import Database from "@tauri-apps/plugin-sql";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import "./App.css";

import type {
  Route,
  Theme,
  ProjectRow,
  ProjectAnalysis,
  DoctorCheck,
  CommandResult,
} from "./app/types";
import { getBrandAssets } from "./app/brand";

// Components
import { SplashScreen } from "./components/SplashScreen";
import { AppShell } from "./components/AppShell";
import { DiscoverModal } from "./components/DiscoverModal";
import { TitleBar } from "./components/TitleBar";

// Pages
import { HomePage } from "./pages/main/HomePage";
import { ProjectsPage } from "./pages/main/ProjectsPage";
import { DoctorPage } from "./pages/app-mode/DoctorPage";
import { ActionsPage } from "./pages/app-mode/ActionsPage";
import { PluginsPage } from "./pages/app-mode/PluginsPage";
import { PermissionsPage } from "./pages/app-mode/PermissionsPage";
import { ConfigPage } from "./pages/app-mode/ConfigPage";
import {
  CreateProjectPage,
  type ProjectConfig,
} from "./pages/main/CreateProjectPage";

function App() {
  const [bootStage, setBootStage] = useState<"splash" | "ready">("splash");
  const [route, setRoute] = useState<Route>("home");
  const [theme, setTheme] = useState<Theme>("dark");

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
  const [db, setDb] = useState<Database | null>(null);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [activeProjectPath, setActiveProjectPath] = useState<string | null>(
    null,
  );

  const [doctorChecks, setDoctorChecks] = useState<DoctorCheck[] | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(false);

  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<ProjectAnalysis[]>([]);

  const [actionsProjectPath, setActionsProjectPath] = useState<string | null>(
    null,
  );
  const [actionsRunning, setActionsRunning] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [logText, setLogText] = useState<string>("");
  const [logFilter, setLogFilter] = useState<"all" | "errors">("all");

  const splashStartRef = useRef<number>(Date.now());

  const { logoSrc, iconSrc } = getBrandAssets(theme);

  async function refreshProjects(
    currentDb: Database,
    autoSelect: boolean = false,
  ) {
    const rows = (await currentDb.select(
      "SELECT id, name, path, nativescript_version, framework, platforms, last_opened, plugins_count, permissions_count, version_code, version_name, target_sdk, min_sdk FROM projects ORDER BY name ASC",
    )) as ProjectRow[];

    // Verify if folders still exist
    const validProjects: ProjectRow[] = [];
    const missingPaths: string[] = [];

    for (const project of rows) {
      const exists = await invoke("check_directory_exists", {
        path: project.path,
      });
      if (exists) {
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
    try {
      await db.execute("DELETE FROM projects WHERE path = $1", [path]);
      if (activeProjectPath === path) {
        setActiveProjectPath(null);
      }
      if (actionsProjectPath === path) {
        setActionsProjectPath(null);
      }
      await refreshProjects(db);
    } catch (err) {
      console.error("Failed to remove project:", err);
    }
  }

  async function init() {
    try {
      const currentDb = await Database.load("sqlite:nsforge_v1.db");
      setDb(currentDb);
      await refreshProjects(currentDb, true);
    } catch (err) {
      console.error("Failed to init DB:", err);
    }

    const minSplashMs = 1200;
    const elapsed = Date.now() - splashStartRef.current;
    const remaining = Math.max(0, minSplashMs - elapsed);
    window.setTimeout(() => setBootStage("ready"), remaining);

    // Show window after initial loading to prevent white flash
    try {
      await getCurrentWindow().show();
    } catch (err) {
      console.error("Failed to show window:", err);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function upsertProject(currentDb: Database, analysis: ProjectAnalysis) {
    const platforms = JSON.stringify(analysis.platforms ?? []);
    const lastOpened = Date.now();

    await currentDb.execute(
      `INSERT INTO projects (name, path, nativescript_version, framework, platforms, last_opened, plugins_count, permissions_count, version_code, version_name, target_sdk, min_sdk)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT(path) DO UPDATE SET
         name = excluded.name,
         nativescript_version = excluded.nativescript_version,
         framework = excluded.framework,
         platforms = excluded.platforms,
         last_opened = excluded.last_opened,
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
    } catch (err) {
      console.error("Failed to add project:", err);
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
    try {
      const results = (await invoke("discover_projects", {
        rootPath,
        maxDepth: 4,
      })) as ProjectAnalysis[];
      setDiscoverResults(results);
    } catch (err) {
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
    } catch (err) {
      console.error("Import failed:", err);
    }
  }

  async function handleCreateProject(config: ProjectConfig) {
    if (!db) return;
    setCreateLoading(true);
    setLogText("Starting project creation process...\n");

    const unlisten = await listen<{ message: string }>(
      "create-project-log",
      (event) => {
        setLogText((prev) => prev + event.payload.message);
      },
    );

    try {
      const result = (await invoke("create_ns_project", {
        projectName: config.name,
        parentPath: config.parentPath,
        flavor: config.flavor,
        template: config.template,
        platform: config.platform,
      })) as CommandResult;

      if (result.statusCode === 0) {
        // Success! Now analyze and add to DB
        const projectPath = `${config.parentPath}/${config.name}`;
        const analysis = (await invoke("analyze_project", {
          projectPath,
        })) as ProjectAnalysis;

        await upsertProject(db, analysis);
        await refreshProjects(db);
        setActiveProjectPath(projectPath);
        setActionsProjectPath(projectPath);
        // REMOVED: setRoute("app-actions"); // Do not auto-redirect
      } else {
        alert(`Failed to create project. Check terminal for details.`);
      }
    } catch (err) {
      console.error("Create project failed:", err);
      alert(`Error: ${String(err)}`);
    } finally {
      unlisten();
      setCreateLoading(false);
    }
  }

  async function openInFileManager(path: string) {
    await openPath(path);
  }

  async function runDoctor() {
    setDoctorLoading(true);
    // If we have an active project, go to app-doctor, else maybe stay on home doctor if it existed?
    // User wants doctor in Application context.
    if (activeProjectPath) {
      setRoute("app-doctor");
    } else {
      // Fallback for home context if needed, but user said doctor is in Application Page.
      // For now let's assume if they click doctor from home, it opens the last active or first project.
      if (projects.length > 0) {
        const path = activeProjectPath || projects[0].path;
        setActiveProjectPath(path);
        setActionsProjectPath(path);
        setRoute("app-doctor");
      }
    }

    try {
      const result = (await invoke("doctor_checks")) as DoctorCheck[];
      setDoctorChecks(result);
    } catch (err) {
      console.error("Doctor failed:", err);
    } finally {
      setDoctorLoading(false);
    }
  }

  async function runAction(action: "run-android" | "run-ios" | "build") {
    if (!actionsProjectPath) return;
    setActionsRunning(true);
    setLogText("");
    try {
      const result = (await invoke("run_ns", {
        projectPath: actionsProjectPath,
        action,
      })) as CommandResult;
      const combined = [result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n");
      setLogText(combined.trim());
    } catch (e) {
      setLogText(String(e));
    } finally {
      setActionsRunning(false);
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
  }

  if (bootStage === "splash") {
    return <SplashScreen theme={theme} logoSrc={logoSrc} />;
  }

  const activeProject = activeProjectPath
    ? projects.find((p) => p.path === activeProjectPath)
    : null;

  const isAppMode = route.startsWith("app-");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
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
        brandIconSrc={iconSrc}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
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
      >
        {route === "home" && (
          <HomePage
            logoSrc={logoSrc}
            projects={projects}
            onAddProject={browseAndAddProject}
            onCreateProject={() => setRoute("create")}
            onOpenDoctor={runDoctor}
            onViewAllProjects={() => setRoute("projects")}
            onOpenProject={handleOpenActions}
            onOpenFolder={(path) => invoke("reveal_in_explorer", { path })}
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

        {route === "app-doctor" && (
          <DoctorPage
            checks={doctorChecks}
            loading={doctorLoading}
            onRunChecks={runDoctor}
          />
        )}

        {route === "app-actions" && (
          <ActionsPage
            projects={projects}
            projectPath={actionsProjectPath}
            setProjectPath={setActionsProjectPath}
            running={actionsRunning}
            logText={logText}
            logFilter={logFilter}
            setLogFilter={setLogFilter}
            onRunAction={runAction}
          />
        )}

        {/* Application Tools */}
        {route === "app-plugins" && <PluginsPage />}
        {route === "app-permissions" && <PermissionsPage />}
        {route === "app-config" && <ConfigPage />}

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
    </div>
  );
}

export default App;
