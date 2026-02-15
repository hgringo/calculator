import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ChangeDetectorRef, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { VneAutomaticCashService } from '../../services/VneProtocol.service';
import { VnePaymentPendingResponse, VnePaymentResponse } from '../../types/VnePaymentRequest';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

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

  constructor(
    private protocolService: VneAutomaticCashService,
    private ref: DynamicDialogRef,
    private cd: ChangeDetectorRef,
    private config: DynamicDialogConfig
  ) {}

  ngOnInit() {
    
    this.paymentData = this.config.data?.paymentData;

    if (this.paymentData) {

      this.paymentState = {
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
    interval(100)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.protocolService.pollPayment(this.paymentData.id))
      )
      .subscribe({
        next: (response) => {

          this.paymentState = response;

          if (this.isPaymentFinished(response)) {
            this.closeModal("success");
            return;
          }

          // refresh UI
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Polling error', err);
        }
      });
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
        next: () => this.closeModal("cancelled"),
        error: (err) => console.error('Cancel payment failed', err)
      });
  }

  // ==============================
  // CLOSE MODAL CLEANLY
  // ==============================
  private closeModal(result: "success" | "cancelled") {
    this.stopPolling();
    this.ref.close(result);
  }

  private stopPolling() {
    this.destroy$.next();
  }

  ngOnDestroy() {
    this.stopPolling();
    this.destroy$.complete();
  }
}