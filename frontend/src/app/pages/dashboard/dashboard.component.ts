import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService, Business } from '../../core/services/business.service';
import { AuthService, StoredUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="dashboard-page animated-fade-in">
      <header class="dash-header">
        <div>
          <h2>Welcome back, {{ currentUser?.name || 'there' }} 👋</h2>
          <p class="subtitle">NOVA Decision Intelligence · Real-Time SME Outcome Engine</p>
        </div>
        <button class="btn btn-primary 3d-btn" (click)="openAddModal()">
          <span>+ Add Business Profile</span>
        </button>
      </header>

      <!-- Trust Layer Status Bar -->
      <div class="trust-banner">
        <div class="trust-pill verified">
          <span class="status-dot green"></span> Layer 1: Data Rules Verified
        </div>
        <div class="trust-pill confidence">
          <span class="status-dot blue"></span> Layer 2: ML Model Bounds ±88.4%
        </div>
        <div class="trust-pill llm">
          <span class="status-dot purple"></span> Layer 3: Gemini 2.5 Copilot Ready
        </div>
        <div class="trust-pill feedback">
          <span class="status-dot coral"></span> Layer 4: Outcome Retraining Active
        </div>
      </div>

      <!-- Overview Metric Cards (real data only) -->
      <div class="grid grid-3 mt-4">
        <div class="card stat-card 3d-card">
          <div class="card-glow sky"></div>
          <span class="stat-title">Your Business Profiles</span>
          <h3 class="stat-value">{{ businesses.length }}</h3>
          <span class="stat-meta" *ngIf="businesses.length > 0">Active across NOVA World Model</span>
          <span class="stat-meta" *ngIf="businesses.length === 0">Add your first business below</span>
        </div>

        <div class="card stat-card 3d-card" [class.highlight-success]="avgHealthScore > 0">
          <div class="card-glow green"></div>
          <span class="stat-title">Avg. Business Health Score</span>
          <h3 class="stat-value text-success" *ngIf="avgHealthScore > 0">
            {{ avgHealthScore | number:'1.1-1' }} <span class="max-val">/ 100</span>
          </h3>
          <h3 class="stat-value text-muted" *ngIf="avgHealthScore === 0">—</h3>
          <span class="stat-meta" *ngIf="avgHealthScore > 0">Based on your business data</span>
          <span class="stat-meta" *ngIf="avgHealthScore === 0">Upload data to see your score</span>
        </div>

        <div class="card stat-card 3d-card" [class.highlight-coral]="opportunities > 0">
          <div class="card-glow coral"></div>
          <span class="stat-title">Detected Opportunities</span>
          <h3 class="stat-value text-coral" *ngIf="opportunities > 0">{{ opportunities }} Actionable</h3>
          <h3 class="stat-value text-muted" *ngIf="opportunities === 0">—</h3>
          <span class="stat-meta" *ngIf="opportunities > 0">Scan Copilot for details</span>
          <span class="stat-meta" *ngIf="opportunities === 0">Scan businesses via Copilot</span>
        </div>
      </div>

      <!-- Business Profiles Section -->
      <section class="mt-4">
        <div class="section-title-row mb-3">
          <h3>Your Business Profiles</h3>
          <span class="live-tag" *ngIf="businesses.length > 0">
            <span class="pulse"></span> LIVE REASONING
          </span>
        </div>

        <!-- Loading -->
        <div class="empty-state card mt-2" *ngIf="loading">
          <div class="loading-spinner"></div>
          <p>Loading your businesses...</p>
        </div>

        <!-- Businesses grid -->
        <div class="grid grid-2" *ngIf="businesses.length > 0 && !loading">
          <div class="card biz-card 3d-card" *ngFor="let biz of businesses">
            <div class="biz-card-header">
              <div>
                <h4>{{ biz.name }}</h4>
                <span class="badge mt-1">{{ biz.industry || 'General' }}</span>
              </div>
              <span class="currency-tag">{{ biz.currency || 'AED' }}</span>
            </div>

            <p class="biz-desc">{{ biz.description || 'No description. Click Business Data to add details.' }}</p>

            <div class="biz-metrics-row" *ngIf="biz.goals?.target_annual_revenue || biz.goals?.target_margin">
              <div class="mini-metric" *ngIf="biz.goals?.target_annual_revenue">
                <span class="m-lbl">Target Revenue</span>
                <span class="m-val">{{ biz.currency || 'AED' }} {{ biz.goals.target_annual_revenue | number:'1.0-0' }}</span>
              </div>
              <div class="mini-metric" *ngIf="biz.goals?.target_margin">
                <span class="m-lbl">Target Margin</span>
                <span class="m-val text-success">{{ biz.goals.target_margin }}%</span>
              </div>
            </div>

            <div class="biz-no-goals" *ngIf="!biz.goals?.target_annual_revenue && !biz.goals?.target_margin">
              <span class="no-data-hint">📝 Set goals via Business Data page</span>
            </div>

            <div class="biz-footer mt-3">
              <button class="btn btn-secondary btn-sm" [routerLink]="['/business', biz.id]">📄 Data &amp; Uploads</button>
              <button class="btn btn-secondary btn-sm" [routerLink]="['/analytics', biz.id]">📈 Analytics &amp; What-If</button>
              <button class="btn btn-primary btn-sm" [routerLink]="['/copilot', biz.id]">🤖 Copilot &amp; Actions</button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div class="empty-state card mt-2" *ngIf="businesses.length === 0 && !loading">
          <div class="empty-icon">🏢</div>
          <h3>No Business Profiles Yet</h3>
          <p>Create your first business profile to start getting AI-powered insights, forecasts, and decision intelligence.</p>
          <button class="btn btn-primary mt-3" (click)="openAddModal()">+ Create Your First Business</button>
        </div>
      </section>
    </div>

    <!-- ── Add Business Modal ── -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-card animated-fade-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Create Business Profile</h3>
          <button class="modal-close" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Business Name <span class="req">*</span></label>
              <input type="text" [(ngModel)]="newBiz.name" placeholder="e.g. Al Noor Trading LLC" />
            </div>
            <div class="form-group">
              <label>Industry <span class="req">*</span></label>
              <select [(ngModel)]="newBiz.industry">
                <option value="">Select industry...</option>
                <option *ngFor="let ind of industries" [value]="ind">{{ ind }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Currency</label>
              <select [(ngModel)]="newBiz.currency">
                <option value="AED">AED – UAE Dirham</option>
                <option value="SAR">SAR – Saudi Riyal</option>
                <option value="QAR">QAR – Qatari Riyal</option>
                <option value="KWD">KWD – Kuwaiti Dinar</option>
                <option value="USD">USD – US Dollar</option>
                <option value="EUR">EUR – Euro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Business Size</label>
              <select [(ngModel)]="newBiz.size">
                <option value="">Select size...</option>
                <option value="micro">Micro (1–9 employees)</option>
                <option value="small">Small (10–49 employees)</option>
                <option value="medium">Medium (50–249 employees)</option>
                <option value="large">Large (250+ employees)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Business Description</label>
            <textarea [(ngModel)]="newBiz.description" rows="3" placeholder="Briefly describe your business, products/services, and market..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Target Annual Revenue ({{ newBiz.currency }})</label>
              <input type="number" [(ngModel)]="newBiz.target_revenue" placeholder="e.g. 5000000" min="0" />
            </div>
            <div class="form-group">
              <label>Target Net Margin (%)</label>
              <input type="number" [(ngModel)]="newBiz.target_margin" placeholder="e.g. 25" min="0" max="100" />
            </div>
          </div>

          <div class="modal-error" *ngIf="modalError">{{ modalError }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="createBusiness()" [disabled]="!newBiz.name || !newBiz.industry || creating">
            <span *ngIf="!creating">✓ Create Business Profile</span>
            <span *ngIf="creating" class="spinner"></span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.75rem;
    }

    .subtitle {
      color: var(--slate-gray);
      font-size: 0.95rem;
      margin-top: 0.2rem;
    }

    .trust-banner {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      background: var(--white);
      padding: 0.85rem 1.35rem;
      border-radius: 12px;
      box-shadow: var(--shadow-3d);
      border: 1px solid var(--border-color);
    }

    .trust-pill {
      font-size: 0.82rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      background: var(--cream);
      color: var(--deep-navy);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: all 0.25s ease;
    }
    .trust-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(13, 27, 42, 0.08); }
    .trust-pill.verified { background: #f0fdf4; color: #14532d; border-color: rgba(34, 197, 94, 0.3); }
    .trust-pill.confidence { background: #eff6ff; color: #1e40af; border-color: rgba(59, 130, 246, 0.3); }
    .trust-pill.llm { background: #faf5ff; color: #6b21a8; border-color: rgba(139, 92, 246, 0.3); }
    .trust-pill.coral { background: #fff1f2; color: #9f1239; border-color: rgba(246, 159, 152, 0.4); }

    .status-dot {
      width: 9px; height: 9px; border-radius: 50%;
      &.green { background: var(--success-green); box-shadow: 0 0 8px var(--success-green); }
      &.blue { background: var(--primary-blue); box-shadow: 0 0 8px var(--primary-blue); }
      &.purple { background: var(--accent-purple); box-shadow: 0 0 8px var(--accent-purple); }
      &.coral { background: var(--coral-pink); box-shadow: 0 0 8px var(--coral-pink); }
    }

    .stat-card {
      display: flex; flex-direction: column; gap: 0.4rem; position: relative;
    }
    .card-glow {
      position: absolute; top: -30px; right: -30px; width: 100px; height: 100px;
      border-radius: 50%; pointer-events: none; filter: blur(25px); opacity: 0.4;
      &.sky { background: var(--sky-blue); }
      &.green { background: var(--success-green); }
      &.coral { background: var(--coral-pink); }
    }
    .stat-title {
      font-size: 0.85rem; color: var(--muted-gray);
      text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
    }
    .stat-value { font-size: 2.2rem; font-weight: 800; color: var(--deep-navy); }
    .max-val { font-size: 1rem; color: var(--muted-gray); font-weight: 500; }
    .stat-meta { font-size: 0.78rem; color: var(--slate-gray); }
    .text-success { color: var(--success-green); }
    .text-coral { color: var(--coral-pink); }
    .text-muted { color: var(--muted-gray); }

    .section-title-row { display: flex; justify-content: space-between; align-items: center; }
    .live-tag {
      font-size: 0.75rem; font-weight: 700; color: var(--deep-navy);
      background: var(--sky-blue); padding: 0.25rem 0.75rem; border-radius: 12px;
      display: flex; align-items: center; gap: 0.4rem;
      box-shadow: 0 2px 8px rgba(94, 225, 241, 0.4);
    }
    .pulse {
      width: 7px; height: 7px; background: var(--coral-pink); border-radius: 50%;
      animation: pulseAnim 1.5s infinite;
    }
    @keyframes pulseAnim {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(246, 159, 152, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(246, 159, 152, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(246, 159, 152, 0); }
    }

    .biz-card { display: flex; flex-direction: column; justify-content: space-between; }
    .biz-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .currency-tag {
      font-weight: 700; color: var(--deep-navy); background: var(--peach);
      padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.82rem;
    }
    .biz-desc { margin: 0.85rem 0; font-size: 0.88rem; color: var(--slate-gray); line-height: 1.5; }
    .biz-metrics-row {
      display: flex; gap: 1.5rem; background: var(--cream);
      padding: 0.75rem 1rem; border-radius: 10px; margin-top: 0.5rem;
    }
    .biz-no-goals {
      background: var(--cream); padding: 0.6rem 1rem; border-radius: 8px;
      margin-top: 0.5rem; font-size: 0.82rem;
    }
    .no-data-hint { color: var(--muted-gray); font-style: italic; }
    .mini-metric { display: flex; flex-direction: column; }
    .m-lbl { font-size: 0.72rem; color: var(--muted-gray); text-transform: uppercase; }
    .m-val { font-weight: 700; font-size: 0.95rem; color: var(--deep-navy); }
    .biz-footer { display: flex; gap: 0.65rem; flex-wrap: wrap; }
    .btn-sm { padding: 0.45rem 0.85rem; font-size: 0.82rem; }

    /* Empty state */
    .empty-state {
      text-align: center; padding: 3rem 2rem; display: flex;
      flex-direction: column; align-items: center; gap: 0.75rem;
    }
    .empty-icon { font-size: 3rem; }
    .empty-state h3 { color: var(--deep-navy); }
    .empty-state p { color: var(--muted-gray); max-width: 420px; font-size: 0.92rem; }
    .loading-spinner {
      width: 40px; height: 40px; border-radius: 50%;
      border: 3px solid var(--border-color); border-top-color: var(--coral-pink);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Modal ── */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(13, 27, 42, 0.65);
      backdrop-filter: blur(6px); display: flex; align-items: center;
      justify-content: center; z-index: 1000; padding: 1rem;
    }
    .modal-card {
      background: var(--white); border-radius: 20px; width: 100%;
      max-width: 680px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 30px 60px rgba(13, 27, 42, 0.35);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem 2rem; border-bottom: 1px solid var(--border-color);
      position: sticky; top: 0; background: var(--white); z-index: 2;
      border-radius: 20px 20px 0 0;
    }
    .modal-header h3 { margin: 0; color: var(--deep-navy); }
    .modal-close {
      background: none; border: none; font-size: 1.1rem; cursor: pointer;
      color: var(--muted-gray); padding: 0.25rem 0.5rem; border-radius: 6px;
      transition: all 0.2s;
    }
    .modal-close:hover { background: var(--cream); color: var(--deep-navy); }
    .modal-body { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.85rem;
      padding: 1.25rem 2rem; border-top: 1px solid var(--border-color);
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); }
    .form-group input, .form-group select, .form-group textarea {
      padding: 0.65rem 0.85rem; border: 1px solid var(--border-color);
      border-radius: 8px; font-family: inherit; font-size: 0.9rem;
      color: var(--deep-navy); background: var(--white); transition: all 0.2s;
    }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none; border-color: var(--sky-blue);
      box-shadow: 0 0 0 3px rgba(94, 225, 241, 0.2);
    }
    .req { color: var(--coral-pink); }
    .modal-error {
      background: #fff1f2; border: 1px solid rgba(246, 159, 152, 0.4);
      color: var(--coral-pink); padding: 0.75rem 1rem; border-radius: 8px;
      font-size: 0.85rem;
    }
    .spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
  `]
})
export class DashboardComponent implements OnInit {
  businesses: Business[] = [];
  loading = true;
  showModal = false;
  creating = false;
  modalError = '';
  avgHealthScore = 0;
  opportunities = 0;
  currentUser: StoredUser | null = null;

  newBiz = this.emptyBiz();

  industries = [
    'Technology & Software', 'Retail & E-commerce', 'F&B / Hospitality',
    'Real Estate & Property', 'Logistics & Supply Chain', 'Healthcare & Wellness',
    'Financial Services', 'Construction & Contracting', 'Education & Training',
    'Marketing & Media', 'Manufacturing', 'Consulting & Professional Services', 'Other'
  ];

  constructor(
    private businessService: BusinessService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getStoredUser();
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.loadBusinesses();
  }

  emptyBiz() {
    return {
      name: '',
      industry: '',
      currency: 'AED',
      size: '',
      description: '',
      target_revenue: null as number | null,
      target_margin: null as number | null,
    };
  }

  loadBusinesses(): void {
    this.loading = true;
    this.businessService.getBusinesses().subscribe({
      next: (res) => {
        this.businesses = res.businesses || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openAddModal(): void {
    this.newBiz = this.emptyBiz();
    this.modalError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.creating = false;
  }

  createBusiness(): void {
    if (!this.newBiz.name.trim() || !this.newBiz.industry) {
      this.modalError = 'Business name and industry are required.';
      return;
    }
    this.creating = true;
    this.modalError = '';

    const payload: Partial<Business> = {
      name: this.newBiz.name.trim(),
      industry: this.newBiz.industry,
      currency: this.newBiz.currency || 'AED',
      size: this.newBiz.size || undefined,
      description: this.newBiz.description.trim() || undefined,
      goals: (this.newBiz.target_revenue || this.newBiz.target_margin) ? {
        target_annual_revenue: this.newBiz.target_revenue || undefined,
        target_margin: this.newBiz.target_margin || undefined
      } : undefined
    };

    this.businessService.createBusiness(payload).subscribe({
      next: (res) => {
        this.creating = false;
        this.showModal = false;
        this.loadBusinesses();
      },
      error: (err) => {
        this.creating = false;
        if (err.status === 0) {
          this.modalError = 'Unable to connect to backend server. Please check your network connection.';
        } else {
          this.modalError = err.error?.error || err.error?.msg || err.message || 'Failed to create business. Please try again.';
        }
      }
    });
  }
}
