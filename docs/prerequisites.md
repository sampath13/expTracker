# Blocked Stories — Prerequisite Document

> **RESOLVED 2026-06-30** — All toolchain blockers installed, all 8 blocked stories completed.
> 10/11 Epic 0 stories are now DONE with full verification (build, test, typecheck).

---

## Root Blockers — Toolchain Prerequisites

### B1: Java JDK + Android SDK

**Required by:** S0.1, S0.2, S0.3, S0.4, S0.5, S0.11 (6 stories)

| Tool | Required Version | Purpose |
|---|---|---|
| Java JDK | 17 (LTS) | Required for Gradle/React Native Android native build |
| Android SDK | API 34 (Android 14) | Build target, emulator image |
| Android SDK Platform-Tools | Latest stable | `adb` for emulator/device communication |
| Android SDK Build-Tools | 34.0.0 | Compilation |
| Android NDK | 26.x | Required by react-native-vision-camera (C++ native module compilation) |

**Verification checklist:**
- [ ] `java -version` reports JDK 17
- [ ] `$JAVA_HOME` environment variable set
- [ ] `$ANDROID_HOME` environment variable set
- [ ] `adb devices` lists an available emulator or device
- [ ] `npx react-native init TestProject` completes successfully (smoke test)

**Installation guide:**
```bash
# macOS (Homebrew) — recommended path
brew install openjdk@17
brew install android-commandlinetools  # or Android Studio for GUI

# Environment variables (~/.zshrc)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
```

---

### B2: .NET 10 SDK

**Required by:** S0.6, S0.7 (2 stories)
**Blocks partially:** S0.9 (API Dockerfile), S0.10 (.NET test assertions)

| Tool | Required Version | Purpose |
|---|---|---|
| .NET SDK | 10.0.x (STS or LTS) | Backend build, EF Core migrations, NuGet restore |
| .NET Runtime | 10.0.x | `dotnet run`, test runner |
| EF Core CLI | Included in SDK | `dotnet ef` for migrations |

**Current state:** .NET 8.0.119 installed — upgrade required.

**Verification checklist:**
- [ ] `dotnet --version` reports 10.0.x
- [ ] `dotnet new webapi` creates a project targeting `net10.0`
- [ ] `dotnet build` succeeds on the new project
- [ ] EF Core 10 NuGet packages resolve without version conflicts

**Installation guide:**
```bash
# macOS (x64/arm64 — download from dotnet.microsoft.com)
# .NET 10 installer: https://dotnet.microsoft.com/en-us/download/dotnet/10.0
brew install --cask dotnet-sdk

# Verify
dotnet --version
# Expected: 10.0.x
```

---

## Blocked Stories & Their Direct Prerequisites

### S0.1 — React Native Project Scaffold
- **Status:** BLOCKED
- **Blocked by:** B1 (Java JDK + Android SDK)
- **Blocks:** S0.2, S0.3, S0.4, S0.5, S0.11 (5 stories)
- **Why blocked:** Cannot run `npx react-native init` without JDK; cannot build/launch on emulator without Android SDK.
- **Location:** `stories/epic-0-scaffold/S0.1-rn-scaffold.md`

### S0.2 — Zustand Store Skeleton
- **Status:** BLOCKED
- **Blocked by:** S0.1 → B1 (Java JDK + Android SDK)
- **Blocks:** S0.11
- **Why blocked:** Requires an existing React Native project (`apps/mobile/`) to install packages into and add store files.
- **Location:** `stories/epic-0-scaffold/S0.2-zustand-store.md`

### S0.3 — WatermelonDB Setup
- **Status:** BLOCKED
- **Blocked by:** S0.1 → B1 (Java JDK + Android SDK)
- **Why blocked:** Requires an existing React Native project with native build system to install WatermelonDB + SQLite native adapter.
- **Location:** `stories/epic-0-scaffold/S0.3-watermelondb-setup.md`

### S0.4 — Permissions Foundation
- **Status:** BLOCKED
- **Blocked by:** S0.1 → B1 (Java JDK + Android SDK)
- **Blocks:** S0.5
- **Why blocked:** Requires an existing React Native project to install `react-native-permissions` and configure `AndroidManifest.xml`.
- **Location:** `stories/epic-0-scaffold/S0.4-permissions.md`

### S0.5 — Camera Capture & File I/O
- **Status:** BLOCKED
- **Blocked by:** S0.4 → S0.1 → B1 (Java JDK + Android SDK)
- **Why blocked:** Requires a working React Native project with permissions configured (S0.4) to install `react-native-vision-camera` and `react-native-fs`.
- **Location:** `stories/epic-0-scaffold/S0.5-camera-fileio.md`

