import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PaymentLogService } from '../../services/payment.log.service';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-modal-payment-logs-clean',
  imports: [
    CommonModule,
    ButtonModule,
    TranslatePipe
  ],
  templateUrl: './modal-payment-logs-clean.html',
  styleUrl: './modal-payment-logs-clean.scss',
})
export class ModalPaymentLogsClean {

  constructor(
    private paymentLogService: PaymentLogService,
    private ref: DynamicDialogRef
  ) {}

  onCancel() {
    this.ref.close();
  }

  onCleanLogs() {
    this.paymentLogService.clearLogs();
    this.ref.close(true);
  }
}
