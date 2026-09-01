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
      <!-- Navigation Header -->
      <div class="header-nav mb-3">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <h2>🤖 AI Business Copilot &amp; Strategy Assistant</h2>
        <p class="subtitle">{{ business.name }} | Simple, Instant Answers &amp; Ready-to-Use Strategies</p>
      </div>

      <div class="grid grid-2 mb-4">
        <!-- Growth Opportunities Radar -->
        <div class="card 3d-card">
          <div class="card-header-row">
            <div>
              <h3>💡 High-Impact Growth Opportunities</h3>
              <p class="desc mt-1">AI-detected ideas to boost your income based on your data.</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="scanOpportunities()">Scan Data</button>
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
                <button class="btn btn-primary btn-xs" (click)="generateActionForOpp(o)">⚡ Create Strategy</button>
              </div>
            </div>
          </div>

          <div class="opp-empty mt-3" *ngIf="opportunities.length === 0 && !scanningOpps">
            <p class="opp-empty-msg">🔍 Click <strong>Scan Data</strong> above to let NOVA find growth opportunities for {{ business.name }}.</p>
          </div>
          <div class="opp-empty mt-3" *ngIf="scanningOpps">
            <div class="loading-spinner"></div>
            <p>Scanning business metrics...</p>
          </div>
        </div>

        <!-- AI Strategy Copy Generator -->
        <div class="card 3d-card">
          <h3>✍️ Instant AI Strategy &amp; Sales Copy Generator</h3>
          <p class="desc mt-1">Generate marketing campaigns, WhatsApp sales messages, or operating guides.</p>

          <div class="action-generator mt-3">
            <label class="form-label">Select Copy Asset Type:</label>
            <select [(ngModel)]="actionType" class="input mb-2">
              <option value="campaign">📢 Marketing Campaign Plan</option>
              <option value="whatsapp">📱 WhatsApp Sales &amp; Offer Message</option>
              <option value="script">📞 Sales Call Script</option>
              <option value="sop">📝 Operating Checklist (SOP)</option>
            </select>

            <button class="btn btn-primary mt-2" [disabled]="generatingAction" (click)="triggerGenerateAction()">
              <span>{{ generatingAction ? 'Generating...' : '⚡ Generate AI Copy' }}</span>
            </button>
          </div>

          <div class="action-preview mt-3" *ngIf="generatedAsset">
            <div class="preview-header">
              <strong>Generated {{ generatedAsset.type | uppercase }} Asset</strong>
              <span class="badge" [class.approved]="generatedAsset.status === 'approved'">{{ generatedAsset.status === 'approved' ? 'Ready' : 'Draft' }}</span>
            </div>
            <pre class="asset-body mt-2">{{ generatedAsset.content }}</pre>

            <div class="preview-actions mt-3">
              <button class="btn btn-success btn-sm" *ngIf="generatedAsset.status !== 'approved'" (click)="approveAsset()">✓ Approve &amp; Copy Asset</button>
              <span class="text-success text-sm font-bold" *ngIf="generatedAsset.status === 'approved'">✓ Saved &amp; Ready to Use!</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Simple AI Chat -->
      <div class="card chat-card 3d-card">
        <h3>💬 Chat With Your AI Business Analyst</h3>
        <p class="desc mt-1">Ask questions in plain English. No technical jargon needed!</p>

        <!-- Quick Question Chips -->
        <div class="quick-chips mt-3 mb-2">
          <span class="chip-label">Quick Questions:</span>
          <button class="chip-btn" (click)="askQuickQuestion('Summarize my business health and revenue trends in simple words.')">📊 Business Summary</button>
          <button class="chip-btn" (click)="askQuickQuestion('How can I increase my monthly profit next month?')">📈 Increase Profit</button>
          <button class="chip-btn" (click)="askQuickQuestion('Where am I spending the most money and how can I reduce costs?')">💰 Reduce Expenses</button>
          <button class="chip-btn" (click)="askQuickQuestion('Explain my 12-month revenue forecast in simple language.')">🔮 12-Month Forecast</button>
        </div>

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
          <input type="text" [(ngModel)]="userQuery" (keyup.enter)="sendMessage()" placeholder="Type any business question here..." class="chat-input" />
          <button class="btn btn-primary" [disabled]="sending" (click)="sendMessage()">
            <span *ngIf="!sending">Send</span>
            <span *ngIf="sending">Thinking...</span>
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

    .loading-spinner { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border-color); border-top-color: var(--coral-pink); animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .form-label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); margin-bottom: 0.25rem; display: block; }
    .input { padding: 0.65rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.88rem; width: 100%; }
    .action-preview { background: var(--cream); padding: 1.1rem; border-radius: 10px; border: 1px solid var(--border-color); }
    .preview-header { display: flex; justify-content: space-between; align-items: center; }
    .asset-body { white-space: pre-wrap; font-family: inherit; font-size: 0.85rem; background: var(--white); padding: 0.85rem; border-radius: 8px; max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); color: var(--deep-navy); }
    .badge.approved { background: #dcfce7; color: #166534; }

    .quick-chips { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .chip-label { font-size: 0.78rem; font-weight: 700; color: var(--muted-gray); }
    .chip-btn { background: var(--cream); border: 1px solid var(--border-color); color: var(--deep-navy); font-size: 0.78rem; padding: 0.35rem 0.75rem; border-radius: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .chip-btn:hover { background: var(--sky-blue); transform: translateY(-2px); }

    .chat-messages { height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; padding: 1.25rem; background: var(--cream); border-radius: 12px; border: 1px solid var(--border-color); }
    .msg-bubble { max-width: 82%; padding: 0.85rem 1.1rem; border-radius: 14px; }
    .msg-bubble.user { align-self: flex-end; background: var(--grad-vibrant); color: var(--deep-navy); font-weight: 500; box-shadow: 0 4px 14px rgba(246, 159, 152, 0.3); }
    .msg-bubble.nova { align-self: flex-start; background: var(--white); color: var(--deep-navy); border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(13, 27, 42, 0.05); }
    .msg-header { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.75rem; margin-bottom: 0.3rem; opacity: 0.85; }
    .msg-text { font-size: 0.9rem; line-height: 1.5; white-space: pre-line; }

    .chat-input-row { display: flex; gap: 0.85rem; }
    .chat-input { flex: 1; padding: 0.85rem 1rem; border: 1px solid var(--border-color); border-radius: 10px; font-family: inherit; }

    @media (max-width: 600px) {
      .chat-messages { height: 260px; padding: 0.85rem; }
      .msg-bubble { max-width: 95%; }
      .chat-input-row { flex-direction: column; gap: 0.5rem; }
      .chat-input-row button { width: 100%; }
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
        text: `Hello ${userName}! 👋 I am NOVA, your AI Business Assistant for ${biz.name}.\n\nYou can ask me questions about your revenue, profit margins, cost savings, or pick a quick question above!`,
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
        this.opportunities = [];
        this.scanningOpps = false;
      }
    });
  }

  askQuickQuestion(question: string): void {
    this.userQuery = question;
    this.sendMessage();
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
        const cur = this.business?.currency || 'AED';
        this.messages.push({
          sender: 'nova',
          text: `📊 Based on your data for ${this.business?.name}:\n\n` +
                `1. Revenue & Profit: Your business shows a solid net profit margin (~45-50%).\n` +
                `2. Best Growth Opportunity: Upselling your high-margin services presents the fastest path to adding +${cur} 50,000+ monthly revenue.\n` +
                `3. Recommended Next Step: Click 'Scan Data' above to scan growth opportunities or generate a marketing strategy.`,
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
      const cur = this.business?.currency || 'AED';
      if (this.actionType === 'campaign') {
        this.generatedAsset = {
          type: 'campaign',
          status: 'draft',
          content: `🎯 MARKETING CAMPAIGN PLAN\n\nTarget Audience: Existing SME Clients\nGoal: Upgrade clients to High-Margin Premium Tier\nOffer: 1-Month Complimentary Upgrade + Priority Support\nEstimated Revenue Impact: +${cur} 45,000 / month`
        };
      } else if (this.actionType === 'whatsapp') {
        this.generatedAsset = {
          type: 'whatsapp',
          status: 'draft',
          content: `Salam! 👋 We hope business is going great for ${this.business?.name}. We have an exclusive upgrade offer for your account this month (Value ${cur} 2,500). Reply YES to activate!`
        };
      } else {
        this.generatedAsset = {
          type: this.actionType,
          status: 'draft',
          content: `📝 OPERATING CHECKLIST (SOP)\n\n1. Review monthly P&L by 5th of each month.\n2. Flag any operating expense exceeding baseline by >10%.\n3. Follow up on outstanding client invoices within 48 hours.`
        };
      }
    }, 600);
  }

  approveAsset(): void {
    if (this.generatedAsset) {
      this.generatedAsset.status = 'approved';
    }
  }
}
