import { create } from 'zustand';

interface Bill {
  id: string;
  retailerName: string;
  outletName: string | null;
  total: number;
  confirmedAt: string;
  itemCount: number;
}

interface ExpensesState {
  bills: Bill[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  currentBill: any | null;
  error: string | null;
  fetchBills: () => void;
  appendBills: (newBills: Bill[], nextCursor: string | null) => void;
  setCurrentBill: (bill: any) => void;
  upsertBill: (bill: any) => void;
  removeBill: (billId: string) => void;
  syncBills: () => void;
}

const initialState = {
  bills: [],
  cursor: null,
  hasMore: true,
  isLoading: false,
  syncStatus: 'idle' as const,
  currentBill: null,
  error: null,
};

export const useExpensesStore = create<ExpensesState>((set) => ({
  ...initialState,
  fetchBills: () => {
    // Stub — implemented in S4.4
  },
  appendBills: (_newBills: Bill[], _nextCursor: string | null) => {
    // Stub
  },
  setCurrentBill: (_bill: any) => {
    // Stub
  },
  upsertBill: (_bill: any) => {
    // Stub
  },
  removeBill: (_billId: string) => {
    // Stub
  },
  syncBills: () => {
    // Stub — implemented in S4.5
  },
}));
