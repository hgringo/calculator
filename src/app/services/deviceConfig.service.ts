import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { NetworkMode } from "../types/config";

@Injectable({ providedIn: 'root' })
export class DeviceConfigService {

  private readonly KEY = 'device_ip';
  private readonly KEY_NETWORK_MODE = 'device_network_mode';

  private ipSubject = new BehaviorSubject<string | null>(this.loadIp());
  ip$ = this.ipSubject.asObservable();

  private networkModeSubject = new BehaviorSubject<NetworkMode>(this.loadNetworkMode());
  networkMode$ = this.networkModeSubject.asObservable();

  private loadIp(): string | null {
    return localStorage.getItem(this.KEY);
  }

  private loadNetworkMode(): NetworkMode {
    return (localStorage.getItem(this.KEY_NETWORK_MODE) as NetworkMode) ?? 'OPEN';
  }


  get ip(): string | null {
    return this.ipSubject.value;
  }

  set ip(value: string | null) {

    if (!value || value.trim() === '') {
      localStorage.removeItem(this.KEY);
      this.ipSubject.next(null);
      return;
    }

    const clean = value.trim();
    localStorage.setItem(this.KEY, clean);
    this.ipSubject.next(clean);
  }

  get networkMode(): NetworkMode {
    return this.networkModeSubject.value;
  }

  set networkMode(mode: NetworkMode) {
    localStorage.setItem(this.KEY_NETWORK_MODE, mode);
    this.networkModeSubject.next(mode);
  }

  clear() {
    localStorage.removeItem(this.KEY);
    this.ipSubject.next(null);
  }

  isValidIp(ip: string): boolean {
    const regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return regex.test(ip);
  }

  isConfigured(): boolean {
    return !!this.ipSubject.value;
  }
}