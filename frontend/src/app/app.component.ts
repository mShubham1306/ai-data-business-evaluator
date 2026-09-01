// NOVA AI Decision Engine — Production Build
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, StoredUser } from './core/services/auth.service';
import { CurrencyService } from './core/services/currency.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <div class="app-container">
      <!-- Navbar: hidden on landing page -->
      <nav class="navbar" *ngIf="showNav">
        <div class="nav-brand" routerLink="/dashboard" style="cursor:pointer">
          <div class="logo-mark">▲</div>
          <div>
            <h1>NOVA</h1>
            <p>AI Business Analyst &amp; Decision Engine</p>
          </div>
        </div>

        <button class="mobile-toggle" *ngIf="isAuthenticated$ | async" (click)="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle navigation">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-links" [class.mobile-open]="mobileMenuOpen" *ngIf="isAuthenticated$ | async">
          <a routerLink="/dashboard" routerLinkActive="active" (click)="mobileMenuOpen = false">Dashboard</a>
          <a routerLink="/business" routerLinkActive="active" (click)="mobileMenuOpen = false">Business Data</a>
          <a routerLink="/analytics/default" routerLinkActive="active" (click)="mobileMenuOpen = false">Analytics &amp; ML</a>
          <a routerLink="/copilot/default" routerLinkActive="active" (click)="mobileMenuOpen = false">Copilot AI</a>

          <!-- App-Wide Global Currency Selector -->
          <div class="nav-currency-box">
            <span class="nav-curr-icon">💱</span>
            <select [(ngModel)]="currentCurrency" (change)="onCurrencyChange()" class="nav-curr-select">
              <option *ngFor="let c of currencyService.currencies" [value]="c.code">
                {{ c.flag }} {{ c.code }} ({{ c.symbol }})
              </option>
            </select>
          </div>

          <!-- User Avatar + Name chip -->
          <div class="user-chip" *ngIf="currentUser">
            <div class="user-avatar">{{ getInitials(currentUser.name) }}</div>
            <div class="user-info">
              <span class="user-name">{{ currentUser.name }}</span>
              <span class="user-email">{{ currentUser.email }}</span>
            </div>
          </div>

          <button (click)="logout(); mobileMenuOpen = false" class="btn-logout">Logout</button>
        </div>
      </nav>

      <main class="main-content" [class.full-width]="!showNav">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--bg-page);
    }

    .navbar {
      background: linear-gradient(135deg, #0D1B2A 0%, #1E293B 100%);
      color: white;
      padding: 0.9rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 30px -5px rgba(13, 27, 42, 0.3), 0 2px 10px rgba(94, 225, 241, 0.15);
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid rgba(94, 225, 241, 0.2);
    }

    .nav-brand { display: flex; align-items: center; gap: 0.85rem; }

    .logo-mark {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #F69F98 0%, #5EE1F1 100%);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #0D1B2A; font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba(246, 159, 152, 0.4);
      animation: pulseGlow 4s infinite ease-in-out;
    }

    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 12px rgba(94, 225, 241, 0.5); }
      50% { box-shadow: 0 0 24px rgba(246, 159, 152, 0.8); }
    }

    .nav-brand h1 { margin: 0; font-size: 1.5rem; color: #FFFFFF; letter-spacing: 0.05em; }
    .nav-brand p { margin: 0; font-size: 0.72rem; color: #5EE1F1; font-weight: 500; }

    .mobile-toggle { display: none; flex-direction: column; gap: 5px; background: transparent; border: none; cursor: pointer; padding: 0.5rem; }
    .mobile-toggle span { display: block; width: 24px; height: 2px; background-color: #5EE1F1; border-radius: 2px; transition: all 0.3s; }

    .nav-links { display: flex; gap: 1.2rem; align-items: center; }
    .nav-links a { color: #E2E8F0; text-decoration: none; font-weight: 500; font-size: 0.88rem; padding: 0.4rem 0.8rem; border-radius: 8px; transition: all 0.25s ease; }
    .nav-links a:hover { color: #5EE1F1; background: rgba(94, 225, 241, 0.08); transform: translateY(-1px); }
    .nav-links a.active { color: #0D1B2A; background: linear-gradient(135deg, #F69F98 0%, #FDD5C8 100%); font-weight: 600; box-shadow: 0 4px 14px rgba(246, 159, 152, 0.4); }

    .nav-currency-box {
      display: flex; align-items: center; gap: 0.35rem;
      background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(94, 225, 241, 0.3);
      padding: 0.25rem 0.6rem; border-radius: 20px; transition: all 0.2s;
    }
    .nav-currency-box:hover { background: rgba(255, 255, 255, 0.18); border-color: var(--sky-blue); }
    .nav-curr-icon { font-size: 0.82rem; }
    .nav-curr-select {
      background: transparent; border: none; color: #5EE1F1; font-weight: 700;
      font-size: 0.82rem; cursor: pointer; outline: none; font-family: inherit;
    }
    .nav-curr-select option { background: #0D1B2A; color: #FFFFFF; }

    .user-chip { display: flex; align-items: center; gap: 0.65rem; background: rgba(255, 255, 255, 0.06); padding: 0.35rem 0.85rem; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--sky-blue) 0%, var(--coral-pink) 100%); color: var(--deep-navy); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; }
    .user-info { display: flex; flex-direction: column; text-align: left; }
    .user-name { font-size: 0.82rem; font-weight: 700; color: #FFFFFF; line-height: 1.2; }
    .user-email { font-size: 0.7rem; color: var(--slate-gray); }

    .btn-logout { background: transparent; border: 1px solid rgba(246, 159, 152, 0.4); color: #F69F98; padding: 0.4rem 0.95rem; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.2s ease; }
    .btn-logout:hover { background: #F69F98; color: #0D1B2A; }

    .main-content { flex: 1; overflow-y: auto; padding: 1.75rem 2.5rem; background: var(--cream); }
    .main-content.full-width { padding: 0; }

    @media (max-width: 992px) {
      .mobile-toggle { display: flex; }
      .nav-links { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #0D1B2A; flex-direction: column; padding: 1.5rem; gap: 1rem; border-bottom: 1px solid rgba(94, 225, 241, 0.2); }
      .nav-links.mobile-open { display: flex; }
      .nav-links a { width: 100%; text-align: center; }
      .user-chip { width: 100%; justify-content: center; }
      .btn-logout { width: 100%; }
    }

    @media (max-width: 480px) {
      .navbar { padding: 0.75rem 1rem; }
      .nav-brand h1 { font-size: 1.25rem; }
      .nav-brand p { font-size: 0.65rem; }
      .main-content { padding: 1rem 0.85rem; }
    }
  `]
})
export class AppComponent implements OnInit {
  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser: StoredUser | null = null;
  showNav = true;
  mobileMenuOpen = false;
  currentCurrency = 'AED';

  constructor(
    private authService: AuthService,
    public currencyService: CurrencyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.currencyService.selectedCurrency$.subscribe(curr => {
      this.currentCurrency = curr;
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.showNav = e.urlAfterRedirects !== '/';
    });
    this.showNav = this.router.url !== '/';
  }

  onCurrencyChange(): void {
    this.currencyService.setCurrency(this.currentCurrency);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.trim().split(' ')
      .slice(0, 2)
      .map(n => n[0]?.toUpperCase() || '')
      .join('');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
