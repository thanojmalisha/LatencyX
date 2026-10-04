import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Flame,
  Play,
  Square,
  Activity,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BufferbloatEngine, getBufferbloatGrade } from '../services/bufferbloatService';

export default function BufferbloatCard({ selection }) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const engineRef = useRef(null);

  const targetEndpoint = selection?.server?.endpoint || 'dynamodb.ap-south-1.amazonaws.com';

  const handleStart = useCallback(() => {
    setIsRunning(true);
    setResult(null);

    const engine = new BufferbloatEngine(
      targetEndpoint,
      (prog) => setProgress(prog),
      (res) => {
        setResult(res);
        setIsRunning(false);
      }
    );

    engineRef.current = engine;
    engine.start();
  }, [targetEndpoint]);

  const handleStop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (engineRef.current) engineRef.current.stop();
    };
  }, []);

  return (
    <div className="bloat-card">
      {/* Header */}
      <div className="bloat-card-header">
        <div className="bloat-title-block">
          <div className="bloat-icon-circle">
            <Flame size={20} className="text-moss" />
          </div>
          <div>
            <div className="bloat-heading-row">
              <h3 className="bloat-title">Bufferbloat & Traffic Load Diagnostic</h3>
              <span className="bloat-badge-live">Traffic Stress Test</span>
            </div>
            <p className="bloat-subtitle">
              Measures if household streaming (YouTube, TikTok, Netflix) or background downloads cause your game ping to spike.
            </p>
          </div>
        </div>

        <div>
          {!isRunning ? (
            <button
              type="button"
              className="bloat-run-btn"
              onClick={handleStart}
            >
              <Play size={15} fill="#141414" />
              <span>TEST BUFFERBLOAT</span>
            </button>
          ) : (
            <button
              type="button"
              className="bloat-stop-btn"
              onClick={handleStop}
            >
              <Square size={14} fill="#ffffff" />
              <span>Stop Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress & Live Testing State */}
      {isRunning && progress && (
        <div className="bloat-active-panel">
          <div className="bloat-phase-row">
            <span className="bloat-phase-name">{progress.phaseName}</span>
            <span className="bloat-phase-pct">{progress.percent}%</span>
          </div>

          <div className="bloat-progress-track">
            <div
              className="bloat-progress-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="bloat-live-telemetry">
            <div className="bloat-telemetry-item">
              <span className="telemetry-label">Current Probe:</span>
              <strong className="text-moss">{progress.currentPing} ms</strong>
            </div>
            <div className="bloat-telemetry-item">
              <span className="telemetry-label">Idle Baseline:</span>
              <strong>{progress.idlePing ? `${progress.idlePing} ms` : 'Measuring...'}</strong>
            </div>
            <div className="bloat-telemetry-item">
              <span className="telemetry-label">Under Load:</span>
              <strong>
                {progress.uploadPing
                  ? `${progress.uploadPing} ms (Upload)`
                  : progress.downloadPing
                  ? `${progress.downloadPing} ms (Download)`
                  : 'Pending...'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Display */}
      {result && !isRunning && (
        <div className="bloat-results-container">
          {/* Main Grade Banner */}
          <div
            className="bloat-grade-banner"
            style={{
              borderColor: result.color,
              background: result.bgColor,
            }}
          >
            <div className="grade-badge-circle" style={{ borderColor: result.color, color: result.color }}>
              <span className="grade-letter">{result.grade}</span>
            </div>
            <div className="grade-text-area">
              <div className="grade-title-row">
                <h4 className="grade-label" style={{ color: result.color }}>
                  {result.label}
                </h4>
                <span className="grade-spike-stat">
                  Max Spike: <strong>+{result.maxDelta}ms</strong>
                </span>
              </div>
              <p className="grade-description">{result.description}</p>
            </div>
          </div>

          {/* Metric Comparison Tri-Grid */}
          <div className="bloat-metrics-grid">
            {/* Idle Baseline */}
            <div className="bloat-metric-box">
              <div className="metric-header-row">
                <Activity size={14} className="text-moss" />
                <span>Unloaded Baseline</span>
              </div>
              <div className="metric-big-val">
                {result.idlePing} <small>ms</small>
              </div>
              <span className="metric-sub-note">Clean idle connection</span>
            </div>

            {/* Download Load */}
            <div className="bloat-metric-box">
              <div className="metric-header-row">
                <ArrowDown size={14} className="text-blue-400" />
                <span>Download Active</span>
              </div>
              <div className="metric-big-val">
                {result.downloadPing} <small>ms</small>
              </div>
              <span className={`metric-delta-tag ${result.downloadDelta <= 15 ? 'delta-good' : 'delta-bad'}`}>
                {result.downloadDelta > 0 ? `+${result.downloadDelta}ms spike` : '0ms spike'}
              </span>
            </div>

            {/* Upload Load */}
            <div className="bloat-metric-box">
              <div className="metric-header-row">
                <ArrowUp size={14} className="text-orange-400" />
                <span>Upload Active</span>
              </div>
              <div className="metric-big-val">
                {result.uploadPing} <small>ms</small>
              </div>
              <span className={`metric-delta-tag ${result.uploadDelta <= 15 ? 'delta-good' : 'delta-bad'}`}>
                {result.uploadDelta > 0 ? `+${result.uploadDelta}ms spike` : '0ms spike'}
              </span>
            </div>
          </div>

          {/* Sri Lankan ISP Optimization Guidance */}
          <div className="bloat-advice-box">
            <div className="advice-header" onClick={() => setShowTips(!showTips)}>
              <div className="advice-title-left">
                <Cpu size={16} className="text-moss" />
                <strong>Sri Lankan Router & Network Fixes for Your Connection</strong>
              </div>
              <button type="button" className="advice-toggle-btn">
                {showTips ? 'Hide Tips' : 'Show Fixes'}
              </button>
            </div>

            {showTips && (
              <div className="advice-content-grid">
                <div className="advice-card">
                  <span className="advice-carrier-badge">SLT-Mobitel Fiber (ZTE / Huawei GPON)</span>
                  <p>
                    SLT GPON routers provide generous download bandwidth, but unthrottled upstream packets cause buffer queues to overflow.
                  </p>
                  <ul>
                    <li>Log into your router admin (<code>192.168.1.1</code>).</li>
                    <li>Look for <strong>QoS (Quality of Service)</strong> or <strong>Bandwidth Control</strong>.</li>
                    <li>Limit maximum upstream bandwidth to <strong>90%</strong> of your plan (e.g. 45Mbps instead of 50Mbps).</li>
                    <li>Always play on a wired Cat6 Ethernet cable rather than 2.4GHz Wi-Fi.</li>
                  </ul>
                </div>

                <div className="advice-card">
                  <span className="advice-carrier-badge">Dialog 4G / Hutch (B310 / B315 / ZTE)</span>
                  <p>
                    Mobile 4G towers use deep buffer queues. When high data transfers occur, game packets wait behind heavy streaming streams.
                  </p>
                  <ul>
                    <li>Log into router gateway (<code>192.168.8.1</code>).</li>
                    <li>Lock the router to <strong>4G Only</strong> (prevent switching to congested 3G bands).</li>
                    <li>Switch your Wi-Fi SSID to the <strong>5GHz band</strong> to eliminate 2.4GHz household microwave and neighbor interference.</li>
                    <li>Avoid uploading large files or syncing Google Photos while in ranked competitive games.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty Initial State */}
      {!result && !isRunning && (
        <div className="bloat-empty-info">
          <div className="bloat-info-pill">
            <Layers size={14} className="text-moss" />
            <span>Simulates simultaneous Colombo CDN stream load while probing your selected game server.</span>
          </div>
        </div>
      )}
    </div>
  );
}
