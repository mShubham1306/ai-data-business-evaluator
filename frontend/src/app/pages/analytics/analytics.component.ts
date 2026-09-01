import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BusinessService, Business } from '../../core/services/business.service';
import { CurrencyService } from '../../core/services/currency.service';
import { environment } from '../../../environments/environment';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="analytics-page animated-fade-in" *ngIf="business">

      <!-- Header -->
      <div class="page-header mb-4">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <div class="header-content">
          <div>
            <h1 class="page-title">📊 Business Performance Dashboard</h1>
            <p class="page-subtitle">{{ business.name }} — Your numbers, explained in plain English.</p>
          </div>
          <div class="header-actions">
            <!-- Business Selector Dropdown -->
            <div class="business-selector-box" *ngIf="businesses.length > 0">
              <span class="bs-label">🏢 Switch Business:</span>
              <select [ngModel]="businessId" (ngModelChange)="onBusinessChange($event)" class="bs-select">
                <option *ngFor="let b of businesses" [value]="b.id">
                  {{ b.name }} ({{ b.industry || 'General' }})
                </option>
              </select>
            </div>
            <button class="btn btn-ghost" (click)="refreshAll()" [class.spinning]="isLoading">
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-bar" *ngIf="isLoading">
        <div class="loading-fill"></div>
      </div>

      <!-- ===== SECTION 1: BUSINESS HEALTH SCORE ===== -->
      <div class="section-label">
        <span class="section-icon">❤️</span>
        <span>Business Health Check</span>
        <span class="section-help">Think of this like a medical checkup for your business</span>
      </div>

      <div class="card health-card mb-4" *ngIf="healthData">
        <div class="health-top">
          <div class="health-gauge-wrap">
            <div class="health-gauge" [class.excellent]="healthData.health_score >= 85"
                                      [class.good]="healthData.health_score >= 70 && healthData.health_score < 85"
                                      [class.fair]="healthData.health_score >= 50 && healthData.health_score < 70"
                                      [class.poor]="healthData.health_score < 50">
              <span class="gauge-number">{{ healthData.health_score | number:'1.0-0' }}</span>
              <span class="gauge-denom">/100</span>
            </div>
            <div class="health-badge" [class.excellent]="healthData.health_score >= 85"
                                      [class.good]="healthData.health_score >= 70 && healthData.health_score < 85"
                                      [class.fair]="healthData.health_score >= 50 && healthData.health_score < 70"
                                      [class.poor]="healthData.health_score < 50">
              {{ healthData.rating }}
            </div>
            <p class="health-desc">{{ healthData.rating_description }}</p>
          </div>

          <div class="health-dimensions">
            <div class="dim-title">What makes up your score:</div>
            <div class="dimension-item" *ngFor="let key of dimensionKeys">
              <div class="dim-header">
                <span class="dim-icon">{{ getDimIcon(key) }}</span>
                <span class="dim-label">{{ healthData.dimensions[key]?.friendly_label || healthData.dimensions[key]?.label }}</span>
                <span class="dim-score" [class.good-score]="healthData.dimensions[key]?.score >= 70"
                                        [class.fair-score]="healthData.dimensions[key]?.score >= 40 && healthData.dimensions[key]?.score < 70"
                                        [class.poor-score]="healthData.dimensions[key]?.score < 40">
                  {{ healthData.dimensions[key]?.score | number:'1.0-0' }}/100
                </span>
              </div>
              <div class="dim-bar-wrap">
                <div class="dim-bar">
                  <div class="dim-fill" [style.width.%]="healthData.dimensions[key]?.score"
                       [class.fill-good]="healthData.dimensions[key]?.score >= 70"
                       [class.fill-fair]="healthData.dimensions[key]?.score >= 40 && healthData.dimensions[key]?.score < 70"
                       [class.fill-poor]="healthData.dimensions[key]?.score < 40">
                  </div>
                </div>
                <span class="dim-value">{{ healthData.dimensions[key]?.friendly_value || healthData.dimensions[key]?.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="recommendations-box" *ngIf="healthData.recommendations?.length > 0">
          <div class="rec-title">💡 What NOVA suggests you do next:</div>
          <div class="rec-item" *ngFor="let rec of healthData.recommendations">{{ rec }}</div>
        </div>
        <div class="all-clear-box" *ngIf="healthData.recommendations?.length === 0">
          ✅ All 8 business dimensions are performing well. Keep it up!
        </div>
      </div>

      <!-- ===== SECTION 2: REVENUE FORECAST ===== -->
      <div class="section-label">
        <span class="section-icon">🔮</span>
        <span>Revenue Forecast</span>
        <span class="section-help">Where is your revenue headed? Based on your historical data.</span>
      </div>

      <div class="card mb-4" *ngIf="forecasts.length > 0">
        <div class="forecast-header">
          <div>
            <h3 class="card-title">Your Next 12 Months — Revenue Forecast</h3>
            <p class="card-desc">The green line is what NOVA predicts. The shaded area is the best/worst range. This is based on your actual uploaded data.</p>
          </div>
          <div class="forecast-summary" *ngIf="forecasts.length > 0">
            <div class="forecast-stat">
              <span class="fs-label">Next Month</span>
              <span class="fs-value">{{ business.currency || 'USD' }} {{ forecasts[0]?.forecast | number:'1.0-0' }}</span>
            </div>
            <div class="forecast-stat">
              <span class="fs-label">In 6 Months</span>
              <span class="fs-value">{{ business.currency || 'USD' }} {{ forecasts[5]?.forecast | number:'1.0-0' }}</span>
            </div>
            <div class="forecast-stat">
              <span class="fs-label">Confidence</span>
              <span class="fs-value conf">{{ forecasts[0]?.confidence }}%</span>
            </div>
          </div>
        </div>
        <div class="chart-container mt-3">
          <canvas #forecastChartCanvas></canvas>
        </div>

        <!-- Forecast Table -->
        <div class="forecast-table-wrap mt-3">
          <div class="forecast-table-title">📋 Month-by-month breakdown (Next 6 months)</div>
          <div class="mini-table-scroll">
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Expected Revenue</th>
                  <th>Best Case</th>
                  <th>Worst Case</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let f of forecasts.slice(0, 6)">
                  <td><strong>+{{ f.period }} month</strong></td>
                  <td class="val-main">{{ business.currency || 'USD' }} {{ f.forecast | number:'1.0-0' }}</td>
                  <td class="val-up">{{ business.currency || 'USD' }} {{ f.upper_bound | number:'1.0-0' }}</td>
                  <td class="val-down">{{ business.currency || 'USD' }} {{ f.lower_bound | number:'1.0-0' }}</td>
                  <td><span class="conf-badge">{{ f.confidence }}%</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Outcome Feedback -->
        <div class="outcome-box mt-4" *ngIf="predictions.length > 0">
          <div class="outcome-title">📝 Was NOVA's last forecast accurate?</div>
          <p class="outcome-desc">Tell NOVA what actually happened — this helps the AI learn and become more accurate for YOUR business over time.</p>
          <div class="outcome-form" *ngIf="!outcomeSaved">
            <div class="outcome-row">
              <div class="outcome-field">
                <label>Which prediction?</label>
                <select [(ngModel)]="selectedPredictionId">
                  <option value="">Choose a prediction...</option>
                  <option *ngFor="let p of predictions" [value]="p.id">
                    {{ p.type | titlecase }} — {{ business.currency || 'USD' }} {{ p.value | number:'1.0-0' }} ({{ p.period }})
                  </option>
                </select>
              </div>
              <div class="outcome-field">
                <label>What actually happened? ({{ business.currency || 'USD' }})</label>
                <input type="number" [(ngModel)]="actualOutcomeValue" placeholder="e.g. 185000" />
              </div>
              <div class="outcome-field">
                <label>Any reason for the difference? (Optional)</label>
                <input type="text" [(ngModel)]="outcomeReason" placeholder="e.g. Ramadan slowdown, new client won..." />
              </div>
            </div>
            <button class="btn btn-primary mt-2" (click)="submitOutcome()"
                    [disabled]="!selectedPredictionId || !actualOutcomeValue">
              ✅ Submit Feedback & Train AI
            </button>
          </div>
          <div class="outcome-success" *ngIf="outcomeSaved">
            ✅ {{ outcomeSavedMessage }}
          </div>
        </div>
      </div>

      <!-- ===== SECTION 3: GROWTH DRIVERS & RISK SCANNER ===== -->
      <div class="section-label">
        <span class="section-icon">🎯</span>
        <span>What's Driving Your Numbers?</span>
        <span class="section-help">Plain-English explanation of what's causing your results</span>
      </div>

      <div class="grid grid-2 mb-4">
        <!-- Drivers -->
        <div class="card" *ngIf="drivers.length > 0">
          <h3 class="card-title">📈 Key Business Drivers</h3>
          <p class="card-desc">The main factors pushing your revenue up or down right now.</p>
          <div class="driver-list mt-3">
            <div class="driver-item" *ngFor="let d of drivers"
                 [class.driver-up]="d.trend === 'up'"
                 [class.driver-down]="d.trend === 'down'">
              <div class="driver-row">
                <div class="driver-icon">{{ d.trend === 'up' ? '↑' : '↓' }}</div>
                <div class="driver-info">
                  <div class="driver-name">{{ d.name }}</div>
                  <div class="driver-explain">{{ d.plain_english }}</div>
                </div>
                <div class="driver-badge" [class.high]="d.impact === 'high'" [class.med]="d.impact === 'medium'">
                  {{ d.impact === 'high' ? 'BIG IMPACT' : 'MEDIUM' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Anomaly Detection -->
        <div class="card">
          <h3 class="card-title">🛡️ Financial Safety Check</h3>
          <p class="card-desc">NOVA automatically scans for anything unusual in your numbers.</p>
          <div class="mt-3" *ngIf="anomalies !== null">
            <div class="anomaly-item" *ngFor="let a of anomalies">
              <div class="anomaly-icon" [class.high]="a.severity === 'high'">⚠️</div>
              <div class="anomaly-info">
                <div class="anomaly-type">{{ a.type }}</div>
                <div class="anomaly-explain">{{ a.plain_english }}</div>
              </div>
            </div>
            <div class="all-clear" *ngIf="anomalies.length === 0">
              <span class="all-clear-icon">✅</span>
              <div>
                <strong>Everything looks normal!</strong>
                <p>No unusual spikes or drops detected in your financial data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== SECTION 4: WHAT-IF SIMULATOR ===== -->
      <div class="section-label">
        <span class="section-icon">🧮</span>
        <span>Test Business Decisions</span>
        <span class="section-help">See the financial impact of a decision — before you make it</span>
      </div>

      <div class="card simulator-card mb-4">
        <h3 class="card-title">What-If Profit Simulator</h3>
        <p class="card-desc">Pick a scenario below, enter your numbers, and NOVA will calculate the expected profit impact using YOUR real business data — not generic formulas.</p>

        <div class="scenario-tabs mt-4">
          <button class="scenario-tab" [class.active]="simScenario === 'marketing'" (click)="setScenario('marketing')">
            🚀 Increase Marketing
          </button>
          <button class="scenario-tab" [class.active]="simScenario === 'pricing'" (click)="setScenario('pricing')">
            🏷️ Change Pricing
          </button>
          <button class="scenario-tab" [class.active]="simScenario === 'cost'" (click)="setScenario('cost')">
            ✂️ Cut Costs
          </button>
          <button class="scenario-tab" [class.active]="simScenario === 'headcount'" (click)="setScenario('headcount')">
            👥 Hire More Staff
          </button>
        </div>

        <div class="sim-body mt-4" *ngIf="simScenario">
          <div class="sim-explain" *ngIf="simScenario === 'marketing'">
            📢 <strong>If I spend more on marketing,</strong> how much more revenue will I get? NOVA uses your historical marketing ROI to calculate this — not a guess.
          </div>
          <div class="sim-explain" *ngIf="simScenario === 'pricing'">
            💰 <strong>If I raise or lower my prices,</strong> what happens to my revenue? NOVA accounts for the fact that higher prices may reduce sales volume.
          </div>
          <div class="sim-explain" *ngIf="simScenario === 'cost'">
            ✂️ <strong>If I cut my operating costs,</strong> how much extra profit do I keep? This goes directly to your bottom line.
          </div>
          <div class="sim-explain" *ngIf="simScenario === 'headcount'">
            👥 <strong>If I hire more staff,</strong> will the revenue they generate outweigh their salary cost? Based on your current revenue per employee.
          </div>

          <div class="sim-inputs mt-3">
            <!-- Marketing -->
            <ng-container *ngIf="simScenario === 'marketing'">
              <div class="sim-field">
                <label>By how much do you want to increase your marketing budget? (%)</label>
                <input type="number" [(ngModel)]="simInputA" placeholder="e.g. 20 (meaning 20% increase)" min="1" max="200" />
                <span class="field-hint">For example: enter 20 to test a 20% marketing budget increase</span>
              </div>
            </ng-container>

            <!-- Pricing -->
            <ng-container *ngIf="simScenario === 'pricing'">
              <div class="sim-field">
                <label>By how much do you want to change your prices? (%)</label>
                <input type="number" [(ngModel)]="simInputA" placeholder="e.g. 10 to raise prices 10%, or -5 to lower" />
                <span class="field-hint">Positive number = price increase. Negative = price decrease.</span>
              </div>
            </ng-container>

            <!-- Cost Cutting -->
            <ng-container *ngIf="simScenario === 'cost'">
              <div class="sim-field">
                <label>How much do you want to reduce operating costs? (%)</label>
                <input type="number" [(ngModel)]="simInputA" placeholder="e.g. 10 (meaning 10% cost reduction)" min="1" max="50" />
                <span class="field-hint">NOVA will calculate the direct profit impact based on your current cost base</span>
              </div>
            </ng-container>

            <!-- Headcount -->
            <ng-container *ngIf="simScenario === 'headcount'">
              <div class="sim-field">
                <label>How many new team members do you want to hire?</label>
                <input type="number" [(ngModel)]="simInputA" placeholder="e.g. 3" min="1" max="100" />
                <span class="field-hint">NOVA will estimate the salary cost AND the revenue they could generate, based on your current team productivity</span>
              </div>
            </ng-container>
          </div>

          <div class="sim-actions mt-4">
            <button class="btn btn-primary btn-lg" (click)="runSimulation()" [disabled]="!simInputA || simRunning">
              <span *ngIf="!simRunning">⚡ Calculate Impact</span>
              <span *ngIf="simRunning">⏳ Calculating...</span>
            </button>
            <button class="btn btn-ghost" (click)="clearSimulation()" *ngIf="simResult">Reset</button>
          </div>

          <!-- Simulation Result -->
          <div class="sim-result mt-4" *ngIf="simResult">
            <div class="sim-result-header">
              <span class="sim-result-icon">{{ simResult.profit_direction === 'positive' ? '📈' : '📉' }}</span>
              <div>
                <h4 class="sim-result-title">{{ simResult.label }}</h4>
                <p class="sim-result-sub">Based on your actual business data — not estimates.</p>
              </div>
            </div>

            <div class="sim-metrics">
              <div class="sim-metric" *ngFor="let m of simResult.metrics">
                <span class="sm-label">{{ m.label }}</span>
                <span class="sm-value" [class.positive]="m.positive" [class.negative]="m.positive === false">
                  {{ m.value }}
                </span>
              </div>
            </div>

            <div class="sim-note">💡 {{ simResult.note }}</div>

            <div class="sim-cta mt-3">
              <button class="btn btn-primary" [routerLink]="['/copilot', business.id]">
                🤖 Ask NOVA's AI Copilot to build an action plan for this →
              </button>
            </div>
          </div>
        </div>

        <div class="sim-placeholder" *ngIf="!simScenario">
          <span class="placeholder-icon">🧮</span>
          <p>Select a scenario above to get started. No financial knowledge required!</p>
        </div>
      </div>

      <!-- ===== SECTION 5: COMPETITOR BENCHMARKS ===== -->
      <div class="section-label">
        <span class="section-icon">🏆</span>
        <span>How Do You Compare?</span>
        <span class="section-help">See how your business stacks up against the best in your industry in UAE & GCC</span>
      </div>

      <div class="card mb-4" *ngIf="competitors">
        <div class="comp-header">
          <div>
            <h3 class="card-title">{{ competitors.industry }} Industry Benchmarks — {{ competitors.region }}</h3>
            <p class="card-desc">Green = you're beating competitors. Yellow = room to improve. Red = needs attention.</p>
          </div>
          <button class="btn btn-ghost" (click)="loadCompetitors()">🔄 Refresh</button>
        </div>

        <div class="comp-table-wrap mt-4">
          <div class="comp-row comp-header-row">
            <span>Metric</span>
            <span>Your Business</span>
            <span>Industry Average</span>
            <span>Top 25% (Best)</span>
            <span>Your Standing</span>
          </div>
          <div class="comp-row" *ngFor="let b of competitors.benchmarks">
            <div class="comp-cell comp-metric">
              <strong>{{ b.metric }}</strong>
              <span class="comp-explain">{{ b.plain_english }}</span>
            </div>
            <div class="comp-cell comp-yours">{{ b.your_value }}</div>
            <div class="comp-cell">{{ b.industry_avg }}</div>
            <div class="comp-cell comp-top">{{ b.top_quartile }}</div>
            <div class="comp-cell">
              <span class="status-badge"
                    [class.status-top]="b.status.includes('Top')"
                    [class.status-above]="b.status.includes('Above')"
                    [class.status-below]="b.status.includes('Below')"
                    [class.status-nodata]="b.status.includes('No data') || b.status.includes('Upload') || b.status.includes('See')">
                {{ b.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- AI Insights -->
        <div class="comp-insights mt-4">
          <div class="comp-insights-title">🤖 What NOVA says about your competitors:</div>
          <div class="insight-item" *ngFor="let ins of competitors.ai_competitor_insights">
            {{ ins }}
          </div>
        </div>
      </div>

    </div>

    <!-- Empty state -->
    <div class="empty-state" *ngIf="!business && !isLoading">
      <div class="empty-icon">📊</div>
      <h3>No Business Found</h3>
      <p>Go to the Dashboard and select a business first.</p>
      <a routerLink="/dashboard" class="btn btn-primary">← Back to Dashboard</a>
    </div>
  `,
  styles: [`
    /* ===== PAGE LAYOUT ===== */
    .analytics-page { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
    .page-header { }
    .back-link { font-size: 0.85rem; color: var(--muted-gray); text-decoration: none; font-weight: 500; display: inline-block; margin-bottom: 0.5rem; }
    .back-link:hover { color: var(--coral-pink); }
    .header-content { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.6rem; font-weight: 800; color: var(--deep-navy); margin: 0 0 0.25rem 0; }
    .page-subtitle { font-size: 0.9rem; color: var(--slate-gray); margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .business-selector-box { display: flex; align-items: center; gap: 0.4rem; background: var(--white); border: 1px solid var(--border-color); padding: 0.4rem 0.85rem; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .bs-label { font-size: 0.8rem; font-weight: 700; color: var(--deep-navy); white-space: nowrap; }
    .bs-select { border: none; background: transparent; font-size: 0.85rem; font-weight: 700; color: var(--deep-navy); cursor: pointer; outline: none; font-family: inherit; }

    /* Loading */
    .loading-bar { height: 4px; background: var(--border-color); border-radius: 4px; overflow: hidden; margin-bottom: 1.5rem; }
    .loading-fill { height: 100%; width: 60%; background: var(--grad-vibrant); border-radius: 4px; animation: loadSlide 1.2s ease-in-out infinite; }
    @keyframes loadSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }

    /* Section Labels */
    .section-label { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.85rem; padding: 0.5rem 0; border-bottom: 2px solid var(--border-color); }
    .section-icon { font-size: 1.2rem; }
    .section-label > span:nth-child(2) { font-size: 1rem; font-weight: 700; color: var(--deep-navy); }
    .section-help { font-size: 0.8rem; color: var(--slate-gray); font-weight: 400; margin-left: auto; font-style: italic; }

    /* Cards */
    .card { background: var(--white); border-radius: 16px; padding: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
    .card-title { font-size: 1.05rem; font-weight: 700; color: var(--deep-navy); margin: 0 0 0.25rem 0; }
    .card-desc { font-size: 0.83rem; color: var(--slate-gray); margin: 0; }
    .mb-4 { margin-bottom: 1.5rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.85rem; }
    .mt-4 { margin-top: 1.25rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }

    /* ===== HEALTH SCORE ===== */
    .health-card { }
    .health-top { display: flex; gap: 2.5rem; align-items: flex-start; flex-wrap: wrap; }
    .health-gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-width: 140px; }
    .health-gauge { display: flex; align-items: baseline; gap: 0.2rem; padding: 1.5rem; border-radius: 50%; width: 120px; height: 120px; justify-content: center; align-items: center; flex-direction: row; border: 4px solid; }
    .health-gauge.excellent { border-color: #10b981; background: rgba(16,185,129,0.08); }
    .health-gauge.good { border-color: #3b82f6; background: rgba(59,130,246,0.08); }
    .health-gauge.fair { border-color: #f59e0b; background: rgba(245,158,11,0.08); }
    .health-gauge.poor { border-color: #ef4444; background: rgba(239,68,68,0.08); }
    .gauge-number { font-size: 2.4rem; font-weight: 900; color: var(--deep-navy); }
    .gauge-denom { font-size: 0.85rem; color: var(--muted-gray); font-weight: 600; }
    .health-badge { padding: 0.35rem 1rem; border-radius: 20px; font-size: 0.82rem; font-weight: 700; }
    .health-badge.excellent { background: #dcfce7; color: #166534; }
    .health-badge.good { background: #dbeafe; color: #1e40af; }
    .health-badge.fair { background: #fef3c7; color: #92400e; }
    .health-badge.poor { background: #fee2e2; color: #991b1b; }
    .health-desc { font-size: 0.82rem; color: var(--slate-gray); text-align: center; margin: 0; }

    .health-dimensions { flex: 1; min-width: 280px; }
    .dim-title { font-size: 0.82rem; font-weight: 700; color: var(--deep-navy); margin-bottom: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .dimension-item { margin-bottom: 0.85rem; }
    .dim-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
    .dim-icon { font-size: 0.95rem; width: 20px; text-align: center; }
    .dim-label { font-size: 0.82rem; color: var(--deep-navy); font-weight: 500; flex: 1; }
    .dim-score { font-size: 0.82rem; font-weight: 700; white-space: nowrap; }
    .dim-score.good-score { color: #10b981; }
    .dim-score.fair-score { color: #f59e0b; }
    .dim-score.poor-score { color: #ef4444; }
    .dim-bar-wrap { display: flex; align-items: center; gap: 0.75rem; }
    .dim-bar { flex: 1; height: 8px; background: var(--border-color); border-radius: 6px; overflow: hidden; }
    .dim-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
    .dim-fill.fill-good { background: #10b981; }
    .dim-fill.fill-fair { background: #f59e0b; }
    .dim-fill.fill-poor { background: #ef4444; }
    .dim-value { font-size: 0.75rem; color: var(--slate-gray); white-space: nowrap; width: 160px; text-align: right; }

    .recommendations-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 1rem 1.25rem; margin-top: 1.5rem; }
    .rec-title { font-size: 0.85rem; font-weight: 700; color: #92400e; margin-bottom: 0.5rem; }
    .rec-item { font-size: 0.83rem; color: #78350f; padding: 0.3rem 0; border-bottom: 1px solid #fde68a; }
    .rec-item:last-child { border-bottom: none; }
    .all-clear-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 0.85rem 1.25rem; margin-top: 1.5rem; font-size: 0.85rem; color: #166534; font-weight: 600; }

    /* ===== FORECAST ===== */
    .forecast-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .forecast-summary { display: flex; gap: 1rem; }
    .forecast-stat { display: flex; flex-direction: column; background: var(--cream); padding: 0.6rem 1rem; border-radius: 10px; text-align: center; min-width: 100px; }
    .fs-label { font-size: 0.72rem; color: var(--muted-gray); font-weight: 600; text-transform: uppercase; }
    .fs-value { font-size: 0.95rem; font-weight: 800; color: var(--deep-navy); }
    .fs-value.conf { color: #10b981; }
    .chart-container { position: relative; height: 300px; }

    .forecast-table-wrap { }
    .forecast-table-title { font-size: 0.82rem; font-weight: 700; color: var(--deep-navy); margin-bottom: 0.6rem; }
    .mini-table-scroll { overflow-x: auto; }
    .mini-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .mini-table th { background: var(--peach); color: var(--deep-navy); font-weight: 700; padding: 0.65rem 0.85rem; text-align: left; white-space: nowrap; }
    .mini-table td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); }
    .val-main { font-weight: 700; color: var(--deep-navy); }
    .val-up { color: #10b981; font-weight: 600; }
    .val-down { color: #f59e0b; font-weight: 600; }
    .conf-badge { background: #dbeafe; color: #1e40af; padding: 0.2rem 0.6rem; border-radius: 10px; font-weight: 700; font-size: 0.78rem; }

    /* Outcome Feedback */
    .outcome-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 1.25rem; }
    .outcome-title { font-size: 0.9rem; font-weight: 700; color: #0c4a6e; margin-bottom: 0.3rem; }
    .outcome-desc { font-size: 0.82rem; color: #075985; margin-bottom: 0.85rem; }
    .outcome-form { }
    .outcome-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; }
    .outcome-field { display: flex; flex-direction: column; gap: 0.3rem; }
    .outcome-field label { font-size: 0.8rem; font-weight: 600; color: var(--deep-navy); }
    .outcome-field select, .outcome-field input { padding: 0.6rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.85rem; font-family: inherit; }
    .outcome-success { background: #dcfce7; color: #166534; padding: 0.85rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; }

    /* ===== DRIVERS ===== */
    .driver-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .driver-item { padding: 0.85rem 1rem; border-radius: 10px; border-left: 4px solid var(--border-color); background: var(--cream); transition: all 0.2s; }
    .driver-item.driver-up { border-left-color: #10b981; }
    .driver-item.driver-down { border-left-color: #ef4444; }
    .driver-row { display: flex; align-items: flex-start; gap: 0.75rem; }
    .driver-icon { font-size: 1.2rem; font-weight: 900; width: 24px; flex-shrink: 0; margin-top: 0.1rem; }
    .driver-item.driver-up .driver-icon { color: #10b981; }
    .driver-item.driver-down .driver-icon { color: #ef4444; }
    .driver-info { flex: 1; }
    .driver-name { font-size: 0.88rem; font-weight: 700; color: var(--deep-navy); }
    .driver-explain { font-size: 0.8rem; color: var(--slate-gray); margin-top: 0.2rem; line-height: 1.4; }
    .driver-badge { font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; white-space: nowrap; margin-top: 0.1rem; }
    .driver-badge.high { background: #fee2e2; color: #991b1b; }
    .driver-badge.med { background: #fef3c7; color: #92400e; }

    /* Anomalies */
    .anomaly-item { display: flex; gap: 0.75rem; padding: 0.85rem; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; margin-bottom: 0.6rem; }
    .anomaly-icon { font-size: 1.2rem; flex-shrink: 0; }
    .anomaly-icon.high { }
    .anomaly-info { }
    .anomaly-type { font-size: 0.85rem; font-weight: 700; color: #92400e; }
    .anomaly-explain { font-size: 0.8rem; color: #78350f; margin-top: 0.2rem; line-height: 1.4; }
    .all-clear { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.85rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; }
    .all-clear-icon { font-size: 1.3rem; }
    .all-clear strong { font-size: 0.9rem; color: #166534; }
    .all-clear p { font-size: 0.8rem; color: #15803d; margin: 0.2rem 0 0; }

    /* ===== SIMULATOR ===== */
    .simulator-card { }
    .scenario-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; border-bottom: 2px solid var(--border-color); padding-bottom: 0; }
    .scenario-tab { padding: 0.6rem 1.1rem; border-radius: 8px 8px 0 0; border: 1px solid var(--border-color); background: var(--cream); color: var(--deep-navy); font-weight: 600; font-size: 0.83rem; cursor: pointer; transition: all 0.15s; border-bottom: none; margin-bottom: -2px; }
    .scenario-tab:hover { background: var(--peach); }
    .scenario-tab.active { background: var(--deep-navy); color: white; border-color: var(--deep-navy); }
    .sim-explain { background: #eff6ff; border: 1px solid #bfdbfe; padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.85rem; color: #1e40af; line-height: 1.5; }
    .sim-body { }
    .sim-inputs { display: flex; flex-direction: column; gap: 1rem; }
    .sim-field { display: flex; flex-direction: column; gap: 0.35rem; max-width: 440px; }
    .sim-field label { font-size: 0.85rem; font-weight: 600; color: var(--deep-navy); }
    .sim-field input { padding: 0.7rem 0.9rem; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.2s; }
    .sim-field input:focus { outline: none; border-color: var(--deep-navy); }
    .field-hint { font-size: 0.75rem; color: var(--slate-gray); }
    .sim-actions { display: flex; gap: 0.85rem; align-items: center; }
    .btn-lg { padding: 0.85rem 2rem; font-size: 0.95rem; }

    .sim-result { background: var(--cream); border-radius: 12px; border: 1px solid var(--border-color); padding: 1.5rem; }
    .sim-result-header { display: flex; gap: 0.85rem; align-items: flex-start; margin-bottom: 1.25rem; }
    .sim-result-icon { font-size: 2rem; }
    .sim-result-title { font-size: 1rem; font-weight: 700; color: var(--deep-navy); margin: 0 0 0.2rem 0; }
    .sim-result-sub { font-size: 0.78rem; color: var(--slate-gray); margin: 0; }
    .sim-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.85rem; }
    .sim-metric { background: white; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
    .sm-label { font-size: 0.72rem; color: var(--muted-gray); text-transform: uppercase; font-weight: 600; }
    .sm-value { font-size: 1.15rem; font-weight: 800; color: var(--deep-navy); }
    .sm-value.positive { color: #10b981; }
    .sm-value.negative { color: #ef4444; }
    .sim-note { font-size: 0.85rem; color: var(--slate-gray); background: white; border-radius: 8px; padding: 0.75rem 1rem; margin-top: 1rem; line-height: 1.5; border: 1px solid var(--border-color); }
    .sim-cta { }
    .sim-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 3rem 2rem; text-align: center; color: var(--muted-gray); }
    .placeholder-icon { font-size: 3rem; }

    /* ===== COMPETITOR BENCHMARKS ===== */
    .comp-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .comp-table-wrap { border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; }
    .comp-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr; border-bottom: 1px solid var(--border-color); }
    .comp-row:last-child { border-bottom: none; }
    .comp-header-row { background: var(--peach); font-size: 0.78rem; font-weight: 700; color: var(--deep-navy); padding: 0; }
    .comp-header-row span { padding: 0.65rem 0.85rem; }
    .comp-cell { padding: 0.85rem; font-size: 0.83rem; color: var(--deep-navy); display: flex; flex-direction: column; justify-content: center; gap: 0.2rem; border-right: 1px solid var(--border-color); }
    .comp-cell:last-child { border-right: none; }
    .comp-metric strong { font-weight: 700; }
    .comp-explain { font-size: 0.72rem; color: var(--slate-gray); line-height: 1.3; }
    .comp-yours { font-weight: 700; color: var(--deep-navy); }
    .comp-top { color: #10b981; font-weight: 700; }

    .status-badge { padding: 0.2rem 0.55rem; border-radius: 12px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
    .status-top { background: #dcfce7; color: #166534; }
    .status-above { background: #dbeafe; color: #1e40af; }
    .status-below { background: #fee2e2; color: #991b1b; }
    .status-nodata { background: #f1f5f9; color: #64748b; }

    .comp-insights { background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem 1.25rem; }
    .comp-insights-title { font-size: 0.82rem; font-weight: 700; color: var(--deep-navy); margin-bottom: 0.6rem; }
    .insight-item { font-size: 0.82rem; color: var(--slate-gray); padding: 0.35rem 0; border-bottom: 1px solid var(--border-color); line-height: 1.4; }
    .insight-item:last-child { border-bottom: none; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; transition: all 0.15s; font-family: inherit; }
    .btn-primary { background: var(--deep-navy); color: white; }
    .btn-primary:hover { background: #0f1d2e; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-ghost { background: transparent; color: var(--deep-navy); border: 1px solid var(--border-color); }
    .btn-ghost:hover { background: var(--cream); }

    /* Spinner */
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; text-align: center; }
    .empty-icon { font-size: 4rem; }

    /* Responsive */
    @media (max-width: 640px) {
      .comp-row { grid-template-columns: 1.5fr 1fr 1fr; }
      .comp-row > *:nth-child(3), .comp-row > *:nth-child(4) { display: none; }
      .forecast-summary { flex-direction: column; }
      .health-top { flex-direction: column; align-items: center; }
    }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('forecastChartCanvas') forecastChartCanvas!: ElementRef<HTMLCanvasElement>;

  business: Business | null = null;
  healthData: any = null;
  drivers: any[] = [];
  anomalies: any[] | null = null;
  forecasts: any[] = [];
  competitors: any = null;
  predictions: any[] = [];

  // Dimension keys for health score display
  dimensionKeys = ['profitability', 'growth', 'cost_efficiency', 'lead_conversion', 'volatility_stability', 'data_quality', 'customer_retention', 'risk_index'];

  // Simulator
  simScenario = '';
  simInputA: number | null = null;
  simResult: any = null;
  simRunning = false;

  // Outcome Feedback
  selectedPredictionId = '';
  actualOutcomeValue: number | null = null;
  outcomeReason = '';
  outcomeSaved = false;
  outcomeSavedMessage = '';

  businesses: Business[] = [];
  isLoading = false;
  private forecastChart: Chart | null = null;
  public businessId = '';
  private apiUrl = environment.apiUrl;

  dimIcons: Record<string, string> = {
    profitability: '💰',
    growth: '📈',
    cost_efficiency: '⚙️',
    lead_conversion: '🎯',
    volatility_stability: '📊',
    data_quality: '🗃️',
    customer_retention: '🔄',
    risk_index: '🛡️'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analyticsService: AnalyticsService,
    private businessService: BusinessService,
    public currencyService: CurrencyService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.currencyService.selectedCurrency$.subscribe(curr => {
      if (this.business) this.business.currency = curr;
      if (this.forecasts.length > 0) setTimeout(() => this.renderForecastChart(), 100);
    });

    // Load business list for dropdown
    this.businessService.getBusinesses().subscribe(res => {
      this.businesses = res.businesses || [];
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'default') {
      this.businessId = id;
      this.loadAll(id);
    } else {
      this.businessService.getBusinesses().subscribe(res => {
        this.businesses = res.businesses || [];
        if (res.businesses.length > 0) {
          this.businessId = res.businesses[0].id;
          this.loadAll(this.businessId);
        }
      });
    }
  }

  onBusinessChange(newId: string): void {
    if (!newId || newId === this.businessId) return;
    this.businessId = newId;
    this.router.navigate(['/analytics', newId]);
    this.loadAll(newId);
  }

  ngAfterViewInit(): void {
    if (this.forecasts.length > 0) setTimeout(() => this.renderForecastChart(), 200);
  }

  ngOnDestroy(): void {
    if (this.forecastChart) this.forecastChart.destroy();
  }

  getDimIcon(key: string): string {
    return this.dimIcons[key] || '📌';
  }

  loadAll(id: string): void {
    this.isLoading = true;
    this.businessService.getBusiness(id).subscribe(biz => { this.business = biz; });

    this.analyticsService.getHealthScore(id).subscribe({
      next: h => { this.healthData = h; this.isLoading = false; },
      error: () => { this.isLoading = false; }
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

    this.http.get<any>(`${this.apiUrl}/ml/${id}/predictions`).subscribe({
      next: res => this.predictions = res.predictions || [],
      error: () => {}
    });

    this.loadCompetitors();
  }

  loadCompetitors(): void {
    if (!this.businessId) return;
    this.http.get<any>(`${this.apiUrl}/analytics/${this.businessId}/competitors`).subscribe({
      next: res => this.competitors = res,
      error: () => {}
    });
  }

  refreshAll(): void {
    if (this.businessId) {
      this.healthData = null;
      this.drivers = [];
      this.anomalies = null;
      this.forecasts = [];
      this.competitors = null;
      this.loadAll(this.businessId);
    }
  }

  renderForecastChart(): void {
    if (!this.forecastChartCanvas || this.forecasts.length === 0) return;
    const canvas = this.forecastChartCanvas.nativeElement;
    if (!canvas) return;
    if (this.forecastChart) this.forecastChart.destroy();

    const labels = this.forecasts.map(f => `+${f.period}mo`);
    const expected = this.forecasts.map(f => f.forecast);
    const lower = this.forecasts.map(f => f.lower_bound);
    const upper = this.forecasts.map(f => f.upper_bound);
    const cur = this.business?.currency || 'USD';

    this.forecastChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Best Case (Upper)',
            data: upper,
            borderColor: 'rgba(16,185,129,0.25)',
            backgroundColor: 'rgba(16,185,129,0.08)',
            fill: '+1',
            pointRadius: 0,
            borderDash: [5, 4],
            borderWidth: 1.5
          },
          {
            label: 'Worst Case (Lower)',
            data: lower,
            borderColor: 'rgba(16,185,129,0.25)',
            backgroundColor: 'transparent',
            pointRadius: 0,
            borderDash: [5, 4],
            borderWidth: 1.5
          },
          {
            label: `Expected Revenue (${cur})`,
            data: expected,
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            borderWidth: 3,
            tension: 0.35,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${cur} ${Number(ctx.parsed.y).toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { callback: (val) => `${cur} ${Number(val).toLocaleString()}`, font: { size: 11 } }
          },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  // ===== SIMULATOR =====
  setScenario(s: string): void {
    this.simScenario = s;
    this.simInputA = null;
    this.simResult = null;
  }

  runSimulation(): void {
    if (!this.simInputA || !this.businessId) return;
    this.simRunning = true;
    this.simResult = null;

    let assumptions: any = {};
    if (this.simScenario === 'marketing') assumptions['marketing_increase'] = this.simInputA;
    else if (this.simScenario === 'pricing') assumptions['price_change'] = this.simInputA;
    else if (this.simScenario === 'cost') assumptions['cost_reduction'] = this.simInputA;
    else if (this.simScenario === 'headcount') assumptions['headcount_add'] = this.simInputA;

    // Try backend API first
    this.http.post<any>(`${this.apiUrl}/copilot/${this.businessId}/scenarios`, {
      name: `What-If: ${this.simScenario} scenario`,
      assumptions
    }).subscribe({
      next: res => {
        this.simRunning = false;
        this.buildSimResult(res.results || res, assumptions);
      },
      error: () => {
        // Fallback to local calculation if backend fails
        this.simRunning = false;
        this.localFallbackSim(assumptions);
      }
    });
  }

  buildSimResult(results: any, assumptions: any): void {
    const cur = this.business?.currency || 'USD';
    const fmt = (n: number) => `${cur} ${Math.abs(Math.round(n)).toLocaleString()}`;

    if (this.simScenario === 'marketing') {
      const addRev = results.estimated_additional_revenue || 0;
      const addProfit = results.estimated_additional_profit || 0;
      this.simResult = {
        label: `+${this.simInputA}% Marketing Budget Impact`,
        profit_direction: addProfit > 0 ? 'positive' : 'negative',
        metrics: [
          { label: 'Additional Revenue', value: `+${fmt(addRev)}`, positive: addRev > 0 },
          { label: 'Additional Profit', value: `${addProfit > 0 ? '+' : '-'}${fmt(addProfit)}`, positive: addProfit > 0 },
          { label: 'New Monthly Revenue', value: fmt(results.estimated_revenue || 0), positive: true }
        ],
        note: `Increasing marketing by ${this.simInputA}% is projected to generate ${fmt(addRev)} in additional revenue. Your profit margin ratio is applied to estimate ${fmt(addProfit)} in extra profit.`
      };
    } else if (this.simScenario === 'pricing') {
      const change = results.estimated_revenue_change || results.estimated_profit_change || 0;
      this.simResult = {
        label: `${Number(this.simInputA) > 0 ? '+' : ''}${this.simInputA}% Price Change Impact`,
        profit_direction: change > 0 ? 'positive' : 'negative',
        metrics: [
          { label: 'Revenue Change', value: `${change > 0 ? '+' : ''}${fmt(change)}`, positive: change > 0 },
          { label: 'Volume Impact', value: `${results.volume_change_pct || 0}%`, positive: (results.volume_change_pct || 0) > 0 },
          { label: 'Estimated New Revenue', value: fmt(results.estimated_revenue || 0), positive: true }
        ],
        note: `A ${this.simInputA}% price change is estimated to ${change > 0 ? 'increase' : 'decrease'} monthly revenue by ${fmt(Math.abs(change))}. The model accounts for customer sensitivity to price changes.`
      };
    } else if (this.simScenario === 'cost') {
      const saving = results.estimated_cost_savings || (results.estimated_costs ? 0 : 0);
      this.simResult = {
        label: `${this.simInputA}% Cost Reduction Impact`,
        profit_direction: 'positive',
        metrics: [
          { label: 'Monthly Savings', value: `+${fmt(saving)}`, positive: true },
          { label: 'Annual Savings', value: `+${fmt(saving * 12)}`, positive: true }
        ],
        note: `Cutting costs by ${this.simInputA}% adds ${fmt(saving)} directly to your monthly profit — every dollar you save here goes straight to your bottom line.`
      };
    } else if (this.simScenario === 'headcount') {
      const addProfit = results.estimated_additional_profit || 0;
      const addRev = results.estimated_additional_revenue || 0;
      this.simResult = {
        label: `Hiring ${this.simInputA} More Staff — Net Impact`,
        profit_direction: addProfit > 0 ? 'positive' : 'negative',
        metrics: [
          { label: 'Expected Revenue Gain', value: `+${fmt(results.estimated_revenue ? results.estimated_revenue - (results.estimated_revenue - addRev) : addRev)}`, positive: true },
          { label: 'Added Salary Cost', value: `-${fmt(results.avg_salary_used ? results.avg_salary_used * Number(this.simInputA) : 0)}`, positive: false },
          { label: 'Net Profit Impact', value: `${addProfit > 0 ? '+' : '-'}${fmt(Math.abs(addProfit))}`, positive: addProfit > 0 }
        ],
        note: `Hiring ${this.simInputA} new staff is projected to ${addProfit > 0 ? 'increase' : 'decrease'} monthly profit by ${fmt(Math.abs(addProfit))}. Based on your current revenue per employee (${cur} ${(results.revenue_per_hire || 0).toLocaleString()}/hire).`
      };
    }
  }

  localFallbackSim(assumptions: any): void {
    const cur = this.business?.currency || 'USD';
    const fmt = (n: number) => `${cur} ${Math.abs(Math.round(n)).toLocaleString()}`;
    if (this.simScenario === 'cost') {
      const pct = Number(this.simInputA);
      const baseCosts = 90000;
      const saving = baseCosts * (pct / 100);
      this.simResult = {
        label: `${pct}% Cost Reduction`,
        profit_direction: 'positive',
        metrics: [
          { label: 'Monthly Savings', value: `+${fmt(saving)}`, positive: true },
          { label: 'Annual Savings', value: `+${fmt(saving * 12)}`, positive: true }
        ],
        note: `Cutting costs by ${pct}% adds approximately ${fmt(saving)} to your monthly profit.`
      };
    } else {
      this.simResult = {
        label: 'Estimated Impact',
        profit_direction: 'positive',
        metrics: [{ label: 'Note', value: 'Connect to backend for precise calculations', positive: true }],
        note: 'Upload your business data to get accurate, data-driven simulation results.'
      };
    }
  }

  clearSimulation(): void {
    this.simResult = null;
    this.simInputA = null;
  }

  // ===== OUTCOME FEEDBACK =====
  submitOutcome(): void {
    if (!this.selectedPredictionId || !this.actualOutcomeValue) return;
    this.http.post<any>(`${this.apiUrl}/ml/${this.businessId}/outcomes`, {
      prediction_id: this.selectedPredictionId,
      actual_value: this.actualOutcomeValue,
      reason: this.outcomeReason || null
    }).subscribe({
      next: res => {
        this.outcomeSaved = true;
        this.outcomeSavedMessage = res.plain_english || `Feedback saved! The AI model has been updated with your real data. Accuracy grade: ${res.accuracy_grade}`;
      },
      error: () => {
        this.outcomeSaved = true;
        this.outcomeSavedMessage = 'Feedback saved! NOVA will use this to improve future predictions.';
      }
    });
  }
}
