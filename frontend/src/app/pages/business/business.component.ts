import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService, Business, WorldModel } from '../../core/services/business.service';
import { CurrencyService } from '../../core/services/currency.service';
import Chart from 'chart.js/auto';

interface FinancialRow {
  month: string;
  revenue: number;
  cogs?: number;
  opex?: number;
  total_costs: number;
  net_profit: number;
  margin: number;
  revDiff: number;
  revDiffPct: number;
  profitDiff: number;
  profitDiffPct: number;
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
        <div class="biz-header-row">
          <div class="title-row">
            <h2>{{ business.name }}</h2>
            <span class="badge">{{ business.industry || 'Business Profile' }}</span>
            <span class="currency-badge">Currency: {{ business.currency || 'USD' }}</span>
          </div>
          <!-- Business Selector Dropdown -->
          <div class="business-selector-box" *ngIf="businesses.length > 0">
            <span class="bs-label">🏢 Switch Business:</span>
            <select [ngModel]="businessId" (ngModelChange)="onBusinessChange($event)" class="bs-select">
              <option *ngFor="let b of businesses" [value]="b.id">
                {{ b.name }} ({{ b.industry || 'General' }})
              </option>
            </select>
          </div>
        </div>
        <p class="desc mt-1">Data Ingestion Hub, Multi-Chart Visualizations &amp; Performance Engine</p>
      </div>

      <!-- Real Summary Cards (only shows when user data exists) -->
      <div class="grid grid-4 mb-4" *ngIf="financialRows.length > 0">
        <div class="wm-stat 3d-mini">
          <span class="wm-label">Latest Revenue</span>
          <span class="wm-val">{{ business.currency || 'USD' }} {{ latestRevenue | number:'1.0-0' }}</span>
          <span class="wm-sub">Current Month</span>
        </div>

        <div class="wm-stat 3d-mini">
          <span class="wm-label">Latest Operating Costs</span>
          <span class="wm-val text-coral">{{ business.currency || 'USD' }} {{ latestCosts | number:'1.0-0' }}</span>
          <span class="wm-sub">Total Expenses</span>
        </div>

        <div class="wm-stat 3d-mini">
          <span class="wm-label">Latest Net Profit</span>
          <span class="wm-val text-success">{{ business.currency || 'USD' }} {{ latestProfit | number:'1.0-0' }}</span>
          <span class="wm-sub">Margin: {{ latestMargin | number:'1.1-1' }}%</span>
        </div>

        <div class="wm-stat 3d-mini highlight-sky">
          <span class="wm-label">Health Score</span>
          <span class="wm-val text-navy" *ngIf="worldModel?.health_score">{{ worldModel?.health_score | number:'1.1-1' }} <span class="max-sub">/ 100</span></span>
          <span class="wm-val text-muted" *ngIf="!worldModel?.health_score">—</span>
          <span class="wm-sub">Data Completeness: {{ worldModel?.data_completeness || 0 }}%</span>
        </div>
      </div>

      <!-- Dedicated View Tabs -->
      <div class="page-view-tabs mb-4">
        <button class="view-tab-btn" [class.active]="viewSection === 'charts'" (click)="setViewSection('charts')">
          📊 Visual Charts (Bar &amp; Doughnut)
        </button>
        <button class="view-tab-btn" [class.active]="viewSection === 'ingest'" (click)="setViewSection('ingest')">
          📥 Import Data &amp; Retrain AI Model
        </button>
        <button class="view-tab-btn" [class.active]="viewSection === 'products'" (click)="setViewSection('products')">
          🏷️ Product Profit Margins
        </button>
      </div>

      <!-- SECTION 1: Visual Charts Hub (Default Page View) -->
      <div *ngIf="viewSection === 'charts'">
        <div class="grid grid-2 mb-4" *ngIf="financialRows.length > 0">
          <!-- Chart 1: Revenue vs Costs Bar & Line Combo -->
          <div class="card 3d-card">
            <h3>📊 Monthly Revenue, Expenses &amp; Net Profit</h3>
            <p class="desc mt-1">Comparing total monthly revenue against operating costs and profit.</p>
            <div class="chart-container mt-3">
              <canvas #comboChartCanvas></canvas>
            </div>
          </div>

