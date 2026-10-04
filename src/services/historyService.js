/**
 * Personal Test History Service
 * Stores ping diagnostic records in browser localStorage
 * Supports export (JSON, CSV), filtering, and statistics
 */

const STORAGE_KEY = 'latencyx_test_history_v1';
const LEGACY_STORAGE_KEY = 'sl_gameping_test_history_v1';
const MAX_STORED_RECORDS = 60;

/**
 * Retrieve all history records from localStorage
 * @returns {Array} Array of test history records
 */
export function getStoredHistory() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate legacy key if present
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load ping test history from localStorage:', err);
    return [];
  }
}

/**
 * Save a new completed test record
 * @param {Object} param0
 * @param {Object} param0.selection - Game and server selection
 * @param {Object} param0.stats - Completed ping stats
 * @param {Object} param0.ispData - User ISP details
 * @returns {Array} Updated history list
 */
export function saveHistoryRecord({ selection, stats, ispData }) {
  if (!selection || !stats) return getStoredHistory();

  try {
    const current = getStoredHistory();
    const newRecord = {
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      game: {
        id: selection.game.id,
        name: selection.game.name,
        icon: selection.game.icon,
        publisher: selection.game.publisher,
      },
      server: {
        id: selection.server.id,
        region: selection.server.region,
        provider: selection.server.provider,
        endpoint: selection.server.endpoint,
        cableRoute: selection.server.cableRoute,
      },
      isp: ispData ? {
        name: ispData.ispName || 'Unknown ISP',
        connectionType: ispData.connectionType || 'Broadband',
        city: ispData.city || 'Sri Lanka',
        ip: ispData.ip ? `${ispData.ip.split('.').slice(0, 2).join('.')}.*.*` : 'Masked',
      } : {
        name: 'Sri Lanka ISP',
        connectionType: 'Broadband',
        city: 'Colombo',
        ip: 'Masked',
      },
      stats: {
        avg: stats.avg,
        min: stats.min,
        max: stats.max,
        jitter: stats.jitter,
        packetLoss: stats.packetLoss || 0,
        samples: stats.samples || stats.totalSamples || 30,
      },
    };

    // Prepend new record, slice to MAX_STORED_RECORDS
    const updated = [newRecord, ...current].slice(0, MAX_STORED_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save test record to localStorage:', err);
    return getStoredHistory();
  }
}

/**
 * Delete a specific record by ID
 * @param {string} id
 * @returns {Array} Updated history list
 */
export function deleteHistoryRecord(id) {
  try {
    const current = getStoredHistory();
    const updated = current.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete history item:', err);
    return getStoredHistory();
  }
}

/**
 * Clear all test history
 */
export function clearAllHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (err) {
    console.error('Failed to clear test history:', err);
    return [];
  }
}

/**
 * Trigger download of records as JSON file
 * @param {Array} records
 */
export function exportHistoryJSON(records = null) {
  const data = records || getStoredHistory();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `latencyx-history-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger download of records as CSV file
 * @param {Array} records
 */
export function exportHistoryCSV(records = null) {
  const data = records || getStoredHistory();
  if (data.length === 0) return;

  const headers = [
    'Date',
    'Time',
    'Game',
    'Region',
    'Provider',
    'Endpoint',
    'Cable Route',
    'ISP Name',
    'Connection Type',
    'City',
    'Average Ping (ms)',
    'Min Ping (ms)',
    'Max Ping (ms)',
    'Jitter (ms)',
    'Packet Loss (%)',
    'Samples'
  ];

  const escapeCSV = (field) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = data.map(r => {
    const d = new Date(r.timestamp);
    const dateStr = d.toLocaleDateString();
    const timeStr = d.toLocaleTimeString();

    return [
      escapeCSV(dateStr),
      escapeCSV(timeStr),
      escapeCSV(r.game?.name),
      escapeCSV(r.server?.region),
      escapeCSV(r.server?.provider),
      escapeCSV(r.server?.endpoint),
      escapeCSV(r.server?.cableRoute),
      escapeCSV(r.isp?.name),
      escapeCSV(r.isp?.connectionType),
      escapeCSV(r.isp?.city),
      r.stats?.avg ?? '',
      r.stats?.min ?? '',
      r.stats?.max ?? '',
      r.stats?.jitter ?? '',
      r.stats?.packetLoss ?? '0',
      r.stats?.samples ?? ''
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `latencyx-history-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
