import { Component, OnInit } from '@angular/core';

export function isPwaInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}

@Component({
  standalone: true,
  selector: 'pwa-install',
  imports: [],
  templateUrl: './pwa-install.html',
  styleUrl: './pwa-install.scss',
})
export class PwaInstall implements OnInit {

  deferredPrompt: any = null;

  inputCode = '';
  expectedCode = '';
  unlocked = false;

  ngOnInit() {
    this.generateCode();

    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  }

  generateCode() {
    const now = new Date();

    const pad = (n: number) => n.toString().padStart(2, '0');

    this.expectedCode =
      pad(now.getDate()) +
      pad(now.getMonth() + 1) +
      now.getFullYear().toString().slice(-2) +
      pad(now.getHours()) +
      pad(now.getMinutes());
  }

  onCodeChange(v: string) {
    this.inputCode = v;

    if (this.inputCode === this.expectedCode) {
      this.unlocked = true;
    }
  }

  async install() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;

    this.deferredPrompt = null;
  }
}