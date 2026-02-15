import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[longPress]',
  standalone: true
})
export class LongPressDirective {

  @Output() longPress = new EventEmitter<void>();
  @Input() duration = 3000; // temps en ms, par défaut 3s

  private pressTimer: any;

  @HostListener('mousedown')
  @HostListener('touchstart')
  onPressStart() {
    this.pressTimer = setTimeout(() => {
      this.longPress.emit();
    }, this.duration);
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  @HostListener('touchend')
  onPressEnd() {
    clearTimeout(this.pressTimer);
  }
}