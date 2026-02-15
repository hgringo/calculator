import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'device-blocker',
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './device-blocker.html',
  styleUrl: './device-blocker.scss'
})
export class DeviceBlockerComponent implements OnInit {

  isMobile = false;

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
  this.breakpointObserver
    .observe(['(max-width: 450px)'])
    .subscribe(result => {
      this.isMobile = result.matches;
    });
}
}