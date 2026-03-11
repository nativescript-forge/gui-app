use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

pub fn setup_environment() {
    if std::env::var("ANDROID_HOME").is_err() && std::env::var("ANDROID_SDK_ROOT").is_err() {
        #[cfg(target_os = "windows")]
        if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
            let sdk_path = PathBuf::from(local_appdata).join("Android").join("Sdk");
            if sdk_path.exists() {
                std::env::set_var("ANDROID_HOME", &sdk_path);
            } else {
                let default_paths = ["C:\\Android\\sdk", "C:\\Program Files (x86)\\Android\\android-sdk"];
                for path in default_paths {
                    let p = PathBuf::from(path);
                    if p.exists() {
                        std::env::set_var("ANDROID_HOME", &p);
                        break;
                    }
                }
            }
        }
        #[cfg(target_os = "macos")]
        if let Ok(home) = std::env::var("HOME") {
            let sdk_path = PathBuf::from(home).join("Library").join("Android").join("sdk");
            if sdk_path.exists() {
                std::env::set_var("ANDROID_HOME", &sdk_path);
            }
        }
        #[cfg(target_os = "linux")]
        if let Ok(home) = std::env::var("HOME") {
            let sdk_path = PathBuf::from(home).join("Android").join("Sdk");
            if sdk_path.exists() {
                std::env::set_var("ANDROID_HOME", &sdk_path);
            }
        }
    }

    if std::env::var("JAVA_HOME").is_err() {
        #[cfg(target_os = "windows")]
        {
            let maybe_java_dir1 = PathBuf::from("C:\\Program Files\\Java");
            let maybe_java_dir2 = PathBuf::from("C:\\Program Files\\Eclipse Adoptium");
            
            for base_dir in [maybe_java_dir1, maybe_java_dir2] {
                if base_dir.exists() {
                    if let Ok(entries) = std::fs::read_dir(base_dir) {
                        // find the first directory that looks like a jdk or jre
                        for entry in entries.flatten() {
                            if entry.path().is_dir() {
                                std::env::set_var("JAVA_HOME", entry.path());
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandResult {
    pub status_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub command: Option<String>,
    pub resolved_path: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdbDevice {
    pub id: String,
    pub model: String,
    pub status: String,
    pub platform: String,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BuildConfig {
    pub platform: String,
    pub mode: String,
    pub format: String,
    pub build_type: String,
    pub clean: bool,
    pub key_store_path: Option<String>,
    pub key_store_password: Option<String>,
    pub key_store_alias: Option<String>,
    pub key_store_alias_password: Option<String>,
    pub additional_options: Option<String>,
    // New flags
    pub aot: Option<bool>,
    pub snapshot: Option<bool>,
    pub compile_snapshot: Option<bool>,
    pub uglify: Option<bool>,
    pub report: Option<bool>,
    pub source_map: Option<bool>,
    pub hidden_source_map: Option<bool>,
    pub force: Option<bool>,
    pub compile_sdk: Option<String>,
    pub copy_to: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DoctorCheck {
    pub id: String,
    pub label: String,
    pub status: String,
    pub summary: String,
    pub details: Option<String>,
    pub hint: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NsReport {
    pub info: String,
    pub doctor: String,
    pub package_manager: String,
}

#[tauri::command]
pub async fn verify_tool(tool: String) -> Result<CommandResult, String> {
    let (program, args, env_vars) = match tool.as_str() {
        "node" => ("node", vec!["-v"], vec![]),
        "javac" => ("javac", vec!["-version"], vec!["JAVA_HOME"]),
        "adb" => {
            let adb_name = if cfg!(target_os = "windows") { "adb.exe" } else { "adb" };
            let env_vars = vec!["ANDROID_HOME", "ANDROID_SDK_ROOT"];
            
            // Add common Windows paths if not in env
            #[cfg(target_os = "windows")]
            {
                if let Ok(local_appdata) = env::var("LOCALAPPDATA") {
                    let sdk_path = PathBuf::from(local_appdata).join("Android").join("Sdk");
                    if sdk_path.exists() {
                         // We can't easily add to env_vars as it expects &str from match
                         // but we can handle it below.
                    }
                }
            }
            (adb_name, vec!["--version"], env_vars)
        },
        "ns" => {
             let cli_state = None; // verify_tool doesn't have access to state easily here without being modified
             if let Some(cli) = resolve_cli_with_cache(cli_state) {
                 let mut full_args = cli.base_args.clone();
                 full_args.push("-v".to_string());
                 return run_command_vec(&cli.launcher, full_args, None);
             }
             ("ns", vec!["-v"], vec![])
        },
        "brew" => ("brew", vec!["--version"], vec![]),
        "xcode-select" => ("xcode-select", vec!["-p"], vec![]),
        "pod" => ("pod", vec!["--version"], vec![]),
        _ => return Err(format!("Unknown tool: {}", tool)),
    };

    // Try normal execution first
    if let Ok(res) = run_command(program, &args, None) {
        if res.status_code == Some(0) {
            return Ok(res);
        }
    }

    // If failed, try to resolve via environment variables or common paths
    let mut search_roots = Vec::new();
    for env_var in env_vars {
        if let Ok(root) = env::var(env_var) {
            search_roots.push(PathBuf::from(root));
        }
    }

    // Add common paths as fallback
    #[cfg(target_os = "windows")]
    if tool == "adb" || tool == "javac" {
        if let Ok(local_appdata) = env::var("LOCALAPPDATA") {
            let sdk_path = PathBuf::from(local_appdata).join("Android").join("Sdk");
            if sdk_path.exists() {
                if env::var("ANDROID_HOME").is_err() {
                    env::set_var("ANDROID_HOME", &sdk_path);
                }
                search_roots.push(sdk_path);
            }
        }
        
        let common_sdk_paths = vec![
            "C:\\Android\\sdk",
            "C:\\Program Files (x86)\\Android\\android-sdk",
        ];
        
        for path in common_sdk_paths {
            let p = PathBuf::from(path);
            if p.exists() {
                if env::var("ANDROID_HOME").is_err() {
                    env::set_var("ANDROID_HOME", &p);
                }
                search_roots.push(p);
            }
        }
        
        if tool == "javac" {
            search_roots.push(PathBuf::from("C:\\Program Files\\Java"));
        }
    }

    for root_path in search_roots {
        if !root_path.exists() {
            continue;
        }
        
        // Define possible subdirectories where the binary might be
        let subdirs = match tool.as_str() {
            "javac" => vec!["bin"],
            "adb" => vec!["platform-tools"],
            _ => vec!["bin", ""],
        };

        for subdir in subdirs {
            let bin_path = if subdir.is_empty() {
                root_path.join(program)
            } else {
                root_path.join(subdir).join(program)
            };

            if bin_path.exists() {
                let bin_str = bin_path.to_string_lossy().to_string();
                if let Ok(res) = run_command(&bin_str, &args, None) {
                    if res.status_code == Some(0) {
                        return Ok(res);
                    }
                }
            }
        }
    }

    // Final fallback for Windows: try cmd /C
    #[cfg(target_os = "windows")]
    {
        if let Ok(res) = run_command(program, &args, None) {
             return Ok(res);
        }
    }

    Err(format!("Could not find or execute tool: {}", tool))
}

#[tauri::command]
pub async fn detect_available_package_managers() -> Vec<String> {
    let mut available = Vec::new();
    let pms = vec!["npm", "yarn", "pnpm", "bun"];

    for pm in pms {
        if let Ok(res) = run_command(pm, &["--version"], None) {
            if res.status_code == Some(0) {
                available.push(pm.to_string());
            }
        }
    }

    available
}

#[tauri::command]
pub async fn set_ns_package_manager(
    window: tauri::Window,
    cli_state: State<'_, CliState>,
    pm: String
) -> Result<CommandResult, String> {
    let cli = resolve_cli_with_cache(Some(cli_state)).ok_or("NativeScript CLI not found")?;
    
    // Run in a separate thread to avoid blocking the Tauri async runtime
    let result = tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();
        let args = ["package-manager", "set", &pm];
        run_resolved_streaming(&window, state, &cli, &args, None, "package-manager".to_string(), None, None)
    }).await.map_err(|e| e.to_string())??;

    Ok(CommandResult {
        status_code: result.status_code,
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command,
        resolved_path: result.resolved_path,
    })
}

#[derive(Clone)]
pub struct ResolvedCli {
    pub launcher: String,
    pub base_args: Vec<String>,
    pub display: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct InstalledPlugin {
    pub name: String,
    pub version: String,
    pub r#type: String, // "plugin" or "common module"
    pub source: String, // "Dependencies" or "Dev Dependencies"
}

#[tauri::command]
pub async fn scan_ns_plugins(project_path: String) -> Result<Vec<InstalledPlugin>, String> {
    let pkg_path = PathBuf::from(&project_path).join("package.json");
    if !pkg_path.exists() {
        return Err("Project package.json not found".to_string());
    }

    let pkg_content = fs::read_to_string(&pkg_path).map_err(|e| e.to_string())?;
    let pkg: serde_json::Value = serde_json::from_str(&pkg_content).map_err(|e| e.to_string())?;

    let mut all_packages = Vec::new();

    if let Some(deps) = pkg.get("dependencies").and_then(|d| d.as_object()) {
        for (name, version) in deps {
            all_packages.push((
                name.clone(),
                version.as_str().unwrap_or("").to_string(),
                "Dependencies".to_string(),
            ));
        }
    }

    if let Some(dev_deps) = pkg.get("devDependencies").and_then(|d| d.as_object()) {
        for (name, version) in dev_deps {
            all_packages.push((
                name.clone(),
                version.as_str().unwrap_or("").to_string(),
                "Dev Dependencies".to_string(),
            ));
        }
    }

    let mut scanned_plugins = Vec::new();

    for (name, version, source) in all_packages {
        let pkg_dir = PathBuf::from(&project_path).join("node_modules").join(&name);
        let pkg_json_path = pkg_dir.join("package.json");

        let mut is_plugin = false;

        if pkg_json_path.exists() {
            if let Ok(content) = fs::read_to_string(&pkg_json_path) {
                if let Ok(inner_pkg) = serde_json::from_str::<serde_json::Value>(&content) {
                    // Check for various suffixes in the package directory
                    let mut has_android = false;
                    let mut has_ios = false;

                    if let Ok(entries) = fs::read_dir(&pkg_dir) {
                        for entry in entries.flatten() {
                            if let Some(file_name) = entry.file_name().to_str() {
                                if file_name.ends_with(".android.d.ts")
                                    || file_name.ends_with(".android.d.js")
                                    || file_name.ends_with(".android.ts")
                                    || file_name.ends_with(".android.js")
                                {
                                    has_android = true;
                                }
                                if file_name.ends_with(".ios.d.ts")
                                    || file_name.ends_with(".ios.d.js")
                                    || file_name.ends_with(".ios.ts")
                                    || file_name.ends_with(".ios.js")
                                {
                                    has_ios = true;
                                }
                            }
                        }
                    }

                    // Check for both ios and android platforms in package.json
                    let platforms = inner_pkg.get("nativescript").and_then(|ns| ns.get("platforms"));
                    let has_platforms = platforms.and_then(|p| p.get("ios")).is_some()
                        && platforms.and_then(|p| p.get("android")).is_some();

                    if (has_android || has_ios) && has_platforms {
                        is_plugin = true;
                    }
                }
            }
        }

        scanned_plugins.push(InstalledPlugin {
            name,
            version,
            r#type: if is_plugin {
                "plugin".to_string()
            } else {
                "common module".to_string()
            },
            source,
        });
    }

    // Save to .nsforge/configs/plugins.json
    let config_dir = PathBuf::from(&project_path).join(".nsforge").join("configs");
    if !config_dir.exists() {
        let _ = fs::create_dir_all(&config_dir);
    }

    let plugins_json_path = config_dir.join("plugins.json");
    if let Ok(json_str) = serde_json::to_string_pretty(&scanned_plugins) {
        let _ = fs::write(plugins_json_path, json_str);
    }

    Ok(scanned_plugins)
}

pub fn run_command(
    program: &str,
    args: &[&str],
    cwd: Option<&str>,
) -> Result<CommandResult, String> {
    setup_environment();
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // Try raw command first
        let mut cmd = Command::new(program);
        cmd.args(args);
        cmd.creation_flags(CREATE_NO_WINDOW);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }

        if let Ok(output) = cmd.output() {
            return Ok(CommandResult {
                status_code: output.status.code(),
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                command: Some(format!("{} {}", program, args.join(" "))),
                resolved_path: Some(program.to_string()),
            });
        }

        // If it's a .cmd or .bat file, we MUST use cmd /C
        let is_script = program.to_lowercase().ends_with(".cmd") || program.to_lowercase().ends_with(".bat");

        if is_script {
            let mut cmd = Command::new("cmd");
            cmd.arg("/C");
            cmd.arg(program);
            cmd.args(args);
            cmd.creation_flags(CREATE_NO_WINDOW);
            if let Some(cwd) = cwd {
                cmd.current_dir(cwd);
            }
            let output = cmd.output().map_err(|e| e.to_string())?;
            return Ok(CommandResult {
                status_code: output.status.code(),
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                command: Some(format!("cmd /C {} {}", program, args.join(" "))),
                resolved_path: Some(program.to_string()),
            });
        }
        
        // Fallback for non-scripts or if direct call failed above
        let mut cmd = Command::new("cmd");
        cmd.arg("/C");
        cmd.arg(program);
        cmd.args(args);
        cmd.creation_flags(CREATE_NO_WINDOW);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }
        let output = cmd.output().map_err(|e| e.to_string())?;
        Ok(CommandResult {
            status_code: output.status.code(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            command: Some(format!("cmd /C {} {}", program, args.join(" "))),
            resolved_path: Some(program.to_string()),
        })
    }

    #[cfg(not(target_os = "windows"))]
    {
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
            command: Some(format!("{} {}", program, args.join(" "))),
            resolved_path: Some(program.to_string()),
        })
    }
}

pub fn run_command_vec(
    program: &str,
    args: Vec<String>,
    cwd: Option<&str>,
) -> Result<CommandResult, String> {
    setup_environment();
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // Try raw command first
        let mut cmd = Command::new(program);
        cmd.args(&args);
        cmd.creation_flags(CREATE_NO_WINDOW);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }

        if let Ok(output) = cmd.output() {
            return Ok(CommandResult {
                status_code: output.status.code(),
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                command: Some(format!("{} {}", program, args.join(" "))),
                resolved_path: Some(program.to_string()),
            });
        }

        // If it's a .cmd or .bat file, we MUST use cmd /C
        let is_script = program.to_lowercase().ends_with(".cmd") || program.to_lowercase().ends_with(".bat");

        if is_script {
            let mut cmd = Command::new("cmd");
            cmd.arg("/C");
            cmd.arg(program);
            cmd.args(&args);
            cmd.creation_flags(CREATE_NO_WINDOW);
            if let Some(cwd) = cwd {
                cmd.current_dir(cwd);
            }
            let output = cmd.output().map_err(|e| e.to_string())?;
            return Ok(CommandResult {
                status_code: output.status.code(),
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                command: Some(format!("cmd /C {} {}", program, args.join(" "))),
                resolved_path: Some(program.to_string()),
            });
        }

        // Fallback for non-scripts or if direct call failed above
        let mut cmd = Command::new("cmd");
        cmd.arg("/C");
        cmd.arg(program);
        cmd.args(&args);
        cmd.creation_flags(CREATE_NO_WINDOW);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }
        let output = cmd.output().map_err(|e| e.to_string())?;
        Ok(CommandResult {
            status_code: output.status.code(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            command: Some(format!("cmd /C {} {}", program, args.join(" "))),
            resolved_path: Some(program.to_string()),
        })
    }

    #[cfg(not(target_os = "windows"))]
    {
        let mut cmd = Command::new(program);
        cmd.args(&args);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }

        let output = cmd.output().map_err(|e| e.to_string())?;
        Ok(CommandResult {
            status_code: output.status.code(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            command: Some(format!("{} {}", program, args.join(" "))),
            resolved_path: Some(program.to_string()),
        })
    }
}

pub fn run_resolved(
    cli: &ResolvedCli,
    args: &[&str],
    cwd: Option<&str>,
) -> Result<CommandResult, String> {
    setup_environment();
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

pub fn resolve_cli() -> Option<ResolvedCli> {
    resolve_cli_with_cache(None)
}

pub fn resolve_cli_with_cache(cli_state: Option<State<'_, CliState>>) -> Option<ResolvedCli> {
    // 1. Check cache if available
    if let Some(state) = &cli_state {
        let lock = state.0.lock().unwrap();
        if let Some(cached) = &*lock {
            return Some(cached.clone());
        }
    }

    // 2. Try common direct paths first (Fast Path)
    #[cfg(target_os = "windows")]
    let resolved = {
        let mut found = None;
        let common_npm_paths = [
            env::var("APPDATA").ok().map(|p| PathBuf::from(p).join("npm")),
            env::var("LOCALAPPDATA").ok().map(|p| PathBuf::from(p).join("npm")),
        ];

        for path in common_npm_paths.into_iter().flatten() {
            for name in ["ns.cmd", "nativescript.cmd"] {
                let candidate = path.join(name);
                if candidate.is_file() {
                    let path_str = candidate.to_string_lossy().to_string();
                    found = Some(ResolvedCli {
                        launcher: "cmd".to_string(),
                        base_args: vec!["/C".to_string(), path_str.clone()],
                        display: format!("cmd /C {}", path_str),
                    });
                    break;
                }
            }
            if found.is_some() { break; }
        }
        found
    };
    #[cfg(not(target_os = "windows"))]
    let resolved: Option<String> = None;

    if let Some(r) = resolved {
        if let Some(state) = cli_state {
            let mut lock = state.0.lock().unwrap();
            *lock = Some(r.clone());
        }
        return Some(r);
    }

    // 3. If not found in common paths, do the full search (Slow Path)
    let dirs = path_dirs();

    // On Windows, we should prioritize .cmd files for npm-installed binaries
    #[cfg(target_os = "windows")]
    let names = ["ns.cmd", "ns.exe", "nativescript.cmd", "nativescript.exe", "tns.cmd", "tns.exe"];
    #[cfg(not(target_os = "windows"))]
    let names = ["ns", "nativescript", "tns"];

    // First, try to find the executable in PATH without spawning it
    if let Some(path) = first_existing_in_dirs(&dirs, &names) {
        let path_str = path.to_string_lossy().to_string();

        #[cfg(target_os = "windows")]
        {
            let ext = path
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            if ext == "cmd" || ext == "bat" {
                let r = ResolvedCli {
                    launcher: "cmd".to_string(),
                    base_args: vec!["/C".to_string(), path_str.clone()],
                    display: format!("cmd /C {}", path_str),
                };
                if let Some(state) = cli_state {
                    let mut lock = state.0.lock().unwrap();
                    *lock = Some(r.clone());
                }
                return Some(r);
            }
        }

        let r = ResolvedCli {
            launcher: path_str.clone(),
            base_args: Vec::new(),
            display: path_str,
        };
        if let Some(state) = cli_state {
            let mut lock = state.0.lock().unwrap();
            *lock = Some(r.clone());
        }
        return Some(r);
    }

    // Fallback: check if 'ns' is directly available in PATH (shell resolution)
    if run_command("ns", &["--version"], None).is_ok() {
        let r = ResolvedCli {
            launcher: "ns".to_string(),
            base_args: Vec::new(),
            display: "ns".to_string(),
        };
        if let Some(state) = cli_state {
            let mut lock = state.0.lock().unwrap();
            *lock = Some(r.clone());
        }
        return Some(r);
    }

    None
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
            let combined = format!("{}{}", result.stdout, result.stderr)
                .trim()
                .to_string();
            let summary = if combined.is_empty() {
                "Detected".to_string()
            } else {
                combined.lines().next().unwrap_or("Detected").to_string()
            };
            DoctorCheck {
                id: id.to_string(),
                label: label.to_string(),
                status: if result.status_code == Some(0) {
                    "ok"
                } else {
                    "warning"
                }
                .to_string(),
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
pub fn doctor_checks() -> Vec<DoctorCheck> {
    setup_environment();
    let mut checks = Vec::new();

    checks.push(doctor_command_check(
        "node",
        "Node.js",
        "node",
        &["-v"],
        "Install Node.js and make sure it's available in PATH.",
    ));

    // For doctor checks, we'll use resolve_cli without state to be simple, 
    // it will still use its internal logic.
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
pub async fn get_adb_devices() -> Result<Vec<AdbDevice>, String> {
    // 1. Find adb path
    let adb_path = if let Ok(res) = verify_tool("adb".to_string()).await {
        res.resolved_path.unwrap_or_else(|| {
            if cfg!(target_os = "windows") { "adb.exe".to_string() } else { "adb".to_string() }
        })
    } else {
        if cfg!(target_os = "windows") { "adb.exe".to_string() } else { "adb".to_string() }
    };

    let adb_cmd = adb_path.as_str();

    // Kill and Start server
    let _ = run_command(adb_cmd, &["kill-server"], None);
    let _ = run_command(adb_cmd, &["start-server"], None);

    // Get devices
    let output = run_command(adb_cmd, &["devices", "-l"], None)?;
    let mut devices = Vec::new();
    let mut start_parsing = false;

    for line in output.stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if line.starts_with("List of devices attached") {
            start_parsing = true;
            continue;
        }

        if !start_parsing {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            let id = parts[0].to_string();
            let status = parts[1].to_string();
            let mut model = id.clone();

            // Extract model from -l output (e.g., model:Pixel_4_API_30)
            for part in parts.iter().skip(2) {
                if part.starts_with("model:") {
                    model = part.replace("model:", "").replace("_", " ");
                }
            }

            devices.push(AdbDevice {
                id,
                model,
                status,
                platform: "android".to_string(),
            });
        }
    }

    // Also check for iOS devices if on macOS
    #[cfg(target_os = "macos")]
    {
        if let Ok(xc_output) = run_command("xcrun", &["simctl", "list", "devices", "booted"], None) {
            for line in xc_output.stdout.lines() {
                if line.contains("(") && line.contains(")") && line.contains("Booted") {
                    let parts: Vec<&str> = line.split('(').collect();
                    if parts.len() >= 2 {
                        let model = parts[0].trim().to_string();
                        let id_part = parts[1].split(')').next().unwrap_or("").trim();
                        devices.push(AdbDevice {
                            id: id_part.to_string(),
                            model,
                            status: "device".to_string(),
                            platform: "ios".to_string(),
                        });
                    }
                }
            }
        }
    }

    Ok(devices)
}

#[tauri::command]
pub async fn run_npm(
    window: tauri::Window,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<CommandResult, String> {
    let program = if cfg!(target_os = "windows") {
        "npm.cmd"
    } else {
        "npm"
    };

    let cli = ResolvedCli {
        launcher: program.to_string(),
        base_args: Vec::new(),
        display: program.to_string(),
    };

    let result = tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();
        let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
        run_resolved_streaming(&window, state, &cli, &args_refs, cwd.as_deref(), "npm".to_string(), None, None)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(CommandResult {
        status_code: result.status_code,
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command,
        resolved_path: result.resolved_path,
    })
}

#[tauri::command]
pub async fn run_npx(
    window: tauri::Window,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<CommandResult, String> {
    let program = if cfg!(target_os = "windows") {
        "npx.cmd"
    } else {
        "npx"
    };

    let cli = ResolvedCli {
        launcher: program.to_string(),
        base_args: Vec::new(),
        display: program.to_string(),
    };

    let result = tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();
        let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
        run_resolved_streaming(&window, state, &cli, &args_refs, cwd.as_deref(), "npx".to_string(), None, None)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(CommandResult {
        status_code: result.status_code,
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command,
        resolved_path: result.resolved_path,
    })
}

#[tauri::command]
pub async fn run_ns(
    window: tauri::Window,
    _state: State<'_, ProcessState>,
    cli_state: State<'_, CliState>,
    project_path: String,
    action: String,
    device_id: Option<String>,
    build_config: Option<BuildConfig>,
    source_path: Option<String>,
    background_color: Option<String>,
) -> Result<CommandResult, String> {
    let mut args: Vec<String> = match action.as_str() {
        "run-android" | "run-ios" | "debug-android" | "debug-ios" => {
            let cmd = if action.starts_with("run") { "run" } else { "debug" };
            let platform = if action.ends_with("android") { "android" } else { "ios" };
            let mut r_args = vec![cmd.to_string(), platform.to_string()];
            
            if let Some(config) = &build_config {
                // Add optimization and additional flags
                if config.uglify.unwrap_or(false) {
                    r_args.push("--env.uglify".to_string());
                }
                if config.aot.unwrap_or(false) {
                    r_args.push("--env.aot".to_string());
                }
                if config.snapshot.unwrap_or(false) {
                    r_args.push("--env.snapshot".to_string());
                }
                if config.compile_snapshot.unwrap_or(false) {
                    r_args.push("--env.compileSnapshot".to_string());
                }
                if config.report.unwrap_or(false) {
                    r_args.push("--env.report".to_string());
                }
                if config.source_map.unwrap_or(false) {
                    r_args.push("--env.sourceMap".to_string());
                }
                if config.hidden_source_map.unwrap_or(false) {
                    r_args.push("--env.hiddenSourceMap".to_string());
                }
                if config.force.unwrap_or(false) {
                    r_args.push("--force".to_string());
                }
                
                // Add additional options at the end
                if let Some(options) = &config.additional_options {
                    if !options.is_empty() {
                        for opt in options.split_whitespace() {
                            r_args.push(opt.to_string());
                        }
                    }
                }
            }
            r_args
        }
        "clean" => vec!["clean".to_string()],
        "install" => vec!["install".to_string()],
        "doctor" => vec!["doctor".to_string()],
        "info" => vec!["info".to_string()],
        "update" => vec!["update".to_string()],
        "migrate" => vec!["migrate".to_string()],
        "package-manager" => vec!["package-manager".to_string()],
        "platform-add-android" => vec!["platform".to_string(), "add".to_string(), "android".to_string()],
        "platform-add-ios" => vec!["platform".to_string(), "add".to_string(), "ios".to_string()],
        "plugin-add" => {
            let mut p_args = vec!["plugin".to_string(), "add".to_string()];
            if let Some(name) = &source_path {
                if !name.is_empty() {
                    p_args.push(name.clone());
                }
            }
            p_args
        }
        "plugin-remove" => {
            let mut p_args = vec!["plugin".to_string(), "remove".to_string()];
            if let Some(name) = &source_path {
                if !name.is_empty() {
                    p_args.push(name.clone());
                }
            }
            p_args
        }
        "resources-update" => vec!["resources".to_string(), "update".to_string()],
        "resources-generate-splashes" => {
            let mut res_args = vec![
                "resources".to_string(),
                "generate".to_string(),
                "splashes".to_string(),
            ];
            if let Some(path) = &source_path {
                if !path.is_empty() {
                    res_args.push(path.clone());
                }
            }
            if let Some(color) = &background_color {
                if !color.is_empty() {
                    res_args.push("--background".to_string());
                    res_args.push(color.clone());
                }
            }
            res_args
        }
        "resources-generate-icons" => {
            let mut res_args = vec![
                "resources".to_string(),
                "generate".to_string(),
                "icons".to_string(),
            ];
            if let Some(path) = &source_path {
                if !path.is_empty() {
                    res_args.push(path.clone());
                }
            }
            res_args
        }
        "fonts" => vec!["fonts".to_string()],
        "build" => {
            if let Some(config) = &build_config {
                let mut b_args = vec!["build".to_string(), config.platform.clone()];
                if config.mode == "release" {
                    b_args.push("--release".to_string());
                }

                if config.platform == "android" {
                    if config.format == "aab" {
                        b_args.push("--aab".to_string());
                    }

                    // Validation for Android Release
                    if config.mode == "release" {
                        let missing_keystore = config.key_store_path.as_ref().map_or(true, |s| s.is_empty()) ||
                                              config.key_store_password.as_ref().map_or(true, |s| s.is_empty()) ||
                                              config.key_store_alias.as_ref().map_or(true, |s| s.is_empty()) ||
                                              config.key_store_alias_password.as_ref().map_or(true, |s| s.is_empty());
                        
                        if missing_keystore {
                            return Err("When producing a release build for Android, you must specify all key-store options (path, password, alias, and alias password).".to_string());
                        }
                    }

                    // Add optimization and additional flags
                    if config.uglify.unwrap_or(false) {
                        b_args.push("--env.uglify".to_string());
                    }
                    if config.aot.unwrap_or(false) {
                        b_args.push("--env.aot".to_string());
                    }
                    if config.snapshot.unwrap_or(false) {
                        b_args.push("--env.snapshot".to_string());
                    }
                    if config.compile_snapshot.unwrap_or(false) {
                        b_args.push("--env.compileSnapshot".to_string());
                    }
                    if config.report.unwrap_or(false) {
                        b_args.push("--env.report".to_string());
                    }
                    if config.source_map.unwrap_or(false) {
                        b_args.push("--env.sourceMap".to_string());
                    }
                    if config.hidden_source_map.unwrap_or(false) {
                        b_args.push("--env.hiddenSourceMap".to_string());
                    }
                    if config.force.unwrap_or(false) {
                        b_args.push("--force".to_string());
                    }
                    if let Some(sdk) = &config.compile_sdk {
                        if !sdk.is_empty() {
                            b_args.push("--compileSdk".to_string());
                            b_args.push(sdk.clone());
                        }
                    }
                    if let Some(copy_to) = &config.copy_to {
                        if !copy_to.is_empty() {
                            b_args.push("--copy-to".to_string());
                            b_args.push(copy_to.clone());
                        }
                    }

                    // Add keystore args if provided (usually for release)
                    if config.mode == "release" {
                        if let Some(path) = &config.key_store_path {
                            if !path.is_empty() {
                                b_args.push("--key-store-path".to_string());
                                b_args.push(path.clone());
                            }
                        }
                        if let Some(pwd) = &config.key_store_password {
                            if !pwd.is_empty() {
                                b_args.push("--key-store-password".to_string());
                                b_args.push(pwd.clone());
                            }
                        }
                        if let Some(alias) = &config.key_store_alias {
                            if !alias.is_empty() {
                                b_args.push("--key-store-alias".to_string());
                                b_args.push(alias.clone());
                            }
                        }
                        if let Some(alias_pwd) = &config.key_store_alias_password {
                            if !alias_pwd.is_empty() {
                                b_args.push("--key-store-alias-password".to_string());
                                b_args.push(alias_pwd.clone());
                            }
                        }
                    }
                }
                if config.platform == "ios" && config.build_type == "simulator" {
                    b_args.push("--emulator".to_string());
                }

                // Add additional options at the end
                if let Some(options) = &config.additional_options {
                    if !options.is_empty() {
                        // Split by whitespace but respect quotes if possible (simple split for now)
                        for opt in options.split_whitespace() {
                            b_args.push(opt.to_string());
                        }
                    }
                }
                b_args
            } else {
                vec!["build".to_string()]
            }
        }
        _ => return Err("Unknown action".to_string()),
    };

    if let Some(id) = &device_id {
        if !id.is_empty() {
            args.push("--device".to_string());
            args.push(id.clone());
        }
    }

    let Some(cli) = resolve_cli_with_cache(Some(cli_state)) else {
        return Err(
            "NativeScript CLI was not found. Install it via: npm i -g nativescript".to_string(),
        );
    };

    let args_owned: Vec<String> = args.iter().map(|s| s.to_string()).collect();
    let project_path_owned = project_path.clone();
    let build_config_owned = build_config.clone();

    let action_owned = action.clone();
    let device_id_owned = device_id.clone();
    
    // Extract package name (appId) from package.json if possible
    let pkg_path = std::path::Path::new(&project_path).join("package.json");
    let package_name = if pkg_path.exists() {
        if let Ok(content) = std::fs::read_to_string(pkg_path) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&content) {
                // NativeScript appId is often in nativescript.id or just the name
                v.get("nativescript")
                    .and_then(|ns| ns.get("id"))
                    .and_then(|id| id.as_str())
                    .or_else(|| v.get("name").and_then(|n| n.as_str()))
                    .map(|s| s.to_string())
            } else { None }
        } else { None }
    } else { None };

    let result = tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();

        // Handle ns clean if requested
        if let Some(config) = &build_config_owned {
            if config.clean {
                let _ = window.emit("create-project-log", LogPayload { message: "Starting clean build...\n".to_string() });
                let clean_args = ["clean"];
                let _ = run_resolved_streaming(&window, state.clone(), &cli, &clean_args, Some(&project_path_owned), "clean".to_string(), None, None);
                let _ = window.emit("create-project-log", LogPayload { message: "\n--- Clean completed, starting build ---\n".to_string() });
            }
        }

        let args_str: Vec<&str> = args_owned.iter().map(|s| s.as_str()).collect();

        if action_owned == "fonts" {
            // Use non-streaming version for fonts to get stdout directly
            run_resolved(&cli, &args_str, Some(&project_path_owned))
        } else {
            run_resolved_streaming(&window, state, &cli, &args_str, Some(&project_path_owned), action_owned, device_id_owned, package_name)
        }
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(CommandResult {
        status_code: result.status_code,
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command,
        resolved_path: result.resolved_path,
    })
}

use tauri::{Emitter, State, Manager};
use std::sync::Mutex;

pub struct ActiveProcess {
    pub child: std::process::Child,
    pub action: String,
    pub device_id: Option<String>,
    pub package_name: Option<String>,
}

pub struct ProcessState(pub Mutex<Option<ActiveProcess>>);

pub struct CliState(pub Mutex<Option<ResolvedCli>>);

#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProcessStatusPayload {
    pub status: String, // "starting", "building", "running", "finished", "error", "terminated"
    pub action: String,
    pub device_id: Option<String>,
    pub exit_code: Option<i32>,
    pub message: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogPayload {
    pub message: String,
}

// ... existing structs ...

pub fn run_resolved_streaming(
    window: &tauri::Window,
    state: State<'_, ProcessState>,
    cli: &ResolvedCli,
    args: &[&str],
    cwd: Option<&str>,
    action: String,
    device_id: Option<String>,
    package_name: Option<String>,
) -> Result<CommandResult, String> {
    setup_environment();
    let mut full_args = cli.base_args.clone();
    full_args.extend(args.iter().map(|a| a.to_string()));

    let _ = window.emit("ns-process-status", ProcessStatusPayload {
        status: "starting".to_string(),
        action: action.clone(),
        device_id: device_id.clone(),
        exit_code: None,
        message: Some("Initializing...".to_string()),
    });

    let mut cmd = Command::new(&cli.launcher);
    cmd.args(full_args.clone());
    cmd.env("CI", "true");
    if let Some(cwd) = cwd {
        cmd.current_dir(cwd);
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| {
        let err_msg = format!("Failed to spawn command: {}\n", e);
        let _ = window.emit("create-project-log", LogPayload { message: err_msg.clone() });
        let _ = window.emit("ns-process-status", ProcessStatusPayload {
            status: "error".to_string(),
            action: action.clone(),
            device_id: device_id.clone(),
            exit_code: None,
            message: Some(err_msg.clone()),
        });
        e.to_string()
    })?;

    let _ = window.emit("create-project-log", LogPayload { 
        message: format!("Executing: {} {}\n", 
            cli.launcher, 
            args.iter().map(|&a| {
                if a.contains("password") || a.contains("alias") {
                    "********"
                } else {
                    a
                }
            }).collect::<Vec<_>>().join(" ")) 
    });

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // Store child in state
    {
        let mut lock = state.0.lock().unwrap();
        *lock = Some(ActiveProcess {
            child,
            action: action.clone(),
            device_id: device_id.clone(),
            package_name: package_name.clone(),
        });
    }

    let window_clone = window.clone();
    let action_clone = action.clone();
    let device_id_clone = device_id.clone();
    
    // Shared buffer for logs with interior mutability and thread safety
    let log_buffer = std::sync::Arc::new(std::sync::Mutex::new(String::new()));
    let log_buffer_stdout = log_buffer.clone();
    let log_buffer_stderr = log_buffer.clone();

    let stdout_thread = std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line_content) = line {
                {
                    let mut buffer = log_buffer_stdout.lock().unwrap();
                    buffer.push_str(&format!("{}\n", line_content));
                }
                
                // Parse status
                if line_content.contains("Preparing project...") || line_content.contains("Building project...") {
                    let _ = window_clone.emit("ns-process-status", ProcessStatusPayload {
                        status: "building".to_string(),
                        action: action_clone.clone(),
                        device_id: device_id_clone.clone(),
                        exit_code: None,
                        message: Some(line_content.clone()),
                    });
                } else if line_content.contains("Successfully synced on device") || line_content.contains("Successfully installed on device") {
                    let _ = window_clone.emit("ns-process-status", ProcessStatusPayload {
                        status: "running".to_string(),
                        action: action_clone.clone(),
                        device_id: device_id_clone.clone(),
                        exit_code: None,
                        message: Some("App is running".to_string()),
                    });
                }
            }
        }
    });

    let window_clone = window.clone();
    let action_clone = action.clone();
    let device_id_clone = device_id.clone();
    let stderr_thread = std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line_content) = line {
                {
                    let mut buffer = log_buffer_stderr.lock().unwrap();
                    buffer.push_str(&format!("{}\n", line_content));
                }
                
                if line_content.to_lowercase().contains("error") {
                    let _ = window_clone.emit("ns-process-status", ProcessStatusPayload {
                        status: "error".to_string(),
                        action: action_clone.clone(),
                        device_id: device_id_clone.clone(),
                        exit_code: None,
                        message: Some(line_content.clone()),
                    });
                }
            }
        }
    });

    // Buffering/Throttling Thread: Emits logs to frontend every 100ms
    let window_emitter = window.clone();
    let buffer_reader = log_buffer.clone();
    let _throttle_thread = std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(150));
            let logs_to_send = {
                let mut buffer = buffer_reader.lock().unwrap();
                if buffer.is_empty() {
                    None
                } else {
                    let content = buffer.clone();
                    buffer.clear();
                    Some(content)
                }
            };

            if let Some(message) = logs_to_send {
                let _ = window_emitter.emit("create-project-log", LogPayload { message });
            }

            // Check if we should exit (this is crude, but we wait for other threads later)
            // A more robust way would be a flag, but for a simple optimization this works
            // as it will be joined eventually.
        }
    });

    // Wait for child to finish without holding the lock continuously
    let status = loop {
        {
            let mut lock = state.0.lock().unwrap();
            if let Some(process) = lock.as_mut() {
                match process.child.try_wait() {
                    Ok(Some(status)) => break Ok(status),
                    Ok(None) => {} // Still running
                    Err(e) => break Err(e.to_string()),
                }
            } else {
                break Err("Process was terminated".to_string());
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(200));
    };

    let _ = stdout_thread.join();
    let _ = stderr_thread.join();

    let status = status?;
    
    let _ = window.emit("ns-process-status", ProcessStatusPayload {
        status: if status.success() { "finished".to_string() } else { "error".to_string() },
        action: action.clone(),
        device_id: device_id.clone(),
        exit_code: status.code(),
        message: Some(format!("Process exited with status: {}", status)),
    });

    Ok(CommandResult {
        status_code: status.code(),
        stdout: "Logs sent via events".to_string(),
        stderr: "".to_string(),
        command: Some(format!("{} {}", cli.launcher, full_args.join(" "))),
        resolved_path: Some(cli.launcher.clone()),
    })
}

