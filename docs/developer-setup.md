# Developer Setup Guide — ExpTracker

Last updated: 2026-07-01

This document covers all tools and dependencies needed to develop the ExpTracker project. It reflects the actual working setup used on macOS (Apple Silicon).

---

## System Requirements

- **OS:** macOS 14+ (Sonoma/Sequoia)
- **Architecture:** Apple Silicon (arm64) or Intel (x64)
- **Disk:** ~20 GB free (Docker images, Xcode simulators, SDKs)
- **RAM:** 16 GB recommended (Docker + Xcode + Metro bundler run simultaneously)

---

## 1. Core Toolchain

### 1.1 Node.js + npm

```bash
# Install via Homebrew or nvm
brew install node@22
# Verify
node --version    # >= 22.11.0
npm --version     # >= 10.x
```

### 1.2 .NET 10 SDK

```bash
brew install --cask dotnet-sdk
# Verify
dotnet --version   # 10.0.x
```

Install the EF Core CLI tool globally:

```bash
dotnet tool install --global dotnet-ef
dotnet tool update --global dotnet-ef
# Add to PATH if needed (~/.zshrc)
export PATH="$PATH:$HOME/.dotnet/tools"
```

### 1.3 Python 3.12+

```bash
brew install python@3.12
# Verify
python3 --version  # 3.12.x
```

### 1.4 Docker Runtime

On macOS, Docker Desktop or Colima is needed. This project uses **Colima** (lightweight, no license fees).

```bash
brew install colima docker docker-compose
colima start
# Verify
docker ps
```

> **Note:** `docker compose` (v2 plugin) is required, not the legacy `docker-compose` (v1).

---

## 2. iOS Development

### 2.1 Xcode

