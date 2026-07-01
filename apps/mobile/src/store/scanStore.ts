import { create } from 'zustand';
import apiClient from '../services/api';
import type { UploadUrlResponse, ScanResponse } from '@types';

interface ScanState {
  capturedImagePath: string | null;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  objectKey: string | null;
  ocrResult: ScanResponse | null;
  isManualEntry: boolean;
  error: string | null;
  captureImage: (path: string) => void;
  uploadImage: (imagePath: string) => Promise<void>;
  setOcrResult: (result: ScanResponse | null) => void;
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

  captureImage: (path: string) => {
    set({ capturedImagePath: path, uploadStatus: 'idle', uploadProgress: 0, error: null });
  },

  uploadImage: async (imagePath: string) => {
    set({ uploadStatus: 'uploading', uploadProgress: 0, error: null });

    try {
      const { uploadUrl, objectKey } = await apiClient.get<UploadUrlResponse>('/bills/upload-url');
      set({ objectKey });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            set({ uploadProgress: progress });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.timeout = 30000;

        xhr.send({ uri: imagePath, type: 'image/jpeg', name: 'receipt.jpg' });
      });

      set({ uploadStatus: 'success', uploadProgress: 100 });
    } catch (err: any) {
      set({ uploadStatus: 'error', error: err.message || 'Upload failed' });
      throw err;
    }
  },

  setOcrResult: (result: ScanResponse | null) => {
    set({ ocrResult: result });
  },

  resetScan: () => {
    set({ ...initialState });
  },
}));
