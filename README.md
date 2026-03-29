<div align="center">
  <img src="./public/nsf-dark.svg" alt="NativeScript Forge" width="500" />
  <br />
  <br />

[![Tauri](https://img.shields.io/badge/Tauri-v2-orange?style=flat&logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-v19-blue?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

  <p align="center">
    <b>Simplify, Visualize, and Control your NativeScript Workflow</b>
  </p>
</div>

---

**NativeScript Forge** is a community-built development studio designed to simplify, visualize, and control the NativeScript development workflow. It provides developers with a unified graphical interface to manage projects, environments, plugins, builds, and platform configurations—without replacing the NativeScript CLI. NativeScript Forge focuses on transparency, safety, and productivity, helping developers reduce setup friction, avoid common pitfalls, and stay in control of complex NativeScript projects.

![NativeScript Forge Screenshot](./public/assets/screenshot/ns-forge-v1.png)

## ✨ Key Features

- **🗂 Project Library**: Centralized management for all your NativeScript projects.
- **🩺 Environment Doctor**: Built-in diagnostics to ensure your dev environment (Android SDK, Java, Node.js) is ready.
- **🚀 CLI Orchestration**: Visual interface for common CLI commands, reducing the need to memorize flags.
- **📊 Metadata & Insights**: Quickly view project details, plugins, permissions, and target SDK versions.
- **🎨 Modern UI**: Built with a responsive and dark-mode friendly interface using DaisyUI.

## 🛠 Tech Stack

- **Core**: [Tauri v2](https://tauri.app) (Rust)
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS, DaisyUI
- **Database**: SQLite (via Tauri Plugin)

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later) 
  - https://nodejs.org/en/download
- **Tauri** (v2 or later)
  - https://v2.tauri.app/start/prerequisites  
- **Rust** (pinned by this repo to v1.88.0 via rustup)
  - The first Tauri build may download the pinned toolchain automatically.
- **Android Studio / Xcode** (for NativeScript development)
  - https://developer.android.com/studio
  - https://developer.apple.com/xcode

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/nativescript-forge/gui-app.git
   cd gui-app
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   bun install
   ```

3. Run the application in development mode:

  The repo includes `rust-toolchain.toml`, so `cargo` and `tauri` will use Rust 1.88.0 instead of a globally configured nightly toolchain.

   ```bash
   npm run tauri dev
   # or
   bun run tauri dev
   ```

4. Build the application for production:
   ```bash
   npm tauri build
   # or
   bun tauri build
   ```

## 🗺️ Feature Checklist

For a detailed breakdown of our plans, check out the full [FEATURE-CHECKLIST.md](./FEATURE-CHECKLIST.md).

---

## 💾 Database & Migrations

NativeScript Forge uses SQLite for persistent storage. To ensure data integrity and avoid errors during development:

- **Golden Rule**: Never modify an existing migration (e.g., `version: 1`). If you need to change the schema (add columns, etc.), always create a **new version** (e.g., `version: 4`) in `src-tauri/src/lib.rs`.
- **Error: "migration was modified"**: This happens if you change the SQL of a version that has already been applied. To fix this, you must reset the database.
- **Resetting the Database**: Delete the database files in your app data folder:
  - Windows: `%APPDATA%\com.kangcahya.nativescript-forge-app\nsforge.db`
  - This will clear all projects and logs, and re-apply all migrations from scratch.

---

<div align="center">
  <img src="./public/nsf-dark-io.svg" alt="NativeScript Forge Icon" width="64" />
  <p><i>Built with ❤️ for the NativeScript Community</i></p>
</div>
