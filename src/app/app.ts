import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLink } from '@angular/router';
import { DeviceConfigService } from './services/deviceConfig.service';
import { LanguageService } from './services/language.service';
import { LanguageSwitcher } from './components/language-switcher/language-switcher';
import { ThemeService } from './services/theme.service';
import { CommonModule } from '@angular/common';
import { ErrorBannerComponent } from './components/error-banner/error-banner';
import { MonnayeurHealth } from './components/monnayeur-health/monnayeur-health';
import { UpdateAppComponent } from './components/update-app/update-app.component';
import { ButtonModule } from 'primeng/button';
import { DeviceBlockerComponent } from './components/device-blocker/device-blocker';
import { Subject, takeUntil } from 'rxjs';
import { SplashScreen } from './components/splash-screen/splash-screen';
import { PwaInstall } from './components/pwa-install/pwa-install';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MonnayeurHealth,
    ErrorBannerComponent,
    DeviceBlockerComponent,
    UpdateAppComponent,
    LanguageSwitcher,
    PwaInstall,
    SplashScreen,
    ButtonModule,
    RouterLinkWithHref,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  
  deviceIP: string | null = '';
  logoPath!: string;
  sidebarOpen: boolean = false;

  showSplash: boolean = true;
  showInstall: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private deviceConfigService: DeviceConfigService,
    private langService: LanguageService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {

    this.deviceConfigService.ip$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ip => {
        this.deviceIP = ip;
        console.log('IP updated in AppComponent:', ip);
      });

    this.langService.initLanguage();

    this.logoPath = this.themeService.getLogo();
    this.themeService.applyTheme();

    this.handleOrientation();
    window.addEventListener('resize', this.handleOrientation.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleOrientation() {
    if (this.isPortrait) {
      this.sidebarOpen = false;
    } else {
      this.sidebarOpen = true;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  get isPortrait() {
    return window.matchMedia("(orientation: portrait)").matches;
  }

  onSplashFinished() {
    this.showSplash = false;

    if (!this.isInstalled()) {
      this.showInstall = true;
    }
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
  }
}
