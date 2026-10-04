import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Gamepad2,
  ShieldCheck,
  History,
  Flame,
  Globe,
  Play,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import IspHeaderCard from './components/IspHeaderCard';
import GameServerSelector from './components/GameServerSelector';
import PingTestHUD from './components/PingTestHUD';
import IspBenchmarkCard from './components/IspBenchmarkCard';
import BufferbloatCard from './components/BufferbloatCard';
import DnsBenchmarkCard from './components/DnsBenchmarkCard';
import TestHistoryCard from './components/TestHistoryCard';
import { getStoredHistory, saveHistoryRecord } from './services/historyService';

export default function App() {
  const [selection, setSelection] = useState(null);
  const [pingStats, setPingStats] = useState(null);
  const [ispData, setIspData] = useState(null);
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    setHistory(getStoredHistory());
  }, []);

  // IntersectionObserver for smooth fade-in animations on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [selection, pingStats]);

  // Auto-save test result to history
  const handleTestComplete = useCallback(({ selection: currentSelection, stats: currentStats }) => {
    const updated = saveHistoryRecord({
      selection: currentSelection,
      stats: currentStats,
      ispData,
    });
    setHistory(updated);
  }, [ispData]);

  const scrollToSection = (id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="app">
      {/* Background Graphic & Ambient Effects */}
      <div className="bg-hero-graphic" />
      <div className="bg-overlay-gradient" />
      <div className="bg-grid-mesh" />

      {/* Navigation Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-badge">
            <span className="live-dot" />
            <img src="/favicon.svg" alt="LatencyX Logo" className="logo-badge-icon" />
          </div>
          <div className="logo-text">
            <h1 className="logo-title">Latency<span className="text-moss">X</span></h1>
            <span className="logo-subtitle">Sri Lankan ISP Real-Time Game Latency Tester</span>
          </div>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="header-chip header-chip-interactive"
            onClick={() => scrollToSection('bloat-section')}
            title="Jump to Bufferbloat test"
          >
            <Flame size={14} className="text-moss" />
            <span>Bufferbloat</span>
          </button>

          <button
            type="button"
            className="header-chip header-chip-interactive"
            onClick={() => scrollToSection('dns-section')}
            title="Jump to DNS Benchmark"
          >
            <Globe size={14} className="text-moss" />
            <span>DNS Speed</span>
          </button>

          {history.length > 0 && (
            <button
              type="button"
              className="header-chip header-chip-interactive"
              onClick={() => scrollToSection('history-section')}
              title="Jump to saved test history"
            >
              <History size={14} className="text-moss" />
              <span>{history.length} Saved {history.length === 1 ? 'Test' : 'Tests'}</span>
            </button>
          )}

          <div className="header-chip">
            <Gamepad2 size={15} className="text-moss" />
            <span>11 Competitive Titles</span>
          </div>

          <div className="header-chip header-chip-sl">
            <ShieldCheck size={15} className="text-moss" />
            <span>Sri Lanka Optimized</span>
          </div>
        </div>
      </header>

      {/* Mobile Quick Navigation Bar (Horizontal Scroll on Mobile) */}
      <nav className="mobile-quick-nav" aria-label="Quick mobile navigation">
        <button
          type="button"
          className="mobile-nav-chip"
          onClick={() => scrollToSection('step-ping')}
        >
          <Activity size={14} className="text-moss" />
          <span>Live Ping</span>
        </button>
        <button
          type="button"
          className="mobile-nav-chip"
          onClick={() => scrollToSection('step-game')}
        >
          <Gamepad2 size={14} className="text-moss" />
          <span>Games</span>
        </button>
        <button
          type="button"
          className="mobile-nav-chip"
          onClick={() => scrollToSection('bloat-section')}
        >
          <Flame size={14} className="text-moss" />
          <span>Bufferbloat</span>
        </button>
        <button
          type="button"
          className="mobile-nav-chip"
          onClick={() => scrollToSection('dns-section')}
        >
          <Globe size={14} className="text-moss" />
          <span>DNS Speed</span>
        </button>
        <button
          type="button"
          className="mobile-nav-chip"
          onClick={() => scrollToSection('history-section')}
        >
          <History size={14} className="text-moss" />
          <span>History{history.length > 0 ? ` (${history.length})` : ''}</span>
        </button>
      </nav>

      {/* Modern Hero Section */}
      <section className="hero-section reveal-on-scroll">
        <div className="hero-glow-backdrop" />

        {/* Top Feature Pill Badge */}
        <div className="hero-pill-badge">
          <span className="hero-pulse-dot" />
          <span className="hero-pill-text">NEXT-GEN SRI LANKAN GAMING TELEMETRY · SUBSEA OPTIMIZED</span>
        </div>

        {/* Main Headline with Gradient */}
        <h2 className="hero-heading">
          Dominate With <span className="hero-gradient-text">Precision Ping</span> &amp; Zero Lag Spikes
        </h2>

        {/* Subtext */}
        <p className="hero-subtext">
          Precision round-trip latency diagnostics for <strong>SLT-Mobitel</strong>, <strong>Dialog</strong>, and <strong>Hutch</strong>. Test raw in-game UDP socket latency, isolate router bufferbloat, and benchmark ultra-fast DNS resolvers across SEA-ME-WE subsea cable routes.
        </p>

        {/* Quick CTA Actions */}
        <div className="hero-cta-row">
          <button
            type="button"
            className="hero-primary-btn"
            onClick={() => scrollToSection('step-ping')}
          >
            <Play size={16} fill="#141414" />
            <span>Launch Live Ping Test</span>
          </button>
          <button
            type="button"
            className="hero-secondary-btn"
            onClick={() => scrollToSection('bloat-section')}
          >
            <Flame size={16} className="text-moss" />
            <span>Test Bufferbloat</span>
          </button>
        </div>

        {/* Live Feature Highlights Strip */}
        <div className="hero-features-strip">
          <div className="hero-feature-item">
            <Gamepad2 size={16} className="text-moss" />
            <div className="feature-item-text">
              <strong>11 Esports Titles</strong>
              <span>Valorant, CS2, Free Fire &amp; more</span>
            </div>
          </div>
          <div className="hero-feature-divider" />
          <div className="hero-feature-item">
            <Radio size={16} className="text-moss" />
            <div className="feature-item-text">
              <strong>Subsea Cable Telemetry</strong>
              <span>SEA-ME-WE 3/5 &amp; BBG Gateways</span>
            </div>
          </div>
          <div className="hero-feature-divider" />
          <div className="hero-feature-item">
            <ShieldCheck size={16} className="text-moss" />
            <div className="feature-item-text">
              <strong>100% Client-Side</strong>
              <span>Zero server delay · 100% Private</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Multi-Step Flow */}
      <main className="app-main">
        {/* Step 1: ISP Auto-Detection */}
        <section id="step-isp" className="app-step-section reveal-on-scroll">
          <div className="step-badge-row">
            <span className="step-num">STEP 1</span>
            <span className="step-heading">Your Network Connection</span>
          </div>
          <IspHeaderCard onIspDetected={setIspData} />
        </section>

        {/* Step 2: Choose Game & Server Region */}
        <section id="step-game" className="app-step-section reveal-on-scroll">
          <div className="step-badge-row">
            <span className="step-num">STEP 2</span>
            <span className="step-heading">Select Game & Target Region</span>
          </div>
          <GameServerSelector
            onSelect={setSelection}
            disabled={false}
          />
        </section>

        {/* Step 3: Run Real-Time Ping Test */}
        <section id="step-ping" className="app-step-section reveal-on-scroll">
          <div className="step-badge-row">
            <span className="step-num">STEP 3</span>
            <span className="step-heading">Real-Time Latency Probe</span>
          </div>
          <PingTestHUD
            selection={selection}
            onStatsUpdate={setPingStats}
            onTestComplete={handleTestComplete}
          />
        </section>

        {/* Step 4: ISP Benchmark Comparison */}
        {selection && pingStats && (
          <section id="step-benchmark" className="app-step-section reveal-on-scroll">
            <div className="step-badge-row">
              <span className="step-num">STEP 4</span>
              <span className="step-heading">Sri Lankan ISP Benchmarks</span>
            </div>
            <IspBenchmarkCard selection={selection} stats={pingStats} />
          </section>
        )}

        {/* Feature 2: Bufferbloat & Network Congestion Test */}
        <section id="bloat-section" className="app-step-section reveal-on-scroll">
          <div className="step-badge-row">
            <span className="step-num">TOOL 1</span>
            <span className="step-heading">Bufferbloat & Load Spike Diagnostic</span>
          </div>
          <BufferbloatCard selection={selection} />
        </section>

        {/* Feature 4: DNS Benchmark */}
        <section id="dns-section" className="app-step-section reveal-on-scroll">
          <div className="step-badge-row">
            <span className="step-num">TOOL 2</span>
            <span className="step-heading">Sri Lanka DNS Benchmark & Router Setup</span>
          </div>
          <DnsBenchmarkCard />
        </section>

        {/* Step 7: Personal Test History & Diagnostics Log */}
        <section id="history-section" className="app-step-section reveal-on-scroll">
          <div className="step-badge-row">
            <span className="step-num">LOGS</span>
            <span className="step-heading">Personal Test History & Diagnostics Log</span>
          </div>
          <TestHistoryCard
            history={history}
            onHistoryUpdate={setHistory}
          />
        </section>
      </main>

      {/* Simplified Clear Footer */}
      <footer className="app-footer">
        <div className="footer-supported-isps">
          <span className="footer-label">Supported Providers:</span>
          <span className="isp-tag">SLT-Mobitel Fibre & 4G</span>
          <span className="isp-tag">Dialog Home Broadband</span>
          <span className="isp-tag">Hutch 4G</span>
          <span className="isp-tag">Airtel</span>
        </div>
        <p className="footer-disclaimer">
          Measured using browser HTTP RTT probes directly to public regional cloud endpoints. Actual in-game UDP socket latency may vary slightly based on server routing.
        </p>
      </footer>
    </div>
  );
}

