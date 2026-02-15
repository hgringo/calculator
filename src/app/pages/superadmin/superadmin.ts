import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SettingsService } from '../../services/settings.service';
import { CommonModule } from '@angular/common';
import { DeviceConfigService } from '../../services/deviceConfig.service';
import { ThemeService } from '../../services/theme.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'superadmin',
  imports: [
    CommonModule,
    FormsModule, 
    ButtonModule, 
    ToggleSwitchModule, 
    InputTextModule,
    TranslatePipe
  ],
  templateUrl: './superadmin.html',
  styleUrls: ['./superadmin.scss'],
})
export class Superadmin implements OnInit {

  originalFeatures: Feature[] = [
    { id: 'hooper', title: "FEATURES.HOOPER.TITLE", description: "FEATURES.HOOPER.DESC", enabled: false },
    { id: 'recycleur', title: 'FEATURES.RECYCLER.TITLE', description: "FEATURES.RECYCLER.DESC", enabled: false },
  ];

  originalAccessCodes: AccessCode[] = [
    { id: 'admin_code', title: 'ACCESS.ADMIN.TITLE', value: '', description: "ACCESS.ADMIN.DESC" },
    { id: 'open_code', title: 'ACCESS.OPENDOOR.TITLE', value: '', description: "ACCESS.OPENDOOR.DESC" },
    { id: 'withdrawal_code', title: 'ACCESS.WITHDRAWAL.TITLE', value: '', description: "ACCESS.WITHDRAWAL.DESC" },
    { id: 'access_log_code', title: 'ACCESS.LOGS.TITLE', value: '', description: "ACCESS.LOGS.DESC" },
    { id: 'access_clean_code', title: 'ACCESS.LOGS.CLEAN.TITLE', value: '', description: "ACCESS.LOGS.CLEAN.DESC" },
    { id: 'limit_withdrawal', title: 'ACCESS.WITHDRAWAL.LIMIT.TITLE', value: '', description: "ACCESS.WITHDRAWAL.LIMIT.DESC" }
  ];

  originalSavPhone: string = '';

  features: Feature[] = [];
  accessCodes: AccessCode[] = [];

  ipInput: string = '';
  ipInvalid: boolean = false;

  logos: string[] = [];
  colors: string[] = [];

  selectedLogo!: string;
  selectedColor!: string;
  savPhone: string = '';

  hideMachineConfig: boolean = false;
  hideTheme: boolean = false;

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private deviceConfigService: DeviceConfigService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {

    const url = this.router.url;

    if (url.includes('/admin')) {
      this.hideMachineConfig = true;
      this.hideTheme = true;
    }

    this.ipInput = this.deviceConfigService.ip || '';

    this.originalFeatures = this.settingsService.loadFeatures(this.originalFeatures);
    this.originalAccessCodes = this.settingsService.loadAccessCodes(this.originalAccessCodes);

    this.features = JSON.parse(JSON.stringify(this.originalFeatures));
    this.accessCodes = JSON.parse(JSON.stringify(this.originalAccessCodes));

    this.logos = this.themeService.logos;
    this.colors = this.themeService.colors;

    this.selectedLogo = this.themeService.getLogo();
    this.selectedColor = this.themeService.getColor();

    this.savPhone = this.themeService.getPhone();
    this.originalSavPhone = this.savPhone;
  }

  selectLogo(logo: string) {
    this.selectedLogo = logo;
    this.themeService.saveLogo(logo);
    window.location.reload();
  }

  selectColor(color: string) {
    this.selectedColor = color;
    this.themeService.saveColor(color);
  }

  savePhone() {
    this.themeService.savePhone(this.savPhone);
  }

  hasChanges(): boolean {
    return (
      this.features.some((f, i) => f.enabled !== this.originalFeatures[i].enabled) ||
      this.accessCodes.some((c, i) => c.value !== this.originalAccessCodes[i].value) ||
      this.savPhone !== this.originalSavPhone
    );
  }

  save() {
    
    this.settingsService.saveFeatures(this.features);
    this.settingsService.saveAccessCodes(this.accessCodes);
    
    this.themeService.savePhone(this.savPhone);

    this.originalFeatures = JSON.parse(JSON.stringify(this.features));
    this.originalAccessCodes = JSON.parse(JSON.stringify(this.accessCodes));
    this.originalSavPhone = this.savPhone;
  }


  cancel() {
    this.features = JSON.parse(JSON.stringify(this.originalFeatures));
    this.accessCodes = JSON.parse(JSON.stringify(this.originalAccessCodes));
    this.savPhone = this.originalSavPhone;
  }

  goBack() {
    this.router.navigate(['/calculator']);
  }

  saveIp() {
    this.ipInvalid = false;

    if (!this.deviceConfigService.isValidIp(this.ipInput)) {
      this.ipInvalid = true;
      return;
    }

    this.deviceConfigService.ip = this.ipInput;
  }
}