# BUG-S4.1-1: ConfirmOcrScreen — SafeAreaView Deprecation

**Epic:** 4 — Confirmation & Expense History
**Related Story:** S4.1
**Priority:** MEDIUM
**Reported:** 2026-07-01

## Context

The `ConfirmOcrScreen` uses `SafeAreaView` from `react-native` core, which has been deprecated in React Native 0.86. The warning reads:

> SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.

The `react-native-safe-area-context` package is already installed in the project and used in `App.tsx` (via `SafeAreaProvider`). The screen just needs to swap the import.

## Fix

1. In `src/screens/ConfirmOcrScreen.tsx` (line 374):
   - Replace `import { ..., SafeAreaView } from 'react-native'` 
   - Add `import { SafeAreaView } from 'react-native-safe-area-context'`

## Verification

- No console warning on screen mount
- Layout remains identical

---

# BUG-S4.1-2: ConfirmOcrScreen — Shows "No Scan Data" After Upload

**Epic:** 4 — Confirmation & Expense History
**Related Story:** S4.1, S3.7 (Backend OCR orchestration)
**Priority:** HIGH
**Reported:** 2026-07-01

## Context

After a successful image capture and upload to S3, the `ConfirmOcrScreen` displays "No Scan Data". The screen reads `ocrResult` from `useScanStore().ocrResult`, but this value is never populated because:

1. The `POST /bills/scan` endpoint (S3.7 — Backend OCR orchestration) has not been implemented yet
2. The `ScanReceiptScreen` upload flow does not call `POST /bills/scan` after upload
3. Even if called, the OCR service would need to return actual parsed receipt data (currently stubs)

## Root Cause Chain

1. Camera captures photo → 2. Blur check passes → 3. Upload to S3 succeeds → 4. Navigate to ConfirmOCR → 5. Screen reads `useScanStore().ocrResult` which is `null` → 6. Shows "No Scan Data" empty state

## Required Fixes

### A. Backend: Implement `POST /bills/scan` (S3.7)
- Receives `{ objectKey }`
- Calls Python OCR service to process the uploaded image
- OCR service returns structured line items
- Returns `ScanResponse` to mobile

### B. Mobile: Call `POST /bills/scan` after S3 upload
- In `ScanReceiptScreen.handleProceed`, after `uploadImage` succeeds:
  1. Call `POST /bills/scan` with the objectKey
  2. Store the OCR result in `useScanStore().setOcrResult`
  3. Then navigate to ConfirmOCR

### C. Wire the Python OCR pipeline end-to-end (S3.1-S3.6)
- Preprocessing (S3.1) ✅ — done
- PaddleOCR (S3.2) ✅ — done  
- Receipt parsing (S3.3) — not done
- Category detection (S3.4) — not done
- RapidFuzz matching (S3.5) — not done
- OCR REST API (S3.6) — partially done

## Verification

- After capture + upload, ConfirmOCR shows extracted receipt items with confidence tiers
- "No Scan Data" is only shown when no scan has been performed
