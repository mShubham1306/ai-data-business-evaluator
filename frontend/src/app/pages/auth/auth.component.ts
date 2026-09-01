import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <!-- Background orbs -->
      <div class="auth-bg">
        <div class="auth-orb orb-1"></div>
        <div class="auth-orb orb-2"></div>
        <div class="auth-orb orb-3"></div>
      </div>

      <!-- Back to landing -->
      <a routerLink="/" class="back-to-home">← Back to Home</a>

      <div class="auth-wrapper">
        <!-- Left panel (branding) -->
        <div class="auth-side">
          <div class="auth-side-content">
            <div class="side-logo">
              <div class="logo-icon">▲</div>
              <span>NOVA</span>
            </div>
            <h2 class="side-title">AI Decision Intelligence<br/>for GCC Businesses</h2>
            <p class="side-sub">Get ML-powered forecasts, anomaly detection, and Gemini AI strategy — all verified through 4 trust layers.</p>

            <div class="side-features">
              <div class="side-feature" *ngFor="let f of sideFeatures">
                <span class="side-feature-icon">{{ f.icon }}</span>
                <span>{{ f.text }}</span>
              </div>
            </div>

            <div class="side-quote">
              <p>"NOVA replaced our 3 separate analytics tools."</p>
              <span>— UAE Tech SME Founder</span>
            </div>
          </div>
        </div>

        <!-- Right panel (form) -->
        <div class="auth-card">
          <div class="auth-header">
            <h1>{{ isLogin ? 'Welcome back' : 'Create account' }}</h1>
            <p>{{ isLogin ? 'Sign in to your NOVA workspace' : 'Start your free AI business analysis' }}</p>
          </div>

          <!-- Tabs -->
          <div class="auth-tabs">
            <button [class.active]="!isLogin" (click)="switchMode(false)" class="tab-btn" id="tab-signup">
              Sign Up
            </button>
            <button [class.active]="isLogin" (click)="switchMode(true)" class="tab-btn" id="tab-signin">
              Sign In
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" id="auth-form">
            <div *ngIf="!isLogin" class="form-group">
              <label>Full Name <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">👤</span>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="e.g. Nayan Ahmed"
                  id="input-name"
                />
              </div>
              <span class="field-error" *ngIf="form.get('name')?.touched && form.get('name')?.invalid">
                Name is required
              </span>
            </div>

            <div class="form-group">
              <label>Email Address <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">📧</span>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="you@example.com"
                  id="input-email"
                />
              </div>
              <span class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.invalid">
                Valid email is required
              </span>
            </div>

            <div class="form-group">
              <label>Password <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">🔒</span>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Min. 6 characters"
                  id="input-password"
                />
                <button type="button" class="toggle-pw" (click)="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <span class="field-error" *ngIf="form.get('password')?.touched && form.get('password')?.invalid">
                Password must be at least 6 characters
              </span>
            </div>

            <div *ngIf="!isLogin" class="form-group">
              <label>Company Name <span class="optional">(optional)</span></label>
              <div class="input-wrap">
                <span class="input-icon">🏢</span>
                <input
                  type="text"
                  formControlName="company_name"
                  placeholder="Your company or trade name"
                  id="input-company"
                />
              </div>
            </div>

            <div *ngIf="error" class="alert-error">
              <span>⚠️</span> {{ error }}
            </div>

            <div *ngIf="successMsg" class="alert-success">
              <span>✅</span> {{ successMsg }}
            </div>

            <button
              type="submit"
              class="btn-submit"
              [disabled]="!form.valid || isLoading"
              id="btn-submit"
            >
              <span class="spinner-sm" *ngIf="isLoading"></span>
              <span *ngIf="!isLoading">{{ isLogin ? '→ Sign In' : '→ Create Free Account' }}</span>
            </button>
          </form>

          <p class="auth-switch">
            {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
            <button class="link-btn" (click)="switchMode(!isLogin)">
              {{ isLogin ? 'Sign Up Free' : 'Sign In' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      background: #0D1B2A;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      font-family: 'Poppins', sans-serif;
    }

    /* Background orbs */
    .auth-bg { position: absolute; inset: 0; pointer-events: none; }
    .auth-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; }
    .orb-1 { width: 500px; height: 500px; background: #5EE1F1; top: -150px; right: -100px; animation: orbFloat 8s ease-in-out infinite; }
    .orb-2 { width: 350px; height: 350px; background: #F69F98; bottom: -100px; left: -50px; animation: orbFloat 10s ease-in-out infinite reverse; }
    .orb-3 { width: 200px; height: 200px; background: #8B5CF6; top: 50%; left: 35%; animation: orbFloat 12s ease-in-out infinite; }
    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(20px, -20px); }
    }

    /* Back link */
    .back-to-home {
      position: absolute;
      top: 1.5rem;
      left: 2rem;
      color: #64748B;
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 600;
      transition: color 0.2s;
      z-index: 10;
    }
    .back-to-home:hover { color: #5EE1F1; }

    /* Wrapper: side + card */
    .auth-wrapper {
      display: flex;
      width: 100%;
      max-width: 980px;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(94,225,241,0.1);
      position: relative;
      z-index: 5;
      animation: fadeInUp 0.5s ease forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Left brand panel */
    .auth-side {
      flex: 0 0 380px;
      background: linear-gradient(150deg, #0D1B2A 0%, #1a2d45 100%);
      padding: 3rem 2.5rem;
      display: flex;
      align-items: center;
      border-right: 1px solid rgba(94, 225, 241, 0.1);
    }
    .auth-side-content { width: 100%; }
    .side-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2.5rem;
    }
    .logo-icon {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #F69F98, #5EE1F1);
      color: #0D1B2A; font-weight: 900; font-size: 1.1rem;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px rgba(94,225,241,0.4);
      animation: glow 3s ease-in-out infinite;
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 15px rgba(94,225,241,0.4); }
      50% { box-shadow: 0 0 30px rgba(246,159,152,0.7); }
    }
    .side-logo span { font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: 0.05em; }
    .side-title { font-size: 1.5rem; font-weight: 800; color: #fff; line-height: 1.3; margin-bottom: 0.85rem; }
    .side-sub { font-size: 0.82rem; color: #64748B; line-height: 1.65; margin-bottom: 2rem; }
    .side-features { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2rem; }
    .side-feature {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.82rem; color: #94A3B8; font-weight: 500;
    }
    .side-feature-icon { font-size: 1.1rem; }
    .side-quote {
      background: rgba(94,225,241,0.06);
      border: 1px solid rgba(94,225,241,0.15);
      border-radius: 12px;
      padding: 1rem 1.25rem;
    }
    .side-quote p { font-size: 0.82rem; color: #E2E8F0; font-style: italic; margin-bottom: 0.35rem; }
    .side-quote span { font-size: 0.72rem; color: #5EE1F1; font-weight: 600; }

    /* Right form card */
    .auth-card {
      flex: 1;
      background: #FFFFFF;
      padding: 3rem 2.5rem;
    }
    .auth-header { margin-bottom: 1.75rem; }
    .auth-header h1 { font-size: 1.75rem; font-weight: 800; color: #0D1B2A; margin-bottom: 0.3rem; letter-spacing: -0.02em; }
    .auth-header p { font-size: 0.88rem; color: #64748B; }

    /* Tabs */
    .auth-tabs {
      display: flex;
      background: #F1F5F9;
      border-radius: 10px;
      padding: 0.25rem;
      margin-bottom: 1.75rem;
      gap: 0.25rem;
    }
    .tab-btn {
      flex: 1;
      padding: 0.65rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.88rem;
      color: #64748B;
      border-radius: 8px;
      transition: all 0.2s;
      font-family: 'Poppins', sans-serif;
    }
    .tab-btn.active {
      background: #FFFFFF;
      color: #0D1B2A;
      box-shadow: 0 2px 8px rgba(13,27,42,0.1);
    }

    /* Form */
    .form-group { margin-bottom: 1.1rem; }
    .form-group label {
      display: block; margin-bottom: 0.4rem;
      font-size: 0.82rem; font-weight: 600; color: #334155;
    }
    .req { color: #F69F98; }
    .optional { color: #94A3B8; font-weight: 400; font-size: 0.75rem; }
    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 0.9rem;
      font-size: 0.95rem;
      pointer-events: none;
    }
    .input-wrap input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.6rem;
      border: 1.5px solid #E2E8F0;
      border-radius: 10px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.88rem;
      color: #0D1B2A;
      background: #FAFAFA;
      transition: all 0.2s;
    }
    .input-wrap input:focus {
      outline: none;
      border-color: #5EE1F1;
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(94,225,241,0.15);
    }
    .toggle-pw {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
      line-height: 1;
    }
    .field-error { display: block; font-size: 0.72rem; color: #EF4444; margin-top: 0.3rem; font-weight: 500; }

    /* Alerts */
    .alert-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fff1f2;
      border: 1px solid rgba(246,159,152,0.4);
      border-left: 4px solid #EF4444;
      color: #9f1239;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      margin-bottom: 1rem;
    }
    .alert-success {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f0fdf4;
      border: 1px solid rgba(34,197,94,0.3);
      border-left: 4px solid #22C55E;
      color: #14532d;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      margin-bottom: 1rem;
    }

    /* Submit button */
    .btn-submit {
      width: 100%;
      padding: 0.9rem;
      background: linear-gradient(135deg, #F69F98 0%, #5EE1F1 100%);
      color: #0D1B2A;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 4px 14px rgba(246,159,152,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(246,159,152,0.55);
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinner-sm {
      width: 18px; height: 18px; border-radius: 50%;
      border: 2px solid rgba(13,27,42,0.2); border-top-color: #0D1B2A;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Switch mode */
    .auth-switch { text-align: center; font-size: 0.82rem; color: #64748B; }
    .link-btn {
      background: none; border: none; cursor: pointer;
      color: #F69F98; font-weight: 700; font-size: 0.82rem;
      font-family: 'Poppins', sans-serif;
      text-decoration: underline;
      transition: color 0.2s;
    }
    .link-btn:hover { color: #e07870; }

    /* Responsive */
    @media (max-width: 768px) {
      .auth-wrapper { flex-direction: column; }
      .auth-side { flex: 0 0 auto; border-right: none; border-bottom: 1px solid rgba(94,225,241,0.1); padding: 2rem 1.75rem; }
      .auth-card { padding: 2rem 1.75rem; }
      .back-to-home { top: 1rem; left: 1rem; }
    }
  `]
})
export class AuthComponent implements OnInit {
  form: FormGroup;
  isLogin = true;
  error = '';
  successMsg = '';
  isLoading = false;
  showPassword = false;

  sideFeatures = [
    { icon: '🧠', text: 'ML Revenue Forecasting (12-Month)' },
    { icon: '🏥', text: 'Business Health Score (0-100)' },
    { icon: '🤖', text: 'Gemini AI Copilot Chat' },
    { icon: '⚡', text: 'What-If Financial Simulator' },
    { icon: '🔍', text: 'Anomaly & Outlier Detection' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      company_name: ['']
    });
  }

  ngOnInit(): void {
    // Redirect already-authenticated users to dashboard
    if (this.authService.hasToken()) {
      this.router.navigate(['/dashboard']);
    }
  }

  switchMode(toLogin: boolean): void {
    this.isLogin = toLogin;
    this.error = '';
    this.successMsg = '';
    this.form.reset();
    this.form.markAsUntouched();
  }

  submit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = '';
    this.successMsg = '';
    this.isLoading = true;

    const data = { ...this.form.value };

    if (this.isLogin) {
      delete data.name;
      delete data.company_name;

      this.authService.login(data).subscribe({
        next: (res) => {
          this.successMsg = `Welcome back, ${res.user.name}! Redirecting...`;
          setTimeout(() => this.router.navigate(['/dashboard']), 600);
        },
        error: (err) => {
          if (err.status === 0) {
            this.error = 'Unable to connect to backend server (http://localhost:5000). Please ensure backend is running.';
          } else {
            this.error = err.error?.error || 'Login failed. Please check your email and password.';
          }
          this.isLoading = false;
        }
      });
    } else {
      if (!data.name?.trim()) {
        this.error = 'Please enter your full name.';
        this.isLoading = false;
        return;
      }

      this.authService.register(data).subscribe({
        next: (res) => {
          this.successMsg = `Account created! Welcome, ${res.user.name}! Redirecting...`;
          setTimeout(() => this.router.navigate(['/dashboard']), 600);
        },
        error: (err) => {
          if (err.status === 0) {
            this.error = 'Unable to connect to backend server (http://localhost:5000). Please ensure backend is running.';
          } else {
            this.error = err.error?.error || 'Registration failed. Please try again.';
          }
          this.isLoading = false;
        }
      });
    }
  }
}
