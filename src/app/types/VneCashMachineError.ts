export type CashErrorType =
  | 'GLOBAL'
  | 'RECYCLER'
  | 'HOPPER'
  | 'DISPENSER'
  | 'NETWORK'
  | 'PAYMENT';

export interface CashError {
  type: CashErrorType;
  message: string;
  code?: string | number;
  timestamp: number;
}