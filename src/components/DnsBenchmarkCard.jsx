import { useState, useCallback } from 'react';
import {
  Zap,
  CheckCircle2,
  Server,
  Globe,
  Settings,
  ChevronDown,
  ChevronUp,
  Award,
  Play,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { runDnsBenchmark } from '../services/dnsBenchmarkService';

export default function DnsBenchmarkCard() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [selectedGuideTab, setSelectedGuideTab] = useState('windows'); // 'windows' | 'slt' | 'dialog'

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setProgress({ percent: 5, providerName: 'Starting benchmark...' });
    setResults(null);

    try {
      const benchmarkResults = await runDnsBenchmark((prog) => {
        setProgress(prog);
      });
      setResults(benchmarkResults);
    } catch (err) {
      console.error('DNS Benchmark failed:', err);
    } finally {
      setIsRunning(false);
    }
  }, []);

  return (
    <div className="dns-card">
      {/* Header */}
      <div className="dns-card-header">
        <div className="dns-title-block">
          <div className="dns-icon-circle">
            <Globe size={20} className="text-moss" />
          </div>
          <div>
            <div className="dns-heading-row">
              <h3 className="dns-title">DNS Resolution Speed Benchmark</h3>
              <span className="dns-badge-live">DoH Live Telemetry</span>
            </div>
            <p className="dns-subtitle">
              Sri Lankan ISPs often use sluggish default DNS. Test which global resolver cuts initial matchmaking and game asset lookup latency.
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="dns-run-btn"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Zap size={15} className="animate-spin text-dark" />
                <span>BENCHMARKING...</span>
              </>
            ) : (
              <>
                <Play size={15} fill="#141414" />
                <span>RUN DNS BENCHMARK</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Running Progress Bar */}
      {isRunning && progress && (
        <div className="dns-progress-box">
          <div className="dns-progress-info">
            <span className="dns-progress-text">
              Testing {progress.providerName}
              {progress.currentDomain ? ` · ${progress.currentDomain}` : ''}
            </span>
            <span className="dns-progress-pct">{progress.percent}%</span>
          </div>
          <div className="dns-progress-track">
            <div
              className="dns-progress-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Grid / Leaderboard */}
      {results && !isRunning && (
        <div className="dns-results-area">
          <div className="dns-leaderboard-grid">
            {results.map((res, index) => {
              const isWinner = index === 0;

              return (
                <div
                  key={res.id}
                  className={`dns-provider-card ${isWinner ? 'dns-winner-card' : ''}`}
                >
                  {isWinner && (
                    <div className="dns-winner-tag">
                      <Award size={13} />
                      <span>FASTEST FOR YOUR CONNECTION</span>
                    </div>
                  )}

                  <div className="dns-card-top">
                    <div className="dns-name-group">
                      <div
                        className="dns-dot-indicator"
                        style={{ backgroundColor: res.iconColor }}
                      />
                      <div>
                        <h4 className="dns-name">{res.name}</h4>
                        <span className="dns-badge-small">{res.badge}</span>
                      </div>
                    </div>

                    <div className="dns-speed-badge">
                      <span className="speed-ms" style={{ color: isWinner ? '#2BEE34' : 'inherit' }}>
                        {res.avgLatency}
                        <small>ms</small>
                      </span>
                      <span className="speed-rank">Rank #{index + 1}</span>
                    </div>
                  </div>

                  <p className="dns-description">{res.description}</p>

                  <div className="dns-ip-strip">
                    <span className="ip-label">Primary IP:</span>
                    <code className="ip-code">{res.ips[0]}</code>
                    {res.ips[1] && (
                      <>
                        <span className="ip-label">Secondary:</span>
                        <code className="ip-code">{res.ips[1]}</code>
                      </>
                    )}
                  </div>

                  {/* Per domain details */}
                  <div className="dns-domain-breakdown">
                    {res.details.map((d, i) => (
                      <div key={i} className="domain-pill">
                        <span className="domain-pill-label">{d.label.split(' ')[0]}:</span>
                        <strong className="domain-pill-ms">{d.latency}ms</strong>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Setup Guide Drawer */}
          <div className="dns-setup-drawer">
            <button
              type="button"
              className="dns-setup-toggle"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
            >
              <div className="setup-toggle-left">
                <Settings size={16} className="text-moss" />
                <span>How to Change Your DNS in Sri Lanka (Windows / Router)</span>
              </div>
              {showSetupGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSetupGuide && (
              <div className="dns-guide-panel">
                <div className="guide-tab-buttons">
                  <button
                    type="button"
                    className={`guide-tab-btn ${selectedGuideTab === 'windows' ? 'active' : ''}`}
                    onClick={() => setSelectedGuideTab('windows')}
                  >
                    Windows 10 / 11
                  </button>
                  <button
                    type="button"
                    className={`guide-tab-btn ${selectedGuideTab === 'slt' ? 'active' : ''}`}
                    onClick={() => setSelectedGuideTab('slt')}
                  >
                    SLT-Mobitel Fiber Router
                  </button>
                  <button
                    type="button"
                    className={`guide-tab-btn ${selectedGuideTab === 'dialog' ? 'active' : ''}`}
                    onClick={() => setSelectedGuideTab('dialog')}
                  >
                    Dialog 4G Router
                  </button>
                </div>

                <div className="guide-tab-content">
                  {selectedGuideTab === 'windows' && (
                    <ol className="guide-steps">
                      <li>Press <kbd>Win + R</kbd>, type <code>ncpa.cpl</code>, and press Enter to open Network Connections.</li>
                      <li>Right-click your active connection (<strong>Ethernet</strong> or <strong>Wi-Fi</strong>) and select <strong>Properties</strong>.</li>
                      <li>Select <strong>Internet Protocol Version 4 (TCP/IPv4)</strong> and click <strong>Properties</strong>.</li>
                      <li>Choose <strong>Use the following DNS server addresses</strong>.</li>
                      <li>
                        Enter your fastest DNS from above:
                        <br />
                        Preferred: <code>{results[0]?.ips[0] || '1.1.1.1'}</code> &nbsp;|&nbsp;
                        Alternate: <code>{results[0]?.ips[1] || '1.0.0.1'}</code>
                      </li>
                      <li>Click <strong>OK</strong> to apply immediately. Flush DNS cache via <code>ipconfig /flushdns</code> in Command Prompt.</li>
                    </ol>
                  )}

                  {selectedGuideTab === 'slt' && (
                    <ol className="guide-steps">
                      <li>Open your browser and navigate to <code>http://192.168.1.1</code>.</li>
                      <li>Log in using your SLT GPON credentials (default admin / user username on the bottom of the router).</li>
                      <li>Navigate to <strong>Network</strong> &gt; <strong>LAN</strong> &gt; <strong>DHCP Server</strong>.</li>
                      <li>Locate <strong>Primary DNS</strong> and <strong>Secondary DNS</strong> fields.</li>
                      <li>Enter <code>{results[0]?.ips[0] || '1.1.1.1'}</code> and <code>{results[0]?.ips[1] || '1.0.0.1'}</code>.</li>
                      <li>Click <strong>Save / Apply</strong> and restart the router. All household devices will now use this low-latency DNS.</li>
                    </ol>
                  )}

                  {selectedGuideTab === 'dialog' && (
                    <ol className="guide-steps">
                      <li>Open your browser and navigate to <code>http://192.168.8.1</code>.</li>
                      <li>Log in with your Dialog router admin credentials (default user: <code>admin</code>).</li>
                      <li>Go to <strong>Settings</strong> &gt; <strong>Ethernet / DHCP Settings</strong>.</li>
                      <li>Under DHCP IP Settings, change <strong>DNS Server</strong> mode from <em>Automatic</em> to <em>Manual</em>.</li>
                      <li>Enter <code>{results[0]?.ips[0] || '1.1.1.1'}</code> in DNS 1, and <code>{results[0]?.ips[1] || '1.0.0.1'}</code> in DNS 2.</li>
                      <li>Click <strong>Apply</strong>.</li>
                    </ol>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && !isRunning && (
        <div className="dns-empty-state">
          <div className="dns-empty-icon-wrap">
            <Zap size={24} className="text-moss" />
          </div>
          <h4 className="dns-empty-title">Ready to Benchmark Sri Lankan Resolvers</h4>
          <p className="dns-empty-desc">
            Tests Cloudflare (1.1.1.1), Google (8.8.8.8), AdGuard, and NextDNS directly from your browser against active gaming hostnames.
          </p>
        </div>
      )}
    </div>
  );
}
