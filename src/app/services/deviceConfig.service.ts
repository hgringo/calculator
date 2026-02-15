import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class DeviceConfigService {

  private readonly KEY = 'device_ip';

  private ipSubject = new BehaviorSubject<string | null>(this.loadIp());
  ip$ = this.ipSubject.asObservable();

  private loadIp(): string | null {
    return localStorage.getItem(this.KEY);
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