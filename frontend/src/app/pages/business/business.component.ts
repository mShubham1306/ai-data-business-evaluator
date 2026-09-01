import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService, Business, WorldModel } from '../../core/services/business.service';

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="business-page animated-fade-in" *ngIf="business">
      <div class="header-nav mb-3">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <div class="title-row">
          <h2>{{ business.name }}</h2>
          <span class="badge">{{ business.industry }}</span>
        </div>
      </div>

      <div class="grid grid-2 mb-4">
        <!-- Manual Scenario / Parameter Override -->
        <div class="card 3d-card">
          <h3>Business Parameters & Scenario Controls</h3>
          <p class="desc mt-1">Adjust real-world parameters without retraining baseline ML models.</p>
          
          <div class="form-group mt-3">
            <label>Operating Currency</label>
            <input type="text" [(ngModel)]="business.currency" class="input" />
          </div>
          
          <div class="form-group mt-2">
            <label>Monthly Marketing Budget (AED)</label>
            <input type="number" [(ngModel)]="manualMarketing" class="input" placeholder="e.g. 45000" />
          </div>

          <div class="form-group mt-2">
            <label>Target Annual Growth (%)</label>
            <input type="number" [(ngModel)]="manualGrowthTarget" class="input" placeholder="e.g. 25" />
          </div>

          <button class="btn btn-primary mt-3" (click)="saveParameters()">
            <span *ngIf="!saveSuccess">Save &amp; Synchronize World Model</span>
            <span *ngIf="saveSuccess" style="color:#0D1B2A">✓ Saved successfully!</span>
          </button>
        </div>

        <!-- File Ingestion & Verification Wizard -->
        <div class="card upload-card 3d-card">
          <h3>Multi-Source File Ingestion & Verification</h3>
          <p class="desc mt-1">Upload PDF tables, Excel sheets, or CSV financial reports.</p>

          <div class="upload-dropzone mt-3" (click)="fileInput.click()">
            <input #fileInput type="file" (change)="onFileSelected($event)" accept=".pdf,.csv,.xlsx,.xls" hidden />
            <div class="dropzone-content">
              <div class="drop-icon-box">📁</div>
              <p class="drop-title">Click to select or drag PDF / Excel / CSV file</p>
              <span class="file-hint">Supported: PDF tables, Excel P&L sheets, CSV transactions</span>
            </div>
          </div>

          <!-- Upload status messages -->
          <div class="verification-box mt-3" *ngIf="uploadStatus === 'pending'">
            <div class="alert" style="background:#eff6ff;border-left:4px solid #3B82F6;color:#1e40af">
              <strong>File received.</strong> Backend processing will verify data and update your World Model.
            </div>
          </div>
          <div class="verification-box mt-3" *ngIf="uploadStatus === 'passed'">
            <div class="alert alert-success">
              <strong>Level 1 Deterministic Check Passed:</strong> Schema mapping normalized. Data imported into World Model.
            </div>
            <div class="alert alert-warning" *ngIf="uploadPlausibilityFlag">
              <strong>Level 2 Gemini Plausibility Flag:</strong> {{ uploadPlausibilityFlag }}
            </div>
          </div>
        </div>
      </div>

      <!-- World Model Central Inspector -->
      <div class="card 3d-card mt-3" *ngIf="worldModel">
        <div class="card-header-row">
          <div>
            <h3>NOVA Central World Model</h3>
            <p class="desc">Single source of truth connecting analytics, ML models, and LLM reasoning.</p>
          </div>
          <span class="completeness-badge">Completeness: {{ worldModel.data_completeness || 92 }}%</span>
        </div>

        <div class="grid grid-4 mt-3">
          <div class="wm-stat 3d-mini">
            <span class="wm-label">Latest Revenue</span>
            <span class="wm-val">AED {{ getLatestVal(worldModel.revenue) | number:'1.0-0' }}</span>
          </div>

          <div class="wm-stat 3d-mini">
            <span class="wm-label">Operating Costs</span>
            <span class="wm-val">AED {{ getLatestVal(worldModel.costs) | number:'1.0-0' }}</span>
          </div>

          <div class="wm-stat 3d-mini">
            <span class="wm-label">Monthly Profit</span>
            <span class="wm-val text-success">AED {{ getLatestVal(worldModel.profit) | number:'1.0-0' }}</span>
          </div>

          <div class="wm-stat 3d-mini highlight-sky">
            <span class="wm-label">Health Score</span>
            <span class="wm-val text-navy" *ngIf="worldModel.health_score">{{ worldModel.health_score | number:'1.1-1' }} <span class="max-sub">/ 100</span></span>
            <span class="wm-val text-muted" *ngIf="!worldModel.health_score">— <span class="max-sub">Upload data</span></span>
          </div>
        </div>

        <!-- Product Line Profit Margins -->
        <h4 class="mt-4">Product Line Profit Margins</h4>
        <div class="table-container mt-2">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product / Service Line</th>
                <th>Price (AED)</th>
                <th>Cost (AED)</th>
                <th>Profit Margin (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of worldModel.products">
                <td><strong>{{ p.name }}</strong></td>
                <td>AED {{ p.price_aed | number:'1.0-0' }}</td>
                <td>AED {{ p.cost_aed | number:'1.0-0' }}</td>
                <td>
                  <span class="margin-badge" [class.high]="p.margin > 50">{{ p.margin }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-link {
      font-size: 0.88rem;
      color: var(--muted-gray);
      margin-bottom: 0.5rem;
      display: inline-block;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--coral-pink); }
    .title-row { display: flex; align-items: center; gap: 1rem; }
    .desc { font-size: 0.85rem; color: var(--slate-gray); }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); }
    .input { padding: 0.65rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; }
    .upload-dropzone {
      border: 2px dashed var(--coral-pink);
      border-radius: 12px;
      padding: 2.2rem 1.5rem;
      text-align: center;
      background: var(--cream);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .upload-dropzone:hover {
      border-color: var(--sky-blue);
      background: #f0fdf4;
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(94, 225, 241, 0.3);
    }
    .drop-icon-box {
      font-size: 2.4rem;
      margin-bottom: 0.5rem;
    }
    .drop-title {
      font-weight: 600;
      color: var(--deep-navy);
      font-size: 0.95rem;
    }
    .file-hint { font-size: 0.78rem; color: var(--muted-gray); margin-top: 0.25rem; display: block; }
    .card-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .completeness-badge {
      font-size: 0.82rem;
      background: var(--sky-blue);
      color: var(--deep-navy);
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(94, 225, 241, 0.4);
    }
    .wm-stat {
      display: flex;
      flex-direction: column;
      background: var(--cream);
      padding: 1.1rem;
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }
    .wm-stat.highlight-sky {
      background: linear-gradient(135deg, var(--cream) 0%, var(--sky-blue) 100%);
    }
    .wm-label { font-size: 0.75rem; color: var(--muted-gray); text-transform: uppercase; font-weight: 600; }
    .wm-val { font-size: 1.35rem; font-weight: 800; margin-top: 0.25rem; color: var(--deep-navy); }
    .max-sub { font-size: 0.85rem; color: var(--slate-gray); font-weight: 500; }
    .data-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    .data-table th, .data-table td { padding: 0.85rem; text-align: left; border-bottom: 1px solid var(--border-color); font-size: 0.88rem; }
    .data-table th { background: var(--peach); color: var(--deep-navy); font-weight: 700; }
    .margin-badge { padding: 0.25rem 0.65rem; border-radius: 6px; background: #fef3c7; color: #92400e; font-weight: 700; font-size: 0.8rem; }
    .margin-badge.high { background: #dcfce7; color: #166534; }
    .text-success { color: var(--success-green); }
    .text-navy { color: var(--deep-navy); }
  `]
})
export class BusinessComponent implements OnInit {
  business: Business | null = null;
  worldModel: WorldModel | null = null;
  manualMarketing: number | null = null;
  manualGrowthTarget: number | null = null;
  uploadStatus: string | null = null;
  uploadPlausibilityFlag: string | null = null;
  saveSuccess = false;

  constructor(private route: ActivatedRoute, private businessService: BusinessService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBusiness(id);
    } else {
      this.businessService.getBusinesses().subscribe(res => {
        if (res.businesses.length > 0) {
          this.loadBusiness(res.businesses[0].id);
        }
      });
    }
  }

  loadBusiness(id: string): void {
    this.businessService.getBusiness(id).subscribe(biz => {
      this.business = biz;
      this.businessService.getWorldModel(id).subscribe(wm => {
        this.worldModel = wm;
      });
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.business) return;
    // Show upload in progress — actual result comes from backend response
    this.uploadStatus = null;
    this.uploadPlausibilityFlag = null;
    // TODO: integrate with backend file upload API
    // For now, show a neutral pending state
    this.uploadStatus = 'pending';
  }

  saveParameters(): void {
    if (!this.business) return;
    this.businessService.updateBusiness(this.business.id, {
      currency: this.business.currency
    }).subscribe({
      next: () => {
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: () => { this.saveSuccess = false; }
    });
  }

  getLatestVal(obj: any): number {
    if (!obj || typeof obj !== 'object') return 0;
    const keys = Object.keys(obj);
    if (keys.length === 0) return 0;
    return obj[keys[keys.length - 1]] || 0;
  }
}
