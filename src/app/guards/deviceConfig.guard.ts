import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { DeviceConfigService } from "../services/deviceConfig.service";

@Injectable({ providedIn: 'root' })
export class DeviceConfigGuard {
  constructor(
    private config: DeviceConfigService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.config.isConfigured()) {
      this.router.navigate(['/calculator']);
      return false;
    }
    return true;
  }
}