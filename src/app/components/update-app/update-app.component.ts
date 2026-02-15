import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SwUpdateService } from '../../services/sw-update.service';

@Component({
  standalone: true,
  selector: 'update-app',
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TranslatePipe    
  ],
  templateUrl: './update-app.component.html',
  styleUrl: './update-app.component.scss'
})
export class UpdateAppComponent {

  showUpdateDialog: boolean = true;
  version: string = '';

  constructor(
    private swUpdateService: SwUpdateService
  ) {}

  ngOnInit() {

     this.swUpdateService.version$.subscribe(v => {
      this.version = v;
    });

    // Detect when an update is available
    this.swUpdateService.updateAvailable$.subscribe(val => this.showUpdateDialog = val);
  }

  updateApplication() {
    this.swUpdateService.doUpdate();
  }

}
