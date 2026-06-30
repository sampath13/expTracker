import { create } from 'zustand';

interface ComparisonChain {
  chainName: string;
  price: number;
  savings: number | null;
  lastObserved: string;
}

interface ComparisonResult {
  productId: string;
  productName: string;
  userPrice: number;
  minPrice: number;
  minChain: string | null;
  tier: string;
  chainPrices: ComparisonChain[];
}

interface CompareState {
  searchQuery: string;
  searchResults: Array<{ id: string; name: string; category: string }>;
  currentComparison: ComparisonResult | null;
  basketComparison: any | null;
  isLoading: boolean;
  error: string | null;
  searchProducts: (query: string) => void;
  compareItem: (productId: string, unitPrice: number, chainId: string) => void;
  compareBasket: (items: Array<{ productId: string; unitPrice: number; chainId: string }>) => void;
  clearComparison: () => void;
}

const initialState = {
  searchQuery: '',
  searchResults: [],
  currentComparison: null,
  basketComparison: null,
  isLoading: false,
  error: null,
};

export const useCompareStore = create<CompareState>((set) => ({
  ...initialState,
  searchProducts: (_query: string) => {
    // Stub — implemented in S5.4
  },
  compareItem: (_productId: string, _unitPrice: number, _chainId: string) => {
    // Stub — implemented in S5.2
  },
  compareBasket: (_items: Array<{ productId: string; unitPrice: number; chainId: string }>) => {
    // Stub — implemented in S5.3
  },
  clearComparison: () => {
    // Stub
  },
}));
