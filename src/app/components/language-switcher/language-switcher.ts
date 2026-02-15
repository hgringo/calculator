import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'language-switcher',
  imports: [],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher implements OnInit {

  availableLangs!: string[];
  currentLang!: string;

  constructor(
    private langService: LanguageService
  ) {}

  ngOnInit() {
    this.availableLangs = this.langService.getAvailableLangs();
    this.currentLang = this.langService.getCurrentLang();
  }

  changeLang(lang: string) {
    this.langService.switchLanguage(lang);
    this.currentLang = lang;
  }

}
