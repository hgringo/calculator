import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {

  availableLangs = ['fr', 'en', 'nl'];
  currentLang!: string;

  constructor(
    private translate: TranslateService
  ) {}

  initLanguage() {

    const savedLang = localStorage.getItem('lang');

    this.currentLang = savedLang || this.translate.getBrowserLang() || 'fr';

    this.translate.addLangs(this.availableLangs);
    this.translate.setFallbackLang(this.currentLang);
    this.translate.use(this.currentLang);
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  getCurrentLang(): string {
    return this.currentLang;
  }

  getAvailableLangs(): string[] {
    return this.availableLangs;
  }
}
