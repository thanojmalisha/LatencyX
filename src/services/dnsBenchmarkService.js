/**
 * DNS-over-HTTPS (DoH) Benchmark Service
 * Tests lookup speeds across top DNS resolvers relevant to Sri Lankan gamers
 */

export const DNS_PROVIDERS = [
  {
    id: 'cloudflare',
    name: 'Cloudflare DNS',
    ips: ['1.1.1.1', '1.0.0.1'],
    badge: 'Colombo Anycast Peered',
    iconColor: '#f6821f',
    description: 'Directly peered with SLT-Mobitel and Dialog via Colombo Internet Exchange (SLIX). Usually gives lowest query RTT.',
    url: (domain) => `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
    headers: { Accept: 'application/dns-json' },
  },
  {
    id: 'google',
    name: 'Google Public DNS',
    ips: ['8.8.8.8', '8.8.4.4'],
    badge: 'Most Reliable Global',
    iconColor: '#4285f4',
    description: 'High reliability and extensive Anycast nodes routed through Chennai, Mumbai, and Singapore hubs.',
    url: (domain) => `https://dns.google/resolve?name=${domain}&type=A`,
    headers: {},
  },
  {
    id: 'adguard',
    name: 'AdGuard DNS',
    ips: ['94.140.14.14', '94.140.15.15'],
    badge: 'Ad & Tracker Blocker',
    iconColor: '#68bc71',
    description: 'Blocks intrusive telemetry, background analytics, and phishing domains while maintaining fast gaming response.',
    url: (domain) => `https://dns.adguard-dns.com/resolve?name=${domain}&type=A`,
    headers: {},
  },
  {
    id: 'nextdns',
    name: 'NextDNS',
    ips: ['45.90.28.0', '45.90.30.0'],
    badge: 'Low-Latency Security',
    iconColor: '#306bf3',
    description: 'Advanced cloud resolver with ultra-low query latency and protection against DDoS attacks.',
    url: (domain) => `https://dns.nextdns.io/dns-query?name=${domain}&type=A`,
    headers: { Accept: 'application/dns-json' },
  },
];

export const TEST_DOMAINS = [
  { domain: 'dynamodb.ap-south-1.amazonaws.com', label: 'AWS Mumbai (Valorant / CS2)' },
  { domain: 'dynamodb.ap-southeast-1.amazonaws.com', label: 'AWS Singapore (Dota 2 / Free Fire)' },
  { domain: 'store.steampowered.com', label: 'Valve / Steam Client' },
  { domain: 'riotgames.com', label: 'Riot Games Matchmaker' },
];

/**
 * Measure single DNS query latency
 */
async function queryDns(provider, domain) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(provider.url(domain), {
      headers: provider.headers,
      signal: controller.signal,
      cache: 'no-store',
    });
    const end = performance.now();
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const duration = Math.round(end - start);

    return {
      success: true,
      latency: duration,
      resolvedIp: data.Answer?.[0]?.data || null,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      success: false,
      latency: 999,
      error: err.message,
    };
  }
}

/**
 * Run full DNS Benchmark suite
 * @param {Function} onProgress
 * @returns {Promise<Array>} Results per provider
 */
export async function runDnsBenchmark(onProgress) {
  const results = [];
  const totalSteps = DNS_PROVIDERS.length * TEST_DOMAINS.length;
  let completed = 0;

  for (const provider of DNS_PROVIDERS) {
    const latencies = [];
    const details = [];

    for (const item of TEST_DOMAINS) {
      const queryResult = await queryDns(provider, item.domain);
      completed++;

      if (onProgress) {
        onProgress({
          providerName: provider.name,
          currentDomain: item.domain,
          percent: Math.round((completed / totalSteps) * 100),
        });
      }

      if (queryResult.success) {
        latencies.push(queryResult.latency);
      }

      details.push({
        domain: item.domain,
        label: item.label,
        latency: queryResult.latency,
        success: queryResult.success,
      });

      // Small delay between queries to avoid rate-limiting
      await new Promise((r) => setTimeout(r, 60));
    }

    const successfulLatencies = latencies.filter((l) => l < 900);
    const avg = successfulLatencies.length
      ? Math.round(successfulLatencies.reduce((a, b) => a + b, 0) / successfulLatencies.length)
      : 999;
    const min = successfulLatencies.length ? Math.min(...successfulLatencies) : 999;
    const max = successfulLatencies.length ? Math.max(...successfulLatencies) : 999;

    results.push({
      ...provider,
      avgLatency: avg,
      minLatency: min,
      maxLatency: max,
      details,
      isFastest: false,
    });
  }

  // Identify the fastest provider
  let lowestAvg = Infinity;
  let fastestIndex = -1;
  results.forEach((r, idx) => {
    if (r.avgLatency < lowestAvg) {
      lowestAvg = r.avgLatency;
      fastestIndex = idx;
    }
  });

  if (fastestIndex !== -1) {
    results[fastestIndex].isFastest = true;
  }

  // Sort by average latency ascending
  results.sort((a, b) => a.avgLatency - b.avgLatency);

  return results;
}
