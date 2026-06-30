---
name: typescript-clean-code
description: Use when writing TypeScript or JavaScript in this repo (mobile app, threader tool). Enforces consistent patterns: functional components, typed props, Zustand slices, async patterns, API service layer, file naming, module structure. Use for all TS/JS code in apps/mobile/ and apps/threader/.
---

# TypeScript Clean Code — expTracker

Applies to: `apps/mobile/` (React Native) and `apps/threader/` (Vite + React + Express).

## File Naming

| Kind | Convention | Example |
|---|---|---|
| React component | PascalCase, `.tsx` | `HomeScreen.tsx`, `SubmitButton.tsx` |
| Hook | camelCase, `use` prefix, `.ts` | `useAuth.ts`, `useCamera.ts` |
| Utility | camelCase, `.ts` | `blurDetection.ts`, `formatters.ts` |
| Store slice | camelCase, `Slice` suffix | `authSlice.ts`, `scanSlice.ts` |
| Service/client | camelCase, `.ts` | `api.ts` |
| Type/interface file | camelCase or `types.ts`, `.ts` | `types.ts`, `index.ts` |
| Constant file | camelCase, `.ts` | `colors.ts`, `config.ts` |
| Test file | `*.test.ts(x)` or `*.spec.ts(x)` | `HomeScreen.test.tsx` |

## Components

```typescript
// Prefer: typed functional components
interface HomeScreenProps {
  route: HomeStackParamList['Home'];
  // navigation typed via useNavigation typed hook
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ route }) => {
  // ... hooks at top, then handlers, then JSX
};

// Avoid: default exports in shared components
// Prefer: named exports for better tree-shaking and refactoring
export { HomeScreen };

// Avoid: anonymous default exports
// export default function() { ... }  ← NO

// Avoid: `any` — always type
// const data: any = await fetchBills();  ← NO
// const data: Bill[] = await fetchBills();  ← YES
```

## Hooks

```typescript
// Custom hooks: one responsibility per hook
// ❌ Hook that does too much
const useAppData = () => {
  const [user, setUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [camera, setCamera] = useState(null);
  // 3 concerns in 1 hook — split them
};

// ✅ Split into focused hooks
const useAuth = () => { /* user state only */ };
const useExpenses = () => { /* bills state only */ };
const useCamera = () => { /* camera state only */ };
```

## Zustand Slices

```typescript
// ✅ Slices as TypeScript interfaces + actions
interface AuthState {
  user: User | null;
  jwt: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  // Actions
  login: (creds: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshJwt: () => Promise<void>;
}

// Slice file: default export the store creator function
export const createAuthSlice: StateCreator<AuthState> = (set, get) => ({
  user: null,
  jwt: null,
  // ...
});
```

## Async Patterns

```typescript
// ✅ Use async/await with proper error handling
const fetchBills = async (cursor?: string): Promise<BillPage> => {
  try {
    const response = await api.get<BillPage>('/bills', { params: { after_id: cursor } });
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      await useAuthStore.getState().refreshJwt();
      return fetchBills(cursor);  // retry once
    }
    throw new ApiError('Failed to fetch bills', error);
  }
};

// ❌ Avoid: raw callbacks, untyped catch
// api.get('/bills', (err, result) => { ... })  ← use async/await
// } catch(e) { console.log(e) }  ← handle don't swallow
```

## API Service Layer

```typescript
// services/api.ts — centralized HTTP client
import axios from 'axios';
import { useAuthStore } from '../store/authSlice';

const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const jwt = useAuthStore.getState().jwt;
  if (jwt) config.headers.Authorization = `Bearer ${jwt}`;
  return config;
});

// Response interceptor: handle 401, refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // attempt token refresh, retry original request
    }
    return Promise.reject(error);
  }
);

export default api;
```

## TypeScript Strictness

```typescript
// tsconfig.json should set:
// "strict": true,
// "noUncheckedIndexedAccess": true,
// "noImplicitReturns": true,

// ✅ Use discriminated unions for API states
type LoadState<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: T }
  | { kind: 'error'; message: string };

// ❌ Avoid: separate boolean flags
// isLoading, hasError, errorMessage — 3 fields that can be inconsistent

// ✅ Use const enums or string unions for constants
type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

// ❌ Avoid: magic strings
// if (item.confidence === 'high') { }  ← comparison may silently fail
```

## File Organization

```
src/
├── screens/          # One file per route; co-locate sub-components if >3
│   └── ScanReceipt/
│       ├── ScanReceiptScreen.tsx
│       ├── CameraPreview.tsx
│       └── BlurWarning.tsx
├── components/       # Shared across 2+ screens
├── navigation/       # All navigator configs in one directory
└── services/api.ts   # Single HTTP client — never inline fetch/axios
```

## Avoid

| Don't | Do |
|---|---|
| `any` | Proper type or `unknown` with type guard |
| Inline `fetch`/`axios` | Centralized `services/api.ts` |
| `console.log` in production code | Structured logger or remove |
| Magic strings/numbers | Constants or enums |
| `export default` for shared modules | Named exports |
| Unused imports | Remove or `@ts-expect-error` with comment |
| `var` | `const` (default) or `let` (when reassigned) |
| `==` equality | `===` strict equality |
| `.jsx` extension for TSX files | `.tsx` extension |
| Side effects in render | `useEffect` with proper dependencies |
| Deeply nested callbacks | Flatten with async/await or extract functions |

## React Native Specific

- Use `react-native-keychain` for secure token storage (not AsyncStorage for secrets)
- Image cache dir via `react-native-fs` — never request storage permission
- Laplacian blur detection: run off main thread (worklets or JS thread, not UI thread)
- `useMemo` for expensive computations derived from state
- `useCallback` for handlers passed to memoized children
- WatermelonDB: always use `database.write()` for mutations, `database.get().query()` for reads
