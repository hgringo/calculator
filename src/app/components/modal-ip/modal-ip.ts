import { Component, OnInit } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DeviceConfigService } from '../../services/deviceConfig.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'modal-ip',
  imports: [
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './modal-ip.html',
  styleUrl: './modal-ip.scss',
})
export class ModalIp implements OnInit {

  display: string = '';

  showIpDialog: boolean = false;
  ipInput: string = '';
  ipInvalid: boolean = false;

  constructor(
    private deviceConfig: DeviceConfigService
  ) {}

  ngOnInit() {
    if (!this.deviceConfig.isConfigured()) {
      this.showIpDialog = true;
    }
  }

  saveIp() {
    this.ipInvalid = false;

    if (!this.deviceConfig.isValidIp(this.ipInput)) {
      this.ipInvalid = true;
      return;
    }

    this.deviceConfig.ip = this.ipInput;
    this.showIpDialog = false;
  }

}
