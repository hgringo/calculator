import { Injectable } from '@angular/core';
import { PaymentLog } from '../types/paymentLog';
import { VnePaymentPendingResponse } from '../types/VnePaymentRequest';

@Injectable({
  providedIn: 'root'
})
export class PaymentLogService {

  private storageKey = 'payment_logs';

  getLogs(onlyCompleted: boolean = false): PaymentLog[] {
    
    const data = localStorage.getItem(this.storageKey);

    if (!data) return [];

    const parsed = JSON.parse(data) as PaymentLog[];

    let logs = parsed.map(log => ({
      timestamp: new Date(log.timestamp),
      amount: log.amount,
      inserted: log.inserted,
      rest: log.rest,
      status: log.status,
      justif: log.justif
    }));

    if (onlyCompleted) {
      logs = logs.filter(log => log.status.toLowerCase() === 'completed');
    }

    return logs;
  }

  addLog(response: VnePaymentPendingResponse, justif?: string) {

    const logs = this.getLogs();

    const newLog: PaymentLog = {
      timestamp: new Date(),
      amount: response.payment_details?.amount / 100 || 0,
      inserted: response.payment_details?.inserted / 100 || 0,
      rest : response.payment_details?.rest / 100 || 0,
      status: response.payment_details?.status.toUpperCase() || "",
      justif: justif
    };

    logs.push(newLog);

    localStorage.setItem(this.storageKey, JSON.stringify(logs));
  }

  clearLogs() {
    localStorage.removeItem(this.storageKey);
  }

  generateMockLogs() {

    const justificatifs = ['FACT-2024-001', 'FACT-2024-002', 'FACT-2024-003', null];

    const scenarios: {
      justif: string | null;
      status: 'COMPLETED' | 'CANCELED';
      amount: number;
      inserted: number;
    }[] = [
      // ── FACT-2024-001 : 3 completed, 1 canceled ──────────────────────────
      { justif: 'FACT-2024-001', status: 'COMPLETED', amount: 1500, inserted: 1500 },
      { justif: 'FACT-2024-001', status: 'COMPLETED', amount:  750, inserted:  800 },
      { justif: 'FACT-2024-001', status: 'CANCELED',  amount:  200, inserted:    0 },
      { justif: 'FACT-2024-001', status: 'COMPLETED', amount: 3200, inserted: 3200 },

      // ── FACT-2024-002 : 2 completed, 1 canceled ──────────────────────────
      { justif: 'FACT-2024-002', status: 'COMPLETED', amount: 4800, inserted: 5000 },
      { justif: 'FACT-2024-002', status: 'CANCELED',  amount:  900, inserted:    0 },
      { justif: 'FACT-2024-002', status: 'COMPLETED', amount: 1100, inserted: 1100 },

      // ── FACT-2024-003 : all completed ─────────────────────────────────────
      { justif: 'FACT-2024-003', status: 'COMPLETED', amount: 2500, inserted: 2500 },
      { justif: 'FACT-2024-003', status: 'COMPLETED', amount:  600, inserted:  600 },

      // ── No justificatif : tests the fallback section ──────────────────────
      { justif: null, status: 'COMPLETED', amount:  350, inserted:  400 },
      { justif: null, status: 'CANCELED',  amount:  100, inserted:    0 },
      { justif: null, status: 'COMPLETED', amount: 1800, inserted: 1800 },
    ];

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    const logs: PaymentLog[] = scenarios.map((s, i) => {
      // Spread timestamps over the past 7 days, oldest first
      const offsetMs = ((scenarios.length - 1 - i) / scenarios.length) * 7 * ONE_DAY_MS;
      const timestamp = new Date(now - offsetMs);

      const rest = s.status === 'CANCELED' ? 0 : Math.max(0, s.inserted - s.amount);

      return {
        timestamp,
        amount:   s.amount   / 100,   // service stores amounts in euros (divided by 100)
        inserted: s.inserted / 100,
        rest:     rest        / 100,
        status:   s.status,           // UPPERCASE to match PaymentLogService.addLog()
        justif:   s.justif ?? undefined,
      };
    });

    localStorage.setItem('payment_logs', JSON.stringify(logs));
    console.info(`[DEV] ${logs.length} mock payment logs written to localStorage.`);
  }
}
