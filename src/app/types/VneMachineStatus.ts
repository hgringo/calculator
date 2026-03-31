interface CashItem {
  label: string;
  quantity: number;
  level: 'ok' | 'low' | 'empty' | 'error';
}

interface RecyclerNote {
  max_level: string;
  min_level: string;
  alert: number;
  valore: number;
  quantita: string;
}

interface Recycler {
  [key: string]: RecyclerNote | any;
  mess: string;
  totalInRecycle: number;
  error: number;
}

interface HopperCoin {
  [key: string]: number | any;
  mess: string;
  totalInRecycle: number;
  error: number;
}

interface MachineStatus {
  recycler: Recycler;
  hopper: HopperCoin;
  tipo: number;
}