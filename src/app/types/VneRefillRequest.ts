import { VneBaseResponse } from "./VneBaseRequest";

export interface VneRefillResponse extends VneBaseResponse {
  tipo: number;
}

export interface VneRefillPollingResponse extends VneBaseResponse {
  tipo: number;
  inserted?: number;
}