# NS-Forge Testing Matrix

This document contains the Cross-Platform Testing Matrix based on the features available in `FEATURE-CHECKLIST.md`.

### Legend

- ⬜ : Ready to Test / Not Tested Yet
- ✅ : Passed
- ❌ : Failed / Bug Found
- ➖ : Not Applicable (e.g., iOS builds are not possible on Windows)

---

## 🛠️ 1. Setup & Environment

Focuses on the initial setup wizard and global system requirements detection.

|  No | Feature Name                                    | Windows | Win Note | Linux | Lin Note | macOS | Mac Note |
| --: | :---------------------------------------------- | :-----: | :------- | :---: | :------- | :---: | :------- |
|   1 | OS Detection & Requirements Verification        |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   2 | Node.js & Package Managers check                |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   3 | Java (JDK 17) & Android SDK check               |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   4 | NativeScript CLI globally installed verify      |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   5 | Generate detailed system report (Doctor Checks) |   ⬜    |          |  ⬜   |          |  ⬜   |          |

---

## 🌟 2. Main View

Focuses on the project management home, application GUI settings, and historical logs.

|  No | Category           | Feature Name                                | Windows | Win Note | Linux | Lin Note | macOS | Mac Note |
| --: | :----------------- | :------------------------------------------ | :-----: | :------- | :---: | :------- | :---: | :------- |
|   1 | **Home**           | Global System Report Overview               |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   2 | **Home**           | Project Import & Discovery (Single/Batch)   |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   3 | **Projects**       | Project Library / Overview List             |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   4 | **Projects**       | Quick Access & Project Removal              |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   5 | **Create Project** | Support for multiple flavors & Templates    |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   6 | **Create Project** | Real-time creation logs output              |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   7 | **Activity**       | Categorized Activity Logs (SQLite)          |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   8 | **Settings**       | Application Preferences (Theme, Default PM) |   ⬜    |          |  ⬜   |          |  ⬜   |          |
|   9 | **Settings**       | Data Management (Clear logs, DB integrity)  |   ⬜    |          |  ⬜   |          |  ⬜   |          |

---

## 🚀 3. App Mode

Focuses on the specific pages activated after a project is selected/opened by the user.

|  No | Category              | Feature Name                                    |  Windows   | Win Note |   Linux    | Lin Note |        macOS         | Mac Note |
| --: | :-------------------- | :---------------------------------------------- | :--------: | :------- | :--------: | :------- | :------------------: | :------- |
|   1 | **Dashboard**         | Project Status (`node_modules` checking)        |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|   2 | **Dashboard**         | Automated missing dependency fallback           |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|   3 | **Dashboard**         | Real-time ADB devices & emulator detection      |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|   4 | **Dashboard**         | Run Application (Emulator/Device)               | ⬜ Android |          | ⬜ Android |          | ⬜ Android<br>⬜ iOS |          |
|   5 | **Dashboard**         | Debug Application                               | ⬜ Android |          | ⬜ Android |          | ⬜ Android<br>⬜ iOS |          |
|   6 | **Dashboard**         | Build Production (APK/AAB/IPA)                  | ⬜ Android |          | ⬜ Android |          | ⬜ Android<br>⬜ iOS |          |
|   7 | **Dashboard**         | Execution Utilities (Stop, Log Stream, Clean)   | ⬜ Android |          | ⬜ Android |          | ⬜ Android<br>⬜ iOS |          |
|   8 | **Resource Config**   | Visual overview of App Icon & Splash screen     |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|   9 | **Resource Config**   | Asset Generation Engine                         |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|  10 | **Font Config**       | Font Management (Scan & Add TTF/OTF)            |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|  11 | **Project Config**    | General (Bundle ID, Project Name, Paths, etc)   |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|  12 | **Project Config**    | Android (V8 flags, Code Cache, GC tuning)       | ⬜ Android |          | ⬜ Android |          |      ⬜ Android      |          |
|  13 | **Project Config**    | iOS (Bundle ID overrides, JS Exception policy)  |  ➖ (N/A)  |          |  ➖ (N/A)  |          |        ⬜ iOS        |          |
|  14 | **Project Config**    | Bundler (Webpack/Vite switch, Backup/Restore)   |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|  15 | **Project Config**    | CLI & Security (Remote Modules/Presets PM)      |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|  16 | **Platform Config**   | Android (`app.gradle`, `before-plugins.gradle`) | ⬜ Android |          | ⬜ Android |          |      ⬜ Android      |          |
|  17 | **Platform Config**   | iOS (`build.xcconfig`, `Info.plist`)            |  ➖ (N/A)  |          |  ➖ (N/A)  |          |        ⬜ iOS        |          |
|  18 | **Install Plugin**    | Dependency Auditing (Outdated package check)    |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|  19 | **Install Plugin**    | Plugin Discovery (Marketplace Exploration)      |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|  20 | **Install Plugin**    | Plugin Installation Operations                  |     ⬜     |          |     ⬜     |          |          ⬜          |          |
|  21 | **Manage Permission** | Android Manifest Permissions Visual Editor      | ⬜ Android |          | ⬜ Android |          |      ⬜ Android      |          |
|  22 | **Manage Permission** | iOS Plist Permissions (Usage Descriptions)      |  ➖ (N/A)  |          |  ➖ (N/A)  |          |        ⬜ iOS        |          |
