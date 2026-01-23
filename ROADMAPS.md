# NS Forge Roadmap

This roadmap outlines the planned development phases for **NS Forge**, a community-built development studio for NativeScript.  
The focus is on delivering practical value early, maintaining transparency, and evolving incrementally with community feedback.

> ⚠️ NS Forge is **not an official NativeScript product**.  
> It is built by the community, for the community.

---

## Guiding Principles

- Do not replace the NativeScript CLI — orchestrate it
- Prefer visibility and safety over hidden automation
- Ship small, usable increments
- Avoid premature abstraction
- Community feedback drives prioritization

---

## Phase 0 — Foundation & Validation (Pre-MVP)

**Goal:** Establish a solid technical and organizational foundation.

### Scope
- Define product scope and non-goals
- Finalize branding and positioning
- Prepare repository structure

### Deliverables
- GitHub organization: `nsforge`
- Initial repositories:
  - `nsforge-core`
  - `nsforge-desktop`
  - `nsforge-docs`
- Positioning statement & README v1
- Contribution guidelines
- License (MIT or Apache-2.0)

---

## Phase 1 — MVP (Core Value)

**Goal:** Deliver immediate, tangible value for NativeScript developers.

### Forge Projects
- Project discovery (scan local directories)
- Detect:
  - NativeScript version
  - Framework (Angular / Vue / Core)
  - Platforms (Android / iOS)
- Project dashboard view

### Forge Doctor
- Environment health checks:
  - Node.js
  - NativeScript CLI
  - Java / Android SDK
  - Xcode / CocoaPods (macOS)
- Visual status indicators (OK / Warning / Error)
- Basic fix hints (no auto-mutation)

### Forge Actions
- Run common CLI commands:
  - `ns run android`
  - `ns run ios`
  - `ns build`
- Integrated log viewer
- Error highlighting and filtering

### Deliverables
- First public MVP release
- Binary builds (macOS / Windows / Linux)
- Basic documentation

---

## Phase 2 — Productivity Boost

**Goal:** Reduce repetitive manual work and common mistakes.

### Forge Plugins
- List installed plugins
- Install / uninstall plugins
- Display plugin metadata
- Basic compatibility hints (best-effort)

### Forge Config
- Visual editor for:
  - `nativescript.config.ts`
  - App ID
  - App name
- Schema validation
- Diff preview before save

### Forge Platforms
- Platform management:
  - Reset Android / iOS platform
  - Clean build artifacts
  - Clear caches
- Safe execution (explicit user action)

### Deliverables
- Improved UX polish
- Expanded documentation
- Community feedback iteration

---

## Phase 3 — Advanced Tooling

**Goal:** Support advanced workflows and long-term maintenance.

### Forge Migrate
- NativeScript version scan
- Plugin compatibility analysis
- Migration checklist generation
- Dry-run upgrade simulation

### Forge Signing
- Android keystore configuration
- iOS signing overview (read-only first)
- Validation and warnings

### Forge Inspect
- Connected device overview
- Build/runtime information
- Basic performance metrics (non-invasive)

---

## Phase 4 — Ecosystem & Automation

**Goal:** Make NS Forge extensible and ecosystem-aware.

### Forge Deploy
- Build presets (Dev / Staging / Production)
- Environment variable editor
- CI configuration export:
  - GitHub Actions
  - GitLab CI (optional)

### Forge Intelligence (Optional)
- Community-driven knowledge base
- Known issues per NS version
- Plugin compatibility matrix
- Opt-in, anonymous telemetry

---

## Phase 5 — Sustainability & Growth

**Goal:** Ensure long-term maintainability and community health.

### Focus Areas
- Plugin architecture for NS Forge itself
- Stable API contracts in `nsforge-core`
- Better error diagnostics
- Documentation and onboarding improvements

### Community
- Contributor recognition
- Roadmap voting
- RFC process for major changes

---

## Out of Scope (Explicitly)

- Replacing the NativeScript CLI
- Introducing a new framework or runtime
- Auto-fixing destructive configuration changes
- Cloud-based build services (for now)

---

## Status Legend

- 🧪 Planned
- 🚧 In Progress
- ✅ Completed
- ❌ Dropped / Reconsidered

---

## Feedback

This roadmap is **not fixed**.  
Community feedback, real-world usage, and maintenance cost will continuously shape priorities.

Feel free to open an issue or discussion to propose changes.
