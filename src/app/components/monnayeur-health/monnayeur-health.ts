import { CommonModule } from "@angular/common";
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { Subscription, interval, switchMap, timeout, catchError, of, Subject, distinctUntilChanged, takeUntil } from "rxjs";
import { CashErrorService } from "../../services/error.service";
import { SettingsService } from "../../services/settings.service";
import { VneAutomaticCashService } from "../../services/VneProtocol.service";
import { DeviceConfigService } from "../../services/deviceConfig.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

type NetworkError = { networkError: true };

interface MachineStatus {
  recycler?: any;
  hopper?: any;
}

@Component({
  selector: 'monnayeur-health',
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './monnayeur-health.html',
  styleUrl: './monnayeur-health.scss',
})
export class MonnayeurHealth implements OnInit, OnDestroy {

  displayHooperDetails: boolean = false;
  displayRecycleurDetails: boolean = false;

  private subscription: Subscription = new Subscription();

  recyclerItems: CashItem[] = [];
  hopperItems: CashItem[] = [];

  recyclerError: boolean = false;
  hopperError: boolean = false;

  ipInput: string = '';

  private destroy$ = new Subject<void>();
  private ipPollingSub?: Subscription;

  private networkFailCount = 0;
  private readonly MAX_FAIL_BEFORE_ERROR = 15;

  constructor(
    private settingsService: SettingsService,
    private deviceConfigService: DeviceConfigService,
    private protocolService: VneAutomaticCashService,
    private errorService: CashErrorService,
    private cd: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {

    this.settingsService.features$
      .pipe(takeUntil(this.destroy$))
      .subscribe(features => {
        this.displayHooperDetails = features.find(f => f.id === 'hooper')?.enabled ?? false;
        this.displayRecycleurDetails = features.find(f => f.id === 'recycleur')?.enabled ?? false;
    });

    this.deviceConfigService.ip$
    .pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    )
    .subscribe(ip => {

      this.ipInput = ip || '';

      if (!ip) {
        this.stopPolling();
        return;
      }

      this.startPolling();
    });
  }

  statusTreatment(status: any) {

    const recycler: CashItem[] = [];
    const hopper: CashItem[] = [];

    this.recyclerError = false;
    this.hopperError = false;

    // ---------------- RECYCLER ----------------
    if (status.recycler) {
      Object.keys(status.recycler).forEach(key => {
        const note = status.recycler[key];
        if (note && typeof note === 'object' && 'valore' in note && 'quantita' in note) {
          const level: CashItem['level'] = note.alert === 2 ? 'empty' : note.alert === 1 ? 'low' : 'ok';
          if (level === 'empty') this.recyclerError = true;

          recycler.push({
            label: `${note.valore / 100} €`,
            quantity: parseInt(note.quantita, 10),
            level
          });
        }
      });
      recycler.sort((a, b) => parseFloat(a.label) - parseFloat(b.label));
    }

    // ---------------- HOPPER ----------------
    if (status.hopper) {
      Object.keys(status.hopper).forEach(key => {
        if (key.startsWith('moneta_') &&
            !['_alert','_max_level','_min_level','_recycle','_accept','_cashbox'].some(s => key.includes(s))) {

          const value = parseInt(key.split('_')[1], 10);
          const quantity = status.hopper[key] as number;
          const alert = status.hopper[key + '_alert'] as number || 0;

          if (alert === 3) return;

          const level: CashItem['level'] = alert === 2 ? 'empty' : alert === 1 ? 'low' : 'ok';
          if (level === 'empty') this.hopperError = true;

          hopper.push({
            label: `${value / 100} €`,
            quantity,
            level
          });
        }
      });
      hopper.sort((a, b) => parseFloat(a.label) - parseFloat(b.label));
    }

    this.recyclerItems = recycler;
    this.hopperItems = hopper;
    this.cd.markForCheck();
  }

startPolling() {

  if (this.ipPollingSub && !this.ipPollingSub.closed) return;

  this.ipPollingSub = interval(2000).pipe(
    switchMap(() =>
      this.protocolService.getMachineStatus().pipe(
        timeout(4000),
        catchError(() => of({ networkError: true } as NetworkError))
      )
    )
  ).subscribe(res => {

    // ---------------- NETWORK FAIL ----------------
    if ('networkError' in res) {

      this.networkFailCount++;

      if (this.networkFailCount === this.MAX_FAIL_BEFORE_ERROR) {
        this.errorService.push({
          type: 'NETWORK',
          message: this.translate.instant("ERROR.MONNAYEUR"),
          timestamp: Date.now()
        });
      }

      return;
    }

    // ---------------- NETWORK OK ----------------
    this.networkFailCount = 0;
    this.errorService.remove('NETWORK');

    const status = res as MachineStatus;

    // ---------------- RECYCLER ----------------
    if (status.recycler?.error === 1) {
      this.errorService.push({
        type: 'RECYCLER',
        message: this.errorService.mapRecycler(status.recycler.mess),
        code: status.recycler.mess,
        timestamp: Date.now()
      });
    } else {
      this.errorService.remove('RECYCLER');
    }

    // ---------------- HOPPER ----------------
    if (status.hopper?.error === 1) {
      this.errorService.push({
        type: 'HOPPER',
        message: this.errorService.mapHopper(status.hopper.mess),
        code: status.hopper.mess,
        timestamp: Date.now()
      });
    } else {
      this.errorService.remove('HOPPER');
    }

    this.statusTreatment(status);
  });
}


  stopPolling() {
    if (this.ipPollingSub) {
      this.ipPollingSub.unsubscribe();
      this.ipPollingSub = undefined;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }
}
