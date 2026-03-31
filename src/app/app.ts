import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLink, NavigationEnd, Router } from '@angular/router';
import { LanguageSwitcher } from './components/language-switcher/language-switcher';
import { CommonModule } from '@angular/common';
import { ErrorBannerComponent } from './components/error-banner/error-banner';
import { MonnayeurHealth } from './components/monnayeur-health/monnayeur-health';
import { UpdateAppComponent } from './components/update-app/update-app.component';
import { ButtonModule } from 'primeng/button';
import { DeviceBlockerComponent } from './components/device-blocker/device-blocker';
import { SplashScreen } from './components/splash-screen/splash-screen';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslatePipe } from '@ngx-translate/core';
import { version } from '../../package.json';
import { Subject, Observable, filter, takeUntil } from 'rxjs';
import { DeviceConfigService } from './services/deviceConfig.service';
import { LanguageService } from './services/language.service';
import { SystemOverlayService } from './services/system-overlay.service';
import { ThemeService } from './services/theme.service';

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
    ButtonModule,
    RouterLinkWithHref,
    ProgressSpinnerModule,
    TranslatePipe,
    SplashScreen
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  
  deviceIP: string | null = '';
  logoPath!: string;
  sidebarOpen: boolean = false;
  showSplash: boolean = true;

  isDownloadRoute : boolean = false;

  isContentScrollable: boolean = false;

  private destroy$ = new Subject<void>();

  loading$!: Observable<boolean>;
  message$!: Observable<string>;

  version : string = version;

  constructor(
    private deviceConfigService: DeviceConfigService,
    private langService: LanguageService,
    public themeService: ThemeService,
    private router: Router,
    private overlayService: SystemOverlayService
  ) {}

  ngOnInit() {

    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      this.isDownloadRoute = event.urlAfterRedirects.includes('/download');
    });

    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => splash.style.display = 'none', 500);
    }

    this.deviceConfigService.ip$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ip => {
        this.deviceIP = ip;
      });

    this.langService.initLanguage();

    this.logoPath = this.themeService.getLogo();
    this.themeService.applyTheme();

    this.handleOrientation();
    window.addEventListener('resize', this.handleOrientation.bind(this));

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const scrollableRoutes = ['/employee', '/superadmin', '/admin'];

        this.isContentScrollable = scrollableRoutes.some(r => event.urlAfterRedirects.startsWith(r));
      });

    this.loading$ = this.overlayService.loading$;
    this.message$ = this.overlayService.message$;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
      event.preventDefault();
    }
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
  }
}
