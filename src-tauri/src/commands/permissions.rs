use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use roxmltree;
use plist;

#[derive(Serialize, Deserialize, Debug)]
#[allow(dead_code)]
pub struct PermissionInfo {
    pub name: String,
    pub description: Option<String>,
}

#[tauri::command]
pub fn get_android_permissions(project_path: String) -> Result<Vec<String>, String> {
    let manifest_path = Path::new(&project_path)
        .join("App_Resources")
        .join("Android")
        .join("src")
        .join("main")
        .join("AndroidManifest.xml");

    if !manifest_path.exists() {
        return Err("AndroidManifest.xml not found".to_string());
    }

    let content = fs::read_to_string(manifest_path).map_err(|e| e.to_string())?;
    let doc = roxmltree::Document::parse(&content).map_err(|e| e.to_string())?;
    
    let mut permissions = Vec::new();
    for node in doc.descendants() {
        if node.has_tag_name("uses-permission") {
            if let Some(name) = node.attribute(("http://schemas.android.com/apk/res/android", "name")) {
                permissions.push(name.to_string());
            } else if let Some(name) = node.attribute("android:name") {
                permissions.push(name.to_string());
            }
        }
    }

    Ok(permissions)
}

#[tauri::command]
pub fn get_ios_permissions(project_path: String) -> Result<std::collections::BTreeMap<String, String>, String> {
    let plist_path = Path::new(&project_path)
        .join("App_Resources")
        .join("iOS")
        .join("Info.plist");

    if !plist_path.exists() {
        return Err("Info.plist not found".to_string());
    }

    let value = plist::Value::from_file(plist_path).map_err(|e| e.to_string())?;
    let dict = value.as_dictionary().ok_or("Info.plist is not a dictionary")?;

    let mut permissions = std::collections::BTreeMap::new();
    for (key, val) in dict {
        if key.ends_with("UsageDescription") {
            if let Some(desc) = val.as_string() {
                permissions.insert(key.clone(), desc.to_string());
            }
        }
    }

    Ok(permissions)
}

#[tauri::command]
pub fn save_android_permissions(project_path: String, permissions: Vec<String>) -> Result<(), String> {
    let manifest_path = Path::new(&project_path)
        .join("App_Resources")
        .join("Android")
        .join("src")
        .join("main")
        .join("AndroidManifest.xml");

    if !manifest_path.exists() {
        return Err("AndroidManifest.xml not found".to_string());
    }

    // Backup
    let backup_path = manifest_path.with_extension("xml.bak");
    fs::copy(&manifest_path, backup_path).map_err(|e| e.to_string())?;

    let content = fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
    
    // Simple XML manipulation (regex or manual for now to preserve formatting better than a full parser/writer)
    // Actually, let's use a simple approach: remove all uses-permission and re-insert them before <application>
    let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
    lines.retain(|l| !l.contains("<uses-permission"));

    let insert_idx = lines.iter().position(|l| l.contains("<application")).unwrap_or(lines.len() - 1);
    
    for perm in permissions.iter().rev() {
        lines.insert(insert_idx, format!("    <uses-permission android:name=\"{}\" />", perm));
    }

    fs::write(manifest_path, lines.join("\n")).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_ios_permissions(project_path: String, permissions: std::collections::BTreeMap<String, String>) -> Result<(), String> {
    let plist_path = Path::new(&project_path)
        .join("App_Resources")
        .join("iOS")
        .join("Info.plist");

    if !plist_path.exists() {
        return Err("Info.plist not found".to_string());
    }

    // Backup
    let backup_path = plist_path.with_extension("plist.bak");
    fs::copy(&plist_path, backup_path).map_err(|e| e.to_string())?;

    let mut value = plist::Value::from_file(&plist_path).map_err(|e| e.to_string())?;
    let dict = value.as_dictionary_mut().ok_or("Info.plist is not a dictionary")?;

    // Remove existing usage descriptions
    let keys_to_remove: Vec<String> = dict.keys().filter(|k| k.ends_with("UsageDescription")).cloned().collect();
    for key in keys_to_remove {
        dict.remove(&key);
    }

    // Add new ones
    for (key, desc) in permissions {
        dict.insert(key, plist::Value::String(desc));
    }

    value.to_file_xml(plist_path).map_err(|e| e.to_string())?;
    Ok(())
}