### S0.6 — .NET 10 Backend Scaffold
- **Status:** BLOCKED
- **Blocked by:** B2 (.NET 10 SDK)
- **Blocks:** S0.7, partially S0.9 (API Dockerfile), partially S0.10 (.NET tests)
- **Why blocked:** Cannot create a .NET 10 solution, install EF Core 10 / Npgsql / other NuGet packages targeting `net10.0` with only .NET 8 installed.
- **Location:** `stories/epic-0-scaffold/S0.6-dotnet-scaffold.md`

### S0.7 — Database Migrations & EF Core Models
- **Status:** BLOCKED
- **Blocked by:** S0.6 → B2 (.NET 10 SDK)
- **Why blocked:** Requires the .NET solution, DbContext classes, and EF Core tooling from S0.6 to generate and apply migrations.
- **Location:** `stories/epic-0-scaffold/S0.7-db-migrations.md`

### S0.11 — Mobile API Client Module
- **Status:** BLOCKED
- **Blocked by:** S0.2 → S0.1 → B1 (Java JDK + Android SDK)
- **Why blocked:** Requires an existing React Native project with Zustand store (S0.2) to import the auth slice and wire the token interceptor.
- **Location:** `stories/epic-0-scaffold/S0.11-mobile-api-client.md`

---

## Partially Blocked Stories

These stories have been started but have one or more items blocked.

### S0.9 — Docker Compose Dev Environment
- **Status:** DONE (partial)
- **Blocked by:** S0.6 → B2 (.NET 10 SDK)
- **Completed:** `docker-compose.yml` with postgres, OCR, S3Ninja services; OCR Dockerfile; `.env.example`; init SQL
- **Blocked items:**
  - [ ] API Dockerfile (`apps/api/Dockerfile`) — needs .NET 10 solution from S0.6
  - [ ] Full stack verification with API service — needs S0.6
- **Location:** `stories/epic-0-scaffold/S0.9-docker-compose.md`

### S0.10 — CI Skeleton
- **Status:** DONE (partial)
- **Blocked by:** S0.6 → B2 (.NET 10 SDK)
- **Completed:** All three workflow YAML files (ci-mobile, ci-api, ci-ocr), `.editorconfig`, Python test assertions, ruff config
- **Blocked items:**
  - [ ] .NET test project with real integration/unit tests
  - [ ] CI badge(s) in README
- **Location:** `stories/epic-0-scaffold/S0.10-ci-skeleton.md`

---

## Completed Stories (No Action Needed)

| Story | Status | Completed Date |
|---|---|---|
| P0.1 — Monorepo Reorg | DONE | 2026-06-30 |
| S0.8 — Python OCR Service Scaffold | DONE | 2026-06-30 |

---

## Dependency Graph (Blocked Paths)

```
B1 (JDK + Android SDK) ──┬── S0.1 (RN Scaffold) ──┬── S0.2 (Zustand) ──── S0.11 (API Client)
                          │                        │
                          │                        ├── S0.3 (WatermelonDB)
                          │                        │
                          │                        ├── S0.4 (Permissions) ─── S0.5 (Camera)
                          │                        │
                          │                        └── S0.5 (Camera)

B2 (.NET 10 SDK) ────────┬── S0.6 (.NET Scaffold) ─── S0.7 (DB Migrations)
                          │
                          ├── S0.9 (Docker Compose) [partial]
                          │
                          └── S0.10 (CI) [partial]
```

---

## Resolution Order

1. **Install B1 (Java JDK + Android SDK)** → unblocks 6 stories (S0.1 → cascade)
2. **Install B2 (.NET 10 SDK)** → unblocks 2 stories (S0.6 → S0.7) + partial unblocks on S0.9, S0.10
3. **Execute S0.1** → unblocks 5 stories (S0.2, S0.3, S0.4, S0.5, S0.11)
4. **Execute S0.6** → unblocks S0.7 + completes S0.9 and S0.10
5. Remaining S0.2–S0.5, S0.11 can be executed in parallel with S0.6–S0.7 after their respective blockers resolve

---

## Impact

These 10 stories collectively represent the **entire Epic 0 (Project Scaffold)**. Since Epic 0 blocks all subsequent epics (Epic 1 through Epic 8 — ~49 stories of feature work), resolving these two toolchain blockers is **the highest-priority action** in the project.
