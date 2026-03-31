import { Component, OnInit, OnDestroy, ChangeDetectorRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

import { ModalIp } from '../../components/modal-ip/modal-ip';
import { ModalPaymentManagement } from '../../components/modal-payment-management/modal-payment-management';
import { ModalPaymentLogs } from '../../components/modal-payment-logs/modal-payment-logs';

import { environment } from '../../../environments/environment';
import { SettingsService } from '../../services/settings.service';
import { VneAutomaticCashService } from '../../services/VneProtocol.service';
import { PaymentLogService } from '../../services/payment.log.service';
import { VnePaymentPendingResponse, VnePaymentResponse } from '../../types/VnePaymentRequest';
import { DialogService } from 'primeng/dynamicdialog';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CashErrorService } from '../../services/error.service';
import { CashError } from '../../types/VneCashMachineError';
import { ButtonModule } from 'primeng/button';
import { ModalPaymentReceipt } from '../../components/modal-payment-receipt/modal-payment-receipt';

interface ReceiptSettings {
  enabled: boolean;
  email: string;
}

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
  private subscription: Subscription = new Subscription();

  accessUnlocked = false;
  inputCode = '';
  expectedCode = '';
  matchedCode: boolean = false;

  receiptSettings!: ReceiptSettings;


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

    const unlocked = localStorage.getItem('calculatorUnlocked');
    if (unlocked === 'true') {
      this.accessUnlocked = true;
    } else {
      this.generateCode();
    }

    this.subscription.add(
      this.settingsService.accessCodes$.subscribe(() => {
        const admin = this.settingsService.getAccessCode('admin_code');
        const log = this.settingsService.getAccessCode('access_log_code');

        this.receiptSettings = this.settingsService.loadReceiptSettings();

        this.adminCodeValue = admin?.value || '';
        this.accessLogCodeValue = log?.value || '';
      })
    );
  }

  generateCode() {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear().toString().slice(-2);
    const hour = pad(now.getHours());
    const minute = pad(now.getMinutes());

    this.expectedCode = `${day}${month}${year}${hour}${minute}`;
  }

  validateCode() {
    if (this.matchedCode) {
      this.accessUnlocked = true;
      localStorage.setItem('calculatorUnlocked', 'true');
    } else {
      alert('Code incorrect');
    }
  }

  onCodeChange(v: string) {
    this.generateCode();
    this.inputCode = v;
    this.matchedCode = this.inputCode === this.expectedCode;
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

    // Si display contient une expression, calcule-la avant envoi
    if (!/^[0-9]+([.,][0-9]{1,2})?$/.test(this.display)) {
      // On essaye de calculer
      this.calculate();
      // Après calculate, display contient le résultat ou 'Erreur'
      if (this.display === 'Erreur') {
        this.failPayment('PAYMENT', this.translate.instant("ERROR.AMOUNT"));
        this.clear();
        return;
      }
    }

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

    const current = this.errorService.getCurrent();

    const newError: CashError = {
      type,
      message: typeof error === 'string' ? error : JSON.stringify(error),
      code,
      timestamp: Date.now()
    };

    // 🔥 merge intelligent (évite doublon)
    const exists = current.some(e => e.type === type && e.code === code);

    const updated = exists
      ? current
      : [...current, newError];

    this.errorService.update(updated);

    // 🔥 auto-remove (important pour erreur ponctuelle)
    setTimeout(() => {
      const afterRemove = this.errorService['_errors$'].value
        .filter(e => !(e.type === type && e.code === code));

      this.errorService.update(afterRemove);
    }, 5000);

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

          this.openPaymentModal(data, amount);
        },
        error: (err) => {
          if (!this.isSending) return; 
          this.failPayment('NETWORK', err.message);
        }
      });
  }

  private openPaymentModal(data: VnePaymentResponse, amount: number) {

    this.paymentData = data;

    const ref = this.dialogService.open(ModalPaymentManagement, {
      modal: true,
      resizable: true,
      closable: false,
      styleClass: 'full no-border',
      data: { paymentData: this.paymentData }
    });

    if (ref) {
      ref.onClose.subscribe((response: VnePaymentPendingResponse) => {

        // Complete state
        if (response.tipo === 2 && response.payment_status === 1) {

          if (this.receiptSettings.enabled) {
            this.openReceiptModal(response);
          }
          else 
          {
            this.paymentLogService.addLog(response);
          }
        }
        // Cancel state
        else if (response.tipo === 3) {
          
            const enrichedResponse: VnePaymentPendingResponse & {
              payment_details: {
                status: string;
                amount: number;
                inserted: number;
                rest: number;
              }
            } = {
              ...response,
              payment_details: {
                status: 'CANCELED',
                amount: this.paymentData.importo,
                inserted: 0,
                rest: 0,
                not_returned: 0
              }
            };

            this.paymentLogService.addLog(enrichedResponse);
        }
        else {
          this.paymentLogService.addLog(response);
        }
      });
    }

    this.resetSending();
    this.resetDisplay();
    this.cd.markForCheck();
  }

  private openReceiptModal(response: VnePaymentPendingResponse) {

    const ref = this.dialogService.open(ModalPaymentReceipt, {
      modal: true,
      resizable: true,
      closable: false,
      styleClass: 'full no-border'
    });

    if (ref) {
      ref.onClose.subscribe((modalreturn: any) => {
        this.paymentLogService.addLog(response, modalreturn.justificatif);
      });
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}