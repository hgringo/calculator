import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

import { ModalIp } from '../../components/modal-ip/modal-ip';
import { ModalPaymentManagement } from '../../components/modal-payment-management/modal-payment-management';
import { ModalPaymentLogs } from '../../components/modal-payment-logs/modal-payment-logs';
import { ModalPaymentLogsClean } from '../../components/modal-payment-logs-clean/modal-payment-logs-clean';

import { environment } from '../../../environments/environment';
import { SettingsService } from '../../services/settings.service';
import { VneAutomaticCashService } from '../../services/VneProtocol.service';
import { PaymentLogService } from '../../services/payment.log.service';
import { VnePaymentResponse } from '../../types/VnePaymentRequest';
import { DialogService } from 'primeng/dynamicdialog';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CashErrorService } from '../../services/error.service';
import { CashError } from '../../types/VneCashMachineError';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-calculator',
  templateUrl: './calculator.html',
  styleUrl: './calculator.scss',
  imports: [
    CommonModule, 
    ModalIp, 
    DialogModule, 
    TranslatePipe,
    ButtonModule
  ],
  providers: [DialogService]
})
export class Calculator implements OnInit, OnDestroy {

  display: string = '';
  isSending: boolean = false;

  private adminCodeValue: string = '';
  private accessLogCodeValue: string = '';
  private cleanLogCodeValue: string = '';
  private subscription: Subscription = new Subscription();

  paymentData!: VnePaymentResponse;

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private protocolService: VneAutomaticCashService,
    private dialogService: DialogService,
    private paymentLogService: PaymentLogService,
    private cd: ChangeDetectorRef,
    private errorService: CashErrorService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.settingsService.accessCodes$.subscribe(() => {
        const admin = this.settingsService.getAccessCode('admin_code');
        const log = this.settingsService.getAccessCode('access_log_code');
        const clean = this.settingsService.getAccessCode('access_clean_code');

        this.adminCodeValue = admin?.value || '';
        this.accessLogCodeValue = log?.value || '';
        this.cleanLogCodeValue = clean?.value || '';
      })
    );
  }

  append(value: string) {
    // Autorise chiffres, opérateurs, parenthèses et séparateurs décimaux
    if (!/^[0-9+\-*/().,]$/.test(value)) return;

    // Empêche deux opérateurs consécutifs (y compris point ou virgule)
    if (
      /[+\-*/().,]$/.test(this.display) &&
      /[+\-*/().,]/.test(value)
    ) {
      return;
    }

    this.display += value;
  }

  private isValidAmount(): boolean {
    if (!this.display) return false;

    // accepte 123 ou 123,45 ou 123.45
    if (!/^[0-9]+([.,][0-9]{1,2})?$/.test(this.display)) return false;

    // transforme la virgule en point pour parseFloat
    const amount = Number(this.display.replace(',', '.'));

    return amount > 0;
  }

  clear() { this.display = ''; }

  backspace() { this.display = this.display.slice(0, -1); }

  calculate() {
    try {
      if (!/^[0-9+\-*/.() ]+$/.test(this.display)) {
        this.display = 'Erreur';
        return;
      }
      const result = Function('"use strict"; return (' + this.display + ')')();
      this.display = result.toString();
    } catch {
      this.display = 'Erreur';
    }
  }

  send() {
    if (this.isSending) return;

    this.isSending = true;

    // 🔐 SUPERADMIN
    if (this.display === environment.SUPERADMIN_KEY) {
      this.resetSending();
      this.resetDisplay();
      this.router.navigate(['/superadmin']);
      return;
    }

    // 🔐 ADMIN
    if (this.display === this.adminCodeValue && this.adminCodeValue) {
      this.resetSending();
      this.resetDisplay();
      this.router.navigate(['/admin']);
      return;
    }

    // 🔐 LOGS
    if (this.accessLogCodeValue && this.display === this.accessLogCodeValue) {
      this.resetSending();
      this.resetDisplay();
      this.dialogService.open(ModalPaymentLogs, {
        modal: true,
        resizable: true,
        closable: true,
        styleClass: 'full no-border'
      });
      return;
    }

    // 🔐 CLEAN LOGS
    if (this.cleanLogCodeValue && this.display === this.cleanLogCodeValue) {
      this.resetSending();
      this.resetDisplay();
      this.dialogService.open(ModalPaymentLogsClean, {
        modal: true,
        resizable: true,
        closable: true,
        styleClass: 'full no-border'
      });
      return;
    }

    if (!this.isValidAmount()) {
      this.failPayment(
        'PAYMENT',
        this.translate.instant("ERROR.AMOUNT")
      );
      this.clear();
      return;
    }

    this.startPayment();
  }

  private resetSending() {
    this.isSending = false;
  }

private failPayment(type: CashError['type'], error: any, code?: string) {
  this.errorService.push({
    type,
    message: typeof error === 'string' ? error : JSON.stringify(error),
    code,
    timestamp: Date.now()
  });
  this.isSending = false;
  this.cd.markForCheck();
}

private resetDisplay() {
  this.display = '';
}

private startPayment() {

  if (!this.isValidAmount()) {
    this.failPayment('PAYMENT', this.translate.instant('ERROR.AMOUNT'));
    this.clear();
    return;
  }

  const amount = parseFloat(this.display);
  const amountCents = amount * 100;

  this.protocolService.startPayment(amountCents, 'OP1')
    .pipe(
      timeout(5000),
      catchError(err => {
        this.failPayment('NETWORK', err.message);
        return throwError(() => err);
      })
    )
    .subscribe({
      next: (data: any) => {
       
        if (!data || data.success === false || data.status === 'ERROR') {
          this.failPayment('PAYMENT', data, data?.errorCode);
          return;
        }

        this.paymentData = data;

        const ref = this.dialogService.open(ModalPaymentManagement, {
          modal: true,
          resizable: true,
          closable: false,
          styleClass: 'full no-border',
          data: { paymentData: this.paymentData }
        });

        if (ref)
          ref.onClose.subscribe((result: "success" | "cancelled") => {

            if (result === "success") {
              this.paymentLogService.addLog(amount);
            }

          });

        this.resetSending();
        this.resetDisplay();
        this.cd.markForCheck();
      },
      error: (err) => {
        if (!this.isSending) return; 
        this.failPayment('NETWORK', err.message);
      }
    });
}



  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}