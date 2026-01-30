mod commands;

use tauri_plugin_sql::{Migration, MigrationKind};

use std::sync::Mutex;
use commands::ns::ProcessState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
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
        },
        Migration {
            version: 2,
            description: "create activity_logs table",
            sql: "CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activity_type TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add extra columns to projects",
            sql: "ALTER TABLE projects ADD COLUMN plugins_count INTEGER DEFAULT 0;
                  ALTER TABLE projects ADD COLUMN permissions_count INTEGER DEFAULT 0;
                  ALTER TABLE projects ADD COLUMN version_code TEXT;
                  ALTER TABLE projects ADD COLUMN version_name TEXT;
                  ALTER TABLE projects ADD COLUMN target_sdk TEXT;
                  ALTER TABLE projects ADD COLUMN min_sdk TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add created_at to projects",
            sql: "ALTER TABLE projects ADD COLUMN created_at INTEGER;",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .manage(ProcessState(Mutex::new(None)))
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
            commands::ns::stop_ns_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
