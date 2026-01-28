# NS-Forge Backend Engine (Rust)

Selamat datang di dokumentasi internal backend **NS-Forge**. Bagian ini merupakan jantung dari aplikasi yang menangani integrasi sistem, eksekusi CLI, dan manajemen proyek NativeScript menggunakan bahasa pemrograman Rust untuk performa dan keamanan yang maksimal.

## 🏗️ Arsitektur Modular

Backend NS-Forge dirancang dengan pendekatan modular untuk memastikan kode tetap bersih, mudah diuji, dan skalabel. Logika bisnis dipisahkan dari konfigurasi utama Tauri.

### Struktur Direktori

```text
src-tauri/src/
├── commands/           # Implementasi logika perintah (Commands)
│   ├── mod.rs          # Entry point dan definisi modul perintah
│   ├── fs.rs           # Operasi sistem file tingkat lanjut
│   ├── project.rs      # Analisis dan manajemen proyek NativeScript
│   └── ns.rs           # Integrasi NativeScript CLI & Doctor
├── lib.rs              # Konfigurasi Tauri, Plugin, dan Handler Registry
└── main.rs             # Entry point aplikasi
```

---

## 🛠️ Detail Modul Perintah

### 📂 [FileSystem Module](file:///c:/Users/dyazi/DataDisk/projects/kang-cahya/tauri/NS-Forge/src-tauri/src/commands/fs.rs)

Menangani interaksi langsung dengan sistem operasi yang tidak dicakup oleh plugin standar.

- **`reveal_in_explorer`**: Membuka direktori spesifik menggunakan file explorer bawaan OS (Windows Explorer, macOS Finder, dll).

### 🔍 [Project Module](file:///c:/Users/dyazi/DataDisk/projects/kang-cahya/tauri/NS-Forge/src-tauri/src/commands/project.rs)

Bertanggung jawab untuk memahami struktur proyek NativeScript.

- **`analyze_project`**: Melakukan inspeksi mendalam terhadap file `package.json` dan struktur folder untuk menentukan versi, framework (Angular/Vue/React), dan platform yang tersedia.
- **`discover_projects`**: Algoritma pemindaian rekursif untuk menemukan proyek NativeScript dalam direktori induk dengan kedalaman yang dapat dikonfigurasi.

### 🚀 [NativeScript Module](file:///c:/Users/dyazi/DataDisk/projects/kang-cahya/tauri/NS-Forge/src-tauri/src/commands/ns.rs)

Modul paling kritikal yang menjembatani aplikasi dengan NativeScript Ecosystem.

- **`doctor_checks`**: Menjalankan diagnosa lingkungan pengembangan (Node.js, Java, Android SDK, CocoaPods).
- **`run_ns`**: Wrapper untuk mengeksekusi perintah `ns run`, `ns build`, dll dengan manajemen output yang aman.
- **`create_ns_project`**: Menangani pembuatan proyek baru dengan parameter flavor dan template yang dinamis.
- **Helper Internal**: Termasuk logika cerdas `resolve_cli` untuk mendeteksi lokasi instalasi NativeScript CLI di berbagai sistem (Windows/macOS/Linux).

---

## 🔌 Integrasi Plugin Tauri v2

Kami memanfaatkan ekosistem plugin Tauri v2 untuk fungsionalitas inti:

| Plugin                | Kegunaan                                                  |
| :-------------------- | :-------------------------------------------------------- |
| `tauri-plugin-sql`    | Persistensi data lokal menggunakan SQLite (`nsforge.db`). |
| `tauri-plugin-shell`  | Eksekusi proses sidecar dan command-line.                 |
| `tauri-plugin-fs`     | Manipulasi file sistem dengan tingkat keamanan granular.  |
| `tauri-plugin-dialog` | Interaksi UI untuk pemilihan folder dan file sistem.      |
| `tauri-plugin-opener` | Utility untuk membuka resource eksternal.                 |

---

## 🔄 Alur Komunikasi (IPC)

Semua fungsi yang didekorasi dengan `#[tauri::command]` didaftarkan di [lib.rs](file:///c:/Users/dyazi/DataDisk/projects/kang-cahya/tauri/NS-Forge/src-tauri/src/lib.rs) dan dapat dipanggil dari Frontend (React) menggunakan pattern berikut:

```typescript
import { invoke } from "@tauri-apps/api/core";

// Contoh pemanggilan analisis proyek
const projectInfo = await invoke("analyze_project", {
  projectPath: "/path/to/project",
});
```

---

## 🛡️ Prinsip Pengembangan

1. **Safety First**: Selalu gunakan `Result<T, String>` untuk penanganan error yang elegan di frontend.
2. **Type Safety**: Gunakan struct dengan `Serialize` agar kontrak data antara Rust dan TypeScript tetap konsisten.
3. **Performance**: Hindari blocking operations di thread utama; gunakan asinkronitas jika diperlukan.
