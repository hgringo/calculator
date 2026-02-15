import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { CashError } from "../types/VneCashMachineError";

@Injectable({ providedIn: 'root' })
export class CashErrorService {

  private _errors$ = new BehaviorSubject<CashError[]>([]);
  errors$ = this._errors$.asObservable();

  clear() {
    this._errors$.next([]);
  }

  push(error: CashError) {
    const list = this._errors$.value;

    // Évite les doublons pour le même type + code
    if (!list.some(e => e.type === error.type && e.code === error.code)) {
      this._errors$.next([...list, error]);
    }
  }

  remove(type: CashError['type'], code?: string) {
    const list = this._errors$.value;
    this._errors$.next(list.filter(e => !(e.type === type && (!code || e.code === code))));
  }

  set(errors: CashError[]) {
    this._errors$.next(errors);
  }

  parseMachineStatus(machine: any, reqStatus: number): CashError[] {
    const errors: CashError[] = [];

    if (machine.recycler?.error === 1) {
      errors.push({
        type: 'RECYCLER',
        message: this.mapRecycler(machine.recycler.mess),
        code: machine.recycler.mess,
        timestamp: Date.now()
      });
    }

    if (machine.hopper?.error === 1) {
      errors.push({
        type: 'HOPPER',
        message: this.mapHopper(machine.hopper.mess),
        code: machine.hopper.mess,
        timestamp: Date.now()
      });
    }

    return errors;
  }

  mapRecycler(code: any): string {
    switch (code) {
      case 'E01': return 'Billet bloqué';
      case 'E02': return 'Empileur ouvert';
      default: return 'Erreur billets';
    }
  }

  mapHopper(code: any): string {
    switch (code) {
      case 'H01': return 'Hopper bloqué';
      default: return 'Erreur pièces';
    }
  }
}