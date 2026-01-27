use serde::Serialize;
use std::{
    env,
    fs,
    path::{Path, PathBuf},
    process::Command,
};
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectAnalysis {
    name: String,
    path: String,
    nativescript_version: Option<String>,
    framework: Option<String>,
    platforms: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DoctorCheck {
    id: String,
    label: String,
    status: String,
    summary: String,
    details: Option<String>,
    hint: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CommandResult {
    status_code: Option<i32>,
    stdout: String,
    stderr: String,
}

fn folder_name(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(path)
        .to_string()
}

fn project_file(path: &str, relative: &str) -> PathBuf {
    Path::new(path).join(relative)
}

fn read_package_json(project_path: &str) -> Option<serde_json::Value> {
    let package_json_path = project_file(project_path, "package.json");
    let contents = fs::read_to_string(package_json_path).ok()?;
    serde_json::from_str(&contents).ok()
}

fn get_dep_version(pkg: &serde_json::Value, key: &str) -> Option<String> {
    let deps = pkg.get("dependencies").and_then(|v| v.as_object());
    if let Some(deps) = deps {
        if let Some(v) = deps.get(key).and_then(|v| v.as_str()) {
            return Some(v.to_string());
        }
    }

    let dev_deps = pkg.get("devDependencies").and_then(|v| v.as_object());
    if let Some(dev_deps) = dev_deps {
        if let Some(v) = dev_deps.get(key).and_then(|v| v.as_str()) {
            return Some(v.to_string());
        }
    }

    None
}

fn detect_framework(pkg: &serde_json::Value) -> Option<String> {
    let has = |dep: &str| get_dep_version(pkg, dep).is_some();

    if has("@nativescript/angular") || has("nativescript-angular") {
        return Some("Angular".to_string());
    }
    if has("@nativescript/vue") || has("nativescript-vue") {
        return Some("Vue".to_string());
    }
    if has("@nativescript/core") || has("tns-core-modules") {
        return Some("Core".to_string());
    }

    None
}

fn detect_ns_version(pkg: &serde_json::Value) -> Option<String> {
    get_dep_version(pkg, "@nativescript/core")
        .or_else(|| get_dep_version(pkg, "tns-core-modules"))
        .or_else(|| get_dep_version(pkg, "nativescript"))
}

fn detect_platforms(project_path: &str) -> Vec<String> {
    let mut platforms = Vec::new();
    if project_file(project_path, "App_Resources/Android").exists() {
        platforms.push("Android".to_string());
    }
    if project_file(project_path, "App_Resources/iOS").exists() {
        platforms.push("iOS".to_string());
    }
    platforms
}

fn analyze_project_path(project_path: &str) -> ProjectAnalysis {
    let pkg = read_package_json(project_path);

    let name = pkg
        .as_ref()
        .and_then(|v| v.get("name"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| folder_name(project_path));

    let framework = pkg.as_ref().and_then(detect_framework);
    let nativescript_version = pkg.as_ref().and_then(detect_ns_version);
    let platforms = detect_platforms(project_path);

    ProjectAnalysis {
        name,
        path: project_path.to_string(),
        nativescript_version,
        framework,
        platforms,
    }
}

#[tauri::command]
fn analyze_project(project_path: String) -> Result<ProjectAnalysis, String> {
    Ok(analyze_project_path(&project_path))
}

fn should_skip_dir(path: &Path) -> bool {
    let Some(name) = path.file_name().and_then(|s| s.to_str()) else {
        return false;
    };
    matches!(
        name,
        "node_modules" | "platforms" | ".git" | "dist" | "target" | ".idea" | ".vscode"
    )
}

fn discover_projects_recursive(dir: &Path, depth_left: u32, out: &mut Vec<ProjectAnalysis>) {
    if depth_left == 0 {
        return;
    }

    let package_json = dir.join("package.json");
    if package_json.exists() {
        if let Some(pkg) = read_package_json(dir.to_string_lossy().as_ref()) {
            if detect_ns_version(&pkg).is_some() {
                out.push(analyze_project_path(dir.to_string_lossy().as_ref()));
                return;
            }
        }
    }

    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        if should_skip_dir(&path) {
            continue;
        }
        discover_projects_recursive(&path, depth_left - 1, out);
    }
}

#[tauri::command]
fn discover_projects(root_path: String, max_depth: u32) -> Result<Vec<ProjectAnalysis>, String> {
    let root = PathBuf::from(&root_path);
    if !root.exists() {
        return Err("Folder not found".to_string());
    }
    if !root.is_dir() {
        return Err("Path is not a folder".to_string());
    }

    let mut results = Vec::new();
    discover_projects_recursive(&root, max_depth.max(1), &mut results);

    results.sort_by(|a, b| a.path.cmp(&b.path));
    results.dedup_by(|a, b| a.path == b.path);

    Ok(results)
}

fn run_command(program: &str, args: &[&str], cwd: Option<&str>) -> Result<CommandResult, String> {
    let mut cmd = Command::new(program);
    cmd.args(args);
    if let Some(cwd) = cwd {
        cmd.current_dir(cwd);
    }

    let output = cmd.output().map_err(|e| e.to_string())?;
    Ok(CommandResult {
        status_code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

fn run_command_vec(program: &str, args: Vec<String>, cwd: Option<&str>) -> Result<CommandResult, String> {
    let mut cmd = Command::new(program);
    cmd.args(args);
    if let Some(cwd) = cwd {
        cmd.current_dir(cwd);
    }

    let output = cmd.output().map_err(|e| e.to_string())?;
    Ok(CommandResult {
        status_code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[derive(Clone)]
struct ResolvedCli {
    launcher: String,
    base_args: Vec<String>,
    display: String,
}

fn run_resolved(cli: &ResolvedCli, args: &[&str], cwd: Option<&str>) -> Result<CommandResult, String> {
    let mut full_args = cli.base_args.clone();
    full_args.extend(args.iter().map(|a| a.to_string()));
    run_command_vec(&cli.launcher, full_args, cwd)
}

fn path_dirs() -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = env::var_os("PATH")
        .map(|v| env::split_paths(&v).collect())
        .unwrap_or_default();

    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = env::var("APPDATA") {
            dirs.push(PathBuf::from(appdata).join("npm"));
        }
        if let Ok(local_appdata) = env::var("LOCALAPPDATA") {
            dirs.push(PathBuf::from(local_appdata).join("npm"));
        }
    }

    if let Ok(nvm_bin) = env::var("NVM_BIN") {
        dirs.push(PathBuf::from(nvm_bin));
    }

    if let Ok(nvm_dir) = env::var("NVM_DIR") {
        let versions = PathBuf::from(nvm_dir).join("versions").join("node");
        if let Ok(entries) = fs::read_dir(versions) {
            for entry in entries.flatten() {
                let p = entry.path().join("bin");
                dirs.push(p);
            }
        }
    }

    if run_command("node", &["-v"], None).is_ok() {
        if let Ok(prefix) = run_command("npm", &["config", "get", "prefix"], None) {
            let prefix = prefix.stdout.trim();
            if !prefix.is_empty() {
                let prefix_path = PathBuf::from(prefix);
                dirs.push(prefix_path.clone());
                dirs.push(prefix_path.join("bin"));
            }
        }
    }

    dirs
}

fn first_existing_in_dirs(dirs: &[PathBuf], names: &[&str]) -> Option<PathBuf> {
    for dir in dirs {
        for name in names {
            let candidate = dir.join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

fn resolve_cli() -> Option<ResolvedCli> {
    if run_command("ns", &["--version"], None).is_ok() {
        return Some(ResolvedCli {
            launcher: "ns".to_string(),
            base_args: Vec::new(),
            display: "ns".to_string(),
        });
    }

    if run_command("nativescript", &["--version"], None).is_ok() {
        return Some(ResolvedCli {
            launcher: "nativescript".to_string(),
            base_args: Vec::new(),
            display: "nativescript".to_string(),
        });
    }

    let dirs = path_dirs();

    #[cfg(target_os = "windows")]
    let names = ["ns.cmd", "ns.exe", "nativescript.cmd", "nativescript.exe"];
    #[cfg(not(target_os = "windows"))]
    let names = ["ns", "nativescript"];

    let Some(path) = first_existing_in_dirs(&dirs, &names) else {
        return None;
    };

    let path_str = path.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_ascii_lowercase();
        if ext == "cmd" || ext == "bat" {
            return Some(ResolvedCli {
                launcher: "cmd".to_string(),
                base_args: vec!["/C".to_string(), path_str.clone()],
                display: format!("cmd /C {}", path_str),
            });
        }
    }

    Some(ResolvedCli {
        launcher: path_str.clone(),
        base_args: Vec::new(),
        display: path_str,
    })
}

fn doctor_command_check(
    id: &str,
    label: &str,
    program: &str,
    args: &[&str],
    hint: &str,
) -> DoctorCheck {
    match run_command(program, args, None) {
        Ok(result) => {
            let combined = format!("{}{}", result.stdout, result.stderr).trim().to_string();
            let summary = if combined.is_empty() {
                "Detected".to_string()
            } else {
                combined.lines().next().unwrap_or("Detected").to_string()
            };
            DoctorCheck {
                id: id.to_string(),
                label: label.to_string(),
                status: if result.status_code == Some(0) { "ok" } else { "warning" }.to_string(),
                summary,
                details: Some(combined),
                hint: None,
            }
        }
        Err(err) => DoctorCheck {
            id: id.to_string(),
            label: label.to_string(),
            status: "error".to_string(),
            summary: "Not found".to_string(),
            details: Some(err),
            hint: Some(hint.to_string()),
        },
    }
}

#[tauri::command]
fn doctor_checks() -> Vec<DoctorCheck> {
    let mut checks = Vec::new();

    checks.push(doctor_command_check(
        "node",
        "Node.js",
        "node",
        &["-v"],
        "Install Node.js and make sure it's available in PATH.",
    ));

    let ns_check = match resolve_cli() {
        Some(cli) => match run_resolved(&cli, &["--version"], None) {
            Ok(result) => {
                let combined = format!("{}{}", result.stdout, result.stderr).trim().to_string();
                let mut details = combined.clone();
                if !details.is_empty() {
                    details.push_str("\n\n");
                }
                details.push_str(&format!("Resolved command: {}", cli.display));

                DoctorCheck {
                    id: "nativescript".to_string(),
                    label: "NativeScript CLI".to_string(),
                    status: if result.status_code == Some(0) { "ok" } else { "warning" }.to_string(),
                    summary: format!(
                        "ns {}",
                        combined.lines().next().unwrap_or("Detected").trim()
                    ),
                    details: Some(details),
                    hint: None,
                }
            }
            Err(err) => DoctorCheck {
                id: "nativescript".to_string(),
                label: "NativeScript CLI".to_string(),
                status: "error".to_string(),
                summary: "Not found".to_string(),
                details: Some(err),
                hint: Some(
                    "Install NativeScript CLI (npm i -g nativescript). If you use nvm, ensure npm's global bin is in PATH."
                        .to_string(),
                ),
            },
        },
        None => DoctorCheck {
            id: "nativescript".to_string(),
            label: "NativeScript CLI".to_string(),
            status: "error".to_string(),
            summary: "Not found".to_string(),
            details: None,
            hint: Some(
                "Install NativeScript CLI (npm i -g nativescript). If you use nvm, ensure npm's global bin is in PATH."
                    .to_string(),
            ),
        },
    };
    checks.push(ns_check);

    checks.push(doctor_command_check(
        "java",
        "Java (JDK)",
        "java",
        &["-version"],
        "Install a JDK (e.g. Temurin) and verify JAVA_HOME and PATH.",
    ));

    let android_home = std::env::var("ANDROID_HOME").ok();
    let android_sdk_root = std::env::var("ANDROID_SDK_ROOT").ok();
    let android_path = android_home.or(android_sdk_root);
    checks.push(match android_path {
        Some(value) => DoctorCheck {
            id: "androidSdk".to_string(),
            label: "Android SDK".to_string(),
            status: "ok".to_string(),
            summary: "Detected".to_string(),
            details: Some(value),
            hint: None,
        },
        None => DoctorCheck {
            id: "androidSdk".to_string(),
            label: "Android SDK".to_string(),
            status: "warning".to_string(),
            summary: "Not detected".to_string(),
            details: None,
            hint: Some("Set ANDROID_HOME or ANDROID_SDK_ROOT to your SDK location.".to_string()),
        },
    });

    #[cfg(target_os = "macos")]
    {
        checks.push(doctor_command_check(
            "xcode",
            "Xcode",
            "xcodebuild",
            &["-version"],
            "Install Xcode and run xcode-select --install.",
        ));
        checks.push(doctor_command_check(
            "cocoapods",
            "CocoaPods",
            "pod",
            &["--version"],
            "Install CocoaPods (gem install cocoapods).",
        ));
    }

    #[cfg(not(target_os = "macos"))]
    {
        checks.push(DoctorCheck {
            id: "xcode".to_string(),
            label: "Xcode".to_string(),
            status: "skipped".to_string(),
            summary: "macOS only".to_string(),
            details: None,
            hint: None,
        });
        checks.push(DoctorCheck {
            id: "cocoapods".to_string(),
            label: "CocoaPods".to_string(),
            status: "skipped".to_string(),
            summary: "macOS only".to_string(),
            details: None,
            hint: None,
        });
    }

    checks
}

#[tauri::command]
fn run_ns(project_path: String, action: String) -> Result<CommandResult, String> {
    let args: Vec<&str> = match action.as_str() {
        "run-android" => vec!["run", "android"],
        "run-ios" => vec!["run", "ios"],
        "build" => vec!["build"],
        _ => return Err("Unknown action".to_string()),
    };

    let Some(cli) = resolve_cli() else {
        return Err(
            "NativeScript CLI was not found. Install it via: npm i -g nativescript".to_string(),
        );
    };

    run_resolved(&cli, &args, Some(&project_path))
}

#[tauri::command]
fn create_ns_project(
    project_name: String,
    parent_path: String,
    flavor: String,
    template: String,
    platform: String,
) -> Result<CommandResult, String> {
    let mut args = vec!["create", &project_name];

    let is_vision = platform == "vision";

    // Add flavor flag
    if is_vision {
        match flavor.as_str() {
            "angular" | "ng" => args.push("--vision-ng"),
            "vue" | "vue-ts" => args.push("--vision-vue"),
            "react" => args.push("--vision-react"),
            "solid" => args.push("--vision-solid"),
            "svelte" => args.push("--vision-svelte"),
            "js" | "ts" => args.push("--vision"),
            _ => {}
        }
    } else {
        match flavor.as_str() {
            "angular" | "ng" => args.push("--angular"),
            "vue" => args.push("--vue"),
            "vue-ts" => {
                args.push("--vue");
                args.push("--ts");
            }
            "react" => args.push("--react"),
            "solid" => args.push("--solid"),
            "js" => args.push("--js"),
            "ts" => args.push("--ts"),
            "svelte" => args.push("--svelte"),
            _ => {}
        }
    }

    // Add template flag
    if !template.is_empty() {
        args.push("--template");
        args.push(&template);
    }

    let Some(cli) = resolve_cli() else {
        return Err(
            "NativeScript CLI was not found. Install it via: npm i -g nativescript".to_string(),
        );
    };

    run_resolved(&cli, &args, Some(&parent_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_projects",
        sql: r#"
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          path TEXT NOT NULL UNIQUE,
          nativescript_version TEXT,
          framework TEXT,
          platforms TEXT,
          last_opened INTEGER
        );
        "#,
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nsforge.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            analyze_project,
            discover_projects,
            doctor_checks,
            run_ns,
            create_ns_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
