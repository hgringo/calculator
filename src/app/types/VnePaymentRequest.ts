import { VneCommandType } from "../enum/VneCommandType";
import { VneBaseRequest, VneBaseResponse } from "./VneBaseRequest";

export interface VnePaymentRequest extends VneBaseRequest {
  tipo: VneCommandType.PaymentRequest;
  importo: number; // cents
  refundable?: 0 | 1;
  credit_card?: 0 | 1;
  authKey?: string;
}

export interface VnePaymentResponse {
  id: string;
  importo: number;
  tipo: number;
  req_status: number;
}

export interface VnePaymentPendingResponse {
  id: string;
  tipo: number;
  req_status: number;
  payment_status: number;
  payment_details: {
    amount: number;
    inserted: number;
    rest: number;
    status: string;
    not_returned: number
  }
}