#[tauri::command]
pub async fn get_ns_report(cli_state: State<'_, CliState>) -> Result<NsReport, String> {
    let cli = resolve_cli_with_cache(Some(cli_state)).ok_or("NativeScript CLI not found")?;

    // Execute commands in parallel for better performance using Tauri's async runtime
    let info_handle = {
        let cli = cli.clone();
        tauri::async_runtime::spawn(async move {
            run_resolved(&cli, &["info"], None)
                .map(|r| r.stdout + &r.stderr)
                .unwrap_or_else(|e| e)
        })
    };

    let doctor_handle = {
        let cli = cli.clone();
        tauri::async_runtime::spawn(async move {
            run_resolved(&cli, &["doctor"], None)
                .map(|r| r.stdout + &r.stderr)
                .unwrap_or_else(|e| e)
        })
    };

    let pm_handle = {
        let cli = cli.clone();
        tauri::async_runtime::spawn(async move {
            run_resolved(&cli, &["package-manager"], None)
                .map(|r| r.stdout + &r.stderr)
                .unwrap_or_else(|e| e)
        })
    };

    let info = info_handle.await.unwrap_or_else(|_| "Failed to join info thread".to_string());
    let doctor = doctor_handle.await.unwrap_or_else(|_| "Failed to join doctor thread".to_string());
    let package_manager = pm_handle.await.unwrap_or_else(|_| "Failed to join package-manager thread".to_string());

    Ok(NsReport {
        info,
        doctor,
        package_manager,
    })
}

