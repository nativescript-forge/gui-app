# NS-Forge Backend Documentation

Folder ini berisi logika backend Rust untuk aplikasi NS-Forge. Arsitektur backend telah dimodularisasi untuk memudahkan pemeliharaan dan keterbacaan kode.

## Struktur Modul

Backend dipisahkan ke dalam beberapa modul perintah di bawah folder `commands/`:

- **[fs.rs](file:///c:/Users/dyazi/DataDisk/projects/kang-cahya/tauri/NS-Forge/src-tauri/src/commands/fs.rs)**: Menangani operasi sistem file tingkat lanjut.
  - `reveal_in_explorer`: Membuka folder proyek di file explorer sistem.

- **[project.rs](file:///c:/Users/dyazi/DataDisk/projects/kang-cahya/tauri/NS-Forge/src-tauri/src/commands/project.rs)**: Logika untuk analisis proyek NativeScript.
  - `analyze_project`: Mengambil metadata proyek (versi NS, framework, platform, dll).
  - `discover_projects`: Mencari proyek NativeScript secara rekursif dalam direktori tertentu.

- **[ns.rs](file:///c:/Users/dyazi/DataDisk/projects/kang-cahya/tauri/NS-Forge/src-tauri/src/commands/ns.rs)**: Integrasi utama dengan NativeScript CLI.
  - `doctor_checks`: Menjalankan pemeriksaan lingkungan (Node.js, JDK, Android SDK, dll).
  - `run_ns`: Menjalankan perintah NativeScript (run, build).
  - `create_ns_project`: Membuat proyek NativeScript baru dengan berbagai flavor dan template.

## Alur Data

1. **Invoke**: Frontend memanggil perintah menggunakan `invoke('nama_command')`.
2. **Handler**: [lib.rs](file:///c:/Users/dyazi/DataDisk/projects/kang-cahya/tauri/NS-Forge/src-tauri/src/lib.rs) mendaftarkan handler yang mengarah ke fungsi di dalam modul `commands`.
3. **Execution**: Fungsi di modul `commands` mengeksekusi logika dan mengembalikan `Result` yang akan diserialisasi menjadi JSON untuk frontend.

## Plugin yang Digunakan

Aplikasi ini menggunakan beberapa plugin resmi Tauri v2:
- `tauri-plugin-sql`: Untuk manajemen database SQLite local.
- `tauri-plugin-shell`: Untuk menjalankan perintah eksternal (NativeScript CLI).
- `tauri-plugin-fs`: Untuk akses sistem file.
- `tauri-plugin-dialog`: Untuk dialog pemilihan folder/file.
- `tauri-plugin-opener`: Untuk membuka URL atau file dengan aplikasi default.
