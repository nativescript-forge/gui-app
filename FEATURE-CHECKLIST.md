# NS-Forge Feature Checklist

Detailed list of features and functions available in NS-Forge.

## 🛠️ Setup & Environment

- [ ] **Automatic OS Detection** (Release Mode)
- [ ] **Manual OS Selection** (Dev Mode)
- [ ] **Window Management**
  - [ ] Maximize/Minimize controls
  - [ ] Custom Titlebar with drag support (Context-aware)

### 🪟 Windows Setup

- [ ] **Node.js** (LTS version)
- [ ] **Java Development Kit** (JDK 17)
- [ ] **Android SDK**
- [ ] **Android Virtual Device** (AVD/Emulator)
- [ ] **NativeScript CLI** (Global install)

### 🐧 Linux Setup

- [ ] **Node.js** (LTS version)
- [ ] **Java OpenJDK 17**
- [ ] **Android SDK**
- [ ] **Environment Variables** (JAVA_HOME, ANDROID_HOME)
- [ ] **NativeScript CLI** (Global install)

### 🍎 macOS Setup

- [ ] **Homebrew** (Package Manager)
- [ ] **Node.js & JDK 17**
- [ ] **iOS Environment** (Xcode, Command Line Tools)
- [ ] **CocoaPods** (Dependency Manager for iOS)
- [ ] **Android SDK**
- [ ] **NativeScript CLI** (Global install)

## 🏠 Home & Project Management

- [ ] **Project Overview**
  - [ ] Recent projects list with icons
  - [ ] Quick access to project folders
  - [ ] Remove project from library (with history cleanup)
- [ ] **Project Creation**
  - [ ] Support for multiple flavors:
    - [ ] JavaScript
    - [ ] TypeScript
    - [ ] Angular
    - [ ] React
    - [ ] Solid
    - [ ] Svelte
    - [ ] Vue
  - [ ] Template selection (Blank, Drawer, Tabs, etc.)
  - [ ] Standard vs VisionOS platform selection
  - [ ] Real-time creation logs
- [ ] **Project Import**
  - [ ] Single project import
  - [ ] Batch scan folder for NativeScript projects
- [ ] **Global System Report**
  - [ ] System Information (OS, CPU, Memory)
  - [ ] NativeScript Doctor integration
  - [ ] Package Manager status (npm, yarn, pnpm)
  - [ ] Global CLI update functionality

## 📊 Activity & History

- [ ] **Global Activity Logs**
  - [ ] Categorized logs (System, Build, Run, Project, etc.)
  - [ ] Status tracking (Success, Error, Info)
  - [ ] Search and filter by activity type
- [ ] **Database Persistence** (SQLite)
  - [ ] Project metadata storage
  - [ ] Activity history storage

## 🚀 App Mode (Project Dashboard)

- [ ] **Project Status**
  - [ ] Dependency health check (node_modules detection)
  - [ ] Automated npm install for missing dependencies
- [ ] **Package Management**
  - [ ] Real-time outdated package detection
  - [ ] Single package update
  - [ ] Bulk package update
- [ ] **Build & Run Actions**
  - [ ] **Run Application**
    - [ ] Android (Emulator/Device)
    - [ ] iOS (Simulator/Device)
  - [ ] **Debug Application**
    - [ ] Android Debug mode
    - [ ] iOS Debug mode
  - [ ] **Build Production**
    - [ ] Android App Bundle (AAB) / APK
    - [ ] iOS IPA (via Xcode)
  - [ ] **Project Utilities**
    - [ ] Clean project (ns clean)
    - [ ] Install dependencies
    - [ ] Platform Management (Add Android/iOS)
- [ ] **Device Management**
  - [ ] Auto-detection of connected devices/emulators
  - [ ] Device selection for Run/Debug actions

## ⚙️ Project Configuration

- [ ] **NativeScript Config (nativescript.config.ts)**
  - [ ] Bundle ID management (App ID)
  - [ ] Project Name configuration
  - [ ] Performance profiling toggles
  - [ ] Development vs Production presets
  - [ ] Advanced Android/iOS runtime flags
- [ ] **Platform Specific Configs**
  - [ ] **Android**
    - [ ] `app.gradle` editor
    - [ ] `before-plugins.gradle` editor
  - [ ] **iOS**
    - [ ] `build.xcconfig` editor
    - [ ] `Info.plist` key-value management
- [ ] **Permission Management**
  - [ ] **Android Manifest Permissions**
    - [ ] Master permission list for easy adding
    - [ ] Search and filter permissions
    - [ ] Direct Manifest synchronization
  - [ ] **iOS Plist Permissions**
    - [ ] Usage description management
    - [ ] Searchable iOS permission keys

## 🎨 Assets & Resources

- [ ] **Asset Management**
  - [ ] Current Icon & Splash screen preview
- [ ] **Asset Generation**
  - [ ] Automatic Icon generation from source image
  - [ ] Automatic Splash screen generation
  - [ ] Custom background color support for splashes
  - [ ] Cross-platform asset synchronization

## 🔌 Plugin Management

- [ ] **Plugin Exploration**
  - [ ] **Marketplace Plugins**: Integrated search from NativeScript Market
  - [ ] **Awesome Plugins**: Curated list from Awesome NativeScript
  - [ ] **NPM Search**: Direct search on NPM for NativeScript plugins
- [ ] **Plugin Operations**
  - [ ] One-click Install/Uninstall
  - [ ] Smart package name extraction from URLs
  - [ ] Real-time installation status tracking

## 🛠️ Global Settings

- [ ] **Theme Support** (Light/Dark mode)
- [ ] **Reset Options**
  - [ ] Reset setup wizard
  - [ ] Clear global activity logs
- [ ] **System Report Refresh**
  - [ ] On-demand system environment re-scan
