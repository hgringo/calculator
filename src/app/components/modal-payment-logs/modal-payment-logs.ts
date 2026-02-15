import { Component, OnInit } from '@angular/core';
import { PaymentLogService } from '../../services/payment.log.service';
import { PaymentLog } from '../../types/paymentLog';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-modal-payment-logs',
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './modal-payment-logs.html',
  styleUrl: './modal-payment-logs.scss',
})
export class ModalPaymentLogs implements OnInit {

  logs: PaymentLog[] = [];

  constructor(
    private paymentLogService: PaymentLogService
  ) {}

  ngOnInit() {
    this.logs = this.paymentLogService
    .getLogs()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  get total() {
    return this.logs.reduce((sum, log) => sum + log.amount, 0);
  }

}
