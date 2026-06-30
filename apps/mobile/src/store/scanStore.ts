import { create } from 'zustand';

interface OcrItem {
  rawText: string;
  matchedName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ScanState {
  capturedImagePath: string | null;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  objectKey: string | null;
  ocrResult: { retailer: string; date: string; items: OcrItem[] } | null;
  isManualEntry: boolean;
  error: string | null;
  captureImage: (path: string) => void;
  uploadImage: () => void;
  setOcrResult: (result: any) => void;
  setManualEntry: (isManual: boolean) => void;
  resetScan: () => void;
}

const initialState = {
  capturedImagePath: null,
  uploadProgress: 0,
  uploadStatus: 'idle' as const,
  objectKey: null,
  ocrResult: null,
  isManualEntry: false,
  error: null,
};

export const useScanStore = create<ScanState>((set) => ({
  ...initialState,
  captureImage: (_path: string) => {
    // Stub
  },
  uploadImage: () => {
    // Stub — implemented in S2.4
  },
  setOcrResult: (_result: any) => {
    // Stub — implemented in S3.7
  },
  setManualEntry: (_isManual: boolean) => {
    // Stub
  },
  resetScan: () => {
    // Stub — implemented in S2.2
  },
}));