Install from the Mac App Store or [developer.apple.com](https://developer.apple.com).

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -version
# Expected: Xcode 16.x or later
```

### 2.2 CocoaPods

```bash
sudo gem install cocoapods
# Verify
pod --version   # 1.16.x
```

### 2.3 iOS Simulator

Xcode includes simulators. To create one:

```bash
# List available simulators
xcrun simctl list

# Create if needed
xcrun simctl create "iPhone 17 Pro" "iPhone 17 Pro" "com.apple.CoreSimulator.SimRuntime.iOS-26-5"
```

---

## 3. Android Development

### 3.1 Android Studio

Download from [developer.android.com/studio](https://developer.android.com/studio).

After installation, use the SDK Manager to install:
- **SDK Platform:** API 35 (Android 15) or later
- **SDK Build-Tools:** 35.0.0
- **NDK:** 27.x (required by react-native-vision-camera)
- **Android Emulator:** Create an emulator (e.g., Pixel 9, API 35)

### 3.2 Environment Variables

Add to `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
```

### 3.3 Java JDK 17

```bash
brew install openjdk@17
# Verify
java -version   # 17.x
```

### 3.4 Verify

```bash
adb devices              # Should show emulator or device
```

---

## 4. Project Setup (First Time)

### 4.1 Clone and Install Dependencies

```bash
cd expTracker
```

#### Mobile App

```bash
cd apps/mobile
npm install

# Additional packages installed for this project:
#   react-native-keychain       — secure token storage
#   react-native-nitro-modules  — required by vision-camera v5
#   react-native-nitro-image    — required by vision-camera v5
#   @types/node                 — TypeScript types for Buffer

cd ../..
```

#### Backend API

```bash
cd apps/api
dotnet restore
cd ../..
```

#### Python OCR Service

```bash
cd apps/ocr-service
# Virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Note: PaddleOCR and OpenCV are installed in Docker, not on host
deactivate
cd ../..
```

### 4.2 iOS Pods

```bash
cd apps/mobile/ios
pod install
cd ../..
```

> **Troubleshooting:** If `pod install` fails with "Unable to find a specification for simdjson":
> 1. Verify `node_modules/@nozbe/simdjson` exists
> 2. The Podfile has been updated to reference `../node_modules/@nozbe/simdjson` as a local path
> 3. Run `pod repo update trunk` and retry

### 4.3 Docker Environment

```bash
cd docker
docker compose up -d
# Wait for all services (postgres, api, ocr, s3ninja) to be healthy
docker compose ps
cd ..
```

### 4.4 Verify Backend

```bash
# API health
curl http://localhost:5010/health | python3 -m json.tool
# Expected: {"status":"Healthy",...}

# Test registration
curl -s -X POST http://localhost:5010/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"TestPass123","mobile":"+65 9123 4567","communityContribution":true}'
# Expected: {"message":"Registration successful"}
```

---

## 5. Running the App

### 5.1 Start Backend (if not running)

```bash
cd docker
docker compose up -d
cd ..
```

### 5.2 Start Metro Bundler

```bash
cd apps/mobile
npx react-native start --port 8081
# Leave this terminal running
```

### 5.3 Launch iOS Simulator

In a **new terminal**:

```bash
cd apps/mobile
npx react-native run-ios
```

> **Troubleshooting:** If the build fails with `rsync` sandbox errors:
> ```bash
> # Build manually with sandboxing disabled
> rm -rf ~/Library/Developer/Xcode/DerivedData/ExpTracker-*
> xcodebuild -workspace ios/ExpTracker.xcworkspace \
>   -scheme ExpTracker \
>   -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
>   -configuration Debug build \
>   ENABLE_USER_SCRIPT_SANDBOXING=NO
> ```

### 5.4 Launch Android Emulator

```bash
# Start emulator
emulator -avd Pixel_9_API_35 &

# Build and run
cd apps/mobile
npx react-native run-android
```

---

## 6. Development Workflow

### 6.1 JS/TS Changes (Mobile)

After saving a `.tsx`/`.ts` file:
- **iOS Simulator:** Press `Cmd+R` to reload
- **Android Emulator:** Press `R` twice

### 6.2 Native Changes (Mobile)

After modifying native code (Info.plist, Podfile, etc.):
```bash
cd apps/mobile
npx react-native run-ios  # rebuilds native
```

### 6.3 Backend Changes (.NET API)

```bash
cd docker
docker compose build api && docker compose up -d api
```

### 6.4 OCR Changes (Python)

```bash
cd docker
docker compose build ocr && docker compose up -d ocr
```

---

## 7. Port Map

| Service | Host Port | Container Port | Purpose |
|---|---|---|---|
| Metro Bundler | 8081 | — | JS bundle serving |
| .NET API | 5010 | 5000 | Backend REST API |
| PostgreSQL | 5432 | 5432 | Database |
| Python OCR | 8000 | 8000 | OCR microservice |
| S3Ninja (S3Mock) | 9444 | 9090 | S3-compatible storage (dev) |
| S3Ninja HTTPS | 9191 | 9191 | S3 HTTPS (dev) |

> **Note:** Port 5000 is used by macOS AirPlay Receiver, so the API is mapped to host port 5010 instead.

---

## 8. Known Issues & Workarounds

### 8.1 macOS AirPlay Blocks Port 5000

macOS Sonoma/Sequoia reserves port 5000 for AirPlay Receiver.

**Fix:** The API Docker port is mapped to `5010:5000` in `docker-compose.yml`. The mobile app's `config.ts` points to `http://localhost:5010`.

### 8.2 Xcode Build Fails with rsync Sandbox Error

```
Sandbox: rsync(XXXXX) deny(1) file-read-data ...
```

**Fix:** Build with `ENABLE_USER_SCRIPT_SANDBOXING=NO`. This has been added to the Pods xcconfig for the project. If the issue persists, manually add:
```
echo 'ENABLE_USER_SCRIPT_SANDBOXING = NO' >> ios/Pods/Target\ Support\ Files/Pods-ExpTracker/Pods-ExpTracker.debug.xcconfig
```

### 8.3 S3 Bucket Not Created on Startup

The `adobe/s3mock` image may not auto-create buckets from the `initialBuckets` env var.

**Fix:** The API `ApplyMigrationsAndSeed()` now auto-creates the bucket on startup. If the bucket is missing:
```bash
curl -X PUT http://localhost:9444/exptracker-temp-images
```

### 8.4 pod install Fails on simdjson or NitroImage

WatermelonDB requires `simdjson`, and vision-camera v5 requires `NitroImage`. These are npm-vendored packages.

**Fix:**
```bash
npm install react-native-nitro-modules react-native-nitro-image
```
The Podfile has been updated with `pod 'simdjson', :path => '../node_modules/@nozbe/simdjson'`.

### 8.5 iOS Simulator Has No Camera

The iOS simulator cannot access the MacBook camera. The app includes a **Simulator Mode** that shows a mock camera interface and loads a sample receipt from `src/assets/sample-receipt.jpg`.

### 8.6 dotnet-ef Tool Version Mismatch

If you see errors about incompatible EF Core tooling:
```bash
dotnet tool update --global dotnet-ef
# Make sure it's in PATH
export PATH="$PATH:$HOME/.dotnet/tools"
```

---

## 9. Project Structure

```
expTracker/
├── apps/
│   ├── api/              # .NET 10 Backend (3-tier: Api/Core/Infrastructure)
│   │   ├── src/
│   │   │   ├── ExpTracker.Api/         # Controllers, middleware
│   │   │   ├── ExpTracker.Core/        # Services, DTOs, interfaces
│   │   │   └── ExpTracker.Infrastructure/  # DbContexts, S3, JWT, Google Auth
│   │   └── tests/
│   ├── mobile/           # React Native 0.86 (bare, no Expo)
│   │   ├── src/
│   │   │   ├── screens/       # Screen components
│   │   │   ├── components/    # Reusable UI
│   │   │   ├── navigation/    # React Navigation v7 config
│   │   │   ├── store/         # Zustand slices (auth, scan, expenses, compare)
│   │   │   ├── services/      # API client
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── utils/         # Utilities (blur detection)
│   │   │   ├── types/         # TypeScript types
│   │   │   └── constants/     # Colors, config
│   │   ├── android/
│   │   └── ios/
│   ├── ocr-service/      # Python FastAPI OCR microservice
│   │   └── src/ocr_service/
│   └── threader/         # Decision thread explorer tool
├── docs/                 # Architecture, epics, product overview
├── docker/               # Docker Compose dev environment
├── stories/              # Story breakdowns per epic
│   └── bugs/             # Bug reports
└── .github/workflows/    # CI pipelines
```

---

## 10. Key Dependencies

| Layer | Technology | Version |
|---|---|---|
| Mobile Framework | React Native (bare) | 0.86.0 |
| Navigation | React Navigation | 7.x |
| State Management | Zustand | 5.x |
| Local DB | WatermelonDB | 0.28.0 |
| Camera | react-native-vision-camera | 5.0.11 |
| Image Processing | react-native-nitro-image | 0.15.1 |
| File I/O | react-native-fs | 2.20.0 |
| Secure Storage | react-native-keychain | latest |
| Permissions | react-native-permissions | 5.6.0 |
| Backend | .NET / ASP.NET Core | 10.0 |
| ORM | EF Core + Npgsql | 10.0 |
| Auth | ASP.NET Core Identity + JWT | 10.0 |
| Database | PostgreSQL | 16 (Alpine) |
| OCR Engine | PaddleOCR | latest |
| OCR Framework | FastAPI + OpenCV | 3.12 / 4.x |
| Image Storage | AWS S3 / S3Ninja (dev) | — |
| Container Runtime | Docker + Colima | — |
