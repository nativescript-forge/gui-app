use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandResult {
    pub status_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub command: Option<String>,
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
pub async fn detect_available_package_managers() -> Vec<String> {
    let mut available = Vec::new();
    let pms = vec!["npm", "yarn", "pnpm", "bun"];

    for pm in pms {
        if run_command(pm, &["--version"], None).is_ok() {
            available.push(pm.to_string());
        }
    }

    available
}

#[tauri::command]
pub async fn set_ns_package_manager(
    window: tauri::Window,
    pm: String
) -> Result<CommandResult, String> {
    let cli = resolve_cli().ok_or("NativeScript CLI not found")?;
    
    // Run in a separate thread to avoid blocking the Tauri async runtime
    tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();
        let args = ["package-manager", "set", &pm];
        run_resolved_streaming(&window, state, &cli, &args, None)
    }).await.map_err(|e| e.to_string())?
}

#[derive(Clone)]
pub struct ResolvedCli {
    pub launcher: String,
    pub base_args: Vec<String>,
    pub display: String,
}

pub fn run_command(
    program: &str,
    args: &[&str],
    cwd: Option<&str>,
) -> Result<CommandResult, String> {
    #[cfg(target_os = "windows")]
    {
        // Try raw command first
        let mut cmd = Command::new(program);
        cmd.args(args);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }

        if let Ok(output) = cmd.output() {
            return Ok(CommandResult {
                status_code: output.status.code(),
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                command: Some(format!("{} {}", program, args.join(" "))),
            });
        }

        // If failed, try with cmd /C
        let mut cmd = Command::new("cmd");
        cmd.arg("/C");
        cmd.arg(program);
        cmd.args(args);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }
        let output = cmd.output().map_err(|e| e.to_string())?;
        Ok(CommandResult {
            status_code: output.status.code(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            command: Some(format!("cmd /C {} {}", program, args.join(" "))),
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
        })
    }
}

pub fn run_command_vec(
    program: &str,
    args: Vec<String>,
    cwd: Option<&str>,
) -> Result<CommandResult, String> {
    #[cfg(target_os = "windows")]
    {
        // Try raw command first
        let mut cmd = Command::new(program);
        cmd.args(&args);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }

        if let Ok(output) = cmd.output() {
            return Ok(CommandResult {
                status_code: output.status.code(),
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                command: Some(format!("{} {}", program, args.join(" "))),
            });
        }

        // If failed, try with cmd /C
        let mut cmd = Command::new("cmd");
        cmd.arg("/C");
        cmd.arg(program);
        cmd.args(&args);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }
        let output = cmd.output().map_err(|e| e.to_string())?;
        Ok(CommandResult {
            status_code: output.status.code(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            command: Some(format!("cmd /C {} {}", program, args.join(" "))),
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
        })
    }
}

