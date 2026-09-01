import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-wrapper">

      <!-- ===== STICKY NAV ===== -->
      <nav class="land-nav">
        <div class="land-nav-inner">
          <div class="land-brand">
            <div class="land-logo">▲</div>
            <span class="land-logo-text">NOVA</span>
            <span class="land-logo-sub">AI Business Analyst</span>
          </div>
          <div class="land-nav-links">
            <a href="#features" class="land-nav-link">Features</a>
            <a href="#how-it-works" class="land-nav-link">How It Works</a>
            <a href="#stats" class="land-nav-link">Results</a>
            <a routerLink="/auth" class="land-signin-btn">Sign In</a>
            <a routerLink="/auth" class="land-cta-btn">Get Started Free →</a>
          </div>
        </div>
      </nav>

      <!-- ===== HERO ===== -->
      <section class="hero-section">
        <div class="hero-bg-orbs">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>
        </div>

        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            AI + ML Decision Intelligence · GCC & UAE SME Platform
          </div>

          <h1 class="hero-title">
            Transform Your Business<br/>
            <span class="gradient-text">With AI That Thinks</span><br/>
            Like a CFO
          </h1>

          <p class="hero-subtitle">
            NOVA combines real-time ML models, Gemini AI reasoning, and 4-layer
            verified analytics to give UAE & GCC SMEs the decision intelligence
            previously available only to Fortune 500 companies.
          </p>

          <div class="hero-actions">
            <a routerLink="/auth" class="btn-hero-primary">
              <span>🚀 Start Free Analysis</span>
            </a>
            <a href="#how-it-works" class="btn-hero-secondary">
              Watch How It Works →
            </a>
          </div>

          <div class="hero-trust">
            <div class="trust-item">
              <span class="trust-icon">✅</span>
              <span>No credit card required</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">⚡</span>
              <span>Instant AI insights</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">🔒</span>
              <span>Bank-grade data security</span>
            </div>
          </div>
        </div>

        <!-- Hero Dashboard Preview -->
        <div class="hero-visual">
          <div class="dashboard-mock">
            <div class="mock-header">
              <div class="mock-dot red"></div>
              <div class="mock-dot yellow"></div>
              <div class="mock-dot green"></div>
              <span class="mock-title">NOVA · Decision Engine</span>
            </div>
            <div class="mock-body">
              <div class="mock-stat-row">
                <div class="mock-stat">
                  <div class="mock-stat-label">Health Score</div>
                  <div class="mock-stat-value" style="color:#22C55E">87.4</div>
                  <div class="mock-stat-sub">Excellent</div>
                </div>
                <div class="mock-stat">
                  <div class="mock-stat-label">Forecast Revenue</div>
                  <div class="mock-stat-value" style="color:#5EE1F1">AED 4.2M</div>
                  <div class="mock-stat-sub">+18% YoY</div>
                </div>
                <div class="mock-stat">
                  <div class="mock-stat-label">Net Profit Impact</div>
                  <div class="mock-stat-value" style="color:#F69F98">+145K</div>
                  <div class="mock-stat-sub">3 opportunities</div>
                </div>
              </div>
              <div class="mock-bars">
                <div class="mock-bar-row" *ngFor="let b of mockBars">
                  <span class="mock-bar-label">{{ b.label }}</span>
                  <div class="mock-bar-track">
                    <div class="mock-bar-fill" [style.width]="b.width" [style.background]="b.color"></div>
                  </div>
                  <span class="mock-bar-val">{{ b.value }}</span>
                </div>
              </div>
              <div class="mock-ai-msg">
                <span class="mock-ai-icon">🤖</span>
                <span>NOVA: Your ERP line has 65% margin. Reallocating AED 10K budget yields +AED 48K net profit...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== STATS BAR ===== -->
      <section class="stats-section" id="stats">
        <div class="stats-inner">
          <div class="stat-item" *ngFor="let s of statsData">
            <div class="stat-num">{{ s.num }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
          </div>
        </div>
      </section>

      <!-- ===== FEATURES ===== -->
      <section class="features-section" id="features">
        <div class="section-header">
          <div class="section-badge">Platform Features</div>
          <h2 class="section-title">Everything Your Business Needs<br/><span class="gradient-text">to Make Smarter Decisions</span></h2>
          <p class="section-sub">Four layers of intelligence working together to give you verified, actionable insights in real time.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card" *ngFor="let f of features">
            <div class="feature-icon-box" [style.background]="f.iconBg">
              <span class="feature-icon">{{ f.icon }}</span>
            </div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
            <div class="feature-tags">
              <span class="ftag" *ngFor="let t of f.tags">{{ t }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== HOW IT WORKS ===== -->
      <section class="how-section" id="how-it-works">
        <div class="section-header">
          <div class="section-badge">Simple Process</div>
          <h2 class="section-title">From Data to Decision<br/><span class="gradient-text">in 4 Steps</span></h2>
        </div>
        <div class="steps-row">
          <div class="step-card" *ngFor="let step of steps; let i = index">
            <div class="step-number">{{ i + 1 }}</div>
            <div class="step-icon">{{ step.icon }}</div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-desc">{{ step.desc }}</p>
          </div>
        </div>
      </section>

      <!-- ===== TRUST LAYERS ===== -->
      <section class="trust-section">
        <div class="trust-inner">
          <div class="trust-copy">
            <div class="section-badge">4-Layer Verification</div>
            <h2 class="section-title">Built on Trust.<br/><span class="gradient-text">Verified at Every Layer.</span></h2>
            <p class="section-sub">Unlike other AI tools that produce hallucinated numbers, NOVA verifies every output through a rigorous 4-layer trust architecture before showing you results.</p>
            <a routerLink="/auth" class="btn-hero-primary mt-4" style="display:inline-flex">Start Building Trust →</a>
          </div>
          <div class="trust-layers">
            <div class="trust-layer-card" *ngFor="let layer of trustLayers">
              <div class="layer-num">{{ layer.num }}</div>
              <div class="layer-content">
                <div class="layer-title">{{ layer.title }}</div>
                <div class="layer-desc">{{ layer.desc }}</div>
              </div>
              <div class="layer-badge" [style.background]="layer.color">{{ layer.status }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== CTA ===== -->
      <section class="cta-section">
        <div class="cta-inner">
          <div class="cta-orb cta-orb-1"></div>
          <div class="cta-orb cta-orb-2"></div>
          <h2 class="cta-title">Ready to Unlock Your Business Potential?</h2>
          <p class="cta-sub">Join hundreds of UAE & GCC SMEs making smarter decisions with NOVA AI. Set up your first business profile in under 5 minutes.</p>
          <div class="cta-actions">
            <a routerLink="/auth" class="btn-hero-primary">
              🚀 Create Free Account
            </a>
            <a routerLink="/auth" class="btn-hero-ghost">
              Sign In to Existing Account
            </a>
          </div>
        </div>
      </section>

      <!-- ===== FOOTER ===== -->
      <footer class="land-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <div class="land-logo small">▲</div>
            <span class="land-logo-text">NOVA</span>
          </div>
          <p class="footer-copy">© 2026 NOVA AI Business Analyst. Built for UAE & GCC Entrepreneurs.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    /* ── Root ── */
    .landing-wrapper {
      min-height: 100vh;
      background: #0D1B2A;
      color: #E2E8F0;
      font-family: 'Poppins', 'Inter', sans-serif;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(94, 225, 241, 0.3) #0D1B2A;
    }
    .landing-wrapper::-webkit-scrollbar {
      width: 6px;
    }
    .landing-wrapper::-webkit-scrollbar-track {
      background: #0D1B2A;
    }
    .landing-wrapper::-webkit-scrollbar-thumb {
      background: rgba(94, 225, 241, 0.3);
      border-radius: 3px;
    }

    /* ── Nav ── */
    .land-nav {
      position: sticky;
      top: 0;
      z-index: 200;
      background: rgba(13, 27, 42, 0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(94, 225, 241, 0.15);
    }
    .land-nav-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .land-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .land-logo {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F69F98, #5EE1F1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: #0D1B2A;
      font-size: 1rem;
      box-shadow: 0 0 20px rgba(94, 225, 241, 0.4);
      animation: navGlow 3s ease-in-out infinite;
    }
    .land-logo.small { width: 28px; height: 28px; font-size: 0.8rem; }
    @keyframes navGlow {
      0%, 100% { box-shadow: 0 0 15px rgba(94, 225, 241, 0.4); }
      50% { box-shadow: 0 0 30px rgba(246, 159, 152, 0.7); }
    }
    .land-logo-text {
      font-size: 1.4rem;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 0.05em;
    }
    .land-logo-sub {
      font-size: 0.7rem;
      color: #5EE1F1;
      font-weight: 500;
    }
    .land-nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .land-nav-link {
      color: #94A3B8;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    .land-nav-link:hover { color: #5EE1F1; }
    .land-signin-btn {
      color: #E2E8F0;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 0.45rem 1rem;
      border: 1px solid rgba(226, 232, 240, 0.25);
      border-radius: 8px;
      transition: all 0.2s;
    }
    .land-signin-btn:hover {
      border-color: #5EE1F1;
      color: #5EE1F1;
    }
    .land-cta-btn {
      background: linear-gradient(135deg, #F69F98, #5EE1F1);
      color: #0D1B2A;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 0.55rem 1.2rem;
      border-radius: 8px;
      transition: all 0.25s;
      box-shadow: 0 4px 14px rgba(246, 159, 152, 0.35);
    }
    .land-cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(246, 159, 152, 0.55);
    }

    /* ── Hero ── */
    .hero-section {
      min-height: 92vh;
      display: flex;
      align-items: center;
      gap: 4rem;
      max-width: 1280px;
      margin: 0 auto;
      padding: 5rem 2.5rem 4rem;
      position: relative;
    }
    .hero-bg-orbs {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.18;
    }
    .orb-1 {
      width: 500px;
      height: 500px;
      background: #5EE1F1;
      top: -100px;
      right: -100px;
      animation: orbFloat 8s ease-in-out infinite;
    }
    .orb-2 {
      width: 350px;
      height: 350px;
      background: #F69F98;
      bottom: 50px;
      left: -50px;
      animation: orbFloat 10s ease-in-out infinite reverse;
    }
    .orb-3 {
      width: 250px;
      height: 250px;
      background: #8B5CF6;
      top: 40%;
      left: 40%;
      animation: orbFloat 12s ease-in-out infinite;
    }
    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -30px) scale(1.05); }
    }
    .hero-content {
      flex: 1;
      position: relative;
      z-index: 2;
      min-width: 0;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(94, 225, 241, 0.1);
      border: 1px solid rgba(94, 225, 241, 0.3);
      color: #5EE1F1;
      padding: 0.45rem 1rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      margin-bottom: 1.75rem;
      animation: fadeInUp 0.5s ease forwards;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #5EE1F1;
      box-shadow: 0 0 8px #5EE1F1;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.7; }
    }
    .hero-title {
      font-size: clamp(2.4rem, 5vw, 3.8rem);
      font-weight: 900;
      line-height: 1.12;
      color: #FFFFFF;
      letter-spacing: -0.03em;
      margin-bottom: 1.5rem;
      animation: fadeInUp 0.6s 0.1s ease both;
    }
    .gradient-text {
      background: linear-gradient(135deg, #F69F98 0%, #5EE1F1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-subtitle {
      font-size: 1.05rem;
      color: #94A3B8;
      line-height: 1.7;
      max-width: 560px;
      margin-bottom: 2.2rem;
      animation: fadeInUp 0.6s 0.2s ease both;
    }
    .hero-actions {
      display: flex;
      gap: 1.2rem;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      animation: fadeInUp 0.6s 0.3s ease both;
    }
    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #F69F98 0%, #5EE1F1 100%);
      color: #0D1B2A;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0.85rem 2rem;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 8px 25px rgba(246, 159, 152, 0.4);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .btn-hero-primary:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 14px 35px rgba(246, 159, 152, 0.6);
    }
    .btn-hero-secondary {
      color: #E2E8F0;
      font-size: 0.92rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: color 0.2s;
    }
    .btn-hero-secondary:hover { color: #5EE1F1; }
    .btn-hero-ghost {
      display: inline-flex;
      align-items: center;
      background: transparent;
      border: 1px solid rgba(226, 232, 240, 0.3);
      color: #E2E8F0;
      font-weight: 600;
      font-size: 0.92rem;
      padding: 0.85rem 1.75rem;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.25s;
    }
    .btn-hero-ghost:hover {
      border-color: #5EE1F1;
      color: #5EE1F1;
      background: rgba(94, 225, 241, 0.05);
    }
    .hero-trust {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      animation: fadeInUp 0.6s 0.4s ease both;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: #64748B;
    }
    .trust-icon { font-size: 1rem; }

    /* ── Dashboard Mock ── */
    .hero-visual {
      flex: 0 0 480px;
      position: relative;
      z-index: 2;
      animation: fadeInUp 0.7s 0.2s ease both;
    }
    .dashboard-mock {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(94, 225, 241, 0.2);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(94, 225, 241, 0.1);
      animation: mockFloat 6s ease-in-out infinite;
    }
    @keyframes mockFloat {
      0%, 100% { transform: translateY(0px) rotateX(0deg) rotateY(-2deg); }
      50% { transform: translateY(-10px) rotateX(1deg) rotateY(-2deg); }
    }
    .mock-header {
      background: rgba(13, 27, 42, 0.9);
      padding: 0.75rem 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(94, 225, 241, 0.15);
    }
    .mock-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .mock-dot.red { background: #EF4444; }
    .mock-dot.yellow { background: #F59E0B; }
    .mock-dot.green { background: #22C55E; }
    .mock-title {
      font-size: 0.75rem;
      color: #64748B;
      margin-left: 0.5rem;
      font-weight: 600;
    }
    .mock-body {
      padding: 1.25rem;
    }
    .mock-stat-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.1rem;
    }
    .mock-stat {
      background: rgba(13, 27, 42, 0.6);
      border: 1px solid rgba(94, 225, 241, 0.12);
      border-radius: 10px;
      padding: 0.75rem;
    }
    .mock-stat-label {
      font-size: 0.6rem;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .mock-stat-value {
      font-size: 1rem;
      font-weight: 800;
      margin: 0.2rem 0 0.1rem;
    }
    .mock-stat-sub {
      font-size: 0.6rem;
      color: #64748B;
    }
    .mock-bars {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      margin-bottom: 1rem;
    }
    .mock-bar-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .mock-bar-label {
      font-size: 0.65rem;
      color: #94A3B8;
      width: 75px;
      flex-shrink: 0;
    }
    .mock-bar-track {
      flex: 1;
      height: 8px;
      background: rgba(255,255,255,0.06);
      border-radius: 4px;
      overflow: hidden;
    }
    .mock-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 1s ease;
    }
    .mock-bar-val {
      font-size: 0.65rem;
      color: #5EE1F1;
      width: 35px;
      text-align: right;
      font-weight: 700;
    }
    .mock-ai-msg {
      display: flex;
      gap: 0.6rem;
      background: rgba(94, 225, 241, 0.08);
      border: 1px solid rgba(94, 225, 241, 0.2);
      border-radius: 10px;
      padding: 0.75rem;
      font-size: 0.68rem;
      color: #94A3B8;
      line-height: 1.5;
    }
    .mock-ai-icon { font-size: 1rem; flex-shrink: 0; }

    /* ── Stats ── */
    .stats-section {
      background: linear-gradient(135deg, rgba(94, 225, 241, 0.08) 0%, rgba(246, 159, 152, 0.08) 100%);
      border-top: 1px solid rgba(94, 225, 241, 0.1);
      border-bottom: 1px solid rgba(246, 159, 152, 0.1);
      padding: 3rem 2.5rem;
    }
    .stats-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 2rem;
    }
    .stat-item { text-align: center; }
    .stat-num {
      font-size: 2.8rem;
      font-weight: 900;
      background: linear-gradient(135deg, #F69F98, #5EE1F1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }
    .stat-lbl {
      font-size: 0.85rem;
      color: #64748B;
      margin-top: 0.4rem;
      font-weight: 500;
    }

    /* ── Features ── */
    .features-section {
      max-width: 1280px;
      margin: 0 auto;
      padding: 6rem 2.5rem;
    }
    .section-header {
      text-align: center;
      margin-bottom: 4rem;
    }
    .section-badge {
      display: inline-block;
      background: rgba(94, 225, 241, 0.1);
      border: 1px solid rgba(94, 225, 241, 0.3);
      color: #5EE1F1;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.35rem 0.9rem;
      border-radius: 20px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 1.25rem;
    }
    .section-title {
      font-size: clamp(1.8rem, 3.5vw, 2.8rem);
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.2;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }
    .section-sub {
      font-size: 1rem;
      color: #64748B;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.7;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.75rem;
    }
    .feature-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(226, 232, 240, 0.08);
      border-radius: 16px;
      padding: 2rem;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }
    .feature-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(135deg, #F69F98, #5EE1F1);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .feature-card:hover {
      transform: translateY(-6px);
      border-color: rgba(94, 225, 241, 0.25);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(94, 225, 241, 0.15);
    }
    .feature-card:hover::before { opacity: 1; }
    .feature-icon-box {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    .feature-icon { font-size: 1.6rem; }
    .feature-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 0.6rem;
    }
    .feature-desc {
      font-size: 0.85rem;
      color: #64748B;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .feature-tags {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .ftag {
      font-size: 0.7rem;
      padding: 0.2rem 0.55rem;
      background: rgba(94, 225, 241, 0.1);
      border: 1px solid rgba(94, 225, 241, 0.2);
      color: #5EE1F1;
      border-radius: 6px;
      font-weight: 600;
    }

    /* ── How It Works ── */
    .how-section {
      background: rgba(30, 41, 59, 0.35);
      border-top: 1px solid rgba(94, 225, 241, 0.08);
      border-bottom: 1px solid rgba(94, 225, 241, 0.08);
      padding: 6rem 2.5rem;
    }
    .how-section .section-header {
      margin-bottom: 3.5rem;
    }
    .steps-row {
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.75rem;
    }
    .step-card {
      text-align: center;
      padding: 2rem 1.5rem;
      position: relative;
    }
    .step-number {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F69F98, #5EE1F1);
      color: #0D1B2A;
      font-weight: 900;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      box-shadow: 0 6px 18px rgba(246, 159, 152, 0.4);
    }
    .step-icon { font-size: 2rem; margin-bottom: 0.85rem; }
    .step-title {
      font-size: 1rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 0.5rem;
    }
    .step-desc {
      font-size: 0.82rem;
      color: #64748B;
      line-height: 1.6;
    }

    /* ── Trust Layers ── */
    .trust-section {
      max-width: 1280px;
      margin: 0 auto;
      padding: 6rem 2.5rem;
    }
    .trust-inner {
      display: flex;
      gap: 5rem;
      align-items: center;
    }
    .trust-copy {
      flex: 1;
    }
    .trust-copy .section-title {
      text-align: left;
      margin-bottom: 1rem;
    }
    .trust-copy .section-badge { display: block; margin-bottom: 1rem; text-align: left; }
    .trust-copy .section-sub {
      text-align: left;
      max-width: 480px;
      margin: 0;
    }
    .mt-4 { margin-top: 1.5rem; }
    .trust-layers {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .trust-layer-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(94, 225, 241, 0.1);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      transition: all 0.25s;
    }
    .trust-layer-card:hover {
      border-color: rgba(94, 225, 241, 0.3);
      transform: translateX(4px);
    }
    .layer-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(94, 225, 241, 0.15);
      color: #5EE1F1;
      font-weight: 800;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .layer-content { flex: 1; }
    .layer-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .layer-desc {
      font-size: 0.75rem;
      color: #64748B;
      margin-top: 0.15rem;
    }
    .layer-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 10px;
      white-space: nowrap;
    }

    /* ── CTA ── */
    .cta-section {
      background: linear-gradient(135deg, rgba(246, 159, 152, 0.08) 0%, rgba(94, 225, 241, 0.08) 100%);
      border-top: 1px solid rgba(246, 159, 152, 0.15);
      padding: 7rem 2.5rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .cta-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.15;
      pointer-events: none;
    }
    .cta-orb-1 {
      width: 400px;
      height: 400px;
      background: #F69F98;
      top: -100px;
      left: -100px;
    }
    .cta-orb-2 {
      width: 400px;
      height: 400px;
      background: #5EE1F1;
      bottom: -100px;
      right: -100px;
    }
    .cta-inner {
      max-width: 700px;
      margin: 0 auto;
      position: relative;
      z-index: 2;
    }
    .cta-title {
      font-size: clamp(1.8rem, 3.5vw, 2.8rem);
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.2;
      margin-bottom: 1.2rem;
    }
    .cta-sub {
      font-size: 1rem;
      color: #64748B;
      line-height: 1.7;
      margin-bottom: 2.5rem;
    }
    .cta-actions {
      display: flex;
      gap: 1.2rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* ── Footer ── */
    .land-footer {
      background: rgba(13, 27, 42, 0.95);
      border-top: 1px solid rgba(94, 225, 241, 0.08);
      padding: 2rem 2.5rem;
    }
    .footer-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .footer-copy {
      font-size: 0.78rem;
      color: #475569;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1024px) {
      .hero-section { flex-direction: column; padding-top: 3rem; min-height: auto; gap: 3rem; }
      .hero-visual { flex: 0 0 auto; width: 100%; max-width: 500px; }
      .trust-inner { flex-direction: column; }
    }
    @media (max-width: 768px) {
      .land-nav-links .land-nav-link { display: none; }
      .mock-stat-row { grid-template-columns: repeat(3, 1fr); }
    }
  `]
})
export class LandingComponent {
  mockBars = [
    { label: 'Profitability', width: '88%', color: '#F69F98', value: '88%' },
    { label: 'Growth Rate', width: '72%', color: '#5EE1F1', value: '72%' },
    { label: 'Conversion', width: '91%', color: '#22C55E', value: '91%' },
    { label: 'Efficiency', width: '84%', color: '#8B5CF6', value: '84%' },
  ];

  statsData = [
    { num: '4-Layer', label: 'Verified AI Trust Architecture' },
    { num: '88.4%', label: 'ML Model Accuracy (±Bounds)' },
    { num: '12-Month', label: 'Revenue Forecast Horizon' },
    { num: 'Real-Time', label: 'Business Health Monitoring' },
    { num: 'AED', label: 'Multi-Currency GCC Support' },
  ];

  features = [
    {
      icon: '🧠',
      title: 'ML Revenue Forecasting',
      iconBg: 'rgba(94, 225, 241, 0.15)',
      desc: '12-month Prophet-based revenue forecasting with verified prediction intervals and confidence bounds — no guesswork.',
      tags: ['Prophet ML', '12-Month', 'Confidence Bounds']
    },
    {
      icon: '🏥',
      title: 'Business Health Score',
      iconBg: 'rgba(34, 197, 94, 0.15)',
      desc: 'Composite health score across Profitability, Growth, Customer Conversion, and Operating Efficiency — updated in real time.',
      tags: ['4-Factor Score', 'Real-Time', 'Benchmarked']
    },
    {
      icon: '🤖',
      title: 'Gemini AI Copilot',
      iconBg: 'rgba(139, 92, 246, 0.15)',
      desc: 'Interactive AI assistant powered by Gemini 2.5 Flash. Ask questions in plain language and get verified, data-grounded answers.',
      tags: ['Gemini 2.5', 'Chat Interface', 'Grounded']
    },
    {
      icon: '⚡',
      title: 'What-If Simulator',
      iconBg: 'rgba(246, 159, 152, 0.15)',
      desc: 'Test strategic decisions — marketing spend, pricing changes, cost cuts — and see exact financial impact before committing.',
      tags: ['Scenario Analysis', 'Money Impact', 'Risk-Free']
    },
    {
      icon: '🔍',
      title: 'Anomaly Detection',
      iconBg: 'rgba(245, 158, 11, 0.15)',
      desc: 'Z-Score and Isolation Forest algorithms automatically flag statistical outliers in your financial data before they become problems.',
      tags: ['Z-Score', 'Isolation Forest', 'Auto-Alert']
    },
    {
      icon: '📁',
      title: 'Multi-Source Data Ingestion',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      desc: 'Upload PDF reports, Excel P&L sheets, and CSV transactions. NOVA normalizes and verifies the data automatically.',
      tags: ['PDF', 'Excel', 'CSV', 'Auto-Verify']
    },
  ];

  steps = [
    {
      icon: '👤',
      title: 'Create Your Account',
      desc: 'Sign up in seconds. Add your business profile with basic details — name, industry, currency.'
    },
    {
      icon: '📤',
      title: 'Upload Your Data',
      desc: 'Import your financial data via CSV, Excel or PDF. NOVA\'s 4-layer verification cleans and validates everything.'
    },
    {
      icon: '🧮',
      title: 'AI Analyses Everything',
      desc: 'ML models compute your health score, forecast revenue, detect anomalies, and surface growth opportunities.'
    },
    {
      icon: '🎯',
      title: 'Execute Smart Decisions',
      desc: 'Use the Copilot and What-If engine to test strategies, then generate AI-powered marketing and sales assets.'
    },
  ];

  trustLayers = [
    {
      num: '1',
      title: 'Layer 1 — Deterministic Data Rules',
      desc: 'Schema validation, range checks, business logic rules applied to every data point.',
      status: '✓ Always Active',
      color: 'rgba(34, 197, 94, 0.15)'
    },
    {
      num: '2',
      title: 'Layer 2 — ML Model Confidence Bounds',
      desc: 'Every ML output comes with verified confidence intervals and prediction bounds.',
      status: '±88.4% Accuracy',
      color: 'rgba(59, 130, 246, 0.15)'
    },
    {
      num: '3',
      title: 'Layer 3 — Gemini LLM Plausibility Check',
      desc: 'AI reasoning validates business logic and flags implausible outputs before display.',
      status: 'Gemini 2.5',
      color: 'rgba(139, 92, 246, 0.15)'
    },
    {
      num: '4',
      title: 'Layer 4 — Outcome Feedback Loop',
      desc: 'Real outcomes feed back into the system to continuously improve predictions.',
      status: 'Live Retraining',
      color: 'rgba(246, 159, 152, 0.15)'
    },
  ];
}
