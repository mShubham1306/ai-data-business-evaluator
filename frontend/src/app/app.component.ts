// NOVA AI Decision Engine — Production Build Trigger
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService, StoredUser } from './core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
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

        <div class="nav-links" *ngIf="isAuthenticated$ | async">
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/business" routerLinkActive="active">Business Data</a>
          <a routerLink="/analytics/default" routerLinkActive="active">Analytics &amp; ML</a>
          <a routerLink="/copilot/default" routerLinkActive="active">Copilot AI</a>

          <!-- User Avatar + Name chip -->
          <div class="user-chip" *ngIf="currentUser">
            <div class="user-avatar">{{ getInitials(currentUser.name) }}</div>
            <div class="user-info">
              <span class="user-name">{{ currentUser.name }}</span>
              <span class="user-email">{{ currentUser.email }}</span>
            </div>
          </div>

          <button (click)="logout()" class="btn-logout">Logout</button>
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

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .logo-mark {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F69F98 0%, #5EE1F1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #0D1B2A;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba(246, 159, 152, 0.4);
      animation: pulseGlow 4s infinite ease-in-out;
    }

    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 12px rgba(94, 225, 241, 0.5); }
      50% { box-shadow: 0 0 24px rgba(246, 159, 152, 0.8); }
    }

    .nav-brand h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #FFFFFF;
      letter-spacing: 0.05em;
    }

    .nav-brand p {
      margin: 0;
      font-size: 0.72rem;
      color: #5EE1F1;
      font-weight: 500;
    }

    .nav-links {
      display: flex;
      gap: 1.2rem;
      align-items: center;
    }

    .nav-links a {
      color: #E2E8F0;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.88rem;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      transition: all 0.25s ease;
    }

    .nav-links a:hover {
      color: #5EE1F1;
      background: rgba(94, 225, 241, 0.08);
      transform: translateY(-1px);
    }

    .nav-links a.active {
      color: #0D1B2A;
      background: linear-gradient(135deg, #F69F98 0%, #FDD5C8 100%);
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(246, 159, 152, 0.4);
    }

    /* ── User chip ── */
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      background: rgba(94, 225, 241, 0.08);
      border: 1px solid rgba(94, 225, 241, 0.2);
      border-radius: 40px;
      padding: 0.3rem 0.75rem 0.3rem 0.3rem;
      transition: all 0.25s;
    }
    .user-chip:hover {
      background: rgba(94, 225, 241, 0.14);
      border-color: rgba(94, 225, 241, 0.35);
    }
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F69F98, #5EE1F1);
      color: #0D1B2A;
      font-weight: 800;
      font-size: 0.68rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1;
    }
    .user-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .user-email {
      font-size: 0.65rem;
      color: #5EE1F1;
      margin-top: 0.1rem;
    }

    .btn-logout {
      background: transparent;
      color: #F69F98;
      border: 1px solid #F69F98;
      padding: 0.45rem 1.1rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.25s ease;
    }

    .btn-logout:hover {
      background: #F69F98;
      color: #0D1B2A;
      box-shadow: 0 4px 14px rgba(246, 159, 152, 0.4);
      transform: translateY(-2px);
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 2.2rem 3rem;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
    }

    .main-content.full-width {
      padding: 0;
      max-width: 100%;
      overflow-y: auto;
    }
  `]
})
export class AppComponent implements OnInit {
  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser: StoredUser | null = null;
  showNav = true;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Hide navbar on landing page
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.showNav = e.urlAfterRedirects !== '/';
    });
    this.showNav = this.router.url !== '/';
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