pub fn run_resolved(
    cli: &ResolvedCli,
    args: &[&str],
    cwd: Option<&str>,
) -> Result<CommandResult, String> {
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
    // 1. Try common direct paths first (Fast Path)
    #[cfg(target_os = "windows")]
    {
        let common_npm_paths = [
            env::var("APPDATA").ok().map(|p| PathBuf::from(p).join("npm")),
            env::var("LOCALAPPDATA").ok().map(|p| PathBuf::from(p).join("npm")),
        ];

        for path in common_npm_paths.into_iter().flatten() {
            for name in ["ns.cmd", "nativescript.cmd"] {
                let candidate = path.join(name);
                if candidate.is_file() {
                    let path_str = candidate.to_string_lossy().to_string();
                    return Some(ResolvedCli {
                        launcher: "cmd".to_string(),
                        base_args: vec!["/C".to_string(), path_str.clone()],
                        display: format!("cmd /C {}", path_str),
                    });
                }
            }
        }
    }

    // 2. If not found in common paths, do the full search (Slow Path)
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
                return Some(ResolvedCli {
                    launcher: "cmd".to_string(),
                    base_args: vec!["/C".to_string(), path_str.clone()],
                    display: format!("cmd /C {}", path_str),
                });
            }
        }

        return Some(ResolvedCli {
            launcher: path_str.clone(),
            base_args: Vec::new(),
            display: path_str,
        });
    }

    // Fallback: check if 'ns' is directly available in PATH (shell resolution)
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

    if run_command("tns", &["--version"], None).is_ok() {
        return Some(ResolvedCli {
            launcher: "tns".to_string(),
            base_args: Vec::new(),
            display: "tns".to_string(),
        });
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
pub async fn get_adb_devices() -> Result<Vec<AdbDevice>, String> {
    // 1. Try to find adb
    let adb_cmd = if cfg!(target_os = "windows") {
        "adb.exe"
    } else {
        "adb"
    };

    // Kill and Start server
    let _ = run_command(adb_cmd, &["kill-server"], None);
    let _ = run_command(adb_cmd, &["start-server"], None);

    // Get devices
    let output = run_command(adb_cmd, &["devices", "-l"], None)?;
    let mut devices = Vec::new();

    for line in output.stdout.lines().skip(1) {
        if line.trim().is_empty() {
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

    tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();
        let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
        run_resolved_streaming(&window, state, &cli, &args_refs, cwd.as_deref())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn run_ns(
    window: tauri::Window,
    project_path: String,
    action: String,
    device_id: Option<String>,
    build_config: Option<BuildConfig>,
    source_path: Option<String>,
    background_color: Option<String>,
) -> Result<CommandResult, String> {
    let mut args: Vec<String> = match action.as_str() {
        "run-android" => vec!["run".to_string(), "android".to_string()],
        "run-ios" => vec!["run".to_string(), "ios".to_string()],
        "debug-android" => vec!["debug".to_string(), "android".to_string()],
        "debug-ios" => vec!["debug".to_string(), "ios".to_string()],
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

    if let Some(id) = device_id {
        if !id.is_empty() {
            args.push("--device".to_string());
            args.push(id);
        }
    }

    let Some(cli) = resolve_cli() else {
        return Err(
            "NativeScript CLI was not found. Install it via: npm i -g nativescript".to_string(),
        );
    };

    let args_owned: Vec<String> = args.iter().map(|s| s.to_string()).collect();
    let project_path_owned = project_path.clone();
    let build_config_owned = build_config.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();

        // Handle ns clean if requested
        if let Some(config) = &build_config_owned {
            if config.clean {
                let _ = window.emit("create-project-log", LogPayload { message: "Starting clean build...\n".to_string() });
                let clean_args = ["clean"];
                let _ = run_resolved_streaming(&window, state.clone(), &cli, &clean_args, Some(&project_path_owned));
                let _ = window.emit("create-project-log", LogPayload { message: "\n--- Clean completed, starting build ---\n".to_string() });
            }
        }

        let args_str: Vec<&str> = args_owned.iter().map(|s| s.as_str()).collect();
        run_resolved_streaming(&window, state, &cli, &args_str, Some(&project_path_owned))
    })
    .await
    .map_err(|e| e.to_string())?
}

use tauri::{Emitter, State, Manager};
use std::sync::Mutex;

pub struct ProcessState(pub Mutex<Option<std::process::Child>>);

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
) -> Result<CommandResult, String> {
    let mut full_args = cli.base_args.clone();
    full_args.extend(args.iter().map(|a| a.to_string()));

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
        *lock = Some(child);
    }

    let window_clone = window.clone();
    let stdout_thread = std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line_content) = line {
                let _ = window_clone.emit("create-project-log", LogPayload { message: format!("{}\n", line_content) });
            }
        }
    });

    let window_clone = window.clone();
    let stderr_thread = std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line_content) = line {
                let _ = window_clone.emit("create-project-log", LogPayload { message: format!("{}\n", line_content) });
            }
        }
    });

    // Wait for child to finish without holding the lock continuously
    let status = loop {
        {
            let mut lock = state.0.lock().unwrap();
            if let Some(child) = lock.as_mut() {
                match child.try_wait() {
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

    Ok(CommandResult {
        status_code: status.code(),
        stdout: "Logs sent via events".to_string(),
        stderr: "".to_string(),
        command: Some(format!("{} {}", cli.launcher, full_args.join(" "))),
    })
}

#[tauri::command]
pub async fn get_ns_report() -> Result<NsReport, String> {
    let cli = resolve_cli().ok_or("NativeScript CLI not found")?;

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
    if let Some(child) = lock.take() {
        let _ = window.emit("create-project-log", LogPayload { message: "\n--- Process stop requested ---\n".to_string() });
        #[cfg(target_os = "windows")]
        {
            // On Windows, taskkill /F /T /PID is better for killing process trees
            let pid = child.id();
            let _ = Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let mut child = child;
            let _ = child.kill();
        }
        let _ = window.emit("create-project-log", LogPayload { message: "--- Process terminated ---\n".to_string() });
    }
    Ok(())
}

#[tauri::command]
pub async fn create_ns_project(
    window: tauri::Window,
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

    let Some(cli) = resolve_cli() else {
        return Err(
            "NativeScript CLI was not found. Install it via: npm i -g nativescript".to_string(),
        );
    };

    let args_owned: Vec<String> = args.iter().map(|s| s.to_string()).collect();
    
    // Run in a separate thread to avoid blocking the Tauri async runtime
    tauri::async_runtime::spawn_blocking(move || {
        let state = window.state::<ProcessState>();
        let args_refs: Vec<&str> = args_owned.iter().map(|s| s.as_str()).collect();
        run_resolved_streaming(&window, state, &cli, &args_refs, Some(&parent_path))
    })
    .await
    .map_err(|e| e.to_string())?
}