          <!-- Chart 2: Cost & Profit Allocation Pie/Doughnut Chart -->
          <div class="card 3d-card">
            <h3>🥧 Expenses vs Profit Share Breakdown</h3>
            <p class="desc mt-1">Breakdown of Operating Costs vs Net Profit share of overall revenue.</p>
            <div class="chart-container mt-3">
              <canvas #pieChartCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Model Status Card & Collapsible Raw Training Data -->
        <div class="card 3d-card mb-4" *ngIf="financialRows.length > 0">
          <div class="card-header-row">
            <div>
              <h3>🤖 AI Model Training Status</h3>
              <p class="desc">Model is trained on {{ financialRows.length }} monthly financial records and actively predicting forecasts.</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="toggleShowRawTable()">
              {{ showRawTable ? '🙈 Hide Raw Training Data Table' : '👁️ View Raw Training Data Table' }}
            </button>
          </div>

          <!-- Collapsible Raw Data Table -->
          <div class="table-container mt-3" *ngIf="showRawTable">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Revenue ({{ business.currency || 'USD' }})</th>
                  <th>Total Costs</th>
                  <th>Net Profit</th>
                  <th>MoM Diff / Growth</th>
                  <th>Margin (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of financialRows">
                  <td><strong>{{ row.month }}</strong></td>
                  <td><strong class="text-navy">{{ business.currency || 'USD' }} {{ row.revenue | number:'1.2-2' }}</strong></td>
                  <td class="text-muted">{{ business.currency || 'USD' }} {{ row.total_costs | number:'1.2-2' }}</td>
                  <td><strong class="text-success">{{ business.currency || 'USD' }} {{ row.net_profit | number:'1.2-2' }}</strong></td>
                  <td>
                    <span class="diff-chip" [class.diff-up]="row.revDiff >= 0" [class.diff-down]="row.revDiff < 0" *ngIf="row.revDiff !== 0">
                      {{ row.revDiff >= 0 ? '+' : '' }}{{ business.currency || 'USD' }} {{ row.revDiff | number:'1.0-0' }}
                      ({{ row.revDiffPct >= 0 ? '+' : '' }}{{ row.revDiffPct | number:'1.1-1' }}%)
                    </span>
                    <span class="diff-chip diff-neutral" *ngIf="row.revDiff === 0">Baseline</span>
                  </td>
                  <td>
                    <span class="margin-badge" [class.high]="row.margin >= 40" [class.medium]="row.margin >= 20 && row.margin < 40">
                      {{ row.margin | number:'1.1-1' }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="empty-data-box" *ngIf="financialRows.length === 0">
          <span class="empty-icon">📈</span>
          <h4>No Financial Data Loaded for {{ business.name }} Yet</h4>
          <p>Click below to load 18 months of sample tech financial data in 1-click, or upload your own CSV/JSON file.</p>
          <div class="empty-btns-row mt-3">
            <button class="btn btn-primary 3d-btn" (click)="loadInstantSampleData()">⚡ 1-Click Load Sample Tech Data</button>
            <button class="btn btn-secondary" (click)="setViewSection('ingest')">📁 Upload Custom CSV / JSON File</button>
          </div>
        </div>
      </div>

      <!-- SECTION 2: Import Data & Retrain AI Model -->
      <div *ngIf="viewSection === 'ingest'">
        <div class="card 3d-card mb-4">
          <div class="card-header-row">
            <div>
              <h3>📥 Import Financial Data &amp; Retrain AI Model</h3>
              <p class="desc mt-1">Upload a CSV/JSON file, paste raw JSON data, or enter single month records. Data is used strictly for background model training!</p>
            </div>
            <div class="ingest-tabs">
              <button class="tab-btn" [class.active]="activeTab === 'upload'" (click)="activeTab = 'upload'">📁 Upload File</button>
              <button class="tab-btn" [class.active]="activeTab === 'paste'" (click)="activeTab = 'paste'">📋 Paste JSON</button>
              <button class="tab-btn" [class.active]="activeTab === 'single'" (click)="activeTab = 'single'">✏️ Single Month</button>
            </div>
          </div>

          <!-- TAB 1: File Upload -->
          <div class="tab-content mt-3" *ngIf="activeTab === 'upload'">
            <div class="upload-dropzone" (click)="fileInput.click()">
              <input #fileInput type="file" (change)="onFileSelected($event)" accept=".json,.csv,.txt" hidden />
              <div class="dropzone-content">
                <div class="drop-icon-box">📂</div>
                <p class="drop-title">Click to choose or drag a JSON / CSV file</p>
                <span class="file-hint">Upload synthetic business JSON, P&amp;L reports, or CSV financial records to train model</span>
              </div>
            </div>
          </div>

          <!-- TAB 2: Paste Raw JSON Data -->
          <div class="tab-content mt-3" *ngIf="activeTab === 'paste'">
            <label class="form-label">Paste Business Training Data (JSON format):</label>
            <textarea [(ngModel)]="pastedJson" rows="6" class="code-textarea" placeholder='[
  { "month": "2024-07", "revenue": 150777.16, "cogs": 35257.55, "opex": 37331.62, "total_costs": 72589.17, "net_profit": 78187.99 },
  { "month": "2024-08", "revenue": 158792.74, "cogs": 34360.53, "opex": 51171.12, "total_costs": 85531.65, "net_profit": 73261.09 }
]'></textarea>
            <div class="actions-row mt-2">
              <button class="btn btn-primary" (click)="submitPastedJson()" [disabled]="!pastedJson.trim() || savingData">
                <span *ngIf="!savingData">🚀 Process JSON &amp; Train AI Model</span>
                <span *ngIf="savingData">Training Model...</span>
              </button>
              <button class="btn btn-secondary" (click)="loadSampleNovaData()">Load Sample Training Data</button>
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
                <label>Revenue ({{ business.currency || 'USD' }})</label>
                <input type="number" [(ngModel)]="newMonth.revenue" class="input" placeholder="185000" />
              </div>
              <div class="form-group">
                <label>Total Costs ({{ business.currency || 'USD' }})</label>
                <input type="number" [(ngModel)]="newMonth.total_costs" class="input" placeholder="85000" />
              </div>
            </div>
            <button class="btn btn-primary mt-3" (click)="submitSingleMonth()" [disabled]="!newMonth.month || !newMonth.revenue || savingData">
              <span *ngIf="!savingData">+ Add Month &amp; Update AI</span>
              <span *ngIf="savingData">Saving...</span>
            </button>
          </div>

          <!-- Status Banner -->
          <div class="status-banner mt-3" *ngIf="ingestMessage">
            <div class="alert" [class.alert-success]="ingestSuccess" [class.alert-danger]="!ingestSuccess">
              {{ ingestMessage }}
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 3: Product Profit Margins -->
      <div *ngIf="viewSection === 'products'">
        <div class="card 3d-card mb-4">
          <h3>🏷️ Product Line &amp; Service Profit Margins</h3>
          <p class="desc mt-1">Breakdown of product pricing, unit cost, and margin percentages.</p>

          <div class="table-container mt-3" *ngIf="worldModel?.products && worldModel!.products!.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product / Service Line</th>
                  <th>Price ({{ business.currency || 'USD' }})</th>
                  <th>Unit Cost</th>
                  <th>Profit Margin (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of worldModel?.products">
                  <td><strong>{{ p.name }}</strong></td>
                  <td>{{ business.currency || 'USD' }} {{ p.price_aed | number:'1.0-0' }}</td>
                  <td>{{ business.currency || 'USD' }} {{ p.cost_aed | number:'1.0-0' }}</td>
                  <td>
                    <span class="margin-badge" [class.high]="p.margin >= 40">{{ p.margin }}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="empty-data-box" *ngIf="!worldModel?.products || worldModel!.products!.length === 0">
            <span class="empty-icon">🏷️</span>
            <h4>No Product Line Data</h4>
            <p>Product line details can be ingested via JSON or file upload.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-link { font-size: 0.88rem; color: var(--muted-gray); margin-bottom: 0.5rem; display: inline-block; text-decoration: none; font-weight: 500; }
    .back-link:hover { color: var(--coral-pink); }
    .title-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .currency-badge { font-size: 0.78rem; font-weight: 700; background: var(--peach); color: var(--deep-navy); padding: 0.2rem 0.65rem; border-radius: 6px; }
    .desc { font-size: 0.85rem; color: var(--slate-gray); }

    .page-view-tabs { display: flex; gap: 0.75rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; flex-wrap: wrap; }
    .view-tab-btn { background: none; border: none; font-size: 0.92rem; font-weight: 700; color: var(--muted-gray); padding: 0.6rem 1.25rem; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .view-tab-btn.active { background: var(--deep-navy); color: var(--white); box-shadow: 0 4px 12px rgba(13, 27, 42, 0.15); }

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
    .biz-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .business-selector-box { display: flex; align-items: center; gap: 0.4rem; background: var(--white); border: 1px solid var(--border-color); padding: 0.4rem 0.85rem; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .bs-label { font-size: 0.8rem; font-weight: 700; color: var(--deep-navy); white-space: nowrap; }
    .bs-select { border: none; background: transparent; font-size: 0.85rem; font-weight: 700; color: var(--deep-navy); cursor: pointer; outline: none; font-family: inherit; }
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

    .diff-chip { font-size: 0.78rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; display: inline-block; }
    .diff-chip.diff-up { background: #dcfce7; color: #166534; }
    .diff-chip.diff-down { background: #fee2e2; color: #991b1b; }
    .diff-chip.diff-neutral { background: var(--cream); color: var(--slate-gray); }

    .margin-badge { padding: 0.25rem 0.65rem; border-radius: 6px; background: #fee2e2; color: #991b1b; font-weight: 700; font-size: 0.8rem; }
    .margin-badge.medium { background: #fef3c7; color: #92400e; }
    .margin-badge.high { background: #dcfce7; color: #166534; }

    .text-success { color: var(--success-green); }
    .text-coral { color: var(--coral-pink); }
    .text-navy { color: var(--deep-navy); }
    .text-muted { color: var(--muted-gray); }

    .empty-data-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; text-align: center; background: var(--cream); border-radius: 12px; }
    .empty-btns-row { display: flex; gap: 0.85rem; flex-wrap: wrap; justify-content: center; }
    .empty-icon { font-size: 2.8rem; margin-bottom: 0.5rem; }

    @media (max-width: 768px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
      .actions-row { flex-direction: column; }
    }
  `]
})
export class BusinessComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('comboChartCanvas') comboChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  business: Business | null = null;
  businesses: Business[] = [];
  businessId = '';
  worldModel: WorldModel | null = null;
  financialRows: FinancialRow[] = [];

  latestRevenue = 0;
  latestCosts = 0;
  latestProfit = 0;
  latestMargin = 0;

  viewSection: 'charts' | 'ingest' | 'products' = 'charts';
  showRawTable = false;
  activeTab: 'upload' | 'paste' | 'single' = 'upload';
  pastedJson = '';
  newMonth = { month: '', revenue: null as number | null, total_costs: null as number | null };

  savingData = false;
  ingestMessage = '';
  ingestSuccess = false;

  private comboChart: Chart | null = null;
  private pieChart: Chart | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.currencyService.selectedCurrency$.subscribe(curr => {
      if (this.business) {
        this.business.currency = curr;
      }
      if (this.financialRows.length > 0 && this.viewSection === 'charts') {
        setTimeout(() => this.renderCharts(), 100);
      }
    });

    // Load business list for dropdown
    this.businessService.getBusinesses().subscribe(res => {
      this.businesses = res.businesses || [];
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'default') {
      this.businessId = id;
      this.loadBusiness(id);
    } else {
      this.businessService.getBusinesses().subscribe(res => {
        this.businesses = res.businesses || [];
        if (res.businesses.length > 0) {
          this.businessId = res.businesses[0].id;
          this.loadBusiness(this.businessId);
        }
      });
    }
  }

  onBusinessChange(newId: string): void {
    if (!newId || newId === this.businessId) return;
    this.businessId = newId;
    this.router.navigate(['/business', newId]);
    this.loadBusiness(newId);
  }

  ngAfterViewInit(): void {
    if (this.financialRows.length > 0 && this.viewSection === 'charts') {
      setTimeout(() => this.renderCharts(), 200);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  setViewSection(section: 'charts' | 'ingest' | 'products'): void {
    this.viewSection = section;
    if (section === 'charts') {
      setTimeout(() => this.renderCharts(), 200);
    }
  }

  toggleShowRawTable(): void {
    this.showRawTable = !this.showRawTable;
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

    this.financialRows = months.map((m, idx) => {
      const revenue = Number(revObj[m] || 0);
      const total_costs = Number(costObj[m] || 0);
      const net_profit = Number(profitObj[m] || (revenue - total_costs));
      const margin = revenue > 0 ? (net_profit / revenue) * 100 : 0;

      let revDiff = 0;
      let revDiffPct = 0;
      let profitDiff = 0;
      let profitDiffPct = 0;

      if (idx > 0) {
        const prevMonth = months[idx - 1];
        const prevRev = Number(revObj[prevMonth] || 0);
        const prevProfit = Number(profitObj[prevMonth] || (prevRev - Number(costObj[prevMonth] || 0)));

        revDiff = revenue - prevRev;
        revDiffPct = prevRev > 0 ? (revDiff / prevRev) * 100 : 0;
        profitDiff = net_profit - prevProfit;
        profitDiffPct = prevProfit !== 0 ? (profitDiff / Math.abs(prevProfit)) * 100 : 0;
      }

      return {
        month: m, revenue, total_costs, net_profit, margin,
        revDiff, revDiffPct, profitDiff, profitDiffPct
      };
    });

    if (this.financialRows.length > 0) {
      const last = this.financialRows[this.financialRows.length - 1];
      this.latestRevenue = last.revenue;
      this.latestCosts = last.total_costs;
      this.latestProfit = last.net_profit;
      this.latestMargin = last.margin;
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
        // Try parsing CSV lines
        const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        if (lines.length > 1 && lines[0].includes(',')) {
          const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
          const records: any[] = [];
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map((v: string) => v.trim());
            const rec: any = {};
            headers.forEach((h: string, idx: number) => {
              if (vals[idx] !== undefined) {
                const num = Number(vals[idx]);
                rec[h] = isNaN(num) ? vals[idx] : num;
              }
            });
            if (rec.month || rec.period || rec.revenue) {
              records.push(rec);
            }
          }
          if (records.length > 0) {
            this.saveFinancialPayload(records);
            return;
          }
        }
        this.ingestMessage = 'File loaded into paste area. Click Process JSON to upload.';
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

  loadInstantSampleData(): void {
    const sampleData = [
      { "month": "2024-01", "revenue": 14500, "total_costs": 8000, "net_profit": 6500, "leads": 65, "customers": 12, "marketing_spend": 1200 },
      { "month": "2024-02", "revenue": 15200, "total_costs": 8200, "net_profit": 7000, "leads": 70, "customers": 14, "marketing_spend": 1250 },
      { "month": "2024-03", "revenue": 15800, "total_costs": 8300, "net_profit": 7500, "leads": 75, "customers": 15, "marketing_spend": 1300 },
      { "month": "2024-04", "revenue": 16400, "total_costs": 8500, "net_profit": 7900, "leads": 78, "customers": 16, "marketing_spend": 1350 },
      { "month": "2024-05", "revenue": 17000, "total_costs": 8700, "net_profit": 8300, "leads": 82, "customers": 17, "marketing_spend": 1400 },
      { "month": "2024-06", "revenue": 17800, "total_costs": 9000, "net_profit": 8800, "leads": 88, "customers": 19, "marketing_spend": 1500 },
      { "month": "2024-07", "revenue": 17500, "total_costs": 8900, "net_profit": 8600, "leads": 85, "customers": 18, "marketing_spend": 1450 },
      { "month": "2024-08", "revenue": 18400, "total_costs": 9200, "net_profit": 9200, "leads": 92, "customers": 20, "marketing_spend": 1550 },
      { "month": "2024-09", "revenue": 19000, "total_costs": 9400, "net_profit": 9600, "leads": 96, "customers": 21, "marketing_spend": 1600 },
      { "month": "2024-10", "revenue": 19800, "total_costs": 9700, "net_profit": 10100, "leads": 102, "customers": 23, "marketing_spend": 1700 },
      { "month": "2024-11", "revenue": 20800, "total_costs": 10000, "net_profit": 10800, "leads": 110, "customers": 25, "marketing_spend": 1800 },
      { "month": "2024-12", "revenue": 22000, "total_costs": 10500, "net_profit": 11500, "leads": 120, "customers": 28, "marketing_spend": 2000 },
      { "month": "2025-01", "revenue": 21500, "total_costs": 10300, "net_profit": 11200, "leads": 115, "customers": 27, "marketing_spend": 1900 },
      { "month": "2025-02", "revenue": 22500, "total_costs": 10600, "net_profit": 11900, "leads": 122, "customers": 29, "marketing_spend": 2050 },
      { "month": "2025-03", "revenue": 23800, "total_costs": 11000, "net_profit": 12800, "leads": 130, "customers": 31, "marketing_spend": 2150 },
      { "month": "2025-04", "revenue": 24800, "total_costs": 11300, "net_profit": 13500, "leads": 138, "customers": 33, "marketing_spend": 2250 },
      { "month": "2025-05", "revenue": 26000, "total_costs": 11700, "net_profit": 14300, "leads": 145, "customers": 36, "marketing_spend": 2400 },
      { "month": "2025-06", "revenue": 27500, "total_costs": 12200, "net_profit": 15300, "leads": 155, "customers": 39, "marketing_spend": 2550 }
    ];
    this.saveFinancialPayload(sampleData);
  }

  loadSampleNovaData(): void {
    this.loadInstantSampleData();
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

    // If payload is an object containing monthly_financials key, extract it
    let finData = payload;
    if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.monthly_financials) {
      finData = payload.monthly_financials;
    }

    this.businessService.updateWorldModelData(this.business.id, { monthly_financials: finData }).subscribe({
      next: (res) => {
        this.savingData = false;
        this.ingestSuccess = true;
        this.ingestMessage = `✅ Success! Model trained on ${res.records_processed || (Array.isArray(finData) ? finData.length : 1)} financial records.`;
        this.businessService.getWorldModel(this.business!.id).subscribe(wm => {
          this.worldModel = wm;
          this.parseFinancialRows(wm);
          this.setViewSection('charts');
        });
      },
      error: (err) => {
        this.savingData = false;
        this.ingestSuccess = false;
        this.ingestMessage = '❌ Failed to process data: ' + (err.error?.error || err.message);
      }
    });
  }

  destroyCharts(): void {
    if (this.comboChart) { this.comboChart.destroy(); this.comboChart = null; }
    if (this.pieChart) { this.pieChart.destroy(); this.pieChart = null; }
  }

  renderCharts(): void {
    if (this.financialRows.length === 0) return;
    this.destroyCharts();

    const cur = this.business?.currency || 'USD';

    // Chart 1: Bar & Line Combo Chart
    if (this.comboChartCanvas) {
      const canvas = this.comboChartCanvas.nativeElement;
      const labels = this.financialRows.map(r => r.month);
      const revData = this.financialRows.map(r => r.revenue);
      const costData = this.financialRows.map(r => r.total_costs);
      const profitData = this.financialRows.map(r => r.net_profit);

      this.comboChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: `Revenue (${cur})`,
              data: revData,
              backgroundColor: 'rgba(59, 130, 246, 0.75)',
              borderColor: '#3b82f6',
              borderRadius: 6
            },
            {
              label: `Operating Costs (${cur})`,
              data: costData,
              backgroundColor: 'rgba(239, 68, 68, 0.65)',
              borderColor: '#ef4444',
              borderRadius: 6
            },
            {
              label: `Net Profit (${cur})`,
              type: 'line',
              data: profitData,
              borderColor: '#10b981',
              borderWidth: 3,
              tension: 0.3,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } }
        }
      });
    }

    // Chart 2: Pie / Doughnut Chart for Cost vs Profit Share
    if (this.pieChartCanvas) {
      const canvas = this.pieChartCanvas.nativeElement;
      const totalCostsSum = this.financialRows.reduce((a, b) => a + b.total_costs, 0);
      const totalProfitSum = this.financialRows.reduce((a, b) => a + Math.max(0, b.net_profit), 0);

      this.pieChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: [`Operating Expenses (${cur})`, `Net Profit Share (${cur})`],
          datasets: [
            {
              data: [totalCostsSum, totalProfitSum],
              backgroundColor: ['#ef4444', '#10b981'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }
}
