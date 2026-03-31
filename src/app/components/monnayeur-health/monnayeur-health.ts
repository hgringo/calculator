import { CommonModule } from "@angular/common";
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { Subscription, interval, switchMap, timeout, catchError, of, Subject, distinctUntilChanged, takeUntil } from "rxjs";
import { CashErrorService } from "../../services/error.service";
import { SettingsService } from "../../services/settings.service";
import { VneAutomaticCashService } from "../../services/VneProtocol.service";
import { DeviceConfigService } from "../../services/deviceConfig.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { CashInventoryService } from "../../services/cash-inventory.service";
import { CashError } from "../../types/VneCashMachineError";

type NetworkError = { networkError: true };

interface MachineStatus {
  recycler?: any;
  hopper?: any;
}

interface CashItem {
  value: number; // valeur en euros
  quantity: number;
  level: 'ok' | 'low' | 'empty';
}

@Component({
  selector: 'monnayeur-health',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './monnayeur-health.html',
  styleUrl: './monnayeur-health.scss',
})
export class MonnayeurHealth implements OnInit, OnDestroy {

  private USE_MOCK: boolean = false;

  displayHooperDetails = false;
  displayRecycleurDetails = false;

  private subscription = new Subscription();

  recyclerItems: CashItem[] = [];
  hopperItems: CashItem[] = [];

  recyclerError = false;
  hopperError = false;

  ipInput = '';

  private destroy$ = new Subject<void>();
  private ipPollingSub?: Subscription;

  private networkFailCount = 0;

  constructor(
    private settingsService: SettingsService,
    private deviceConfigService: DeviceConfigService,
    private protocolService: VneAutomaticCashService,
    private errorService: CashErrorService,
    private cashInventoryService: CashInventoryService,
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

      if (this.USE_MOCK) {
        this.mockStatus();
      }
      else {
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
  }

  mockStatus() {

    const mock: MachineStatus = {
      recycler: {
        note_5: { valore: 500, quantita: "10", alert: 0 },
        note_10: { valore: 1000, quantita: "2", alert: 1 }, // low
        note_20: { valore: 2000, quantita: "0", alert: 2 }, // empty
        error: 0
      },
      hopper: {
        moneta_5: 50,
        moneta_5_alert: 0,

        moneta_10: 10,
        moneta_10_alert: 1, // low

        moneta_20: 0,
        moneta_20_alert: 2, // empty

        moneta_50: 100,
        moneta_50_alert: 0,

        error: 0
      }
    };

    this.statusTreatment(mock);
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

          const level: CashItem['level'] =
            note.alert === 2 ? 'empty' :
            note.alert === 1 ? 'low' : 'ok';

          if (level === 'empty') this.recyclerError = true;

          recycler.push({
            value: note.valore / 100,
            quantity: parseInt(note.quantita, 10),
            level
          });
        }
      });

      recycler.sort((a, b) => a.value - b.value);
    }

    // ---------------- HOPPER ----------------
    if (status.hopper) {
      Object.keys(status.hopper).forEach(key => {

        if (
          key.startsWith('moneta_') &&
          !['_alert','_max_level','_min_level','_recycle','_accept','_cashbox']
            .some(s => key.includes(s))
        ) {

          const value = parseInt(key.split('_')[1], 10);
          const quantity = status.hopper[key] as number;
          const alert = status.hopper[key + '_alert'] as number || 0;

          if (alert === 3) return;

          const level: CashItem['level'] =
            alert === 2 ? 'empty' :
            alert === 1 ? 'low' : 'ok';

          if (level === 'empty') this.hopperError = true;

          hopper.push({
            value: value / 100,
            quantity,
            level
          });
        }
      });

      hopper.sort((a, b) => a.value - b.value);
    }

    this.recyclerItems = recycler;
    this.hopperItems = hopper;

    this.cashInventoryService.updateInventory(
      this.recyclerItems,
      this.hopperItems
    );

    this.cd.markForCheck();
  }

  startPolling() {

  if (this.ipPollingSub && !this.ipPollingSub.closed) return;

  const NETWORK_THRESHOLD = 3; // 6 secondes

  this.ipPollingSub = interval(2000).pipe(
    switchMap(() =>
      this.protocolService.getMachineStatus().pipe(
        timeout(4000),
        catchError(() => of({ networkError: true } as NetworkError))
      )
    )
  ).subscribe(res => {

    // 🔹 récupère les erreurs actuelles
    const currentErrors = [...this.errorService.getCurrent()];

    // on filtre seulement les erreurs réseau / recycler / hopper pour les recalculer
    const errors: CashError[] = currentErrors.filter(e => !['NETWORK','RECYCLER','HOPPER'].includes(e.type));

    // ---------------- NETWORK ----------------
    if ('networkError' in res) {
      this.networkFailCount++;

      if (this.networkFailCount >= NETWORK_THRESHOLD) {
        errors.push({
          type: 'NETWORK',
          message: this.translate.instant("ERROR.MONNAYEUR"),
          timestamp: Date.now()
        });
      }

      this.errorService.update(errors);
      return;
    }

    // ---------------- SUCCESS ----------------
    this.networkFailCount = 0;

    const status = res as MachineStatus;

    // ---------------- RECYCLER ----------------
    if (status.recycler?.error === 1) {
      errors.push({
        type: 'RECYCLER',
        message: this.errorService.mapRecycler(status.recycler.mess),
        code: status.recycler.mess,
        timestamp: Date.now()
      });
    }

    // ---------------- HOPPER ----------------
    if (status.hopper?.error === 1) {
      errors.push({
        type: 'HOPPER',
        message: this.errorService.mapHopper(status.hopper.mess),
        code: status.hopper.mess,
        timestamp: Date.now()
      });
    }

    // 🔹 update la source unique de vérité
    this.errorService.update(errors);

    this.statusTreatment(status);
  });
}

  stopPolling() {
    if (this.ipPollingSub) {
      this.ipPollingSub.unsubscribe();
      this.ipPollingSub = undefined;
    }
  }

  formatValue(value: number): string {

    if (Number.isInteger(value)) {
      return value.toString();
    }

    return value.toFixed(2);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }
}