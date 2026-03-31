import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { CashError } from "../types/VneCashMachineError";

@Injectable({ providedIn: 'root' })
export class CashErrorService {

  private _errors$ = new BehaviorSubject<CashError[]>([]);
  errors$ = this._errors$.asObservable();

  getCurrent(): CashError[] {
    return this._errors$.value;
  }

  clear() {
    this._errors$.next([]);
  }

  update(errors: CashError[]) {
    const current = this._errors$.value;

    const updated: CashError[] = [];

    for (const err of errors) {
      const existing = current.find(e => 
        e.type === err.type && e.code === err.code
      );

      if (existing) {
        // ✅ garde la même ref → évite re-render inutile
        updated.push({
          ...existing,
          timestamp: err.timestamp // ou garder ancien si tu veux
        });
      } else {
        // ✅ nouvelle erreur
        updated.push(err);
      }
    }

    this._errors$.next(updated);
  }

  remove(type: CashError['type'], code?: string) {
    const list = this._errors$.value;
    this._errors$.next(list.filter(e => !(e.type === type && (!code || e.code === code))));
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