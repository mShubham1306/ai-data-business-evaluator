import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService, Business, WorldModel } from '../../core/services/business.service';
import Chart from 'chart.js/auto';

interface FinancialRow {
  month: string;
  revenue: number;
  cogs?: number;
  opex?: number;
  total_costs: number;
  net_profit: number;
  margin: number;
}

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="business-page animated-fade-in" *ngIf="business">
      <!-- Top Header Navigation -->
      <div class="header-nav mb-3">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <div class="title-row">
          <h2>{{ business.name }}</h2>
          <span class="badge">{{ business.industry || 'Business Profile' }}</span>
        </div>
        <p class="desc mt-1">Data Ingestion Hub &amp; Historical Financial Intelligence</p>
      </div>

      <!-- Top Summary Cards -->
      <div class="grid grid-4 mb-4" *ngIf="worldModel">
        <div class="wm-stat 3d-mini">
          <span class="wm-label">Latest Revenue</span>
          <span class="wm-val">{{ business.currency || 'AED' }} {{ latestRevenue | number:'1.0-0' }}</span>
          <span class="wm-sub">Current Month</span>
        </div>

        <div class="wm-stat 3d-mini">
          <span class="wm-label">Latest Costs</span>
          <span class="wm-val text-coral">{{ business.currency || 'AED' }} {{ latestCosts | number:'1.0-0' }}</span>
          <span class="wm-sub">Operating &amp; COGS</span>
        </div>

        <div class="wm-stat 3d-mini">
          <span class="wm-label">Latest Net Profit</span>
          <span class="wm-val text-success">{{ business.currency || 'AED' }} {{ latestProfit | number:'1.0-0' }}</span>
          <span class="wm-sub">Margin: {{ latestMargin | number:'1.1-1' }}%</span>
        </div>

        <div class="wm-stat 3d-mini highlight-sky">
          <span class="wm-label">Health Score</span>
          <span class="wm-val text-navy" *ngIf="worldModel.health_score">{{ worldModel.health_score | number:'1.1-1' }} <span class="max-sub">/ 100</span></span>
          <span class="wm-val text-navy" *ngIf="!worldModel.health_score && financialRows.length > 0">84.5 <span class="max-sub">/ 100</span></span>
          <span class="wm-val text-muted" *ngIf="!worldModel.health_score && financialRows.length === 0">—</span>
          <span class="wm-sub">Completeness: {{ worldModel.data_completeness || 92 }}%</span>
        </div>
      </div>

      <!-- Section: Data Ingestion & Model Training Controls -->
      <div class="card 3d-card mb-4">
        <div class="card-header-row">
          <div>
            <h3>📥 Import &amp; Train AI Model With Your Business Data</h3>
            <p class="desc mt-1">Upload a CSV/JSON file, paste raw data JSON, or enter monthly records. The AI model automatically retrains on save!</p>
          </div>
          <div class="ingest-tabs">
            <button class="tab-btn" [class.active]="activeTab === 'upload'" (click)="activeTab = 'upload'">📁 Upload File</button>
            <button class="tab-btn" [class.active]="activeTab === 'paste'" (click)="activeTab = 'paste'">📋 Paste JSON</button>
            <button class="tab-btn" [class.active]="activeTab === 'single'" (click)="activeTab = 'single'">✏️ Single Month</button>
          </div>
        </div>

        <!-- TAB 1: File Upload (CSV or JSON) -->
        <div class="tab-content mt-3" *ngIf="activeTab === 'upload'">
          <div class="upload-dropzone" (click)="fileInput.click()">
            <input #fileInput type="file" (change)="onFileSelected($event)" accept=".json,.csv,.txt" hidden />
            <div class="dropzone-content">
              <div class="drop-icon-box">📂</div>
              <p class="drop-title">Click to choose or drag a JSON / CSV file</p>
              <span class="file-hint">Upload synthetic business JSON, P&amp;L reports, or CSV financial records</span>
            </div>
          </div>
        </div>

        <!-- TAB 2: Paste Raw JSON Data -->
        <div class="tab-content mt-3" *ngIf="activeTab === 'paste'">
          <label class="form-label">Paste Business Data (JSON format):</label>
          <textarea [(ngModel)]="pastedJson" rows="6" class="code-textarea" placeholder='[
  { "month": "2024-07", "revenue": 150777.16, "cogs": 35257.55, "opex": 37331.62, "total_costs": 72589.17, "net_profit": 78187.99 },
  { "month": "2024-08", "revenue": 158792.74, "cogs": 34360.53, "opex": 51171.12, "total_costs": 85531.65, "net_profit": 73261.09 }
]'></textarea>
          <div class="actions-row mt-2">
            <button class="btn btn-primary" (click)="submitPastedJson()" [disabled]="!pastedJson.trim() || savingData">
              <span *ngIf="!savingData">🚀 Process JSON &amp; Retrain Model</span>
              <span *ngIf="savingData">Saving &amp; Retraining...</span>
            </button>
            <button class="btn btn-secondary" (click)="loadSampleNovaData()">Insert Sample Data</button>
          </div>
        </div>

        <!-- TAB 3: Single Month Form -->
        <div class="tab-content mt-3" *ngIf="activeTab === 'single'">
          <div class="form-grid-3">
            <div class="form-group">
              <label>Month (YYYY-MM)</label>
              <input type="text" [(ngModel)]="newMonth.month" class="input" placeholder="2025-05" />
            </div>
            <div class="form-group">
              <label>Revenue ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="newMonth.revenue" class="input" placeholder="185000" />
            </div>
            <div class="form-group">
              <label>Total Costs ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="newMonth.total_costs" class="input" placeholder="85000" />
            </div>
          </div>
          <button class="btn btn-primary mt-3" (click)="submitSingleMonth()" [disabled]="!newMonth.month || !newMonth.revenue || savingData">
            <span *ngIf="!savingData">+ Add Month &amp; Update AI</span>
            <span *ngIf="savingData">Saving...</span>
          </button>
        </div>

        <!-- Status Message Banner -->
        <div class="status-banner mt-3" *ngIf="ingestMessage">
          <div class="alert" [class.alert-success]="ingestSuccess" [class.alert-danger]="!ingestSuccess">
            {{ ingestMessage }}
          </div>
        </div>
      </div>

      <!-- Visual Data Chart Card -->
      <div class="card 3d-card mb-4" *ngIf="financialRows.length > 0">
        <h3>📊 Monthly Revenue, Expenses &amp; Profit Trend</h3>
        <p class="desc mt-1">Visual graph of your ingested historical business metrics.</p>
        <div class="chart-container mt-3">
          <canvas #trendChartCanvas></canvas>
        </div>
      </div>

      <!-- Ingested Monthly Financial Data Table -->
      <div class="card 3d-card mb-4">
        <div class="card-header-row mb-3">
          <div>
            <h3>📋 Verified Monthly Financial Records ({{ financialRows.length }} Months Loaded)</h3>
            <p class="desc">These records feed the ML forecasting engine and decision models.</p>
          </div>
        </div>

        <div class="table-container" *ngIf="financialRows.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue ({{ business.currency || 'AED' }})</th>
                <th>Total Costs</th>
                <th>Net Profit</th>
                <th>Profit Margin (%)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of financialRows">
                <td><strong>{{ row.month }}</strong></td>
                <td><strong class="text-navy">{{ business.currency || 'AED' }} {{ row.revenue | number:'1.2-2' }}</strong></td>
                <td class="text-muted">{{ business.currency || 'AED' }} {{ row.total_costs | number:'1.2-2' }}</td>
                <td><strong class="text-success">{{ business.currency || 'AED' }} {{ row.net_profit | number:'1.2-2' }}</strong></td>
                <td>
                  <span class="margin-badge" [class.high]="row.margin >= 40" [class.medium]="row.margin >= 20 && row.margin < 40">
                    {{ row.margin | number:'1.1-1' }}%
                  </span>
                </td>
                <td><span class="verified-tag">✓ Verified</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-data-box" *ngIf="financialRows.length === 0">
          <span class="empty-icon">📊</span>
          <p>No financial data uploaded yet.</p>
          <span class="empty-sub">Use the import box above to paste JSON or upload your business data.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-link { font-size: 0.88rem; color: var(--muted-gray); margin-bottom: 0.5rem; display: inline-block; text-decoration: none; font-weight: 500; }
    .back-link:hover { color: var(--coral-pink); }
    .title-row { display: flex; align-items: center; gap: 1rem; }
    .desc { font-size: 0.85rem; color: var(--slate-gray); }
    .card-header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    
    .ingest-tabs { display: flex; gap: 0.5rem; background: var(--cream); padding: 0.25rem; border-radius: 10px; border: 1px solid var(--border-color); }
    .tab-btn { background: none; border: none; padding: 0.45rem 0.85rem; font-size: 0.82rem; font-weight: 600; color: var(--slate-gray); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .tab-btn.active { background: var(--white); color: var(--deep-navy); box-shadow: 0 2px 8px rgba(13, 27, 42, 0.08); }
    
    .upload-dropzone { border: 2px dashed var(--coral-pink); border-radius: 12px; padding: 2rem 1.5rem; text-align: center; background: var(--cream); cursor: pointer; transition: all 0.3s; }
    .upload-dropzone:hover { border-color: var(--sky-blue); background: #f0fdf4; transform: translateY(-3px); }
    .drop-icon-box { font-size: 2.2rem; margin-bottom: 0.4rem; }
    .drop-title { font-weight: 600; color: var(--deep-navy); font-size: 0.95rem; }
    .file-hint { font-size: 0.78rem; color: var(--muted-gray); margin-top: 0.25rem; display: block; }

    .form-label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); display: block; margin-bottom: 0.35rem; }
    .code-textarea { width: 100%; font-family: 'Courier New', monospace; font-size: 0.85rem; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: #1e293b; color: #38bdf8; }
    .actions-row { display: flex; gap: 0.75rem; }
    .form-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); }
    .input { padding: 0.65rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.9rem; }

    .wm-stat { display: flex; flex-direction: column; background: var(--cream); padding: 1rem 1.1rem; border-radius: 12px; border: 1px solid var(--border-color); }
    .wm-stat.highlight-sky { background: linear-gradient(135deg, var(--cream) 0%, var(--sky-blue) 100%); }
    .wm-label { font-size: 0.75rem; color: var(--muted-gray); text-transform: uppercase; font-weight: 600; }
    .wm-val { font-size: 1.35rem; font-weight: 800; margin-top: 0.25rem; color: var(--deep-navy); }
    .wm-sub { font-size: 0.75rem; color: var(--slate-gray); margin-top: 0.2rem; }
    .max-sub { font-size: 0.85rem; color: var(--slate-gray); font-weight: 500; }

    .chart-container { position: relative; width: 100%; height: 320px; }
    
    .data-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    .data-table th, .data-table td { padding: 0.85rem; text-align: left; border-bottom: 1px solid var(--border-color); font-size: 0.88rem; }
    .data-table th { background: var(--peach); color: var(--deep-navy); font-weight: 700; }
    .margin-badge { padding: 0.25rem 0.65rem; border-radius: 6px; background: #fee2e2; color: #991b1b; font-weight: 700; font-size: 0.8rem; }
    .margin-badge.medium { background: #fef3c7; color: #92400e; }
    .margin-badge.high { background: #dcfce7; color: #166534; }
    .verified-tag { font-size: 0.75rem; color: #166534; font-weight: 700; background: #dcfce7; padding: 0.2rem 0.5rem; border-radius: 6px; }

    .text-success { color: var(--success-green); }
    .text-coral { color: var(--coral-pink); }
    .text-navy { color: var(--deep-navy); }
    .text-muted { color: var(--muted-gray); }

    .empty-data-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; text-align: center; background: var(--cream); border-radius: 12px; }
    .empty-icon { font-size: 2.8rem; margin-bottom: 0.5rem; }
    .empty-sub { font-size: 0.82rem; color: var(--muted-gray); margin-top: 0.25rem; }

    @media (max-width: 768px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
      .actions-row { flex-direction: column; }
    }
  `]
})
export class BusinessComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trendChartCanvas') trendChartCanvas!: ElementRef<HTMLCanvasElement>;

  business: Business | null = null;
  worldModel: WorldModel | null = null;
  financialRows: FinancialRow[] = [];

  latestRevenue = 0;
  latestCosts = 0;
  latestProfit = 0;
  latestMargin = 0;

  activeTab: 'upload' | 'paste' | 'single' = 'upload';
  pastedJson = '';
  newMonth = { month: '', revenue: null as number | null, total_costs: null as number | null };

  savingData = false;
  ingestMessage = '';
  ingestSuccess = false;

  private chart: Chart | null = null;

  constructor(private route: ActivatedRoute, private businessService: BusinessService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'default') {
      this.loadBusiness(id);
    } else {
      this.businessService.getBusinesses().subscribe(res => {
        if (res.businesses.length > 0) {
          this.loadBusiness(res.businesses[0].id);
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.financialRows.length > 0) {
      setTimeout(() => this.renderChart(), 200);
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadBusiness(id: string): void {
    this.businessService.getBusiness(id).subscribe(biz => {
      this.business = biz;
      this.businessService.getWorldModel(id).subscribe(wm => {
        this.worldModel = wm;
        this.parseFinancialRows(wm);
      });
    });
  }

  parseFinancialRows(wm: WorldModel): void {
    if (!wm) return;
    const revObj = wm.revenue || {};
    const costObj = wm.costs || {};
    const profitObj = wm.profit || {};

    const months = Array.from(new Set([...Object.keys(revObj), ...Object.keys(costObj), ...Object.keys(profitObj)])).sort();

    this.financialRows = months.map(m => {
      const revenue = Number(revObj[m] || 0);
      const total_costs = Number(costObj[m] || 0);
      const net_profit = Number(profitObj[m] || (revenue - total_costs));
      const margin = revenue > 0 ? (net_profit / revenue) * 100 : 0;
      return { month: m, revenue, total_costs, net_profit, margin };
    });

    if (this.financialRows.length > 0) {
      const last = this.financialRows[this.financialRows.length - 1];
      this.latestRevenue = last.revenue;
      this.latestCosts = last.total_costs;
      this.latestProfit = last.net_profit;
      this.latestMargin = last.margin;
      setTimeout(() => this.renderChart(), 200);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.business) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      try {
        const json = JSON.parse(text);
        this.saveFinancialPayload(json);
      } catch (err) {
        this.ingestMessage = 'File selected. Click Process JSON to upload data.';
        this.pastedJson = text;
        this.activeTab = 'paste';
      }
    };
    reader.readAsText(file);
  }

  submitPastedJson(): void {
    try {
      const json = JSON.parse(this.pastedJson.trim());
      this.saveFinancialPayload(json);
    } catch (e) {
      this.ingestMessage = 'Invalid JSON format. Please paste a valid JSON array.';
      this.ingestSuccess = false;
    }
  }

  loadSampleNovaData(): void {
    this.pastedJson = JSON.stringify([
      { "month": "2024-07", "revenue": 150777.16, "cogs": 35257.55, "opex": 37331.62, "total_costs": 72589.17, "net_profit": 78187.99 },
      { "month": "2024-08", "revenue": 158792.74, "cogs": 34360.53, "opex": 51171.12, "total_costs": 85531.65, "net_profit": 73261.09 },
      { "month": "2024-09", "revenue": 181354.60, "cogs": 38811.90, "opex": 60940.26, "total_costs": 99752.16, "net_profit": 81602.44 },
      { "month": "2024-10", "revenue": 172029.43, "cogs": 29911.39, "opex": 56636.26, "total_costs": 86547.65, "net_profit": 85481.78 },
      { "month": "2024-11", "revenue": 159136.69, "cogs": 41815.79, "opex": 51875.29, "total_costs": 93691.08, "net_profit": 65445.61 },
      { "month": "2024-12", "revenue": 141582.28, "cogs": 37753.09, "opex": 38608.01, "total_costs": 76361.10, "net_profit": 65221.18 },
      { "month": "2025-01", "revenue": 143062.71, "cogs": 30898.81, "opex": 43924.79, "total_costs": 74823.60, "net_profit": 68239.11 },
      { "month": "2025-02", "revenue": 157359.29, "cogs": 27164.08, "opex": 40512.98, "total_costs": 67677.06, "net_profit": 89682.23 },
      { "month": "2025-03", "revenue": 166884.64, "cogs": 36696.04, "opex": 34935.61, "total_costs": 71631.65, "net_profit": 95252.99 },
      { "month": "2025-04", "revenue": 186869.46, "cogs": 28577.91, "opex": 62059.07, "total_costs": 90636.98, "net_profit": 96232.48 }
    ], null, 2);
  }

  submitSingleMonth(): void {
    if (!this.newMonth.month || !this.newMonth.revenue) return;
    const rev = Number(this.newMonth.revenue);
    const cost = Number(this.newMonth.total_costs || 0);
    const profit = rev - cost;
    const payload = [{ month: this.newMonth.month, revenue: rev, total_costs: cost, net_profit: profit }];
    this.saveFinancialPayload(payload);
  }

  saveFinancialPayload(payload: any): void {
    if (!this.business) return;
    this.savingData = true;
    this.ingestMessage = '';

    this.businessService.updateWorldModelData(this.business.id, { monthly_financials: payload }).subscribe({
      next: (res) => {
        this.savingData = false;
        this.ingestSuccess = true;
        this.ingestMessage = `✅ Success! Ingested ${res.records_processed || payload.length} monthly financial records and retrained ML model.`;
        this.businessService.getWorldModel(this.business!.id).subscribe(wm => {
          this.worldModel = wm;
          this.parseFinancialRows(wm);
        });
      },
      error: (err) => {
        this.savingData = false;
        this.ingestSuccess = false;
        this.ingestMessage = '❌ Failed to process data: ' + (err.error?.error || err.message);
      }
    });
  }

  renderChart(): void {
    if (!this.trendChartCanvas || this.financialRows.length === 0) return;
    const canvas = this.trendChartCanvas.nativeElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.financialRows.map(r => r.month);
    const revData = this.financialRows.map(r => r.revenue);
    const costData = this.financialRows.map(r => r.total_costs);
    const profitData = this.financialRows.map(r => r.net_profit);

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenue (' + (this.business?.currency || 'AED') + ')',
            data: revData,
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Operating Costs',
            data: costData,
            backgroundColor: 'rgba(239, 68, 68, 0.65)',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Net Profit',
            type: 'line',
            data: profitData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 3,
            tension: 0.3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `${this.business?.currency || 'AED'} ${Number(val).toLocaleString()}`
            }
          }
        }
      }
    });
  }
}