#[tauri::command]
pub async fn stop_ns_command(window: tauri::Window, state: State<'_, ProcessState>) -> Result<(), String> {
    let mut lock = state.0.lock().unwrap();
    if let Some(mut process) = lock.take() {
        let _ = window.emit("create-project-log", LogPayload { message: "\n--- Process stop requested ---\n".to_string() });
        
        let _ = window.emit("ns-process-status", ProcessStatusPayload {
            status: "terminated".to_string(),
            action: process.action.clone(),
            device_id: process.device_id.clone(),
            exit_code: None,
            message: Some("Process termination requested".to_string()),
        });

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            // On Windows, taskkill /F /T /PID is better for killing process trees
            let pid = process.child.id();
            let _ = Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = process.child.kill();
        }

        // Try to force stop the app on the device if it's Android and we have package name
        if let (Some(device_id), Some(pkg)) = (process.device_id, process.package_name) {
            if process.action.contains("android") {
                let _ = window.emit("create-project-log", LogPayload { message: format!("Stopping app {} on device {}...\n", pkg, device_id) });
                
                #[cfg(target_os = "windows")]
                {
                    use std::os::windows::process::CommandExt;
                    const CREATE_NO_WINDOW: u32 = 0x08000000;
                    let _ = Command::new("adb")
                        .args(["-s", &device_id, "shell", "am", "force-stop", &pkg])
                        .creation_flags(CREATE_NO_WINDOW)
                        .output();
                }
                #[cfg(not(target_os = "windows"))]
                {
                    let _ = Command::new("adb")
                        .args(["-s", &device_id, "shell", "am", "force-stop", &pkg])
                        .output();
                }
            }
        }

        let _ = window.emit("create-project-log", LogPayload { message: "--- Process terminated ---\n".to_string() });
    }
    Ok(())
}

