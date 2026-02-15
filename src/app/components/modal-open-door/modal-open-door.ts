import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { SettingsService } from '../../services/settings.service';
import { VneAutomaticCashService } from '../../services/VneProtocol.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'modal-open-door',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TranslatePipe
  ],
  templateUrl: './modal-open-door.html',
  styleUrl: './modal-open-door.scss',
})
export class ModalOpenDoor {

  enteredCode: string = '';
  errorMessage: string = '';

  constructor(
    private settingsService: SettingsService,
    private protocolService: VneAutomaticCashService,
    private ref: DynamicDialogRef,
    private translate: TranslateService
  ) {}

  onCancel() {
    this.ref.close(false);
  }

  onConfirm() {

    const storedCode = this.settingsService.getAccessCode('open_code')?.value;

    if (!storedCode || this.enteredCode !== storedCode) {
      this.errorMessage = this.translate.instant('DOOR.INCORRECTCODE');
      return;
    }

    this.errorMessage = '';

    this.protocolService.openDoor("OP1")
      .subscribe({
        next: () => {
          this.ref.close(true);
        },
        error: () => {
          this.errorMessage = this.translate.instant('DOOR.ERROR');
        }
      });
  }
}