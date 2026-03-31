import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  standalone: true,
  selector: 'app-modal-payment-receipt',
  imports: [
    CommonModule,
    FormsModule, 
    ButtonModule, 
    InputTextModule,
    TranslatePipe
  ],
  templateUrl: './modal-payment-receipt.html',
  styleUrl: './modal-payment-receipt.scss',
})
export class ModalPaymentReceipt {

  content: string = "";

  constructor(public ref: DynamicDialogRef) {}

  confirm() {
    this.ref.close({
      justificatif: this.content
    });
  }
}
