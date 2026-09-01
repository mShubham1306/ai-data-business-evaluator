import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CurrencyOption {
  code: string;
  name: string;
  flag: string;
  symbol: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  readonly currencies: CurrencyOption[] = [
    { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'AED' },
    { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', symbol: 'SAR' },
    { code: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦', symbol: 'QAR' },
    { code: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼', symbol: 'KWD' },
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
    { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  ];

  private selectedCurrencySubject = new BehaviorSubject<string>(localStorage.getItem('nova_global_currency') || 'AED');
  selectedCurrency$: Observable<string> = this.selectedCurrencySubject.asObservable();

  get currentCurrency(): string {
    return this.selectedCurrencySubject.value;
  }

  setCurrency(code: string): void {
    if (!code) return;
    localStorage.setItem('nova_global_currency', code);
    this.selectedCurrencySubject.next(code);
  }
}
