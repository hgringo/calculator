import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SystemOverlayService {

  private _loading$ = new BehaviorSubject<boolean>(false);
  private _message$ = new BehaviorSubject<string>('COMMON.LOADING');

  loading$ = this._loading$.asObservable();
  message$ = this._message$.asObservable();

  show(message: string = 'COMMON.LOADING') {
    this._message$.next(message);
    this._loading$.next(true);
  }

  hide() {
    this._loading$.next(false);
  }
}