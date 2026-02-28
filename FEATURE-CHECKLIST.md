# NS-Forge Feature Checklist

Detailed list of features and functions available in NS-Forge, grouped by application routing and menus.

## 🌟 Main View

### 🏠 Home

- [x] **Global System Report**
  - [x] System environment status overview
  - [x] Package Manager status (npm, yarn, pnpm)
- [x] **Project Import & Discovery**
  - [x] Single project folder import
  - [x] Batch folder scanning for existing NativeScript projects

### 📁 Projects

- [x] **Project Library / Overview**
  - [x] List of saved projects with framework badges
  - [x] Quick access to project paths (Reveal in Explorer / Finder)
  - [x] Remove project from library with database history cleanup

### ➕ Create Project

- [x] **Project Creation**
  - [x] Support for multiple flavors (Vanilla, Angular, React, Vue, Svelte, Solid, TypeScript)
  - [x] Template selection (Blank, Drawer, Tabs, etc.)
  - [x] Real-time creation logs output

### 📊 Activity

- [x] **Global Activity Logs**
  - [x] Categorized logs (System, Build, Error, Information)
  - [x] Historical persistence leveraging SQLite database
  - [x] Search, filter, and sort capabilities for activities

### ⚙️ Settings

- [ ] **Application Preferences**
  - [ ] Default Theme customization (Light/Dark mode)
  - [ ] Select default preferred package manager (npm, pnpm, yarn)
- [ ] **Data Management**
  - [ ] Clearing global activity logs or system reports cache
  - [ ] Database SQLite migration & integrity management

---

## 🚀 App Mode

### 🎛️ Dashboard

- [x] **Project Status Overview**
  - [x] Dependency health checking (`node_modules` detection)
  - [x] Automated missing dependency installation fallback
- [x] **Build & Run Workflows**
  - [x] Real-time ADB connected devices & emulator detection
  - [x] **Run Application** on Android (Emulator/Device) or iOS (Simulator/Device)
  - [x] **Debug Application** capabilities
  - [x] **Build Production** packages (Android APK/AAB, iOS IPA)
  - [ ] **Cloud Build** Norrix.net (TBD)
- [x] **Execution Utilities**
  - [x] Stop active terminal processes gracefully
  - [x] Live log streaming output directly to the UI
  - [x] Clean project cache / hooks (`ns clean`)
  - [x] Add/Remove targeted platforms (Android/iOS)

### 🎨 Resource Config

- [x] **Resources Dashboard**
  - [x] Visual overview of current App Icon & Splash screen
- [x] **Asset Generation Engine**
  - [x] Automatic Icon generation from a source image
  - [x] Automatic Splash screen creation with background color picking

### 🔤 Font Config

- [x] **Font Management**
  - [x] Scan and list imported localized font files
  - [x] Add new custom `.ttf` or `.otf` fonts to the project workspace

### ⚙️ Project Config

- [x] **NativeScript Config (`nativescript.config.ts`)**
  - [x] **General:** App Bundle ID, Project Name, Paths (`appPath`, `appResourcesPath`), Entry file, CSS Parser, Profiling
  - [x] **Android:** V8 Runtime flags, Code Cache configuration, Garbage Collection tuning (`gcThrottleTime`, `markingMode`), Memory check intervals
  - [x] **iOS:** Specific Bundle ID overrides, JS Exception discarding policies
  - [x] **CLI:** Configure project-level Package Manager
  - [x] **Bundler:** Switch between Webpack and Vite seamlessly, manage bundler configuration backups and restores
    - [x] Backup and Restore Webpack and Vite config files
  - [x] **Security:** Network & Script loading permissions (`allowRemoteModules`)
  - [x] **Presets:** One-click application of Development and Production optimized presets

### 📱 Platform Config

- [x] **Android Configuration**
  - [x] Manage `app.gradle` editor content
  - [x] Manage `before-plugins.gradle` editor content
- [x] **iOS Configuration**
  - [x] Manage `build.xcconfig` editor content
  - [x] Manage `Info.plist` raw values

### 🔌 Install Plugin

- [x] **Dependency Auditing**
  - [x] Read local `package.json` for installed frameworks & packages
  - [x] Real-time outdated package detection
- [x] **Plugin Discovery**
  - [x] Integrated Marketplace Exploration
  - [x] Awesome NativeScript Curated list viewing
  - [x] Identify installed vs. not installed plugin status
- [x] **Plugin Installation Operations**
  - [x] One-click Install, Uninstall, and updates
  - [x] Smart package wrapper (npm/yarn/pnpm invocations)

### 🔑 Manage Permission

- [x] **Android Manifest Permissions**
  - [x] Advanced visual editor for adding/removing Android Manifest Permissions
- [x] **iOS Plist Permissions**
  - [x] Easy iOS Plist Permissions management (Usage Descriptions)
  - [x] Add/Remove specific OS permission requirements

---

## 🛠️ Setup & Environment (Initial Setup Wizard)

- [x] **System OS Support**
  - [x] Windows Detection & Requirements Verification
  - [x] macOS Environment Detection (Xcode, iOS Simulator, CocoaPods)
  - [x] Linux Distribution Support
- [x] **Dependencies Checking**
  - [x] Node.js & Package Managers detection (npm, yarn, pnpm)
  - [x] Java Development Kit (JDK 17) detection
  - [x] Android SDK & ADB tool verification
  - [x] NativeScript CLI globally installed verification
- [x] **Doctor Checks & System Info**
  - [x] Generate detailed system report (`ns doctor`)
  - [x] Quick links to troubleshoot environments
