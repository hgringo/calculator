import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";
import { VneMessCode } from "../enum/VneMessCode";
import { VneRequestStatus } from "../enum/VneRequestStatus";
import { VneBaseRequest, VneBaseResponse } from "../types/VneBaseRequest";
import { VnePaymentPendingResponse } from "../types/VnePaymentRequest";

@Injectable({
  providedIn: "root"
})
export class VneAutomaticCashService {

  private http = inject(HttpClient);

  private getBaseUrl(): string {

    const ip = localStorage.getItem("device_ip");

    if (!ip) {
      console.warn("IP machine non définie dans localStorage");
      return "";
    }

    return `http://${ip}/selfcashapi/`;
  }

  // ================================
  // GENERIC COMMAND SENDER
  // ================================
  public sendCommand<TReq extends VneBaseRequest, TRes extends VneBaseResponse>(
    request: TReq
  ): Observable<TRes> {

    return this.http.post<TRes>(this.getBaseUrl(), request).pipe(
      timeout(5000),
      catchError(err => {
        console.error("Communication error", err);
        return throwError(() => err);
      })
    );
  }

  // ================================
  // PAYMENTS
  // ================================
  public startPayment(amountCents: number, opName?: string) {

    return this.sendCommand({
      tipo: 1,
      importo: amountCents,
      opName,
      refundable: 1
    });
  }

  public pollPayment(id: string): Observable<VnePaymentPendingResponse> {
    return this.sendCommand<
      { tipo: number; id: string },
      VnePaymentPendingResponse
    >({
      tipo: 2,
      id
    });
  }

  public cancelPayment(id: string) {
    return this.sendCommand(
      {
        tipo: 3,
        tipo_annullamento: 2,
        id
      }
    );
  }

  // ================================
  // WITHDRAWALS
  // ================================
  public startWithdrawal(amountCents: number, taglio?: string, commento?: string, opName?: string) {

    return this.sendCommand({
      tipo: 10,
      importo: amountCents,
      taglio,
      opName,
      operatore: "ID_OPERATORE",
      commento
    });
  }

  // ================================
// REFILL
// ================================

  /**
   * Start refill mode (tipo = 30)
   * The machine enters refill mode and accepts coins/banknotes.
   *
   * @param opName optional operator name
   * @param acceptAll optional: 0 = only recyclable banknotes, 1 = accept all
   */
  public startRefill(opName?: string, acceptAll: 0 | 1 = 0): Observable<VneBaseResponse> {

    return this.sendCommand({
      tipo: 30,
      opName,
      acceptAll
    });
  }


  /**
   * End refill mode (tipo = 31)
   * The machine exits refill mode and returns to payment mode.
   *
   * @param opName optional operator name
   */
  public endRefill(opName?: string): Observable<VneBaseResponse> {

    return this.sendCommand({
      tipo: 31,
      opName
    });
  }

  /**
   * Polling refill status (tipo = 33)
   * Allows to retrieve inserted value during refill.
   *
   * Useful for "change" procedure.
   */
  public pollRefill(): Observable<any> {

    return this.sendCommand({
      tipo: 33
    });
  }



  // ================================
  // MACHINE STATUS
  // ================================
  public getMachineStatus() {
    return this.sendCommand({
      tipo: 20
    });
  }

  // ================================
  // OPENING DOOR
  // ================================
  public openDoor(opName?: string) {

    return this.sendCommand({
      tipo: 55,
      wait_timeout: 0,
      opName
    });
  }

  // ================================
  // CONTROL MONNAYEUR
  // restart = 1 => reboot
  // restart = 0 => shutdown
  // ================================
  public controlMonnayeur(restart: 0 | 1, opName?: string) {

    return this.sendCommand({
      tipo: 81,
      restart,
      opName,
    });
  }

  public rebootMonnayeur(opName?: string) {
    return this.controlMonnayeur(1, opName);
  }

  public shutdownMonnayeur(opName?: string) {
    return this.controlMonnayeur(0, opName);
  }

  // ================================
  // CASH CLOSING
  // ================================
  public getCashierBalancing(opName?: string) {

    return this.sendCommand({
      tipo: 60,
      opName
    });
  }

  // ================================
  // ERROR INTERPRETATION
  // ================================
  public interpretMess(code?: number): string {

    if (!code) return "OK";

    switch (code) {

      case VneMessCode.UnknownTransactionId:
        return "Transaction inconnue";

      case VneMessCode.PaymentAlreadyInProgress:
        return "Paiement déjà en cours";

      case VneMessCode.DenominationNotAvailable:
        return "Dénomination non disponible";

      case VneMessCode.OperationAlreadyInProgress:
        return "Opération déjà en cours";

      default:
        return `Erreur inconnue (${code})`;
    }
  }

  public isNack(response: VneBaseResponse): boolean {
    return response.req_status === VneRequestStatus.NACK;
  }
}