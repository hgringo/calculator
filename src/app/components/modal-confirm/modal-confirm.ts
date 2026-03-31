import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  standalone: true,
  selector: 'app-modal-confirm',
  imports: [
    CommonModule,
    ButtonModule,
    TranslatePipe
  ],
  templateUrl: './modal-confirm.html',
  styleUrl: './modal-confirm.scss',
})
export class ModalConfirm {

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  close(result: boolean) {
    this.ref.close(result);
  }

}
