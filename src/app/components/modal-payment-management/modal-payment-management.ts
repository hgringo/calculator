import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ChangeDetectorRef, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { VneAutomaticCashService } from '../../services/VneProtocol.service';
import { VnePaymentPendingResponse, VnePaymentResponse } from '../../types/VnePaymentRequest';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { CashInventoryService } from '../../services/cash-inventory.service';

@Component({
  standalone: true,
  selector: 'modal-payment-management',
  imports: [
    CommonModule, 
    ButtonModule, 
    DialogModule,
    TranslatePipe
  ],
  templateUrl: './modal-payment-management.html',
  styleUrl: './modal-payment-management.scss',
})
export class ModalPaymentManagement implements OnInit, OnDestroy {

  paymentData!: VnePaymentResponse;
  paymentState?: VnePaymentPendingResponse;

  private destroy$ = new Subject<void>();

  insufficientBalance: boolean = false;

  toReturn!: number;

  constructor(
    private protocolService: VneAutomaticCashService,
    private ref: DynamicDialogRef,
    private cd: ChangeDetectorRef,
    private cashInventoryService: CashInventoryService,
    private config: DynamicDialogConfig
  ) {}

  ngOnInit() {
    
    this.paymentData = this.config.data?.paymentData;

    if (this.paymentData) {

      this.paymentState = {
        id: "",
        payment_status: 0,
        payment_details: {
          amount: 0,
          inserted: 0,
          rest: 0
        }
      } as VnePaymentPendingResponse;
    }

    if (this.paymentData?.id) {
      this.startPolling();
    }
  }

  // ==============================
  // POLLING PAYMENT
  // ==============================
  private startPolling() {
    interval(500)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.protocolService.pollPayment(this.paymentData.id))
      )
      .subscribe({
        next: (response: VnePaymentPendingResponse) => {

          this.paymentState = response;

          const amount = response.payment_details.amount / 100;
          const inserted = response.payment_details.inserted / 100;

          if (inserted > 0)
            this.toReturn = (response.payment_details.inserted - response.payment_details.amount);

          if (inserted > amount) {

            const change = inserted - amount;

            if (this.paymentState.payment_details.status != "completed" && !this.cashInventoryService.canReturnChange(change)) {
              this.handleInsufficientChange();
              return;
            }
          }

          if (this.isPaymentFinished(response)) {
            this.closeModal(response);
            return;
          }

          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Polling error', err);
        }
      });
  }

  private handleInsufficientChange() {

    if (this.insufficientBalance) return;

    this.insufficientBalance = true;
    this.stopPolling();

    this.cd.detectChanges();
  }

  private isPaymentFinished(response: VnePaymentPendingResponse): boolean {
    return response.payment_status === 1;
  }

  // ==============================
  // CANCEL PAYMENT
  // ==============================
  onCancelPayment() {
    if (!this.paymentData?.id) return;

    this.protocolService.cancelPayment(this.paymentData.id)
      .subscribe({
        next: (response: VnePaymentPendingResponse) => {
          this.closeModal(response)
        },
        error: (err) => console.error('Cancel payment failed', err)
      });
  }

  // ==============================
  // CLOSE MODAL CLEANLY
  // ==============================
  private closeModal(result: any) {
    this.stopPolling();
    this.ref.close(result);
  }

  private stopPolling() {
    this.destroy$.next();
  }

  get remainingAmount(): number {
    if (!this.paymentState?.payment_details) return 0;

    const { amount, inserted } = this.paymentState.payment_details;

    return Math.max(amount - inserted, 0);
  }

  ngOnDestroy() {
    this.stopPolling();
    this.destroy$.complete();
  }
}