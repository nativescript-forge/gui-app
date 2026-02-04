use std::fs;
use std::path::Path;
use std::process::Command;

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
pub fn reveal_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        Command::new("explorer")
            .arg(&path)
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
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
