use serde::Serialize;
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

pub fn run_command_vec(
    program: &str,
    args: Vec<String>,
    cwd: Option<&str>,
) -> Result<CommandResult, String> {
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
    let dirs = path_dirs();

    // On Windows, we should prioritize .cmd files for npm-installed binaries
    #[cfg(target_os = "windows")]
    let names = ["ns.cmd", "ns.exe", "nativescript.cmd", "nativescript.exe"];
    #[cfg(not(target_os = "windows"))]
    let names = ["ns", "nativescript"];

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
pub fn run_ns(project_path: String, action: String) -> Result<CommandResult, String> {
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

use std::io::Read;
use tauri::Emitter;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogPayload {
    pub message: String,
}

// ... existing structs ...

pub fn run_resolved_streaming(
    window: &tauri::Window,
    cli: &ResolvedCli,
    args: &[&str],
    cwd: Option<&str>,
) -> Result<CommandResult, String> {
    let mut full_args = cli.base_args.clone();
    full_args.extend(args.iter().map(|a| a.to_string()));

    let mut cmd = Command::new(&cli.launcher);
    cmd.args(full_args);
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

    let mut child = cmd.spawn().map_err(|e| e.to_string())?;
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let window_clone = window.clone();
    let stdout_thread = std::thread::spawn(move || {
        let mut reader = stdout;
        let mut buffer = [0u8; 1024];
        while let Ok(n) = std::io::Read::read(&mut reader, &mut buffer) {
            if n == 0 {
                break;
            }
            let message = String::from_utf8_lossy(&buffer[..n]).to_string();
            let _ = window_clone.emit("create-project-log", LogPayload { message });
        }
    });

    let window_clone = window.clone();
    let stderr_thread = std::thread::spawn(move || {
        let mut reader = stderr;
        let mut buffer = [0u8; 1024];
        while let Ok(n) = std::io::Read::read(&mut reader, &mut buffer) {
            if n == 0 {
                break;
            }
            let message = String::from_utf8_lossy(&buffer[..n]).to_string();
            let _ = window_clone.emit("create-project-log", LogPayload { message });
        }
    });

    let status = child.wait().map_err(|e| e.to_string())?;
    let _ = stdout_thread.join();
    let _ = stderr_thread.join();

    Ok(CommandResult {
        status_code: status.code(),
        stdout: "Logs sent via events".to_string(),
        stderr: "".to_string(),
    })
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
        let args_refs: Vec<&str> = args_owned.iter().map(|s| s.as_str()).collect();
        run_resolved_streaming(&window, &cli, &args_refs, Some(&parent_path))
    })
    .await
    .map_err(|e| e.to_string())?
}
