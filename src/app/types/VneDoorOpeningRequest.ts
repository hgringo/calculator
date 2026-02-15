import { VneCommandType } from "../enum/VneCommandType";
import { VneBaseRequest, VneBaseResponse } from "./VneBaseRequest";

export interface VneDoorOpeningRequest extends VneBaseRequest {
  tipo: VneCommandType.DoorOpening;
  opName?: string;
}

export interface VneDoorOpeningResponse extends VneBaseResponse {}
