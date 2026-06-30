export type {
  HomeStackParamList,
  ExpensesStackParamList,
  CompareStackParamList,
  SettingsStackParamList,
  AuthStackParamList,
  RootTabParamList,
} from '@navigation/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  mobile: string;
  communityContribution: boolean;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    mobile: string | null;
    tier: 'free' | 'premium' | 'founder';
    googleLinked: boolean;
  };
}

export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OcrItem {
  rawText: string;
  matchedName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  confidence: ConfidenceTier;
  candidateMatches?: Array<{ name: string; price: number }>;
}

export interface ScanResponse {
  retailer: string;
  date: string;
  items: OcrItem[];
}

export interface BillResponse {
  id: string;
  retailerName: string;
  outletName: string | null;
  total: number;
  gst: number | null;
  confirmedAt: string;
  itemCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
