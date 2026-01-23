# NativeScript Forge (NS-Forge) Feature Roadmap

## LAYER 1 — Core MVP (Wajib Ada)
**Target:** “GUI wrapper yang benar-benar berguna dari hari pertama”

### 1. Project Manager
*   **List project NativeScript**
*   **Deteksi otomatis:**
    *   Framework (Angular / Vue / Core)
    *   NS version
    *   Android SDK / iOS status
*   **Open project → dashboard**
*   👉 **Value:** context awareness

### 2. Environment Health Check
*   **GUI untuk:**
    *   Node version
    *   Java / Android SDK
    *   Xcode / CocoaPods
    *   `ns doctor` (visualized)
*   **Tampilan:**
    *   ✅ OK
    *   ⚠️ Warning
    *   ❌ Broken
    *   Quick fix suggestion
*   👉 **Ini alone sudah killer feature.**

### 3. Visual CLI Runner
*   **Run:**
    *   `ns run android`
    *   `ns run ios`
    *   `ns build`
*   **Log viewer:**
    *   filter error
    *   highlight stacktrace
    *   copy clean error
*   👉 **Developer tidak perlu terminal terus.**

### 4. Config Editor (Safe Mode)
*   **GUI editor untuk:**
    *   `nativescript.config.ts`
    *   App ID
    *   App name
    *   iOS / Android config dasar
*   **Dengan:**
    *   schema validation
    *   undo
    *   diff preview

---

## LAYER 2 — Developer Productivity Booster
**Target:** “mengurangi kerja repetitif”

### 5. Plugin Manager (Big Win)
*   Browse installed plugins
*   Install / uninstall plugin
*   **Compatibility checker:**
    *   NS 8 vs 9
    *   Android / iOS support
    *   Show known issues (cache lokal / crowd-sourced)
*   👉 **Plugin adalah pain point terbesar di NS.**

### 6. Platform Controls
*   **GUI toggle:**
    *   Clean build
    *   Reset platform
    *   Rebuild native project
    *   Clear Gradle / CocoaPods cache
*   **Tanpa:**
    *   `rm -rf platforms node_modules`

### 7. Certificate & Signing Manager
*   **Android:**
    *   keystore
    *   signing config
*   **iOS:**
    *   provisioning profile
    *   team id
*   👉 **Ini extremely valuable untuk non-native dev.**

---

## LAYER 3 — Advanced / Pro Features
**Target:** power user seperti kamu 😄

### 8. Version & Migration Assistant
*   **Check:**
    *   NS upgrade impact
    *   Plugin breaking change
    *   Dry-run upgrade
    *   Auto generate migration checklist
*   👉 **Ini jarang ada, tapi high value.**

### 9. Build Presets
*   Dev / Staging / Prod
*   Env variable visual editor
*   One-click build profile

### 10. Debug & Inspect Tools
*   Device inspector
*   Live reload control
*   Memory / FPS monitor (basic)

---

## LAYER 4 — Ecosystem & Monetizable
**Target:** long-term sustainability

### 11. Template & Blueprint System
*   **Project template:**
    *   auth
    *   tabs
    *   API-ready
    *   Custom internal template

### 12. CI/CD Exporter
*   **Generate:**
    *   GitHub Actions
    *   GitLab CI
    *   Based on project config

### 13. Community Intelligence (Optional)
*   Plugin issue database
*   Version compatibility matrix
*   Opt-in telemetry (anonymous)
