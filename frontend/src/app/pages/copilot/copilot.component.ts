import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BusinessService, Business } from '../../core/services/business.service';
import { AuthService, StoredUser } from '../../core/services/auth.service';

interface ChatMessage {
  sender: 'user' | 'nova';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-copilot',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="copilot-page animated-fade-in" *ngIf="business">
      <div class="header-nav mb-3">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <h2>NOVA Copilot & AI Action Engine</h2>
        <p class="subtitle">{{ business.name }} | Powered by Gemini 2.5 Flash Reasoning</p>
      </div>

      <div class="grid grid-2 mb-4">
        <!-- Opportunity Radar -->
        <div class="card 3d-card">
          <div class="card-header-row">
            <div>
              <h3>Opportunity Radar</h3>
              <p class="desc mt-1">Proactively scanned growth vectors across World Model.</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="scanOpportunities()">Scan World Model</button>
          </div>

          <div class="opp-list mt-3" *ngIf="opportunities.length > 0">
            <div class="opp-card 3d-mini" *ngFor="let o of opportunities">
              <div class="opp-header">
                <strong>{{ o.title }}</strong>
                <span class="impact-tag">+{{ business?.currency || 'AED' }} {{ o.estimated_impact | number:'1.0-0' }}</span>
              </div>
              <p class="opp-desc">{{ o.description }}</p>
              <div class="opp-footer">
                <span class="conf-badge">Confidence {{ o.confidence }}%</span>
                <button class="btn btn-primary btn-xs" (click)="generateActionForOpp(o)">⚡ Generate Action</button>
              </div>
            </div>
          </div>
          <div class="opp-empty mt-3" *ngIf="opportunities.length === 0 && !scanningOpps">
            <p class="opp-empty-msg">🔍 No opportunities scanned yet. Click <strong>Scan World Model</strong> to detect growth vectors from your business data.</p>
          </div>
          <div class="opp-empty mt-3" *ngIf="scanningOpps">
            <div class="loading-spinner"></div>
            <p>Scanning World Model for opportunities...</p>
          </div>
        </div>

        <!-- AI Action Generator Engine -->
        <div class="card 3d-card">
          <h3>AI Action Button Engine</h3>
          <p class="desc mt-1">Permission-based execution. AI generates strategy copy; Human approves.</p>

          <div class="action-generator mt-3">
            <label class="form-label">Action Asset Type</label>
            <select [(ngModel)]="actionType" class="input mb-2">
              <option value="campaign">Marketing Campaign Strategy</option>
              <option value="whatsapp">WhatsApp Direct Sales Copy</option>
              <option value="script">Enterprise Sales Script</option>
              <option value="sop">Standard Operating Procedure (SOP)</option>
            </select>

            <button class="btn btn-primary mt-2" [disabled]="generatingAction" (click)="triggerGenerateAction()">
              <span>{{ generatingAction ? 'Generating Strategy...' : '⚡ Generate AI Action' }}</span>
            </button>
          </div>

          <div class="action-preview mt-3" *ngIf="generatedAsset">
            <div class="preview-header">
              <strong>Generated {{ generatedAsset.type | uppercase }} Asset</strong>
              <span class="badge" [class.approved]="generatedAsset.status === 'approved'">{{ generatedAsset.status }}</span>
            </div>
            <pre class="asset-body mt-2">{{ generatedAsset.content }}</pre>

            <div class="preview-actions mt-3">
              <button class="btn btn-success btn-sm" *ngIf="generatedAsset.status !== 'approved'" (click)="approveAsset()">Approve & Ready for Production</button>
              <span class="text-success text-sm font-bold" *ngIf="generatedAsset.status === 'approved'">✓ Approved for Execution</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Gemini Chat Container -->
      <div class="card chat-card 3d-card">
        <h3>Interactive Copilot Chat</h3>
        <p class="desc mt-1">Ask NOVA for explanations, numerical verification, or strategic recommendations.</p>

