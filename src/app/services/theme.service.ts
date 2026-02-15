import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private logoKey = 'selected_logo';
  private colorKey = 'selected_color';
  private PHONE_KEY = 'sav_phone';

  logos = [
    'assets/themes/logos/logo_cashconcept.svg',
    'assets/themes/logos/logo_cashprosud.svg',
    'assets/themes/logos/logo_cashbox.svg'
  ];

  colors = [
    '#007ad9',
    'rgb(72, 117, 59)',
    '#ff9800',
    '#e91e63',
    '#000000'
  ];

  // -------------------------------
  // LOGO
  // -------------------------------
  saveLogo(path: string) {
    localStorage.setItem(this.logoKey, path);
  }

  getLogo(): string {
    return localStorage.getItem(this.logoKey) ?? 'assets/themes/logos/logo_cashconcept.svg';
  }

  // -------------------------------
  // COLOR
  // -------------------------------
  saveColor(color: string) {
    localStorage.setItem(this.colorKey, color);
    document.documentElement.style.setProperty('--primary-color', color);
  }

  getColor(): string {
    return localStorage.getItem(this.colorKey) ?? 'rgb(72, 117, 59)';
  }

  // appliquer au démarrage
  applyTheme() {
    this.saveColor(this.getColor());
  }

  // ---------------- SAV PHONE ----------------
  savePhone(phone: string) {
    localStorage.setItem(this.PHONE_KEY, phone);
  }

  getPhone(): string {
    return localStorage.getItem(this.PHONE_KEY) || '';
  }
}