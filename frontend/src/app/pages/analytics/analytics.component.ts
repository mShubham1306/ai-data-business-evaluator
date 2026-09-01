import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BusinessService, Business } from '../../core/services/business.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="analytics-page animated-fade-in" *ngIf="business">
      <div class="header-nav mb-3">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <h2>Analytics &amp; ML Forecast Engine</h2>
        <p class="subtitle">{{ business.name }} | Multi-Layer Verified Numerical Intelligence</p>
      </div>

      <!-- Health Score Decomposition -->
      <div class="card 3d-card mb-4" *ngIf="healthData">
        <h3>Business Health Score Decomposition</h3>
        <p class="desc mt-1">Weighted metric calculation based on Profitability, Growth, Conversion &amp; OpEx Efficiency.</p>

        <div class="health-overview mt-3">
          <div class="health-gauge 3d-box">
            <span class="gauge-score">{{ healthData.health_score | number:'1.1-1' }}</span>
            <span class="gauge-max">/ 100</span>
            <span class="gauge-rating" [class.excellent]="healthData.rating === 'Excellent'">{{ healthData.rating }}</span>
          </div>

          <div class="health-components">
            <div class="component-item">
              <span class="comp-label">Profitability (0-25)</span>
              <div class="progress-bar"><div class="progress-fill coral" [style.width.%]="(healthData.components?.profitability || 0) / 25 * 100"></div></div>
              <span class="comp-val">{{ healthData.components?.profitability | number:'1.1-1' }}</span>
            </div>
            <div class="component-item">
              <span class="comp-label">Growth Rate (0-25)</span>
              <div class="progress-bar"><div class="progress-fill sky" [style.width.%]="(healthData.components?.growth || 0) / 25 * 100"></div></div>
              <span class="comp-val">{{ healthData.components?.growth | number:'1.1-1' }}</span>
            </div>
            <div class="component-item">
              <span class="comp-label">Customer Conversion (0-25)</span>
              <div class="progress-bar"><div class="progress-fill purple" [style.width.%]="(healthData.components?.customer || 0) / 25 * 100"></div></div>
              <span class="comp-val">{{ healthData.components?.customer | number:'1.1-1' }}</span>
            </div>
            <div class="component-item">
              <span class="comp-label">Operating Efficiency (0-25)</span>
              <div class="progress-bar"><div class="progress-fill green" [style.width.%]="(healthData.components?.efficiency || 0) / 25 * 100"></div></div>
              <span class="comp-val">{{ healthData.components?.efficiency | number:'1.1-1' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No health data yet -->
      <div class="card 3d-card mb-4 empty-state-card" *ngIf="!healthData && !loadingHealth">
        <div class="empty-icon">📊</div>
        <h3>Health Score Not Yet Available</h3>
        <p>Upload your financial data on the <a routerLink="/business">Business Data</a> page to generate your business health score.</p>
      </div>
      <div class="card 3d-card mb-4 empty-state-card" *ngIf="loadingHealth">
        <div class="loading-spinner"></div>
        <p>Computing health score...</p>
      </div>

      <div class="grid grid-2 mb-4" *ngIf="drivers.length > 0 || anomalies !== null">
        <!-- Driver Analysis -->
        <div class="card 3d-card" *ngIf="drivers.length > 0">
          <h3>Performance Drivers</h3>
          <p class="desc mt-1">Key internal metrics driving revenue trends.</p>
          <div class="driver-list mt-3">
            <div class="driver-card" *ngFor="let d of drivers">
              <div class="driver-header">
                <strong>{{ d.name }}</strong>
                <span class="impact-tag" [class.high]="d.impact === 'high'">{{ d.impact }} impact</span>
              </div>
              <p class="driver-meta">Trend: <strong [class.text-success]="d.trend === 'up'">{{ d.trend | uppercase }}</strong> | Change: {{ business.currency || 'AED' }} {{ d.change | number:'1.0-0' }}</p>
            </div>
          </div>
        </div>

        <!-- Anomaly Detector -->
        <div class="card 3d-card" *ngIf="anomalies !== null">
          <h3>Anomaly &amp; Outlier Detector</h3>
          <p class="desc mt-1">Z-Score &amp; Isolation Forest Statistical Checks</p>
          <div class="anomaly-list mt-3" *ngIf="anomalies.length > 0">
            <div class="alert alert-warning" *ngFor="let a of anomalies">
              <div><strong>{{ a.type }}:</strong> Value of {{ business.currency || 'AED' }} {{ a.value | number:'1.0-0' }} deviates by {{ a.deviation }} from historical average.</div>
              <div *ngIf="a.corrected_value" class="mt-1" style="color:#1e40af;font-size:0.82rem;margin-top:0.35rem">
                ✨ <strong>Gemini Auto-Correction:</strong> Adjusted to {{ business.currency || 'AED' }} {{ a.corrected_value | number:'1.0-0' }} ({{ a.correction }})
              </div>
            </div>
          </div>
          <div class="alert alert-success mt-3" *ngIf="anomalies.length === 0">
            No statistical anomalies detected in historical baseline.
          </div>
        </div>
      </div>

      <!-- ML Revenue Forecast Table -->
      <div class="card 3d-card mb-4" *ngIf="forecasts.length > 0">
        <h3>12-Month ML Revenue Forecast (With Prediction Bounds)</h3>
        <p class="desc mt-1">Prophet &amp; Trend Extrapolation Model v1.0 | Verified Confidence Bounds</p>

        <div class="table-container mt-3">
          <table class="data-table">
            <thead>
              <tr>
                <th>Forecast Period</th>
                <th>Expected Revenue ({{ business.currency || 'AED' }})</th>
                <th>Lower Bound</th>
                <th>Upper Bound</th>
                <th>Model Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of forecasts.slice(0, 6)">
                <td>Month +{{ f.period }}</td>
                <td><strong class="text-navy">{{ business.currency || 'AED' }} {{ f.forecast | number:'1.0-0' }}</strong></td>
                <td class="text-muted">{{ business.currency || 'AED' }} {{ f.lower_bound | number:'1.0-0' }}</td>
                <td class="text-muted">{{ business.currency || 'AED' }} {{ f.upper_bound | number:'1.0-0' }}</td>
                <td><span class="conf-badge">{{ f.confidence }}%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- No forecast -->
      <div class="card 3d-card mb-4 empty-state-card" *ngIf="forecasts.length === 0 && !loadingForecasts">
        <div class="empty-icon">📈</div>
        <h3>Revenue Forecast Not Available</h3>
        <p>Upload at least 3 months of revenue data on the <a routerLink="/business">Business Data</a> page to generate ML forecasts.</p>
      </div>

      <!-- What-If Simulator — user-input driven -->
      <div class="card simulator-card 3d-card">
        <h3>What-If Simulator &amp; Money Impact Engine</h3>
        <p class="desc mt-1">Enter your own numbers to test strategic decisions. Results are calculated from your inputs — no assumptions made.</p>

        <div class="sim-inputs mt-4">
          <div class="sim-input-group">
            <label>Scenario Type</label>
            <select [(ngModel)]="simScenario">
              <option value="">Select a scenario...</option>
              <option value="marketing">Increase Marketing Budget</option>
              <option value="pricing">Price Change</option>
              <option value="cost">Cost Reduction</option>
              <option value="revenue">Revenue Increase Target</option>
            </select>
          </div>

          <ng-container *ngIf="simScenario === 'marketing'">
            <div class="sim-input-group">
              <label>Current Monthly Marketing Spend ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputA" placeholder="e.g. 40000" min="0" />
            </div>
            <div class="sim-input-group">
              <label>New Monthly Marketing Spend ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputB" placeholder="e.g. 50000" min="0" />
            </div>
            <div class="sim-input-group">
              <label>Expected ROI per {{ business.currency || 'AED' }} spent (e.g. 3 = 3x return)</label>
              <input type="number" [(ngModel)]="simInputC" placeholder="e.g. 3" min="0" step="0.1" />
            </div>
          </ng-container>

          <ng-container *ngIf="simScenario === 'pricing'">
            <div class="sim-input-group">
              <label>Current Average Price ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputA" placeholder="e.g. 1000" min="0" />
            </div>
            <div class="sim-input-group">
              <label>New Price ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputB" placeholder="e.g. 1100" min="0" />
            </div>
            <div class="sim-input-group">
              <label>Monthly Units Sold</label>
              <input type="number" [(ngModel)]="simInputC" placeholder="e.g. 200" min="0" />
            </div>
          </ng-container>

          <ng-container *ngIf="simScenario === 'cost'">
            <div class="sim-input-group">
              <label>Current Monthly Operating Cost ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputA" placeholder="e.g. 150000" min="0" />
            </div>
            <div class="sim-input-group">
              <label>Target Cost Reduction (%)</label>
              <input type="number" [(ngModel)]="simInputB" placeholder="e.g. 12" min="0" max="100" />
            </div>
          </ng-container>

          <ng-container *ngIf="simScenario === 'revenue'">
            <div class="sim-input-group">
              <label>Current Annual Revenue ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputA" placeholder="e.g. 3000000" min="0" />
            </div>
            <div class="sim-input-group">
              <label>Target Revenue Growth (%)</label>
              <input type="number" [(ngModel)]="simInputB" placeholder="e.g. 20" min="0" />
            </div>
            <div class="sim-input-group">
              <label>Estimated Net Margin (%)</label>
              <input type="number" [(ngModel)]="simInputC" placeholder="e.g. 25" min="0" max="100" />
            </div>
          </ng-container>
        </div>

        <div class="sim-actions mt-3" *ngIf="simScenario">
          <button class="btn btn-primary" (click)="runSimulation()" [disabled]="!canRunSim()">
            ⚡ Run Simulation
          </button>
          <button class="btn btn-secondary" (click)="clearSimulation()" *ngIf="simResult">Clear</button>
        </div>

        <div class="sim-result-box mt-4" *ngIf="simResult">
          <h4>📊 Simulation Results — {{ simResult.label }}</h4>
          <div class="sim-result-grid mt-3">
            <div class="sim-metric" *ngFor="let m of simResult.metrics">
              <span class="sim-metric-label">{{ m.label }}</span>
              <span class="sim-metric-value" [class.positive]="m.positive" [class.neutral]="!m.positive">
                {{ m.value }}
              </span>
            </div>
          </div>
          <p class="sim-note mt-3">💡 {{ simResult.note }}</p>
          <button class="btn btn-primary mt-3" [routerLink]="['/copilot', business.id]">
            ⚡ Execute Strategy with Copilot →
          </button>
        </div>

        <div class="sim-empty" *ngIf="!simScenario">
          <span class="sim-empty-icon">🧮</span>
          <p>Select a scenario and enter your real numbers to see the projected financial impact.</p>
        </div>
      </div>
    </div>

    <!-- Loading business -->
    <div class="empty-state-full animated-fade-in" *ngIf="!business && !loadingBusiness">
      <div class="empty-icon">⚠️</div>
      <h3>Business Not Found</h3>
      <p>Go back to dashboard and select a business.</p>
      <a routerLink="/dashboard" class="btn btn-primary mt-3">← Back to Dashboard</a>
    </div>
  `,
  styles: [`
    .back-link { font-size: 0.88rem; color: var(--muted-gray); margin-bottom: 0.5rem; display: inline-block; text-decoration: none; }
    .back-link:hover { color: var(--coral-pink); }
    .subtitle { font-size: 0.88rem; color: var(--slate-gray); }
    .desc { font-size: 0.85rem; color: var(--slate-gray); }

    .health-overview { display: flex; gap: 2.2rem; align-items: center; flex-wrap: wrap; }
    .health-gauge {
      display: flex; flex-direction: column; align-items: center;
      background: var(--cream); padding: 1.8rem 2rem; border-radius: 16px;
      min-width: 160px; border: 1px solid var(--border-color);
    }
    .gauge-score { font-size: 2.8rem; font-weight: 800; color: var(--deep-navy); }
    .gauge-max { font-size: 0.82rem; color: var(--muted-gray); font-weight: 600; }
    .gauge-rating { margin-top: 0.5rem; font-size: 0.82rem; font-weight: 700; background: #dcfce7; color: #166534; padding: 0.25rem 0.75rem; border-radius: 12px; }
    .health-components { flex: 1; display: flex; flex-direction: column; gap: 0.85rem; min-width: 280px; }
    .component-item { display: flex; align-items: center; gap: 1rem; }
    .comp-label { width: 190px; font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); }
    .progress-bar { flex: 1; height: 10px; background: var(--border-color); border-radius: 6px; overflow: hidden; }
    .progress-fill {
      height: 100%; border-radius: 6px;
      &.coral { background: var(--grad-vibrant); }
      &.sky { background: var(--sky-blue); }
      &.purple { background: var(--accent-purple); }
      &.green { background: var(--success-green); }
    }
    .comp-val { font-size: 0.9rem; font-weight: 700; width: 45px; text-align: right; color: var(--deep-navy); }

    .driver-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .driver-card { background: var(--cream); padding: 0.85rem 1rem; border-radius: 10px; border-left: 4px solid var(--coral-pink); }
    .driver-header { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .impact-tag { font-size: 0.75rem; background: var(--peach); color: var(--deep-navy); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700; }
    .impact-tag.high { background: #dcfce7; color: #166534; }
    .driver-meta { font-size: 0.78rem; color: var(--slate-gray); margin-top: 0.3rem; }

    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.85rem; text-align: left; border-bottom: 1px solid var(--border-color); font-size: 0.88rem; }
    .data-table th { background: var(--peach); color: var(--deep-navy); font-weight: 700; }
    .text-navy { color: var(--deep-navy); }
    .text-muted { color: var(--muted-gray); }
    .text-success { color: var(--success-green); }
    .conf-badge { background: var(--sky-blue); color: var(--deep-navy); padding: 0.25rem 0.65rem; border-radius: 12px; font-weight: 700; font-size: 0.78rem; }

    /* What-If Simulator */
    .sim-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .sim-input-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .sim-input-group label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); }
    .sim-input-group input, .sim-input-group select {
      padding: 0.65rem 0.85rem; border: 1px solid var(--border-color);
      border-radius: 8px; font-family: inherit; background: var(--white);
    }
    .sim-actions { display: flex; gap: 0.85rem; }
    .sim-result-box { background: var(--cream); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); }
    .sim-result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .sim-metric { display: flex; flex-direction: column; background: var(--white); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-color); }
    .sim-metric-label { font-size: 0.75rem; color: var(--muted-gray); text-transform: uppercase; font-weight: 600; margin-bottom: 0.35rem; }
    .sim-metric-value { font-size: 1.25rem; font-weight: 800; color: var(--deep-navy); }
    .sim-metric-value.positive { color: var(--success-green); }
    .sim-metric-value.neutral { color: var(--deep-navy); }
    .sim-note { font-size: 0.85rem; color: var(--slate-gray); line-height: 1.5; }
    .sim-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem; text-align: center; }
    .sim-empty-icon { font-size: 2.5rem; }

    /* Empty states */
    .empty-state-card { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2.5rem; text-align: center; }
    .empty-state-card a { color: var(--sky-blue); }
    .empty-icon { font-size: 2.5rem; }
    .empty-state-full { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem; text-align: center; }
    .loading-spinner {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid var(--border-color); border-top-color: var(--coral-pink);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AnalyticsComponent implements OnInit {
  business: Business | null = null;
  healthData: any = null;
  drivers: any[] = [];
  anomalies: any[] | null = null;
  forecasts: any[] = [];
  loadingHealth = true;
  loadingForecasts = true;
  loadingBusiness = true;

  // What-If Simulator — user-input driven
  simScenario = '';
  simInputA: number | null = null;
  simInputB: number | null = null;
  simInputC: number | null = null;
  simResult: any = null;

  constructor(
    private route: ActivatedRoute,
    private analyticsService: AnalyticsService,
    private businessService: BusinessService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'default') {
      this.loadAnalytics(id);
    } else {
      this.businessService.getBusinesses().subscribe(res => {
        if (res.businesses.length > 0) {
          this.loadAnalytics(res.businesses[0].id);
        } else {
          this.loadingBusiness = false;
        }
      });
    }
  }

  loadAnalytics(id: string): void {
    this.businessService.getBusiness(id).subscribe(biz => {
      this.business = biz;
      this.loadingBusiness = false;
    });

    this.analyticsService.getHealthScore(id).subscribe({
      next: h => { this.healthData = h; this.loadingHealth = false; },
      error: () => { this.loadingHealth = false; }
    });

    this.analyticsService.getDrivers(id).subscribe({
      next: (res: any) => this.drivers = res.drivers || [],
      error: () => {}
    });

    this.analyticsService.getAnomalies(id).subscribe({
      next: (res: any) => this.anomalies = res.anomalies || [],
      error: () => this.anomalies = []
    });

    this.analyticsService.forecastRevenue(id).subscribe({
      next: (res: any) => { this.forecasts = res.forecasts || []; this.loadingForecasts = false; },
      error: () => { this.loadingForecasts = false; }
    });
  }

  canRunSim(): boolean {
    if (!this.simScenario) return false;
    if (this.simScenario === 'cost') return !!this.simInputA && !!this.simInputB;
    return !!this.simInputA && !!this.simInputB && !!this.simInputC;
  }

  runSimulation(): void {
    if (!this.canRunSim()) return;
    const cur = this.business?.currency || 'AED';

    if (this.simScenario === 'marketing') {
      const increase = (this.simInputB! - this.simInputA!);
      const additionalRevenue = increase * this.simInputC!;
      const netImpact = additionalRevenue - increase;
      this.simResult = {
        label: 'Marketing Budget Increase',
        metrics: [
          { label: 'Additional Monthly Spend', value: `${cur} ${increase.toLocaleString()}`, positive: false },
          { label: 'Expected Revenue Uplift', value: `${cur} ${Math.round(additionalRevenue).toLocaleString()}`, positive: true },
          { label: 'Net Monthly Impact', value: `${cur} ${Math.round(netImpact).toLocaleString()}`, positive: netImpact > 0 },
          { label: 'Annual Net Impact', value: `${cur} ${Math.round(netImpact * 12).toLocaleString()}`, positive: netImpact > 0 },
        ],
        note: netImpact > 0
          ? `With a ${this.simInputC!}x ROI, increasing marketing spend by ${cur} ${increase.toLocaleString()} per month generates a net positive return of ${cur} ${Math.round(netImpact).toLocaleString()}/month.`
          : `This scenario shows a net loss. Consider improving your ROI per spend or reducing the increase amount.`
      };
    } else if (this.simScenario === 'pricing') {
      const priceDiff = this.simInputB! - this.simInputA!;
      const revenueImpact = priceDiff * this.simInputC!;
      const pctChange = ((priceDiff / this.simInputA!) * 100);
      this.simResult = {
        label: 'Price Change Analysis',
        metrics: [
          { label: 'Price Increase', value: `+${pctChange.toFixed(1)}%`, positive: priceDiff > 0 },
          { label: 'Revenue per Unit Change', value: `${cur} ${priceDiff.toLocaleString()}`, positive: priceDiff > 0 },
          { label: 'Monthly Revenue Impact', value: `${cur} ${Math.round(revenueImpact).toLocaleString()}`, positive: revenueImpact > 0 },
          { label: 'Annual Revenue Impact', value: `${cur} ${Math.round(revenueImpact * 12).toLocaleString()}`, positive: revenueImpact > 0 },
        ],
        note: `Changing price from ${cur} ${this.simInputA!.toLocaleString()} to ${cur} ${this.simInputB!.toLocaleString()} across ${this.simInputC!} units/month adds ${cur} ${Math.round(revenueImpact).toLocaleString()}/month. Factor in potential volume loss from price elasticity.`
      };
    } else if (this.simScenario === 'cost') {
      const saving = this.simInputA! * (this.simInputB! / 100);
      const newCost = this.simInputA! - saving;
      this.simResult = {
        label: 'Cost Reduction Impact',
        metrics: [
          { label: 'Current Monthly Cost', value: `${cur} ${this.simInputA!.toLocaleString()}`, positive: false },
          { label: 'Monthly Savings', value: `${cur} ${Math.round(saving).toLocaleString()}`, positive: true },
          { label: 'New Monthly Cost', value: `${cur} ${Math.round(newCost).toLocaleString()}`, positive: true },
          { label: 'Annual Savings', value: `${cur} ${Math.round(saving * 12).toLocaleString()}`, positive: true },
        ],
        note: `A ${this.simInputB!}% reduction in operating costs saves ${cur} ${Math.round(saving).toLocaleString()} per month, directly improving your net profit margin.`
      };
    } else if (this.simScenario === 'revenue') {
      const targetRevenue = this.simInputA! * (1 + this.simInputB! / 100);
      const additionalRevenue = targetRevenue - this.simInputA!;
      const additionalProfit = additionalRevenue * (this.simInputC! / 100);
      this.simResult = {
        label: 'Revenue Growth Target',
        metrics: [
          { label: 'Current Annual Revenue', value: `${cur} ${this.simInputA!.toLocaleString()}`, positive: false },
          { label: 'Target Revenue', value: `${cur} ${Math.round(targetRevenue).toLocaleString()}`, positive: true },
          { label: 'Additional Revenue', value: `${cur} ${Math.round(additionalRevenue).toLocaleString()}`, positive: true },
          { label: 'Additional Net Profit', value: `${cur} ${Math.round(additionalProfit).toLocaleString()}`, positive: true },
        ],
        note: `Growing revenue by ${this.simInputB!}% would generate an additional ${cur} ${Math.round(additionalRevenue).toLocaleString()} per year, yielding ${cur} ${Math.round(additionalProfit).toLocaleString()} in additional net profit at ${this.simInputC!}% margin.`
      };
    }
  }

  clearSimulation(): void {
    this.simResult = null;
    this.simInputA = null;
    this.simInputB = null;
    this.simInputC = null;
  }
}
