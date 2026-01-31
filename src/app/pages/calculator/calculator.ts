import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-calculator',
  imports: [
    CommonModule
  ],
  templateUrl: './calculator.html',
  styleUrl: './calculator.scss',
})
export class Calculator {

  display = '';

  append(value: string) {
    // Empêche deux points consécutifs
    if (value === '.' && this.display.endsWith('.')) {
      return;
    }

    this.display += value;
  }

  clear() {
    this.display = '';
  }

  backspace() {
    this.display = this.display.slice(0, -1);
  }

  calculate() {
    try {
      this.display = eval(this.display).toString();
    } catch {
      this.display = 'Erreur';
    }
  }

  send() {
    console.log('Valeur envoyée :', this.display);
    alert(`Valeur envoyée : ${this.display}`);
  } 

}
