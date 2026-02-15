import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'splash-screen',
  imports: [

  ],
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.scss',
})
export class SplashScreen implements OnInit {

  @Input() duration = 3000;
  @Output() finished = new EventEmitter<void>();

  visible = true;

  ngOnInit() {
    setTimeout(() => {
      this.visible = false;

      setTimeout(() => {
        this.finished.emit();
      }, 400);

    }, this.duration);
  }
}