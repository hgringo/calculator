export interface PaymentLog {
    timestamp: Date;
    amount: number;
    inserted: number;
    rest: number;
    status: string; //'completed' | 'canceled';
    justif?: string;
}