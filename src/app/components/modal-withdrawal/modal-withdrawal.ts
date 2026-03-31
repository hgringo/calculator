import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { SettingsService } from '../../services/settings.service';
import { VneAutomaticCashService } from '../../services/VneProtocol.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'modal-withdrawal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TranslatePipe
  ],
  templateUrl: './modal-withdrawal.html',
  styleUrl: './modal-withdrawal.scss',
})
export class ModalWithdrawal implements OnInit {

  amount!: number;
  maxAllowed: number = 0;
  enteredCode: string = '';
  justification: string = '';

  amountErrorMessage: string = '';
  codeErrorMessage: string = '';
  errorMessage: string = '';

  dailyLimit!: number;
  dailyWithdrawn!: number;
  machineAvailable: number = 0;

  canSubmit: boolean = true;

  isSubmitting: boolean = false;

  private destroy$ = new Subject<void>();
  isPolling: boolean = false;
  transactionId?: string;

  constructor(
    private settingsService: SettingsService,
    private protocolService: VneAutomaticCashService,
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.dailyLimit = this.config.data.dailyLimit;
    this.dailyWithdrawn = this.config.data.dailyWithdrawn || 0;
    this.machineAvailable = this.config.data.machineAvailable || 0;

   if (this.dailyLimit != null) {
      const remainingDaily = this.dailyLimit - this.dailyWithdrawn;
      this.maxAllowed = Math.max(
        0,
        Math.min(remainingDaily, this.machineAvailable)
      );
    }
  }

  onAmountChange(value: number) {

    this.amount = value;

    if (this.amount > this.machineAvailable) {
      this.canSubmit = false;
      this.errorMessage = this.translate.instant('WITHDRAWAL.NOTENOUGH') + ` (${this.machineAvailable} €)`;
      return;
    }

    if (this.dailyLimit && this.amount > this.maxAllowed) {
      this.canSubmit = false;
      this.errorMessage = this.translate.instant('WITHDRAWAL.LIMITREACH') + `: ${this.maxAllowed} €`;
      return;
    } 
    
    this.canSubmit = true;
    this.errorMessage = '';
  }

  confirm() {
    if (!this.canSubmit) return;
    this.ref.close(this.amount);
  }

  cancel() {
    this.ref.close(0);
  }

  // ----------------------------
  // Cancel
  // ----------------------------
  onCancel() {
    this.ref.close(false);
  }

  // ----------------------------
  // Confirm Withdrawal
  // ----------------------------
  onConfirm() {

    if (this.isSubmitting) return;

    this.amountErrorMessage = this.codeErrorMessage = '';

    const storedCode =
      this.settingsService.getAccessCode('withdrawal_code')?.value;

    if (!this.amount || this.amount <= 0) {
      this.amountErrorMessage = this.translate.instant("WITHDRAWAL.INCORRECTAMOUNT");
    }

    if (!storedCode || this.enteredCode !== storedCode) {
      this.codeErrorMessage = this.translate.instant("WITHDRAWAL.WRONGCODE");
    }

    if (!this.amount || this.amountErrorMessage || this.codeErrorMessage) return;

    this.isSubmitting = true;

    // ===================
    // Start withdrawal request
    // ===================
    this.protocolService.startWithdrawal(this.amount * 100, "all", this.justification)
      .subscribe({
        next: (res: any) => {
          // res doit contenir l’ID de la transaction
          this.transactionId = res?.id;
          if (this.transactionId) {
            this.startPollingWithdrawal(this.transactionId);
          } else {
            // fallback si pas d'ID
            this.ref.close(this.amount);
          }
        },
        error: () => {
          this.errorMessage = this.translate.instant("WITHDRAWAL.ERROR");
          this.isSubmitting = false;
        }
      });
  }

  private startPollingWithdrawal(transactionId: string) {

    if (!transactionId) return;

    this.isPolling = true;

    interval(1000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => 
          this.protocolService.pollingWithdrawal(transactionId, "USERNAME")
        )
      )
      .subscribe({
        next: (status: any) => {
          
          if (status.withdraw_status === 2) {
            return;
          }

          if (status.withdraw_status === 1) {
            this.isPolling = false;
            this.ref.close(status.payment_details);
          }

          if (status.withdraw_status !== 1 && status.withdraw_status !== 2) {
            this.isPolling = false;
            this.errorMessage = this.translate.instant("WITHDRAWAL.ERROR");
            this.isSubmitting = false;
          }
        },
        error: (err: any) => {
          this.isPolling = false;
          this.isSubmitting = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


}