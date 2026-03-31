import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { VneAutomaticCashService } from '../../services/VneProtocol.service';
import { DialogService } from 'primeng/dynamicdialog';
import { ModalOpenDoor } from '../../components/modal-open-door/modal-open-door';
import { ModalWithdrawal } from '../../components/modal-withdrawal/modal-withdrawal';
import { interval, Subject, takeUntil, switchMap, of } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ModalCashierBalancingClean } from '../../components/modal-cashier-balancing-clean/modal-cashier-balancing-clean';
import { TranslatePipe } from '@ngx-translate/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ModalConfirm } from '../../components/modal-confirm/modal-confirm';
import { CashErrorService } from '../../services/error.service';

interface AccessCode {
  id: string;
  value: string;
}

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    DialogModule,
    DynamicDialogModule,
    PasswordModule,
    TranslatePipe
  ],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
  providers: [DialogService]
})
export class Admin implements OnInit, OnDestroy {

  private USE_MOCK: boolean = false;

  // REFILL
  isLoading = false;
  refillAmount = 0;

  // WITHDRAWAL / OPEN DOOR
  withdrawalCode?: AccessCode;
  openDoorCode?: AccessCode;
  limitWithDrawal?: string;
  dailyWithdrawn = 0;

  // SYSTEM ACTION
  isSystemAction = false;
  systemMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private vneProtocolService: VneAutomaticCashService,
    private dialogService: DialogService,
    public themeService: ThemeService,
    private cd: ChangeDetectorRef,
    private cashErrorService: CashErrorService
  ) {}

  // ==============================
  // INIT / DESTROY
  // ==============================
  ngOnInit() {
    this.withdrawalCode = this.settingsService.getAccessCode('withdrawal_code');
    this.openDoorCode = this.settingsService.getAccessCode('open_code');
    this.limitWithDrawal = this.settingsService.getAccessCode('limit_withdrawal')?.value;
    this.loadDailyWithdrawn();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==============================
  // DAILY WITHDRAWN
  // ==============================
  private loadDailyWithdrawn() {
    const key = 'dailyWithdrawn';
    const today = new Date().toISOString().slice(0,10);
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.dailyWithdrawn =
          data?.date === today ? Number(data.amount) || 0 : 0;
      } catch {
        this.dailyWithdrawn = 0;
      }
    }

    localStorage.setItem(key, JSON.stringify({ date: today, amount: this.dailyWithdrawn }));
  }

  private saveDailyWithdrawn() {
    const today = new Date().toISOString().slice(0,10);
    localStorage.setItem('dailyWithdrawn', JSON.stringify({
      date: today,
      amount: this.dailyWithdrawn
    }));
  }

  canWithdraw(amount: number): boolean {
    return this.limitWithDrawal
      ? (this.dailyWithdrawn + amount) <= +this.limitWithDrawal
      : true;
  }

  // ==============================
  // REFILL
  // ==============================
  toggleLoading(start: boolean) {
    this.isLoading = start;
    start ? this.startRefill() : this.endRefill();
  }

  private startRefill() {
    this.vneProtocolService.startRefill('OP1', 0).subscribe({
      next: () => {
        this.refillAmount = 0;
        this.startPolling();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private endRefill() {
    this.vneProtocolService.endRefill('OP1').subscribe({
      next: () => {
        this.destroy$.next();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private startPolling() {
    interval(2000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.vneProtocolService.pollRefill())
      )
      .subscribe({
        next: (res: any) => {
          this.refillAmount = res.amountRefill || 0;
        },
        error: (err) => console.error("Polling refill error", err)
      });
  }

  // ==============================
  // ACTIONS
  // ==============================
  goBack() {
    this.router.navigate(['/calculator']);
  }

  onOpenDoor() {
    this.dialogService.open(ModalOpenDoor, {
      modal: true,
      styleClass: 'full no-border'
    });
  }

handleWithdrawal() {
  this.getMachineStatusWithMock().subscribe({
    next: (status: any) => {

      let total = 0;

      // =========================
      // 💵 RECYCLER (billets)
      // =========================
      if (status.recycler) {
        Object.values(status.recycler).forEach((n: any) => {
          if (n?.valore && n?.quantita) {
            total += n.valore * parseInt(n.quantita, 10);
          }
        });
      }

      // =========================
      // 🪙 HOPPER (pièces)
      // =========================
      if (status.hopper) {
        Object.keys(status.hopper).forEach(k => {

          // ✅ uniquement moneta_XX (exclut _cashbox, _recycle, etc.)
          const match = k.match(/^moneta_(\d+)$/);

          if (match) {
            const value = parseInt(match[1], 10);
            const quantity = status.hopper[k] ?? 0;

            total += value * quantity;
          }
        });
      }

      const ref = this.dialogService.open(ModalWithdrawal, {
        modal: true,
        styleClass: 'full no-border',
        data: {
          dailyLimit: +this.limitWithDrawal!,
          dailyWithdrawn: this.dailyWithdrawn,
          machineAvailable: total / 100
        }
      });

      if (ref) {
        ref.onClose.subscribe((res: any) => {
          if (res?.amount != null) {
            this.dailyWithdrawn += res.amount / 100;
            this.saveDailyWithdrawn();
          }
        });
      }

    },
    error: (err: any) => {
      this.cashErrorService.update([{
        type: 'NETWORK',
        message: 'Machine inaccessible ou hors réseau',
        code: 'NET_ERR',
        timestamp: Date.now()
      }]);

      this.cd.detectChanges();
    }
  });
}

  getMachineStatusWithMock(): any {
    if (this.USE_MOCK) {
      return of(this.getMockStatus()); // mock
    }

    return this.vneProtocolService.getMachineStatus(); // réel
  }

  getMockStatus() {
    return {
      recycler: {
        note_5: { valore: 500, quantita: "10" },   // 5€ x 10
        note_10: { valore: 1000, quantita: "5" }, // 10€ x 5
        note_20: { valore: 2000, quantita: "2" }  // 20€ x 2
      },
      hopper: {
        moneta_5: 0,   // 50cents x 100
        moneta_10: 0,   
        moneta_20: 0,  
        moneta_50: 0   
      }
    };
  }

  onCashierBalancing() {
    this.dialogService.open(ModalCashierBalancingClean, {
      modal: true,
      closable: false
    });
  }

  // ==============================
  // SYSTEM ACTION
  // ==============================

  confirmSystemAction(type: 'reboot' | 'shutdown') {
    const ref = this.dialogService.open(ModalConfirm, {
      modal: true,
      closable: false,
      styleClass: 'confirm-dialog',
      data: {
        title: type === 'reboot' ? 'REBOOT.TITLE' : 'SHUTDOWN.TITLE',
        message: type === 'reboot' ? 'REBOOT.QUESTION' : 'SHUTDOWN.QUESTION'
      }
    });

    if (ref)
    ref.onClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.executeSystemAction(type);
      }
    });
  }

  private executeSystemAction(type: 'reboot' | 'shutdown') {

    setTimeout(() => {
      this.isSystemAction = true;
      this.systemMessage = type === 'reboot' ? 'ADMIN.REBOOTING' : 'ADMIN.SHUTTING_DOWN';
      this.cd.detectChanges();
    }, 0);

    const call$ = type === 'reboot'
      ? this.vneProtocolService.rebootMonnayeur('OP1')
      : this.vneProtocolService.shutdownMonnayeur('OP1');

    call$.subscribe({
      error: () => console.error('Erreur action système')
    });

    const duration = type === 'reboot' ? 90_000 : 30_000; // ms

    setTimeout(() => {
      this.isSystemAction = false;
      this.cd.detectChanges();
    }, duration);
  }
}