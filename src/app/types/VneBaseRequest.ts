import { VneCommandType } from "../enum/VneCommandType";
import { VneRequestStatus } from "../enum/VneRequestStatus";

export interface VneBaseRequest {
  tipo: VneCommandType;
  opName?: string;
}

export interface VneBaseResponse {
  tipo: VneCommandType;
  req_status: VneRequestStatus;
  mess?: number;
}