use std::fs;
use std::path::Path;
#[cfg(target_os = "windows")]
use std::path::PathBuf;
use std::process::Command;
#[cfg(target_os = "windows")]
use crate::commands::project::analyze_project_path;
#[cfg(target_os = "windows")]
use tauri::Manager;

#[allow(unused_imports)]
use image::GenericImageView;

#[tauri::command]
pub fn path_exists(path: String) -> bool {
    let exists = Path::new(&path).exists();
    println!("Checking if path exists: {} -> {}", path, exists);
    exists
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    println!("Reading file: {}", path);
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    println!("Writing to file: {}", path);
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_dir(path: String) -> Result<(), String> {
    println!("Creating directory: {}", path);
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn copy_file(src: String, dest: String) -> Result<(), String> {
    println!("Copying file: {} -> {}", src, dest);
    fs::copy(src, dest).map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_file(path: String) -> Result<(), String> {
    println!("Removing file: {}", path);
    if Path::new(&path).exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn remove_dir(path: String) -> Result<(), String> {
    println!("Removing directory: {}", path);
    if Path::new(&path).exists() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn read_dir(path: String) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    for entry in entries.flatten() {
        if let Some(name) = entry.file_name().to_str() {
            files.push(name.to_string());
        }
    }
    Ok(files)
}

#[tauri::command]
pub fn reveal_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        // Normalize path: replace / with \ and ensure it's a valid Windows path
        let normalized_path = path.replace("/", "\\");
        
        // Use /select, to showcase the file/folder in its parent
        // This is more reliable than just passing the path
        Command::new("explorer")
            .arg("/select,")
            .arg(&normalized_path)
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_project_icon(path: String) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};
    use std::io::Read;

    // Check for Android foreground icon first
    let icon_path = Path::new(&path)
        .join("App_Resources")
        .join("Android")
        .join("src")
        .join("main")
        .join("res")
        .join("drawable-ldpi")
        .join("ic_launcher_foreground.png");

    if icon_path.exists() {
        let mut file = fs::File::open(icon_path).map_err(|e| e.to_string())?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
        let b64 = general_purpose::STANDARD.encode(buffer);
        return Ok(format!("data:image/png;base64,{}", b64));
    }

    // Try normal ic_launcher.png if foreground not found
    let icon_path_alt = Path::new(&path)
        .join("App_Resources")
        .join("Android")
        .join("src")
        .join("main")
        .join("res")
        .join("drawable-mdpi")
        .join("ic_launcher.png");

    if icon_path_alt.exists() {
        let mut file = fs::File::open(icon_path_alt).map_err(|e| e.to_string())?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
        let b64 = general_purpose::STANDARD.encode(buffer);
        return Ok(format!("data:image/png;base64,{}", b64));
    }

    Err("Icon not found".to_string())
}

#[tauri::command]
pub async fn set_project_folder_icon(
    app_handle: tauri::AppHandle,
    project_path: String,
) -> Result<(), String> {
    internal_set_project_folder_icon(&app_handle, &project_path)
}

pub fn internal_set_project_folder_icon(
    _app_handle: &tauri::AppHandle,
    _project_path: &str,
) -> Result<(), String> {
    #[cfg(not(target_os = "windows"))]
    {
        // Only supported on Windows for now to avoid issues on macOS/Linux
        return Ok(());
    }

    #[cfg(target_os = "windows")]
    {
        let app_handle = _app_handle;
        let project_path = _project_path;
        let project_path_buf = PathBuf::from(project_path);
        if !project_path_buf.exists() {
            return Err("Project path does not exist".to_string());
        }

        // 1. Detect framework
        let analysis = analyze_project_path(project_path);
        let framework = analysis.framework.unwrap_or_else(|| "Core".to_string());

        // 2. Map framework to icon name
        let icon_name = match framework.as_str() {
            "Angular" => "nsf-angular.png",
            "React" => "nsf-reactjs.png",
            "Solid" => "nsf-solid.png",
            "Svelte" => "nsf-svelte.png",
            "Vue" => "nsf-vue.png",
            "Core (TS)" => "nsf-typescript.png",
            "Core (JS)" => "nsf-javascript.png",
            _ => {
                if framework.to_lowercase().contains("javascript") {
                    "nsf-javascript.png"
                } else if framework.to_lowercase().contains("typescript") {
                    "nsf-typescript.png"
                } else {
                    "nsf-javascript.png"
                }
            }
        };

        // 3. Find the source icon
        let mut search_paths = Vec::new();

        // Priority 1: resource_dir (Production)
        if let Ok(rd) = app_handle.path().resource_dir() {
            search_paths.push(rd.join(icon_name));
            search_paths.push(rd.join("folders").join(icon_name));
            search_paths.push(rd.join("assets").join("images").join("folders").join(icon_name));
            search_paths.push(rd.join("public").join("assets").join("images").join("folders").join(icon_name));
            search_paths.push(rd.join("_up_").join("public").join("assets").join("images").join("folders").join(icon_name));
        }

        // Priority 2: Relative to CWD (Dev mode)
        if let Ok(cwd) = std::env::current_dir() {
            search_paths.push(cwd.join("public").join("assets").join("images").join("folders").join(icon_name));
            search_paths.push(cwd.join("..").join("public").join("assets").join("images").join("folders").join(icon_name));
        }

        // Priority 3: Relative to Executable
        if let Ok(exe) = std::env::current_exe() {
            if let Some(parent) = exe.parent() {
                search_paths.push(parent.join("public").join("assets").join("images").join("folders").join(icon_name));
                if let Some(p2) = parent.parent() {
                     search_paths.push(p2.join("public").join("assets").join("images").join("folders").join(icon_name));
                }
            }
        }

        let mut resource_path = None;
        for p in search_paths {
            if p.exists() {
                resource_path = Some(p);
                break;
            }
        }

        let resource_path = match resource_path {
            Some(p) => {
                println!("[Icon] Found source icon at: {:?}", p);
                p
            },
            None => {
                return Err(format!(
                    "Source icon not found: {}. Searched in resource dir and common dev paths.",
                    icon_name
                ));
            }
        };

        // 4. Ensure .nsforge directory exists
        let nsforge_dir = project_path_buf.join(".nsforge");
        if !nsforge_dir.exists() {
            fs::create_dir_all(&nsforge_dir).map_err(|e| e.to_string())?;
        }

        // --- Windows Implementation ---
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // Windows: More aggressive refresh with unique filenames to bust cache
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
        let ico_filename = format!("folder_icon_{}.ico", now);
        let ico_path = nsforge_dir.join(&ico_filename);
        let desktop_ini_path = project_path_buf.join("desktop.ini");

        println!("[Icon] Starting Windows update for: {}", project_path);
        println!("[Icon] Framework: {}, Selected Icon: {}", framework, icon_name);
        println!("[Icon] Source PNG: {:?}", resource_path);

        // 1. Convert PNG to ICO FIRST (don't delete anything yet)
        let img = image::open(&resource_path).map_err(|e| {
            let err = format!("Failed to open source icon {:?}: {}", resource_path, e);
            println!("[Icon] Error: {}", err);
            err
        })?;
        let (width, height) = img.dimensions();
        let rgba = img.to_rgba8();

        let mut icon_dir = ico::IconDir::new(ico::ResourceType::Icon);
        let icon_image = ico::IconImage::from_rgba_data(width, height, rgba.into_raw());
        icon_dir.add_entry(ico::IconDirEntry::encode(&icon_image).map_err(|e: std::io::Error| e.to_string())?);

        let ico_file = fs::File::create(&ico_path).map_err(|e: std::io::Error| {
            let err = format!("Failed to create ICO file {:?}: {}", ico_path, e);
            println!("[Icon] Error: {}", err);
            err
        })?;
        icon_dir.write(ico_file).map_err(|e| e.to_string())?;
        println!("[Icon] Successfully created: {:?}", ico_filename);

        // 2. Clear attributes on desktop.ini to allow writing
        if desktop_ini_path.exists() {
            let _ = Command::new("attrib")
                .args(["-s", "-h", "-r", &desktop_ini_path.to_string_lossy()])
                .creation_flags(CREATE_NO_WINDOW)
                .status();
        }

        // 3. Create desktop.ini with UTF-16LE + BOM
        let desktop_ini_content = format!(
            "[.ShellClassInfo]\r\nIconResource=.nsforge\\{},0\r\n[ViewState]\r\nMode=\r\nVid=\r\nFolderType=Generic\r\n;Refresh={}\r\n",
            ico_filename,
            now
        );

        let mut utf16_bytes: Vec<u8> = vec![0xFF, 0xFE]; // BOM for UTF-16LE
        for c in desktop_ini_content.encode_utf16() {
            utf16_bytes.extend_from_slice(&c.to_le_bytes());
        }
        fs::write(&desktop_ini_path, utf16_bytes).map_err(|e| {
            let err = format!("Failed to write desktop.ini: {}", e);
            println!("[Icon] Error: {}", err);
            err
        })?;
        println!("[Icon] Updated desktop.ini");

        // 4. Set attributes
        let _ = Command::new("attrib").args(["+s", "+h", &ico_path.to_string_lossy()]).creation_flags(CREATE_NO_WINDOW).status();
        let _ = Command::new("attrib").args(["+s", "+h", &desktop_ini_path.to_string_lossy()]).creation_flags(CREATE_NO_WINDOW).status();
        let _ = Command::new("attrib").args(["+r", "."]).current_dir(project_path).creation_flags(CREATE_NO_WINDOW).status();
        println!("[Icon] Attributes set correctly");

        // 5. Cleanup OLD icons (everything except the new one)
        if let Ok(entries) = fs::read_dir(&nsforge_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name();
                let name_str = name.to_string_lossy();
                if name_str.starts_with("folder_icon_") && name_str.ends_with(".ico") && name_str != ico_filename {
                    let path = entry.path();
                    let _ = Command::new("attrib").args(["-s", "-h", &path.to_string_lossy()]).creation_flags(CREATE_NO_WINDOW).status();
                    let _ = fs::remove_file(path);
                }
            }
        }

        // 6. Force Shell Refresh
        let ps_script = format!(
            "$code = @'\n\
            using System;\n\
            using System.Runtime.InteropServices;\n\
            public class Win32 {{\n\
                [DllImport(\"shell32.dll\", CharSet = CharSet.Auto)]\n\
                public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);\n\
            }}\n\
            '@\n\
            Add-Type -TypeDefinition $code\n\
            [Win32]::SHChangeNotify(0x08000000, 0x0000, [IntPtr]::Zero, [IntPtr]::Zero)",
        );

        let _ = Command::new("powershell")
            .args(["-NoProfile", "-Command", &ps_script])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
        println!("[Icon] Refresh broadcasted");

        Ok(())
    }
}

#[tauri::command]
pub async fn bulk_set_project_icons(
    app_handle: tauri::AppHandle,
    project_paths: Vec<String>,
) -> Result<(), String> {
    println!("[Bulk] Starting icon refresh for {} projects", project_paths.len());
    for path in project_paths {
        if let Err(e) = internal_set_project_folder_icon(&app_handle, &path) {
            println!("[Bulk] Error setting icon for {}: {}", path, e);
        }
    }
    Ok(())
}
