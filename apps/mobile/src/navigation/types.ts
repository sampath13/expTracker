export type HomeStackParamList = {
  Home: undefined;
  ScanReceipt: undefined;
  ConfirmOCR: undefined;
};

export type ExpensesStackParamList = {
  ExpenseList: undefined;
  BillDetail: { billId: string };
};

export type CompareStackParamList = {
  CompareHome: undefined;
  ItemDetail: { productId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  MobileEntry: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  ExpensesTab: undefined;
  CompareTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
