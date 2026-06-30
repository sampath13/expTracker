---
name: react-native-mobile
description: Use when creating or modifying React Native code in apps/mobile/, especially screens, navigation, Zustand store slices, WatermelonDB models/sync, camera integration with react-native-vision-camera, on-device blur detection, auth token management, or React Navigation v6 configuration. Use ONLY for the expTracker mobile client.
---

# React Native Mobile — expTracker

## Tech Stack

| Concern | Library | Notes |
|---|---|---|
| Framework | React Native (bare, no Expo) | `npx react-native init ExpTracker` |
| Navigation | React Navigation v6 | `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack` |
| State | Zustand | Provider-free, 4 slices: auth, scan, expenses, compare |
| Local DB | WatermelonDB | Reactive, lazy loading, offline sync with SQLite adapter |
| Camera | react-native-vision-camera v3+ | High-res capture, auto-focus, no deprecated react-native-camera |
| Permissions | react-native-permissions | CAMERA only — no storage permission needed |
| File I/O | react-native-fs | App cache directory only |
| Blur detection | Laplacian variance | Custom util, run off main thread |
| Secure storage | react-native-keychain | JWT + refresh token persistence |

## Navigation Structure

```
BottomTabNavigator
  ├── HomeStack       (Home → ScanReceipt → ConfirmOCR)
  ├── ExpensesStack   (ExpenseList → BillDetail)
  ├── CompareStack    (CompareHome → ItemDetail)
  └── SettingsStack   (Settings → Profile)
```

Auth screen sits outside the tab navigator as a root conditional — no navigation guard inside tabs.

## Zustand Store Slices

Each slice in `apps/mobile/src/store/`:

| Slice | State | Key Actions |
|---|---|---|
| `auth` | `{ user, jwt, refreshToken, isAuthenticated }` | `login`, `logout`, `register`, `refreshToken`, `setGoogleUser` |
| `scan` | `{ imageUri, uploadProgress, ocrResult, isConfirming }` | `captureImage`, `uploadImage`, `setOcrResult`, `confirmBill`, `resetScan` |
| `expenses` | `{ bills[], paginationCursor, isLoading }` | `fetchBills`, `fetchNextPage`, `deleteBill`, `syncFromCloud` |
| `compare` | `{ comparisons[], searchResults, isLoading }` | `compareItem`, `compareBasket`, `searchProducts` |

## WatermelonDB Schema

Location: `apps/mobile/src/db/`

```
users          (id, email, mobile, created_at)
bills          (id, user_id, retailer_name, outlet_name, total, confirmed_at, _sync_status)
bill_items     (id, bill_id, raw_text, matched_name, qty, unit, unit_price, total, confidence)
```

Sync strategy:
- Pull on launch → full sync from Personal Bills DB
- Incremental sync → records updated since last sync timestamp
- Conflict: most recent `confirmed_at` wins
- Offline writes → queued locally, pushed on connectivity restore
- `_sync_status`: `'synced' | 'created' | 'updated' | 'deleted'`

## Camera & Permission Flow

```
App launch
  → Check camera permission (react-native-permissions)
    ├─ Granted → proceed to camera
    ├─ Denied → show rationale, link to Settings
    └─ Undetermined → request, handle denial
  → Capture photo (react-native-vision-camera, high-res, auto-focus)
  → On-device blur detection (Laplacian variance ~100 threshold)
    ├─ Sharp → proceed to upload
    └─ Blurry → prompt retake
  → Save to app cache dir (react-native-fs) — NO storage permission
  → Upload to pre-signed S3 URL
  → Delete from local cache
```

## Auth Token Management

- JWT (15-min expiry) + refresh token (30-day, rotating)
- Store in react-native-keychain (secure enclave on iOS, keystore on Android)
- Axios/Fetch interceptor: attach JWT to every request
- On 401: attempt refresh; on refresh failure → clear tokens → navigate to login
- On app launch: load stored tokens, validate expiry, auto-refresh if needed

## Project Structure

Follows the **React Native community layer-based convention** inside `src/`:

```
apps/mobile/
├── src/
│   ├── screens/              # Screen components, one file per route
│   │   ├── HomeScreen.tsx
│   │   ├── ScanReceiptScreen.tsx
│   │   ├── ConfirmOcrScreen.tsx
│   │   ├── ExpenseListScreen.tsx
│   │   ├── BillDetailScreen.tsx
│   │   ├── CompareScreen.tsx
│   │   ├── ItemDetailScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── components/           # Reusable UI components (shared across screens)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Skeleton.tsx
│   │   └── EmptyState.tsx
│   ├── navigation/           # React Navigation v6 config
│   │   ├── AppNavigator.tsx
│   │   ├── HomeStack.tsx
│   │   ├── ExpensesStack.tsx
│   │   ├── CompareStack.tsx
│   │   ├── SettingsStack.tsx
│   │   └── types.ts
│   ├── store/                # Zustand store slices
│   │   ├── authSlice.ts
│   │   ├── scanSlice.ts
│   │   ├── expensesSlice.ts
│   │   └── compareSlice.ts
│   ├── db/                   # WatermelonDB
│   │   ├── schema.ts
│   │   ├── models/
│   │   │   ├── Bill.ts
│   │   │   └── BillItem.ts
│   │   └── sync.ts
│   ├── services/             # API client, side-effectful code
│   │   └── api.ts
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCamera.ts
│   │   └── usePermissions.ts
│   ├── utils/                # Pure utility functions
│   │   ├── blurDetection.ts
│   │   └── formatters.ts
│   ├── constants/            # App-wide constants
│   │   ├── colors.ts
│   │   └── config.ts
│   ├── types/                # Shared TypeScript types
│   │   └── index.ts
│   └── theme/                # Shared styling tokens
│       └── index.ts
├── __tests__/                # Jest tests (mirrors src/ structure)
├── android/
├── ios/
├── App.tsx                   # Root: providers, navigation container
├── index.js                  # Entry point
├── app.json
├── package.json
├── tsconfig.json
├── metro.config.js
├── babel.config.js
└── jest.config.js
```

## Conventions

- Use TypeScript for all new files — `.tsx` for components, `.ts` for utilities
- Functional components + hooks only — no class components
- One screen per file in `screens/`, named after the screen route
- API calls go through `services/api.ts` — never inline fetch/axios in screens
- Camera operations through `hooks/useCamera.ts`
- Permission checks through `hooks/usePermissions.ts`
- No hardcoded strings — use `constants/` or future i18n
- `__tests__/` at root mirrors `src/` structure
- Co-locate screen-specific sub-components in `screens/<ScreenName>/components/` if >3 sub-components