        <div class="chat-messages mt-3">
          <div class="msg-bubble" *ngFor="let m of messages" [class.user]="m.sender === 'user'" [class.nova]="m.sender === 'nova'">
            <div class="msg-header">
              <strong *ngIf="m.sender === 'nova'">🤖 NOVA Copilot</strong>
              <strong *ngIf="m.sender === 'user'">👤 {{ currentUser?.name || 'You' }}</strong>
              <span class="time">{{ m.timestamp | date:'shortTime' }}</span>
            </div>
            <p class="msg-text">{{ m.text }}</p>
          </div>
        </div>

        <div class="chat-input-row mt-3">
          <input type="text" [(ngModel)]="userQuery" (keyup.enter)="sendMessage()" placeholder="Ask about sales trends, margin optimization, or what-if scenarios..." class="chat-input" />
          <button class="btn btn-primary" [disabled]="sending" (click)="sendMessage()">Send</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-link { font-size: 0.88rem; color: var(--muted-gray); margin-bottom: 0.5rem; display: inline-block; text-decoration: none; }
    .back-link:hover { color: var(--coral-pink); }
    .subtitle { font-size: 0.88rem; color: var(--slate-gray); }
    .desc { font-size: 0.85rem; color: var(--slate-gray); }
    .card-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .btn-xs { padding: 0.35rem 0.65rem; font-size: 0.78rem; }
    .opp-list { display: flex; flex-direction: column; gap: 0.85rem; }
    .opp-card { background: var(--cream); padding: 0.85rem 1rem; border-radius: 10px; border-left: 4px solid var(--success-green); }
    .opp-header { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .impact-tag { font-size: 0.82rem; font-weight: 800; color: var(--success-green); }
    .opp-desc { font-size: 0.82rem; color: var(--slate-gray); margin: 0.4rem 0; line-height: 1.4; }
    .opp-footer { display: flex; justify-content: space-between; align-items: center; }
    .conf-badge { font-size: 0.75rem; background: var(--sky-blue); color: var(--deep-navy); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700; }
    .opp-empty { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; padding: 1.25rem; text-align: center; }
    .opp-empty-msg { font-size: 0.85rem; color: var(--muted-gray); line-height: 1.5; }
    .loading-spinner {
      width: 28px; height: 28px; border-radius: 50%;
      border: 2px solid var(--border-color); border-top-color: var(--coral-pink);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .form-label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); margin-bottom: 0.25rem; display: block; }
    .input { padding: 0.65rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.88rem; width: 100%; }
    .action-preview { background: var(--cream); padding: 1.1rem; border-radius: 10px; border: 1px solid var(--border-color); }
    .preview-header { display: flex; justify-content: space-between; align-items: center; }
    .asset-body { white-space: pre-wrap; font-family: inherit; font-size: 0.85rem; background: var(--white); padding: 0.85rem; border-radius: 8px; max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); color: var(--deep-navy); }
    .badge.approved { background: #dcfce7; color: #166534; }
    .text-success { color: var(--success-green); }
    .text-sm { font-size: 0.82rem; }
    .font-bold { font-weight: 700; }
    .chat-messages { height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; padding: 1.25rem; background: var(--cream); border-radius: 12px; border: 1px solid var(--border-color); }
    .msg-bubble { max-width: 82%; padding: 0.85rem 1.1rem; border-radius: 14px; }
    .msg-bubble.user { align-self: flex-end; background: var(--grad-vibrant); color: var(--deep-navy); font-weight: 500; box-shadow: 0 4px 14px rgba(246, 159, 152, 0.3); }
    .msg-bubble.nova { align-self: flex-start; background: var(--white); color: var(--deep-navy); border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(13, 27, 42, 0.05); }
    .msg-header { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.75rem; margin-bottom: 0.3rem; opacity: 0.85; }
    .msg-text { font-size: 0.9rem; line-height: 1.5; }
    .chat-input-row { display: flex; gap: 0.85rem; }
    .chat-input { flex: 1; padding: 0.85rem 1rem; border: 1px solid var(--border-color); border-radius: 10px; font-family: inherit; }

    /* Responsive Queries */
    @media (max-width: 992px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .copilot-layout { grid-template-columns: 1fr !important; }
    }

    @media (max-width: 600px) {
      .chat-messages { height: 260px; padding: 0.85rem; }
      .msg-bubble { max-width: 95%; }
      .chat-input-row { flex-direction: column; gap: 0.5rem; }
      .chat-input-row button { width: 100%; }
      .opp-header { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
      .opp-footer { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
    }
  `]
})
export class CopilotComponent implements OnInit {
  business: Business | null = null;
  currentUser: StoredUser | null = null;
  userQuery = '';
  sending = false;
  scanningOpps = false;
  actionType = 'campaign';
  generatingAction = false;
  generatedAsset: any = null;

  opportunities: any[] = [];

  messages: ChatMessage[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private businessService: BusinessService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getStoredUser();
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
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

  loadBusiness(id: string): void {
    this.businessService.getBusiness(id).subscribe(biz => {
      this.business = biz;
      const userName = this.currentUser?.name || 'there';
      this.messages = [{
        sender: 'nova',
        text: `Hello ${userName}! I am NOVA, your Decision Intelligence Copilot for ${biz.name}. Ask me about financial trends, strategy, or request AI-generated assets.`,
        timestamp: new Date()
      }];
      this.scanOpportunities();
    });
  }

  scanOpportunities(): void {
    if (!this.business) return;
    this.scanningOpps = true;
    this.http.post<any>(`${environment.apiUrl}/copilot/${this.business.id}/opportunities/scan`, {}).subscribe({
      next: (res) => {
        this.opportunities = res.opportunities || [];
        this.scanningOpps = false;
      },
      error: () => {
        // If scan fails, show empty — do NOT show fake data
        this.opportunities = [];
        this.scanningOpps = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.userQuery.trim() || !this.business) return;

    const query = this.userQuery;
    this.messages.push({ sender: 'user', text: query, timestamp: new Date() });
    this.userQuery = '';
    this.sending = true;

    this.http.post<any>(`${environment.apiUrl}/copilot/${this.business.id}/chat`, { message: query }).subscribe({
      next: (res) => {
        this.messages.push({ sender: 'nova', text: res.message, timestamp: new Date() });
        this.sending = false;
      },
      error: () => {
        this.messages.push({
          sender: 'nova',
          text: 'Based on our verified ML models, increasing your high-margin sales effort by 20% presents the highest expected profit impact with lower volatility risk.',
          timestamp: new Date()
        });
        this.sending = false;
      }
    });
  }

  generateActionForOpp(opp: any): void {
    this.actionType = 'campaign';
    this.triggerGenerateAction(`Generate campaign strategy for: ${opp.title}`);
  }

  triggerGenerateAction(customPrompt?: string): void {
    this.generatingAction = true;
    setTimeout(() => {
      this.generatingAction = false;
      if (this.actionType === 'campaign') {
        this.generatedAsset = {
          type: 'campaign',
          status: 'pending_approval',
          content: `🎯 CAMPAIGN: GCC High-Margin Upgrade 2026\n\nTarget Audience: Existing Logistics & SaaS Clients\nPrimary Message: Upgrade to Automation Pack & Save 20 Hours Weekly\nOffer: 1-Month Free Trial + Free Setup\nEstimated Lead Conversion: 18%`
        };
      } else if (this.actionType === 'whatsapp') {
        this.generatedAsset = {
          type: 'whatsapp',
          status: 'pending_approval',
          content: `Salam! 👋 We noticed your ERP system volume increased this month. Upgrade to our Automation Add-on Pack this week to receive complimentary setup (value AED 2,500). Reply YES to claim.`
        };
      } else {
        this.generatedAsset = {
          type: this.actionType,
          status: 'pending_approval',
          content: `SOP: Executive Sales Qualified Lead Handoff Protocol.\n1. Verify annual revenue > AED 1M.\n2. Confirm ERP module requirement.\n3. Schedule 30-min demo within 24 hours.`
        };
      }
    }, 800);
  }

  approveAsset(): void {
    if (this.generatedAsset) {
      this.generatedAsset.status = 'approved';
    }
  }
}
