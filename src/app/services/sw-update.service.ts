import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { VersionService } from './version.service';

@Injectable({
  providedIn: 'root'
})
export class SwUpdateService {

  updateAvailable$ = new BehaviorSubject<boolean>(false);
  version$ = new BehaviorSubject<string>('');
  private isStandalone = false;

  constructor(
    private swUpdate: SwUpdate,
    private versionService: VersionService
  ) {
  
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    this.init();

    if (this.swUpdate.isEnabled && this.isStandalone) {
      this.swUpdate.checkForUpdate().then(hasUpdate => {
        if (hasUpdate) {
          this.updateAvailable$.next(true);
        }
      });
    }
  }

  async init() {
    const version = await this.versionService.getVersion();
    this.version$.next(version);

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY' && this.isStandalone) {
          this.updateAvailable$.next(true);
        }
      });
    }
  }

  doUpdate() {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
