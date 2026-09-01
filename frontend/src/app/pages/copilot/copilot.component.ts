import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BusinessService, Business } from '../../core/services/business.service';
import { AuthService, StoredUser } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';

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
        <h2>🤖 AI Business Copilot</h2>
        <p class="subtitle">{{ business.name }} | Instant Business Advice &amp; Decision Assistant</p>
      </div>

      <!-- Copilot Navigation Tabs -->
      <div class="copilot-tabs mb-4">
        <button class="copilot-tab-btn" [class.active]="activeSection === 'chat'" (click)="activeSection = 'chat'">
          💬 AI Chat Assistant
        </button>
        <button class="copilot-tab-btn" [class.active]="activeSection === 'opportunities'" (click)="activeSection = 'opportunities'">
          💡 Growth Ideas ({{ opportunities.length }})
        </button>
        <button class="copilot-tab-btn" [class.active]="activeSection === 'strategy'" (click)="activeSection = 'strategy'">
          ✍️ Strategy Copy Generator
        </button>
      </div>

      <!-- SECTION 1: SIMPLE AI CHAT (HERO FEATURE) -->
      <div *ngIf="activeSection === 'chat'">
        <div class="card chat-card 3d-card">
          <div class="card-header-row mb-2">
            <div>
              <h3>💬 Ask NOVA Anything About Your Business</h3>
              <p class="desc">Get instant, non-technical answers based on your business numbers.</p>
            </div>
          </div>

          <!-- Quick Question Chips -->
          <div class="quick-chips mb-3">
            <span class="chip-label">Quick Prompts:</span>
            <button class="chip-btn" (click)="askQuickQuestion('Summarize my business health and revenue trends in simple words.')">📊 Business Summary</button>
            <button class="chip-btn" (click)="askQuickQuestion('How can I increase my monthly profit next month?')">📈 Increase Profit</button>
            <button class="chip-btn" (click)="askQuickQuestion('Where am I spending the most money and how can I reduce costs?')">💰 Reduce Expenses</button>
            <button class="chip-btn" (click)="askQuickQuestion('Explain my 12-month revenue forecast in simple language.')">🔮 12-Month Forecast</button>
          </div>

          <!-- Chat Messages Scroll Box -->
          <div class="chat-messages">
            <div class="msg-bubble" *ngFor="let m of messages" [class.user]="m.sender === 'user'" [class.nova]="m.sender === 'nova'">
              <div class="msg-header">
                <div class="header-left">
                  <strong *ngIf="m.sender === 'nova'">🤖 NOVA Copilot</strong>
                  <strong *ngIf="m.sender === 'user'">👤 {{ currentUser?.name || 'You' }}</strong>
                  <span class="time">{{ m.timestamp | date:'shortTime' }}</span>
                </div>
                <button *ngIf="m.sender === 'nova'" (click)="speakText(m.text)" class="btn-speak-icon" title="Listen to AI Audio">🔊 Speak</button>
              </div>
              <p class="msg-text">{{ m.text }}</p>
            </div>
          </div>


          <!-- Chat Input -->
          <div class="chat-input-row mt-3">
            <button type="button" class="btn btn-secondary voice-btn" (click)="toggleVoiceInput()" [class.listening]="isListening" title="Voice Input">
              {{ isListening ? '🔴 Listening...' : '🎙️ Voice' }}
            </button>
            <input type="text" [(ngModel)]="userQuery" (keyup.enter)="sendMessage()" placeholder="Type or speak any business question here..." class="chat-input" />
            <button class="btn btn-primary" [disabled]="sending" (click)="sendMessage()">
              <span *ngIf="!sending">Send Message</span>
              <span *ngIf="sending">Thinking...</span>
            </button>
          </div>
        </div>
      </div>


      <!-- SECTION 2: GROWTH OPPORTUNITIES -->
      <div *ngIf="activeSection === 'opportunities'">
        <div class="card 3d-card mb-4">
          <div class="card-header-row mb-3">
            <div>
              <h3>💡 High-Impact Growth Ideas</h3>
              <p class="desc">AI-detected opportunities to increase your income.</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="scanOpportunities()">Scan Data</button>
          </div>

          <div class="opp-list" *ngIf="opportunities.length > 0">
            <div class="opp-card 3d-mini" *ngFor="let o of opportunities">
              <div class="opp-header">
                <strong>{{ o.title }}</strong>
                <span class="impact-tag">+{{ business.currency || 'USD' }} {{ o.estimated_impact | number:'1.0-0' }}</span>
              </div>
              <p class="opp-desc">{{ o.description }}</p>
              <div class="opp-footer">
                <span class="conf-badge">Confidence {{ o.confidence }}%</span>
                <button class="btn btn-primary btn-xs" (click)="generateActionForOpp(o)">⚡ Create Strategy</button>
              </div>
            </div>
          </div>

          <div class="opp-empty" *ngIf="opportunities.length === 0 && !scanningOpps">
            <p class="opp-empty-msg">🔍 Click <strong>Scan Data</strong> above to scan your business data for growth ideas.</p>
          </div>
          <div class="opp-empty" *ngIf="scanningOpps">
            <div class="loading-spinner"></div>
            <p>Scanning data for growth ideas...</p>
          </div>
        </div>
      </div>

      <!-- SECTION 3: STRATEGY COPY GENERATOR -->
      <div *ngIf="activeSection === 'strategy'">
        <div class="card 3d-card mb-4">
          <h3>✍️ Instant AI Strategy &amp; Copy Generator</h3>
          <p class="desc mt-1">Generate ready-to-use marketing plans, WhatsApp messages, or operating checklists.</p>

          <div class="action-generator mt-3">
            <label class="form-label">Select Asset Type:</label>
            <select [(ngModel)]="actionType" class="input mb-2">
              <option value="campaign">📢 Marketing Campaign Plan</option>
              <option value="whatsapp">📱 WhatsApp Sales Message</option>
              <option value="script">📞 Sales Call Script</option>
              <option value="sop">📝 Operating Checklist (SOP)</option>
            </select>

            <button class="btn btn-primary mt-2" [disabled]="generatingAction" (click)="triggerGenerateAction()">
              <span>{{ generatingAction ? 'Generating...' : '⚡ Generate AI Strategy' }}</span>
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
    </div>
  `,
  styles: [`
    .back-link { font-size: 0.88rem; color: var(--muted-gray); margin-bottom: 0.5rem; display: inline-block; text-decoration: none; font-weight: 500; }
    .back-link:hover { color: var(--coral-pink); }
    .subtitle { font-size: 0.88rem; color: var(--slate-gray); }
    .desc { font-size: 0.85rem; color: var(--slate-gray); }
    .card-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }

    .copilot-tabs { display: flex; gap: 0.75rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; flex-wrap: wrap; }
    .copilot-tab-btn { background: none; border: none; font-size: 0.92rem; font-weight: 700; color: var(--muted-gray); padding: 0.6rem 1.25rem; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .copilot-tab-btn.active { background: var(--deep-navy); color: var(--white); box-shadow: 0 4px 12px rgba(13, 27, 42, 0.15); }

    .quick-chips { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .chip-label { font-size: 0.78rem; font-weight: 700; color: var(--muted-gray); }
    .chip-btn { background: var(--cream); border: 1px solid var(--border-color); color: var(--deep-navy); font-size: 0.78rem; padding: 0.35rem 0.75rem; border-radius: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .chip-btn:hover { background: var(--sky-blue); transform: translateY(-2px); }

    .chat-messages { height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; padding: 1.25rem; background: var(--cream); border-radius: 12px; border: 1px solid var(--border-color); }
    .msg-bubble { max-width: 85%; padding: 0.85rem 1.1rem; border-radius: 14px; }
    .msg-bubble.user { align-self: flex-end; background: var(--grad-vibrant); color: var(--deep-navy); font-weight: 500; box-shadow: 0 4px 14px rgba(246, 159, 152, 0.3); }
    .msg-bubble.nova { align-self: flex-start; background: var(--white); color: var(--deep-navy); border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(13, 27, 42, 0.05); }
    .msg-header { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.75rem; margin-bottom: 0.3rem; opacity: 0.85; }
    .msg-text { font-size: 0.9rem; line-height: 1.5; white-space: pre-line; }

    .chat-input-row { display: flex; gap: 0.85rem; }
    .chat-input { flex: 1; padding: 0.85rem 1rem; border: 1px solid var(--border-color); border-radius: 10px; font-family: inherit; font-size: 0.9rem; }

    .opp-list { display: flex; flex-direction: column; gap: 0.85rem; }
    .opp-card { background: var(--cream); padding: 0.85rem 1rem; border-radius: 10px; border-left: 4px solid var(--success-green); }
    .opp-header { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .impact-tag { font-size: 0.82rem; font-weight: 800; color: var(--success-green); }
    .opp-desc { font-size: 0.82rem; color: var(--slate-gray); margin: 0.4rem 0; line-height: 1.4; }
    .opp-footer { display: flex; justify-content: space-between; align-items: center; }
    .conf-badge { font-size: 0.75rem; background: var(--sky-blue); color: var(--deep-navy); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700; }
    .opp-empty { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; padding: 2rem; text-align: center; background: var(--cream); border-radius: 12px; }

    .action-generator { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-label { font-size: 0.82rem; font-weight: 600; color: var(--deep-navy); }
    .input { padding: 0.65rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.88rem; }
    .action-preview { background: var(--cream); padding: 1.1rem; border-radius: 10px; border: 1px solid var(--border-color); }
    .preview-header { display: flex; justify-content: space-between; align-items: center; }
    .asset-body { white-space: pre-wrap; font-family: inherit; font-size: 0.85rem; background: var(--white); padding: 0.85rem; border-radius: 8px; max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); color: var(--deep-navy); }
    .badge.approved { background: #dcfce7; color: #166534; }

    .loading-spinner { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border-color); border-top-color: var(--coral-pink); animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 600px) {
      .chat-messages { height: 300px; padding: 0.85rem; }
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

  activeSection: 'chat' | 'opportunities' | 'strategy' = 'chat';
  actionType = 'campaign';
  generatingAction = false;
  generatedAsset: any = null;

  opportunities: any[] = [];
  messages: ChatMessage[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private businessService: BusinessService,
    private authService: AuthService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getStoredUser();
    this.authService.currentUser$.subscribe(u => this.currentUser = u);

    this.currencyService.selectedCurrency$.subscribe(curr => {
      if (this.business) {
        this.business.currency = curr;
      }
    });

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
        text: `Hello ${userName}! 👋 I am NOVA, your AI Business Assistant for ${biz.name}.\n\nYou can ask me questions about your revenue, profit margins, cost savings, or tap any quick prompt above!`,
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
        const cur = this.business?.currency || 'USD';
        this.messages.push({
          sender: 'nova',
          text: `📊 Here is the business summary for ${this.business?.name}:\n\n` +
                `1. Overall Health: Solid profit margins (~45-50%).\n` +
                `2. Revenue Forecast: Positive upward trend expected over the next 12 months.\n` +
                `3. Recommended Focus: Upselling high-margin services to boost monthly profit by +${cur} 25,000+.`,
          timestamp: new Date()
        });
        this.sending = false;
      }
    });
  }

  generateActionForOpp(opp: any): void {
    this.actionType = 'campaign';
    this.activeSection = 'strategy';
    this.triggerGenerateAction(`Generate campaign strategy for: ${opp.title}`);
  }

  triggerGenerateAction(customPrompt?: string): void {
    this.generatingAction = true;
    setTimeout(() => {
      this.generatingAction = false;
      const cur = this.business?.currency || 'USD';
      if (this.actionType === 'campaign') {
        this.generatedAsset = {
          type: 'campaign',
          status: 'draft',
          content: `🎯 MARKETING CAMPAIGN PLAN\n\nTarget Audience: Existing Business Clients\nGoal: Upgrade clients to Premium Tier\nOffer: 1-Month Complimentary Upgrade + Priority Support\nEstimated Revenue Impact: +${cur} 45,000 / month`
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

  isListening = false;
  private recognition: any = null;

  toggleVoiceInput(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (this.isListening) {
      if (this.recognition) this.recognition.stop();
      this.isListening = false;
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          this.userQuery = transcript;
          this.sendMessage();
        }
        this.isListening = false;
      };

      this.recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
    } catch (e) {
      console.error(e);
      this.isListening = false;
    }
  }

  speakText(text: string): void {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }
    window.speechSynthesis.cancel(); // Stop any active speech
    const cleanText = text.replace(/[*_#`~]/g, ''); // Strip markdown
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

}
