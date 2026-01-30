mod commands;

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create projects table",
        sql: "CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            nativescript_version TEXT,
            framework TEXT,
            platforms TEXT,
            last_opened INTEGER
        );",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nsforge.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::fs::reveal_in_explorer,
            commands::fs::check_directory_exists,
            commands::project::analyze_project,
            commands::project::discover_projects,
            commands::ns::doctor_checks,
            commands::ns::run_ns,
            commands::ns::create_ns_project,
            commands::ns::get_adb_devices,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
