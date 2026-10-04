import { useState, useMemo } from 'react';
import {
  History,
  Download,
  Trash2,
  Clock,
  Zap,
  TrendingDown,
  Activity,
  HardDrive,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { GameIcon } from './GameIcons';
import { getQualityTier } from '../data/gamesDatabase';
import {
  deleteHistoryRecord,
  clearAllHistory,
  exportHistoryCSV,
  exportHistoryJSON
} from '../services/historyService';

export default function TestHistoryCard({ history, onHistoryUpdate }) {
  const [filterGame, setFilterGame] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'fastest' | 'slowest'
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Extract unique games for the filter dropdown
  const uniqueGames = useMemo(() => {
    const map = new Map();
    history.forEach(item => {
      if (item.game?.id && !map.has(item.game.id)) {
        map.set(item.game.id, item.game.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [history]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = [...history];

    if (filterGame !== 'ALL') {
      result = result.filter(item => item.game?.id === filterGame);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'fastest') {
      result.sort((a, b) => (a.stats?.avg ?? 9999) - (b.stats?.avg ?? 9999));
    } else if (sortBy === 'slowest') {
      result.sort((a, b) => (b.stats?.avg ?? 0) - (a.stats?.avg ?? 0));
    }

    return result;
  }, [history, filterGame, sortBy]);

  // Overall statistics
  const summaryStats = useMemo(() => {
    if (history.length === 0) return null;

    let minAvg = Infinity;
    let bestRecord = null;
    let sumAvg = 0;
    let zeroLossCount = 0;

    history.forEach(item => {
      const avg = item.stats?.avg || 0;
      sumAvg += avg;
      if (avg < minAvg) {
        minAvg = avg;
        bestRecord = item;
      }
      if ((item.stats?.packetLoss || 0) === 0) {
        zeroLossCount++;
      }
    });

    return {
      total: history.length,
      bestPing: minAvg === Infinity ? null : minAvg,
      bestGame: bestRecord?.game?.name || '',
      bestRegion: bestRecord?.server?.region || '',
      overallAvg: Math.round(sumAvg / history.length),
      cleanConnectionRate: Math.round((zeroLossCount / history.length) * 100),
    };
  }, [history]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updated = deleteHistoryRecord(id);
    if (onHistoryUpdate) onHistoryUpdate(updated);
  };

  const handleClearAll = () => {
    const updated = clearAllHistory();
    setShowClearConfirm(false);
    if (onHistoryUpdate) onHistoryUpdate(updated);
  };

  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="history-card">
      {/* Card Header */}
      <div className="history-card-header">
        <div className="history-title-block">
          <div className="history-icon-circle">
            <History size={20} className="text-moss" />
          </div>
          <div>
            <div className="history-heading-row">
              <h3 className="history-title">Session Latency History</h3>
              <span className="history-count-badge">
                {history.length} {history.length === 1 ? 'Test' : 'Tests'} Saved
              </span>
            </div>
            <p className="history-subtitle">
              Stored locally on your device in browser localStorage · 100% private, zero backend tracking.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        {history.length > 0 && (
          <div className="history-header-actions">
            <button
              type="button"
              className="history-action-btn"
              onClick={() => exportHistoryCSV(history)}
              title="Export complete test logs as CSV spreadsheet"
            >
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              className="history-action-btn"
              onClick={() => exportHistoryJSON(history)}
              title="Export test history as JSON data"
            >
              <FileCode size={15} />
              <span>JSON</span>
            </button>
            
            {!showClearConfirm ? (
              <button
                type="button"
                className="history-action-btn history-action-danger"
                onClick={() => setShowClearConfirm(true)}
                title="Clear all stored ping records"
              >
                <Trash2 size={15} />
                <span>Clear</span>
              </button>
            ) : (
              <div className="history-clear-confirm">
                <span className="confirm-text">Clear all?</span>
                <button
                  type="button"
                  className="confirm-btn-yes"
                  onClick={handleClearAll}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="confirm-btn-cancel"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aggregate Statistics Bar */}
      {summaryStats && (
        <div className="history-stats-bar">
          <div className="history-stat-box">
            <div className="stat-label-row">
              <Clock size={13} className="text-moss" />
              <span>Total Probes</span>
            </div>
            <span className="history-stat-value">{summaryStats.total}</span>
          </div>

          <div className="history-stat-box">
            <div className="stat-label-row">
              <TrendingDown size={13} className="text-moss" />
              <span>Best Latency</span>
            </div>
            <div className="history-stat-value text-moss">
              {summaryStats.bestPing} <small>ms</small>
            </div>
            <span className="history-stat-sub">
              {summaryStats.bestGame} ({summaryStats.bestRegion})
            </span>
          </div>

          <div className="history-stat-box">
            <div className="stat-label-row">
              <Activity size={13} className="text-moss" />
              <span>Overall Average</span>
            </div>
            <div className="history-stat-value">
              {summaryStats.overallAvg} <small>ms</small>
            </div>
          </div>

          <div className="history-stat-box">
            <div className="stat-label-row">
              <ShieldCheck size={13} className="text-moss" />
              <span>Clean Lossless Tests</span>
            </div>
            <div className="history-stat-value">
              {summaryStats.cleanConnectionRate}%
            </div>
          </div>
        </div>
      )}

      {/* Filter and Sorting Controls */}
      {history.length > 0 && (
        <div className="history-controls-row">
          <div className="history-filter-group">
            <Filter size={14} className="text-moss" />
            <span className="filter-label">Filter:</span>
            <select
              className="history-select"
              value={filterGame}
              onChange={(e) => setFilterGame(e.target.value)}
            >
              <option value="ALL">All Games ({history.length})</option>
              {uniqueGames.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="history-sort-group">
            <span className="filter-label">Sort:</span>
            <button
              type="button"
              className={`sort-pill ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => setSortBy('newest')}
            >
              Newest
            </button>
            <button
              type="button"
              className={`sort-pill ${sortBy === 'fastest' ? 'active' : ''}`}
              onClick={() => setSortBy('fastest')}
            >
              Fastest Ping
            </button>
            <button
              type="button"
              className={`sort-pill ${sortBy === 'slowest' ? 'active' : ''}`}
              onClick={() => setSortBy('slowest')}
            >
              Highest
            </button>
          </div>
        </div>
      )}

      {/* History Items List */}
      {filteredRecords.length > 0 ? (
        <div className="history-list">
          {filteredRecords.map((item) => {
            const tier = getQualityTier(item.stats?.avg || 999);

            return (
              <div key={item.id} className="history-item">
                <div className="history-item-left">
                  <div className="history-game-icon-wrap">
                    <GameIcon gameId={item.game?.id} size={24} />
                  </div>
                  <div className="history-game-info">
                    <div className="history-game-title-row">
                      <span className="history-game-name">{item.game?.name}</span>
                      <span className="history-region-tag">{item.server?.region}</span>
                    </div>
                    <div className="history-meta-row">
                      <span className="history-isp-tag">
                        {item.isp?.name} {item.isp?.connectionType ? `· ${item.isp.connectionType}` : ''}
                      </span>
                      {item.isp?.city && (
                        <span className="history-city-tag">{item.isp.city}, LK</span>
                      )}
                      <span className="history-time-tag">
                        <Clock size={11} />
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="history-item-right">
                  <div className="history-stats-preview">
                    <div className="history-ping-big" style={{ color: tier.color }}>
                      {item.stats?.avg}
                      <span className="history-unit">ms</span>
                    </div>
                    <span
                      className="history-tier-pill"
                      style={{
                        color: tier.color,
                        backgroundColor: tier.bgColor,
                        borderColor: tier.color,
                      }}
                    >
                      Tier {tier.tier} · {tier.label}
                    </span>
                  </div>

                  <div className="history-details-pill">
                    <div className="history-mini-stat">
                      <span>Min/Max:</span>
                      <strong>{item.stats?.min}/{item.stats?.max}ms</strong>
                    </div>
                    <div className="history-mini-stat">
                      <span>Jitter:</span>
                      <strong>±{item.stats?.jitter}ms</strong>
                    </div>
                    <div className="history-mini-stat">
                      <span>Loss:</span>
                      <strong className={item.stats?.packetLoss > 0 ? 'text-red-400' : 'text-moss'}>
                        {item.stats?.packetLoss || 0}%
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="history-item-delete"
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete this record"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : history.length > 0 ? (
        <div className="history-empty-filter">
          <p>No tests match the selected filter.</p>
          <button
            type="button"
            className="filter-reset-btn"
            onClick={() => setFilterGame('ALL')}
          >
            Show All Games
          </button>
        </div>
      ) : (
        <div className="history-empty-state">
          <div className="history-empty-icon-wrap">
            <HardDrive size={28} className="text-moss" />
          </div>
          <h4 className="history-empty-title">No Ping Tests Recorded Yet</h4>
          <p className="history-empty-desc">
            When you complete a latency probe in Step 3, your results will be automatically saved here for tracking ISP stability and comparison.
          </p>
        </div>
      )}
    </div>
  );
}
