import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Square,
  Activity,
  Gauge,
  TrendingUp,
  Zap,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Gamepad2,
  ShieldCheck,
  Radio,
  Sliders,
} from 'lucide-react';
import { PingEngine } from '../services/pingService';
import { getQualityTier } from '../data/gamesDatabase';
import { GameIcon } from './GameIcons';

function PingGauge({ value, maxValue = 300 }) {
  const canvasRef = useRef(null);
  const animatedValue = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 240 * dpr;
    canvas.height = 140 * dpr;
    ctx.scale(dpr, dpr);

    function draw() {
      const diff = value - animatedValue.current;
      animatedValue.current += diff * 0.18;

      ctx.clearRect(0, 0, 240, 140);
      const cx = 120, cy = 120, radius = 95;
      const startAngle = Math.PI * 0.8;
      const endAngle = Math.PI * 2.2;
      const totalArc = endAngle - startAngle;

      // Background track
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Active neon green arc
      const normalizedValue = Math.min(animatedValue.current / maxValue, 1);
      const segEnd = startAngle + normalizedValue * totalArc;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, segEnd);
      ctx.strokeStyle = '#2BEE34';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#2BEE34';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Needle
      const needleAngle = startAngle + normalizedValue * totalArc;
      const needleLen = radius - 18;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(needleAngle) * needleLen,
        cy + Math.sin(needleAngle) * needleLen
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Center pivot
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#2BEE34';
      ctx.fill();

      // Display value
      ctx.font = 'bold 38px Syne, system-ui, sans-serif';
      ctx.fillStyle = '#2BEE34';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(animatedValue.current)}`, cx, cy - 14);

      ctx.font = '600 12px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('MS LATENCY', cx, cy + 4);

      if (Math.abs(diff) > 0.5) {
        animFrameRef.current = requestAnimationFrame(draw);
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, maxValue]);

  return <canvas ref={canvasRef} className="ping-gauge-canvas" style={{ width: 240, height: 140 }} />;
}

function SparklineGraph({ data, maxValue = 300 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const parentWidth = canvas.parentElement?.clientWidth || 600;
    const h = 110;
    canvas.width = parentWidth * dpr;
    canvas.height = h * dpr;
    canvas.style.width = parentWidth + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, parentWidth, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = (h / 4) * i + 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(parentWidth, y);
      ctx.stroke();
    }

    if (data.length < 2) return;

    const padding = 10;
    const graphW = parentWidth - padding * 2;
    const graphH = h - padding * 2;

    // Line trace
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding + (i / (data.length - 1)) * graphW;
      const y = padding + (1 - Math.min(val / maxValue, 1)) * graphH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = '#2BEE34';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#2BEE34';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill gradient
    const lastX = padding + ((data.length - 1) / (data.length - 1)) * graphW;
    ctx.lineTo(lastX, h);
    ctx.lineTo(padding, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(43, 238, 52, 0.2)');
    grad.addColorStop(1, 'rgba(43, 238, 52, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Latest ping point
    const lastVal = data[data.length - 1];
    const lx = padding + ((data.length - 1) / (data.length - 1)) * graphW;
    const ly = padding + (1 - Math.min(lastVal / maxValue, 1)) * graphH;
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2BEE34';
    ctx.fill();
  }, [data, maxValue]);

  return (
    <div className="sparkline-container">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function PingTestHUD({ selection, onStatsUpdate, onTestComplete }) {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [sampleCount, setSampleCount] = useState(30); // 15 | 30 | 50
  const engineRef = useRef(null);

  const handleStart = useCallback(() => {
    if (!selection) return;
    setIsRunning(true);
    setIsComplete(false);
    setIsWarmingUp(true);
    setStats(null);
    setProgress(0);

    const engine = new PingEngine(
      selection.server.endpoint,
      (newStats, sample) => {
        setIsWarmingUp(false);
        setStats(newStats);
        setProgress(Math.round((sample / newStats.totalSamples) * 100));
        if (onStatsUpdate) onStatsUpdate(newStats);
      },
      (finalStats) => {
        setIsWarmingUp(false);
        setStats(finalStats);
        setIsRunning(false);
        setIsComplete(true);
        setProgress(100);
        if (onStatsUpdate) onStatsUpdate(finalStats);
        if (onTestComplete) onTestComplete({ selection, stats: finalStats });
      },
      { samples: sampleCount, intervalMs: 380 }
    );
    engineRef.current = engine;
    engine.start();
  }, [selection, onStatsUpdate, onTestComplete, sampleCount]);

  const handleStop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsRunning(false);
      setIsWarmingUp(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (engineRef.current) engineRef.current.stop();
    };
  }, []);

  const tier = stats ? getQualityTier(stats.inGameUdp || stats.avg) : null;

  return (
    <div className="ping-hud">
      {/* Test Launch Controls & Sample Selection */}
      <div className="ping-controls">
        {!isRunning ? (
          <div className="ping-launch-group">
            {/* Sample Mode Selector */}
            <div className="sample-mode-selector">
              <span className="sample-mode-label">
                <Sliders size={13} className="text-moss" />
                <span>Test Profile:</span>
              </span>
              <button
                type="button"
                className={`sample-pill ${sampleCount === 15 ? 'active' : ''}`}
                onClick={() => setSampleCount(15)}
              >
                Fast (15)
              </button>
              <button
                type="button"
                className={`sample-pill ${sampleCount === 30 ? 'active' : ''}`}
                onClick={() => setSampleCount(30)}
              >
                Esports Standard (30)
              </button>
              <button
                type="button"
                className={`sample-pill ${sampleCount === 50 ? 'active' : ''}`}
                onClick={() => setSampleCount(50)}
              >
                Deep Stability (50)
              </button>
            </div>

            <button
              type="button"
              className="ping-start-btn"
              onClick={handleStart}
              disabled={!selection}
            >
              <div className="ping-btn-main-row">
                {selection && <GameIcon gameId={selection.game.id} size={24} />}
                <Play size={18} fill="#141414" />
                <span>START PRECISION PING TEST</span>
              </div>
              <span className="ping-btn-sub">
                {selection ? `${selection.game.name} · ${selection.server.region}` : 'Select a game first'}
              </span>
            </button>
          </div>
        ) : (
          <button type="button" className="ping-stop-btn" onClick={handleStop}>
            <Square size={18} fill="#ffffff" />
            <span>Stop Test</span>
          </button>
        )}

        {isRunning && (
          <div className="ping-progress-bar">
            <div className="ping-progress-fill" style={{ width: `${progress}%` }} />
            <span className="ping-progress-text">
              {isWarmingUp ? (
                <>⚡ Pre-warming TCP/TLS handshake to eliminate cold-start lag...</>
              ) : (
                <>Measuring... {progress}% ({stats?.samples || 0}/{stats?.totalSamples || sampleCount} precision probes)</>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Results HUD */}
      {stats && (
        <div className="ping-results">
          {/* Dual In-Game vs HTTP Comparison Strip */}
          <div className="ping-hero-dual-row">
            <div className="dual-hero-card hero-ingame">
              <div className="dual-hero-tag">
                <Gamepad2 size={15} className="text-moss" />
                <span>IN-GAME NETGRAPH ESTIMATE (UDP)</span>
              </div>
              <div className="dual-hero-val text-moss">
                {stats.inGameUdp} <small>ms</small>
              </div>
              <span className="dual-hero-sub">
                Calibrated raw socket latency matching in-game Valorant, CS2, & Free Fire HUDs.
              </span>
            </div>

            <div className="dual-hero-card hero-http">
              <div className="dual-hero-tag">
                <Activity size={15} className="text-blue-400" />
                <span>HTTP/TLS 1.3 RTT (TRIMMED MEAN)</span>
              </div>
              <div className="dual-hero-val">
                {stats.avg} <small>ms</small>
              </div>
              <span className="dual-hero-sub">
                10% trimmed mean discarding cold-start & garbage-collection outliers.
              </span>
            </div>
          </div>

          {/* Gauge and Status Badge */}
          <div className="ping-gauge-row">
            <div className="gauge-wrapper">
              <PingGauge value={stats.inGameUdp || stats.current} />
            </div>

            {tier && (
              <div className="ping-rating-badge">
                <span className="rating-tag">CONNECTION QUALITY</span>
                <h3 className="rating-name" style={{ color: tier.color }}>{tier.label}</h3>
                <span className="rating-desc">
                  {stats.avg < 60 ? 'Optimal low-latency route for competitive matches.' :
                   stats.avg < 100 ? 'Good playable ping for standard ranked matchmaking.' :
                   'Noticeable latency delay. Check subsea cable route or network load.'}
                </span>
              </div>
            )}
          </div>

          {/* Key Metrics Cards (Optimized 6-Box Grid) */}
          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-label">Best Minimum</span>
              <span className="metric-value">{stats.min}<small>ms</small></span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Median (P50)</span>
              <span className="metric-value">{stats.median}<small>ms</small></span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Peak Lag (P95)</span>
              <span className="metric-value">{stats.p95}<small>ms</small></span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Jitter (RFC 3550)</span>
              <span className="metric-value">±{stats.jitter}<small>ms</small></span>
            </div>
            <div className="metric-box metric-box-primary">
              <span className="metric-label">Esports Stability</span>
              <span className="metric-value text-moss">{stats.stabilityScore}%</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Packet Loss</span>
              <span className={`metric-value ${stats.packetLoss > 0 ? 'text-red-400' : 'text-moss'}`}>
                {stats.packetLoss}%
              </span>
            </div>
          </div>

          {/* Real-Time Graph */}
          {stats.history.length > 1 && (
            <div className="graph-card">
              <div className="graph-header">
                <div className="graph-title">
                  <Activity size={15} className="text-moss" />
                  <span>Real-Time Latency Timeline (RTT)</span>
                </div>
                <span className="graph-probes">{stats.history.length} samples collected</span>
              </div>
              <SparklineGraph data={stats.history} />
            </div>
          )}

          {/* Completion summary card */}
          {isComplete && (
            <div className="completion-card">
              <div className="completion-left">
                {selection && <GameIcon gameId={selection.game.id} size={32} />}
                <div>
                  <div className="completion-title-row">
                    <h4 className="completion-title">Test Completed Successfully</h4>
                    <span className="completion-saved-badge">
                      <CheckCircle2 size={12} />
                      Saved to History
                    </span>
                  </div>
                  <p className="completion-desc">
                    Your estimated in-game netgraph latency to <strong>{selection?.game.name} ({selection?.server.region})</strong> is <strong>{stats.inGameUdp}ms</strong> (HTTP RTT: {stats.avg}ms) with <strong>±{stats.jitter}ms</strong> jitter and <strong>{stats.stabilityScore}%</strong> stability.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="retest-btn"
                onClick={handleStart}
              >
                Retest Ping
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!stats && !isRunning && (
        <div className="empty-state">
          <Activity size={36} className="text-moss empty-icon" />
          <p className="empty-title">Ready for Precision Latency Probe</p>
          <p className="empty-sub">
            Click <strong>START PRECISION PING TEST</strong> above to run multi-stage outlier-free telemetry calibrated against Sri Lankan subsea cable routes.
          </p>
        </div>
      )}
    </div>
  );
}
