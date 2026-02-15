import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { VneAutomaticCashService } from '../../services/VneProtocol.service';
import { finalize } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'modal-cashier-balancing-clean',
  standalone: true,
  imports: [
    ButtonModule,
    TranslatePipe
  ],
  templateUrl: './modal-cashier-balancing-clean.html',
  styleUrl: './modal-cashier-balancing-clean.scss',
})
export class ModalCashierBalancingClean {

  loading = false;

  constructor(
    public ref: DynamicDialogRef,
    private vneProtocolService: VneAutomaticCashService
  ) {}

  onConfirm() {
    this.loading = true;

    this.vneProtocolService.getCashierBalancing('OP1')
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (res) => {
          this.ref.close(true);
        },
        error: (err) => {
          console.error(err);
          this.ref.close(false);
        }
      });
  }

  onCancel() {
    this.ref.close(false);
  }
}