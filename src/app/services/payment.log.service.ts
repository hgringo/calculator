import { Injectable } from '@angular/core';
import { PaymentLog } from '../types/paymentLog';

@Injectable({
  providedIn: 'root'
})
export class PaymentLogService {

  private storageKey = 'payment_logs';

  // 🔹 Lire tous les paiements enregistrés
  getLogs(): PaymentLog[] {

    const data = localStorage.getItem(this.storageKey);

    if (!data) return [];

    // Conversion JSON → objets
    const parsed = JSON.parse(data);

    // Reconvertir timestamp en Date
    return parsed.map((log: any) => ({
      timestamp: new Date(log.timestamp),
      amount: log.amount
    }));
  }

  // 🔹 Ajouter un nouveau paiement
  addLog(amount: number) {

    const logs = this.getLogs();

    const newLog: PaymentLog = {
      timestamp: new Date(),
      amount: amount
    };

    logs.push(newLog);

    localStorage.setItem(this.storageKey, JSON.stringify(logs));
  }

  // 🔹 Effacer l’historique
  clearLogs() {
    localStorage.removeItem(this.storageKey);
  }
}
