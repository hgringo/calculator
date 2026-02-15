import { VneCommandType } from "../enum/VneCommandType";
import { VneBaseRequest, VneBaseResponse } from "./VneBaseRequest";

export interface VnePaymentPollingRequest extends VneBaseRequest {
  tipo: VneCommandType.PaymentPolling;
  id: string;
}

export interface VnePaymentPollingResponse extends VneBaseResponse {
  payment_status: 1 | 2;

  payment_details?: {
    amount: number;
    inserted: number;
    rest: number;
    status: string;
    not_returned?: 0 | 1;
  };
}