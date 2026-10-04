/**
 * IP Detection Service
 * Uses multiple free IP geolocation APIs with fallback chain
 * Optimized for Sri Lankan ISP detection
 */

const SRI_LANKAN_ISPS = [
  { patterns: ['SLT', 'Sri Lanka Telecom', 'Mobitel', 'SLT-Mobitel', 'SLTMobitel'], name: 'SLT Mobitel', type: 'Fiber' },
  { patterns: ['Dialog', 'Dialog Axiata', 'Dialog Broadband'], name: 'Dialog Axiata', type: '4G' },
  { patterns: ['Hutch', 'Hutchison'], name: 'Hutch', type: '4G' },
  { patterns: ['Airtel', 'Bharti Airtel'], name: 'Airtel', type: '4G' },
];

function detectSriLankanISP(rawISP) {
  if (!rawISP) return null;
  const lower = rawISP.toLowerCase();
  for (const isp of SRI_LANKAN_ISPS) {
    if (isp.patterns.some(p => lower.includes(p.toLowerCase()))) {
      return isp;
    }
  }
  return null;
}

function detectConnectionType(rawISP, org) {
  const combined = `${rawISP} ${org || ''}`.toLowerCase();
  if (combined.includes('fiber') || combined.includes('fibre') || combined.includes('ftth')) return 'Fiber';
  if (combined.includes('5g')) return '5G';
  if (combined.includes('4g') || combined.includes('lte')) return '4G';
  if (combined.includes('adsl') || combined.includes('dsl')) return 'ADSL';
  if (combined.includes('broadband')) return 'Broadband';
  if (combined.includes('mobile') || combined.includes('cellular')) return '4G';
  return 'Broadband';
}

// Primary: ip-api.com (no key needed, 45 req/min)
async function fetchFromIpApi() {
  const res = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,district,zip,isp,org,as,query');
  const data = await res.json();
  if (data.status !== 'success') throw new Error(data.message);
  return {
    ip: data.query,
    isp: data.isp,
    org: data.org,
    asn: data.as,
    city: data.city || data.regionName,
    district: data.district || data.regionName,
    country: data.country,
  };
}

// Fallback 1: ipapi.co (free tier: 1000/day)
async function fetchFromIpapiCo() {
  const res = await fetch('https://ipapi.co/json/');
  const data = await res.json();
  if (data.error) throw new Error(data.reason);
  return {
    ip: data.ip,
    isp: data.org,
    org: data.org,
    asn: data.asn,
    city: data.city,
    district: data.region,
    country: data.country_name,
  };
}

// Fallback 2: Cloudflare trace (always works)
async function fetchFromCloudflare() {
  const res = await fetch('https://1.1.1.1/cdn-cgi/trace');
  const text = await res.text();
  const lines = text.split('\n');
  const data = {};
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) data[key.trim()] = value.trim();
  });
  return {
    ip: data.ip,
    isp: 'Unknown ISP',
    org: '',
    asn: '',
    city: data.loc || 'Unknown',
    district: '',
    country: data.loc || 'Unknown',
  };
}

export async function detectISP() {
  const apis = [fetchFromIpApi, fetchFromIpapiCo, fetchFromCloudflare];

  for (const apiFn of apis) {
    try {
      const raw = await apiFn();
      const sriLankanISP = detectSriLankanISP(raw.isp);
      const connectionType = detectConnectionType(raw.isp, raw.org);

      return {
        ip: raw.ip,
        ispName: sriLankanISP ? sriLankanISP.name : raw.isp,
        org: raw.org,
        asn: raw.asn,
        city: raw.city,
        district: raw.district,
        country: raw.country,
        connectionType: sriLankanISP ? sriLankanISP.type : connectionType,
        isSriLankan: !!sriLankanISP,
        raw: raw.isp,
      };
    } catch (err) {
      console.warn(`IP API fallback triggered:`, err.message);
      continue;
    }
  }

  // All APIs failed
  return {
    ip: '—',
    ispName: 'Detection Failed',
    org: '',
    asn: '',
    city: 'Unknown',
    district: '',
    country: 'Unknown',
    connectionType: 'Unknown',
    isSriLankan: false,
    raw: '',
  };
}