#[tauri::command]
pub async fn create_ns_project(
    window: tauri::Window,
    cli_state: State<'_, CliState>,
    project_name: String,
    parent_path: String,
    flavor: String,
    template: String,
    platform: String,
) -> Result<CommandResult, String> {
    let mut args = vec!["create".to_string(), project_name];

    let is_vision = platform == "vision";

    if !template.is_empty() && template != "none" {
        args.push("--template".to_string());
        args.push(template);
    } else {
        if is_vision {
            match flavor.as_str() {
                "angular" | "ng" => args.push("--vision-ng".to_string()),
                "vue" | "vue-ts" => args.push("--vision-vue".to_string()),
                "react" => args.push("--vision-react".to_string()),
                "solid" => args.push("--vision-solid".to_string()),
                "svelte" => args.push("--vision-svelte".to_string()),
                "js" | "ts" => args.push("--vision".to_string()),
                _ => {}
            }
        } else {
            match flavor.as_str() {
                "angular" | "ng" => args.push("--ng".to_string()),
                "vue" | "vue-ts" => args.push("--vue".to_string()),
                "react" => args.push("--react".to_string()),
                "solid" => args.push("--solid".to_string()),
                "svelte" => args.push("--svelte".to_string()),
                "js" => {},
                "ts" => args.push("--ts".to_string()),
                _ => {}
            }
        }
    }

    let Some(cli) = resolve_cli_with_cache(Some(cli_state)) else {
        return Err(
            "NativeScript CLI was not found. Install it via: npm i -g nativescript".to_string(),
        );
    };

    let args_owned: Vec<String> = args.iter().map(|s| s.to_string()).collect();
    
    // Run in a separate thread to avoid blocking the Tauri async runtime
    let result = tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();
        let args_refs: Vec<&str> = args_owned.iter().map(|s| s.as_str()).collect();
        run_resolved_streaming(&window, state, &cli, &args_refs, Some(&parent_path), "create".to_string(), None, None)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(CommandResult {
        status_code: result.status_code,
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command,
        resolved_path: result.resolved_path,
    })
}
