import { VneCommandType } from "../enum/VneCommandType";
import { VneBaseRequest, VneBaseResponse } from "./VneBaseRequest";

export interface VneWithdrawalRequest extends VneBaseRequest {
  tipo: VneCommandType.OperatorWithdrawalRequest;
  importo: number;
  taglio?: string;
}

export interface VneWithdrawalResponse extends VneBaseResponse {
  id: string;
}