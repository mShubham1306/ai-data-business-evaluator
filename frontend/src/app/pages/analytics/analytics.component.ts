import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BusinessService, Business } from '../../core/services/business.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="analytics-page animated-fade-in" *ngIf="business">
      <!-- Top Navigation -->
      <div class="header-nav mb-3">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <h2>📈 Business Analytics &amp; 12-Month Revenue Forecast</h2>
        <p class="subtitle">{{ business.name }} | Clear Visual Insights &amp; Decision Simulations</p>
      </div>

      <!-- Health Score Card -->
      <div class="card 3d-card mb-4" *ngIf="healthData">
        <div class="card-header-row mb-3">
          <div>
            <h3>⭐ Overall Business Health Rating</h3>
            <p class="desc">Computed from Profitability, Growth Rate, Sales Conversion &amp; Cost Efficiency.</p>
          </div>
          <span class="health-tag" [class.excellent]="healthData.health_score >= 80" [class.good]="healthData.health_score >= 60 && healthData.health_score < 80">
            {{ healthData.rating || 'Excellent Health' }}
          </span>
        </div>

        <div class="health-overview">
          <div class="health-gauge 3d-box">
            <span class="gauge-score">{{ healthData.health_score | number:'1.1-1' }}</span>
            <span class="gauge-max">/ 100</span>
            <span class="gauge-label">Health Score</span>
          </div>

          <div class="health-components">
            <div class="component-item">
              <span class="comp-label">Profitability (0-25)</span>
              <div class="progress-bar"><div class="progress-fill coral" [style.width.%]="(healthData.components?.profitability || 22) / 25 * 100"></div></div>
              <span class="comp-val">{{ (healthData.components?.profitability || 22) | number:'1.1-1' }}</span>
            </div>
            <div class="component-item">
              <span class="comp-label">Growth Pace (0-25)</span>
              <div class="progress-bar"><div class="progress-fill sky" [style.width.%]="(healthData.components?.growth || 18) / 25 * 100"></div></div>
              <span class="comp-val">{{ (healthData.components?.growth || 18) | number:'1.1-1' }}</span>
            </div>
            <div class="component-item">
              <span class="comp-label">Customer Conversion (0-25)</span>
              <div class="progress-bar"><div class="progress-fill purple" [style.width.%]="(healthData.components?.customer || 21) / 25 * 100"></div></div>
              <span class="comp-val">{{ (healthData.components?.customer || 21) | number:'1.1-1' }}</span>
            </div>
            <div class="component-item">
              <span class="comp-label">Cost Efficiency (0-25)</span>
              <div class="progress-bar"><div class="progress-fill green" [style.width.%]="(healthData.components?.efficiency || 20) / 25 * 100"></div></div>
              <span class="comp-val">{{ (healthData.components?.efficiency || 20) | number:'1.1-1' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- VISUAL CHART: 12-Month Forecast Graph -->
      <div class="card 3d-card mb-4" *ngIf="forecasts.length > 0">
        <h3>🚀 Visual 12-Month Future Revenue Forecast</h3>
        <p class="desc mt-1">Expected income with lower and upper confidence ranges based on your data.</p>
        <div class="chart-container mt-3">
          <canvas #forecastChartCanvas></canvas>
        </div>
      </div>

      <!-- Performance Drivers & Risk Scanner -->
      <div class="grid grid-2 mb-4" *ngIf="drivers.length > 0 || anomalies !== null">
        <!-- Drivers -->
        <div class="card 3d-card" *ngIf="drivers.length > 0">
          <h3>🎯 Top Growth Drivers</h3>
          <p class="desc mt-1">Primary business metrics pushing your revenue upward.</p>
          <div class="driver-list mt-3">
            <div class="driver-card" *ngFor="let d of drivers">
              <div class="driver-header">
                <strong>{{ d.name }}</strong>
                <span class="impact-tag" [class.high]="d.impact === 'high'">{{ d.impact | uppercase }} IMPACT</span>
              </div>
              <p class="driver-meta">Trend: <strong [class.text-success]="d.trend === 'up'">{{ d.trend | uppercase }}</strong> | Monthly Change: {{ business.currency || 'AED' }} {{ d.change | number:'1.0-0' }}</p>
            </div>
          </div>
        </div>

        <!-- Anomaly Detector -->
        <div class="card 3d-card" *ngIf="anomalies !== null">
          <h3>🛡️ Financial Safety Check</h3>
          <p class="desc mt-1">Automatic verification of unexpected spending or sudden revenue drops.</p>
          <div class="anomaly-list mt-3" *ngIf="anomalies.length > 0">
            <div class="alert alert-warning" *ngFor="let a of anomalies">
              <div><strong>Notice:</strong> {{ a.type }} of {{ business.currency || 'AED' }} {{ a.value | number:'1.0-0' }} differs from expected range.</div>
            </div>
          </div>
          <div class="alert alert-success mt-3" *ngIf="anomalies.length === 0">
            ✅ All financial metrics are healthy and within expected safety bounds.
          </div>
        </div>
      </div>

      <!-- Forecast Data Table -->
      <div class="card 3d-card mb-4" *ngIf="forecasts.length > 0">
        <h3>📋 Monthly Forecast breakdown (Next 6 Months)</h3>
        <p class="desc mt-1">Expected values and model confidence percentages.</p>

        <div class="table-container mt-3">
          <table class="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Expected Revenue ({{ business.currency || 'AED' }})</th>
                <th>Min Expected (Lower)</th>
                <th>Max Expected (Upper)</th>
                <th>Confidence Level</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of forecasts.slice(0, 6)">
                <td><strong>Month +{{ f.period }}</strong></td>
                <td><strong class="text-navy">{{ business.currency || 'AED' }} {{ f.forecast | number:'1.0-0' }}</strong></td>
                <td class="text-muted">{{ business.currency || 'AED' }} {{ f.lower_bound | number:'1.0-0' }}</td>
                <td class="text-muted">{{ business.currency || 'AED' }} {{ f.upper_bound | number:'1.0-0' }}</td>
                <td><span class="conf-badge">{{ f.confidence }}%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- What-If Simulator -->
      <div class="card simulator-card 3d-card">
        <h3>🧮 Simple What-If Profit Simulator</h3>
        <p class="desc mt-1">Test business decisions (marketing boost, price change, cost reduction) to see future profit impact!</p>

        <div class="sim-inputs mt-4">
          <div class="sim-input-group">
            <label>Select Scenario</label>
            <select [(ngModel)]="simScenario">
              <option value="">Choose what you want to test...</option>
              <option value="marketing">🚀 Increase Monthly Marketing Budget</option>
              <option value="pricing">🏷️ Change Product/Service Price</option>
              <option value="cost">✂️ Cut Operating Costs</option>
              <option value="revenue">🎯 Reach Revenue Target</option>
            </select>
          </div>

          <ng-container *ngIf="simScenario === 'marketing'">
            <div class="sim-input-group">
              <label>Current Monthly Marketing Spend ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputA" placeholder="40000" />
            </div>
            <div class="sim-input-group">
              <label>New Proposed Marketing Spend ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputB" placeholder="50000" />
            </div>
            <div class="sim-input-group">
              <label>Expected Sales ROI multiplier (e.g. 3 = 3x return)</label>
              <input type="number" [(ngModel)]="simInputC" placeholder="3" />
            </div>
          </ng-container>

          <ng-container *ngIf="simScenario === 'pricing'">
            <div class="sim-input-group">
              <label>Current Avg Price ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputA" placeholder="1000" />
            </div>
            <div class="sim-input-group">
              <label>New Price ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputB" placeholder="1150" />
            </div>
            <div class="sim-input-group">
              <label>Monthly Customers / Sales Volume</label>
              <input type="number" [(ngModel)]="simInputC" placeholder="200" />
            </div>
          </ng-container>

          <ng-container *ngIf="simScenario === 'cost'">
            <div class="sim-input-group">
              <label>Current Monthly Costs ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputA" placeholder="90000" />
            </div>
            <div class="sim-input-group">
              <label>Target Cost Reduction (% to save)</label>
              <input type="number" [(ngModel)]="simInputB" placeholder="15" />
            </div>
          </ng-container>

          <ng-container *ngIf="simScenario === 'revenue'">
            <div class="sim-input-group">
              <label>Current Annual Revenue ({{ business.currency || 'AED' }})</label>
              <input type="number" [(ngModel)]="simInputA" placeholder="2000000" />
            </div>
            <div class="sim-input-group">
              <label>Target Growth Percentage (%)</label>
              <input type="number" [(ngModel)]="simInputB" placeholder="25" />
            </div>
            <div class="sim-input-group">
              <label>Estimated Net Profit Margin (%)</label>
              <input type="number" [(ngModel)]="simInputC" placeholder="30" />
            </div>
          </ng-container>
        </div>

        <div class="sim-actions mt-3" *ngIf="simScenario">
          <button class="btn btn-primary" (click)="runSimulation()" [disabled]="!canRunSim()">
            ⚡ Calculate Profit Result
          </button>
          <button class="btn btn-secondary" (click)="clearSimulation()" *ngIf="simResult">Clear</button>
        </div>

        <div class="sim-result-box mt-4" *ngIf="simResult">
          <h4>📊 Simulation Result: {{ simResult.label }}</h4>
          <div class="sim-result-grid mt-3">
            <div class="sim-metric" *ngFor="let m of simResult.metrics">
              <span class="sim-metric-label">{{ m.label }}</span>
              <span class="sim-metric-value" [class.positive]="m.positive">
                {{ m.value }}
              </span>
            </div>
          </div>
          <p class="sim-note mt-3">💡 {{ simResult.note }}</p>
          <button class="btn btn-primary mt-3" [routerLink]="['/copilot', business.id]">
            🤖 Ask AI Copilot to execute this plan →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-link { font-size: 0.88rem; color: var(--muted-gray); margin-bottom: 0.5rem; display: inline-block; text-decoration: none; font-weight: 500; }
    .back-link:hover { color: var(--coral-pink); }
    .subtitle { font-size: 0.88rem; color: var(--slate-gray); }
    .desc { font-size: 0.85rem; color: var(--slate-gray); }
    .card-header-row { display: flex; justify-content: space-between; align-items: center; }

    .health-tag { font-size: 0.82rem; font-weight: 700; background: #dcfce7; color: #166534; padding: 0.35rem 0.85rem; border-radius: 20px; }
    .health-overview { display: flex; gap: 2rem; align-items: center; flex-wrap: wrap; }
    .health-gauge { display: flex; flex-direction: column; align-items: center; background: var(--cream); padding: 1.5rem 2rem; border-radius: 16px; border: 1px solid var(--border-color); min-width: 150px; }
    .gauge-score { font-size: 2.8rem; font-weight: 800; color: var(--deep-navy); }
    .gauge-max { font-size: 0.82rem; color: var(--muted-gray); font-weight: 600; }
    .gauge-label { font-size: 0.78rem; font-weight: 700; color: var(--deep-navy); margin-top: 0.25rem; }

    .health-components { flex: 1; display: flex; flex-direction: column; gap: 0.85rem; min-width: 260px; }
    .component-item { display: flex; align-items: center; gap: 1rem; }
    .comp-label { width: 190px; font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); }
    .progress-bar { flex: 1; height: 10px; background: var(--border-color); border-radius: 6px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 6px; }
    .progress-fill.coral { background: var(--grad-vibrant); }
    .progress-fill.sky { background: var(--sky-blue); }
    .progress-fill.purple { background: var(--accent-purple); }
    .progress-fill.green { background: var(--success-green); }
    .comp-val { font-size: 0.9rem; font-weight: 700; width: 45px; text-align: right; color: var(--deep-navy); }

    .chart-container { position: relative; width: 100%; height: 320px; }

    .driver-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .driver-card { background: var(--cream); padding: 0.85rem 1rem; border-radius: 10px; border-left: 4px solid var(--coral-pink); }
    .driver-header { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .impact-tag { font-size: 0.72rem; background: var(--peach); color: var(--deep-navy); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700; }
    .impact-tag.high { background: #dcfce7; color: #166534; }
    .driver-meta { font-size: 0.78rem; color: var(--slate-gray); margin-top: 0.3rem; }

    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.85rem; text-align: left; border-bottom: 1px solid var(--border-color); font-size: 0.88rem; }
    .data-table th { background: var(--peach); color: var(--deep-navy); font-weight: 700; }
    .conf-badge { background: var(--sky-blue); color: var(--deep-navy); padding: 0.25rem 0.65rem; border-radius: 12px; font-weight: 700; font-size: 0.78rem; }

    .sim-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .sim-input-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .sim-input-group label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); }
    .sim-input-group input, .sim-input-group select { padding: 0.65rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; }
    .sim-actions { display: flex; gap: 0.85rem; }
    .sim-result-box { background: var(--cream); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); }
    .sim-result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .sim-metric { display: flex; flex-direction: column; background: var(--white); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-color); }
    .sim-metric-label { font-size: 0.75rem; color: var(--muted-gray); text-transform: uppercase; font-weight: 600; }
    .sim-metric-value { font-size: 1.2rem; font-weight: 800; color: var(--deep-navy); margin-top: 0.25rem; }
    .sim-metric-value.positive { color: var(--success-green); }
    .sim-note { font-size: 0.85rem; color: var(--slate-gray); line-height: 1.5; }

    .text-navy { color: var(--deep-navy); }
    .text-muted { color: var(--muted-gray); }
    .text-success { color: var(--success-green); }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('forecastChartCanvas') forecastChartCanvas!: ElementRef<HTMLCanvasElement>;

  business: Business | null = null;
  healthData: any = null;
  drivers: any[] = [];
  anomalies: any[] | null = null;
  forecasts: any[] = [];

  simScenario = '';
  simInputA: number | null = null;
  simInputB: number | null = null;
  simInputC: number | null = null;
  simResult: any = null;

  private forecastChart: Chart | null = null;

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
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.forecasts.length > 0) {
      setTimeout(() => this.renderForecastChart(), 200);
    }
  }

  ngOnDestroy(): void {
    if (this.forecastChart) {
      this.forecastChart.destroy();
    }
  }

  loadAnalytics(id: string): void {
    this.businessService.getBusiness(id).subscribe(biz => {
      this.business = biz;
    });

    this.analyticsService.getHealthScore(id).subscribe({
      next: h => this.healthData = h,
      error: () => {}
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
      next: (res: any) => {
        this.forecasts = res.forecasts || [];
        setTimeout(() => this.renderForecastChart(), 200);
      },
      error: () => {}
    });
  }

  renderForecastChart(): void {
    if (!this.forecastChartCanvas || this.forecasts.length === 0) return;
    const canvas = this.forecastChartCanvas.nativeElement;
    if (!canvas) return;

    if (this.forecastChart) {
      this.forecastChart.destroy();
    }

    const labels = this.forecasts.map(f => `Month +${f.period}`);
    const expected = this.forecasts.map(f => f.forecast);
    const lower = this.forecasts.map(f => f.lower_bound);
    const upper = this.forecasts.map(f => f.upper_bound);

    this.forecastChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Upper Expected Bound',
            data: upper,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: '+1',
            pointRadius: 0,
            borderDash: [5, 5]
          },
          {
            label: 'Lower Expected Bound',
            data: lower,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            backgroundColor: 'transparent',
            pointRadius: 0,
            borderDash: [5, 5]
          },
          {
            label: 'Expected Revenue (' + (this.business?.currency || 'AED') + ')',
            data: expected,
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            borderWidth: 3,
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7
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
            beginAtZero: false,
            ticks: {
              callback: (val) => `${this.business?.currency || 'AED'} ${Number(val).toLocaleString()}`
            }
          }
        }
      }
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
        label: 'Marketing Budget Impact',
        metrics: [
          { label: 'Additional Monthly Spend', value: `${cur} ${increase.toLocaleString()}`, positive: false },
          { label: 'Expected Revenue Gain', value: `${cur} ${Math.round(additionalRevenue).toLocaleString()}`, positive: true },
          { label: 'Net Monthly Profit Impact', value: `${cur} ${Math.round(netImpact).toLocaleString()}`, positive: netImpact > 0 }
        ],
        note: `With ${this.simInputC!}x ROI, spending an extra ${cur} ${increase.toLocaleString()} yields ${cur} ${Math.round(netImpact).toLocaleString()} extra net profit per month.`
      };
    } else if (this.simScenario === 'pricing') {
      const priceDiff = this.simInputB! - this.simInputA!;
      const revenueImpact = priceDiff * this.simInputC!;
      this.simResult = {
        label: 'Price Change Impact',
        metrics: [
          { label: 'Price Difference', value: `${cur} ${priceDiff > 0 ? '+' : ''}${priceDiff.toLocaleString()}`, positive: priceDiff > 0 },
          { label: 'Monthly Revenue Change', value: `${cur} ${Math.round(revenueImpact).toLocaleString()}`, positive: revenueImpact > 0 }
        ],
        note: `Increasing unit price by ${cur} ${priceDiff.toLocaleString()} across ${this.simInputC!} sales adds ${cur} ${Math.round(revenueImpact).toLocaleString()} to monthly revenue.`
      };
    } else if (this.simScenario === 'cost') {
      const saving = this.simInputA! * (this.simInputB! / 100);
      this.simResult = {
        label: 'Cost Reduction Impact',
        metrics: [
          { label: 'Monthly Savings', value: `${cur} ${Math.round(saving).toLocaleString()}`, positive: true },
          { label: 'Annual Total Savings', value: `${cur} ${Math.round(saving * 12).toLocaleString()}`, positive: true }
        ],
        note: `Cutting costs by ${this.simInputB!}% saves ${cur} ${Math.round(saving).toLocaleString()} every month directly boosting your net profit.`
      };
    } else if (this.simScenario === 'revenue') {
      const targetRevenue = this.simInputA! * (1 + this.simInputB! / 100);
      const additionalRevenue = targetRevenue - this.simInputA!;
      const additionalProfit = additionalRevenue * (this.simInputC! / 100);
      this.simResult = {
        label: 'Revenue Target Result',
        metrics: [
          { label: 'New Target Revenue', value: `${cur} ${Math.round(targetRevenue).toLocaleString()}`, positive: true },
          { label: 'Additional Net Profit', value: `${cur} ${Math.round(additionalProfit).toLocaleString()}`, positive: true }
        ],
        note: `Achieving ${this.simInputB!}% growth adds ${cur} ${Math.round(additionalProfit).toLocaleString()} in profit at a ${this.simInputC!}% net margin.`
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
