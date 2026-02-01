use serde::Serialize;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectAnalysis {
    pub name: String,
    pub path: String,
    pub nativescript_version: Option<String>,
    pub framework: Option<String>,
    pub platforms: Vec<String>,
    pub plugins_count: u32,
    pub permissions_count: u32,
    pub version_code: Option<String>,
    pub version_name: Option<String>,
    pub target_sdk: Option<String>,
    pub min_sdk: Option<String>,
    pub created_at: u64,
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

fn read_package_json_required(project_path: &str) -> Result<serde_json::Value, String> {
    let package_json_path = project_file(project_path, "package.json");
    let contents = fs::read_to_string(&package_json_path).map_err(|e| {
        format!(
            "Failed to read package.json at {}: {}",
            package_json_path.to_string_lossy(),
            e
        )
    })?;
    serde_json::from_str(&contents).map_err(|e| format!("Invalid package.json: {}", e))
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
    let pkg = read_package_json(project_path);

    let has_android_pkg = pkg
        .as_ref()
        .and_then(|p| get_dep_version(p, "@nativescript/android"))
        .is_some();
    let has_ios_pkg = pkg
        .as_ref()
        .and_then(|p| get_dep_version(p, "@nativescript/ios"))
        .is_some();

    let has_android_plt = project_file(project_path, "platforms/android").exists();
    let has_ios_plt = project_file(project_path, "platforms/ios").exists();

    if has_android_pkg || has_android_plt {
        platforms.push("Android".to_string());
    }
    if has_ios_pkg || has_ios_plt {
        platforms.push("iOS".to_string());
    }

    platforms
}

fn get_android_info(
    project_path: &str,
) -> (
    Option<String>,
    Option<String>,
    u32,
    Option<String>,
    Option<String>,
) {
    let manifest_path = project_file(
        project_path,
        "App_Resources/Android/src/main/AndroidManifest.xml",
    );
    let gradle_path = project_file(project_path, "App_Resources/Android/app.gradle");

    let mut version_code = None;
    let mut version_name = None;
    let mut permissions_count = 0;
    let mut target_sdk = None;
    let mut min_sdk = None;

    if let Ok(content) = fs::read_to_string(&manifest_path) {
        permissions_count = content.matches("<uses-permission").count() as u32;
    }

    if let Ok(content) = fs::read_to_string(&gradle_path) {
        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("versionCode") {
                version_code = line.split_whitespace().last().map(|s| s.to_string());
            }
            if line.starts_with("versionName") {
                version_name = line.split('"').nth(1).map(|s| s.to_string());
            }
            if line.starts_with("targetSdkVersion") || line.starts_with("compileSdkVersion") {
                target_sdk = line.split_whitespace().last().map(|s| s.to_string());
            }
            if line.starts_with("minSdkVersion") {
                min_sdk = line.split_whitespace().last().map(|s| s.to_string());
            }
        }
    }

    if version_name.is_none() {
        if let Some(pkg) = read_package_json(project_path) {
            version_name = pkg
                .get("version")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
        }
    }

    (
        version_code,
        version_name,
        permissions_count,
        target_sdk,
        min_sdk,
    )
}

fn count_plugins(pkg: &serde_json::Value) -> u32 {
    let mut count = 0;
    if let Some(deps) = pkg.get("dependencies").and_then(|v| v.as_object()) {
        count += deps
            .iter()
            .filter(|(k, _)| k.contains("nativescript-") || k.contains("@nativescript/"))
            .count();
    }
    if let Some(dev_deps) = pkg.get("devDependencies").and_then(|v| v.as_object()) {
        count += dev_deps
            .iter()
            .filter(|(k, _)| k.contains("nativescript-") || k.contains("@nativescript/"))
            .count();
    }
    count as u32
}

pub fn analyze_project_path(project_path: &str) -> ProjectAnalysis {
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

    let (version_code, version_name, permissions_count, target_sdk, min_sdk) =
        get_android_info(project_path);
    let plugins_count = pkg.as_ref().map(|p| count_plugins(p)).unwrap_or(0);

    let created_at = fs::metadata(project_path)
        .and_then(|m| {
            m.created()
                .or_else(|_| m.modified())
                .or_else(|_| m.accessed())
        })
        .and_then(|c| {
            c.duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs())
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
        })
        .unwrap_or(0);

    ProjectAnalysis {
        name,
        path: project_path.to_string(),
        nativescript_version,
        framework,
        platforms,
        plugins_count,
        permissions_count,
        version_code,
        version_name,
        target_sdk,
        min_sdk,
        created_at,
    }
}

#[tauri::command]
pub fn analyze_project(project_path: String) -> Result<ProjectAnalysis, String> {
    Ok(analyze_project_path(&project_path))
}

#[tauri::command]
pub fn get_project_packages(project_path: String) -> Result<BTreeMap<String, String>, String> {
    let pkg = read_package_json_required(&project_path)?;

    let mut out = BTreeMap::new();

    if let Some(deps) = pkg.get("dependencies").and_then(|v| v.as_object()) {
        for (k, v) in deps.iter() {
            if let Some(s) = v.as_str() {
                out.insert(k.to_string(), s.to_string());
            }
        }
    }

    if let Some(dev_deps) = pkg.get("devDependencies").and_then(|v| v.as_object()) {
        for (k, v) in dev_deps.iter() {
            if let Some(s) = v.as_str() {
                out.entry(k.to_string()).or_insert_with(|| s.to_string());
            }
        }
    }

    Ok(out)
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
pub fn discover_projects(
    root_path: String,
    max_depth: u32,
) -> Result<Vec<ProjectAnalysis>, String> {
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

#[tauri::command]
pub fn read_ns_config(project_path: String) -> Result<String, String> {
    let config_path = Path::new(&project_path).join("nativescript.config.ts");
    if !config_path.exists() {
        return Err("nativescript.config.ts not found".to_string());
    }

    fs::read_to_string(config_path).map_err(|e| format!("Failed to read config: {}", e))
}

#[tauri::command]
pub fn write_ns_config(project_path: String, content: String) -> Result<(), String> {
    let config_path = Path::new(&project_path).join("nativescript.config.ts");
    fs::write(config_path, content).map_err(|e| format!("Failed to write config: {}", e))
}

