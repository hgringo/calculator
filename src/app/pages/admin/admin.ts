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
import { interval, Subject, takeUntil, switchMap, finalize } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {DynamicDialogModule } from 'primeng/dynamicdialog'
import { ModalCashierBalancingClean } from '../../components/modal-cashier-balancing-clean/modal-cashier-balancing-clean';
import { TranslatePipe } from '@ngx-translate/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LongPressDirective } from '../../directives/longpress.directive';


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
    TranslatePipe,
    LongPressDirective
  ],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
  providers: [DialogService]
})
export class Admin implements OnInit, OnDestroy {

  isLoading: boolean = false;
  refillAmount: number = 0;

  private destroy$ = new Subject<void>();

  withdrawalCode?: AccessCode;
  openDoorCode?: AccessCode;
  limitWithDrawal?: string | undefined;

  dailyWithdrawn: number = 0;

  countdown: number | null = null;
  countdownTimer: any;
  private systemDestroy$ = new Subject<void>();

  isSystemAction = false;
  systemMessage = '';

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private vneProtocolService: VneAutomaticCashService,
    private dialogService: DialogService,
    public themeService: ThemeService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
   
    this.withdrawalCode = this.settingsService.getAccessCode('withdrawal_code');
    this.openDoorCode = this.settingsService.getAccessCode('open_code');
    this.limitWithDrawal = this.settingsService.getAccessCode('limit_withdrawal')?.value;

    this.loadDailyWithdrawn();
  }

  private loadDailyWithdrawn() {

    const key = 'dailyWithdrawn';
    const today = new Date().toISOString().slice(0,10);
    const stored = localStorage.getItem(key);

    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        this.dailyWithdrawn = data.amount;
      } 
      else {
        this.dailyWithdrawn = 0;
        localStorage.setItem(key, JSON.stringify({ date: today, amount: 0 }));
      }
    } 
    else {
      localStorage.setItem(key, JSON.stringify({ date: today, amount: 0 }));
    }
  }

  private saveDailyWithdrawn() {
    const today = new Date().toISOString().slice(0,10);
    localStorage.setItem('dailyWithdrawn', JSON.stringify({ date: today, amount: this.dailyWithdrawn }));
  }

  canWithdraw(amount: number): boolean {
    if (this.limitWithDrawal)
      return (this.dailyWithdrawn + amount) <= +this.limitWithDrawal;
  
    return true;
  }

  ngOnDestroy() {
    this.stopPolling();
    this.systemDestroy$.next();
    this.systemDestroy$.complete();
    this.destroy$.complete();
  }

  toggleLoading(start: boolean) {
    this.isLoading = start;

    if (start) {
      this.startRefill();
    } else {
      this.endRefill();
    }
  }

  // ================================
  // REFILL
  // ================================
  private startRefill() {
    this.vneProtocolService.startRefill('OP1', 0).subscribe({
      next: () => {
        this.refillAmount = 0;
        this.startPolling();
      },
      error: (err) => {
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  private endRefill() {
    this.vneProtocolService.endRefill('OP1').subscribe({
      next: () => {
        this.stopPolling();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cd.detectChanges();
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
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error("Polling refill error", err);
        }
      });
  }

  private stopPolling() {
    this.destroy$.next();
  }

  // ================================
  // OTHER ACTIONS
  // ================================
  goBack() {
    this.router.navigate(['/calculator']);
  }

  onOpenDoor() {
    this.dialogService.open(ModalOpenDoor, {
      modal: true,
      resizable: true,
      closable: true,
      styleClass: 'full no-border',
      inputValues: {}
    });
  }

  handleWithdrawal() {

    this.vneProtocolService.getMachineStatus().subscribe((status:any) => {

      let total = 0;

      // recycler
      if (status.recycler) {
        Object.values(status.recycler).forEach((n: any) => {
          if (n && n.valore && n.quantita) {
            total += n.valore * parseInt(n.quantita, 10);
          }
        });
      }

      // hopper
      if (status.hopper) {
        Object.keys(status.hopper).forEach(k => {
          if (k.startsWith('moneta_') && !k.includes('_')) {
            const value = parseInt(k.split('_')[1], 10);
            const qty = status.hopper[k];
            total += value * qty;
          }
        });
      }

      const dialogRef = this.dialogService.open(ModalWithdrawal, {
        modal: true,
        styleClass: 'full no-border',
        data: {
          dailyLimit: +this.limitWithDrawal!,
          dailyWithdrawn: this.dailyWithdrawn,
          machineAvailable: total / 100 // en €
        }
      });

      if (dialogRef)
        dialogRef.onClose.subscribe((withdrawnAmount: number) => {
          if (withdrawnAmount) {
            this.dailyWithdrawn += withdrawnAmount;
            this.saveDailyWithdrawn();
            this.cd.detectChanges();
          }
        });

    });
  }

  onReboot() {
    this.systemMessage = 'ADMIN.REBOOTING';

    this.vneProtocolService.rebootMonnayeur('OP1')
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.isSystemAction = false;
            this.cd.detectChanges();
          }, 1000);
        })
      )
      .subscribe();
  }

  onShutdown() {
    this.systemMessage = 'ADMIN.SHUTTING_DOWN';

    this.vneProtocolService.shutdownMonnayeur('OP1')
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.isSystemAction = false;
            this.cd.detectChanges();
          }, 1000);
        })
      )
      .subscribe();
  }

  startSystemAction(type: 'reboot' | 'shutdown') {

    if (this.isSystemAction) return;

    this.isSystemAction = true;
    this.countdown = 3;

    interval(1000)
      .pipe(takeUntil(this.systemDestroy$))
      .subscribe(() => {

        if (this.countdown === null) return;
        
        const next = this.countdown - 1;

        if (next === 0) {
          this.countdown = null;
          this.cd.detectChanges();
          this.launchSystemCall(type);
          return;
        }

        this.countdown = next;
        this.cd.detectChanges();
      });
  }

  private launchSystemCall(type: 'reboot' | 'shutdown') {

    this.systemMessage = type === 'reboot' ? 'ADMIN.REBOOTING' : 'ADMIN.SHUTTING_DOWN';
    this.cd.detectChanges();

    let call$;

    if (type === 'reboot') {
      call$ = this.vneProtocolService.rebootMonnayeur('OP1');
    } else {
      call$ = this.vneProtocolService.shutdownMonnayeur('OP1');
    }

    call$
      .pipe(
        finalize(() => {
          this.closeSystemOverlay();
        })
      )
      .subscribe();
  }

  private closeSystemOverlay() {
    setTimeout(() => {
      this.isSystemAction = false;
      this.countdown = null;
      this.systemDestroy$.next();
      this.cd.detectChanges();
    }, 800);
  }

  onCashierBalancing() {

    this.dialogService.open(ModalCashierBalancingClean, {
      header: '',
      width: '420px',
      closable: false,
      modal: true,
      dismissableMask: true
    })
  }
}