import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CashDenomination {
  value: number; // centimes (ex: 50 = 0.50€)
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CashInventoryService {

  private inventory$ = new BehaviorSubject<CashDenomination[]>([]);
  inventoryState$ = this.inventory$.asObservable();

  // ==============================
  // UPDATE INVENTORY
  // ==============================
  updateInventory(recyclerItems: any[], hopperItems: any[]) {

    // Recycler en euros
    const recycler = recyclerItems.map(i => ({
      value: i.value, // déjà en euros
      quantity: i.quantity
    }));

    // Hopper en euros
    const hopper = hopperItems.map(i => ({
      value: i.value, // déjà en euros
      quantity: i.quantity
    }));

    // Combine et trie par valeur décroissante
    const combined = [...recycler, ...hopper]
      .sort((a, b) => b.value - a.value);

    this.inventory$.next(combined);
  }

  // ==============================
  // CHECK IF CHANGE CAN BE RETURNED
  // ==============================
  // canReturnChange(changeAmount: number): boolean {

  //   if (changeAmount <= 0) return true;

  //   let remaining = changeAmount;

  //   const coins = [...this.inventory$.value]; // clone

  //   for (const coin of coins) {

  //     const usableCoins = Math.min(
  //       Math.floor(remaining / coin.value),
  //       coin.quantity
  //     );

  //     remaining -= usableCoins * coin.value;

  //     if (remaining === 0) return true;
  //   }

  //   return remaining === 0;
  // }

  canReturnChange(changeAmount: number): boolean {

    const coins = this.inventory$.value;

    const dp = new Set<number>();
    dp.add(0);

    for (const coin of coins) {

      const next = new Set(dp);

      for (let i = 1; i <= coin.quantity; i++) {
        for (const val of dp) {

          const sum = val + coin.value * i;

          if (sum === changeAmount) return true;

          if (sum < changeAmount) {
            next.add(sum);
          }
        }
      }

      dp.clear();
      next.forEach(v => dp.add(v));
    }

    return dp.has(changeAmount);
  }

  // ==============================
  // GET CHANGE COINS
  // ==============================
  getChangeCoins(changeAmount: number): CashDenomination[] {

    let remaining = Math.round(changeAmount * 100);

    const coins = [...this.inventory$.value];
    const result: CashDenomination[] = [];

    for (const coin of coins) {

      const usableCoins = Math.min(
        Math.floor(remaining / coin.value),
        coin.quantity
      );

      if (usableCoins > 0) {
        result.push({
          value: coin.value,
          quantity: usableCoins
        });

        remaining -= usableCoins * coin.value;
      }

      if (remaining === 0) break;
    }

    return result;
  }

  // ==============================
  // TOTAL AVAILABLE
  // ==============================
  getTotalAvailable(): number {
    return this.inventory$.value.reduce(
      (sum, c) => sum + (c.value * c.quantity),
      0
    );
  }
}