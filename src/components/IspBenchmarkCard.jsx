import { useMemo } from 'react';
import { BarChart3, Wifi, Award } from 'lucide-react';
import { ISP_BENCHMARKS, getQualityTier } from '../data/gamesDatabase';
import { GameIcon } from './GameIcons';

export default function IspBenchmarkCard({ selection, stats }) {
  const benchmarks = useMemo(() => {
    if (!selection || !stats) return null;

    const server = selection.server;
    const entries = [];

    // Parse expected pings and create benchmark rows
    Object.entries(ISP_BENCHMARKS).forEach(([ispName, isp]) => {
      let expectedStr = '';
      if (ispName.includes('SLT') || ispName.includes('Mobitel')) {
        expectedStr = server.expectedPing.sltFiber;
      } else if (ispName.includes('Dialog')) {
        expectedStr = server.expectedPing.dialog4G;
      } else if (ispName.includes('Hutch')) {
        expectedStr = server.expectedPing.hutch;
      } else {
        const sltBase = parseInt(server.expectedPing.sltFiber);
        const estimated = Math.round(sltBase * isp.avgMultiplier);
        expectedStr = `${estimated}-${estimated + 25}ms`;
      }

      const [minStr] = expectedStr.replace('ms', '').split('-');
      const expectedAvg = parseInt(minStr) + 10;

      entries.push({
        name: isp.shortName,
        fullName: ispName,
        color: isp.color,
        expected: expectedStr,
        expectedAvg,
        connectionTypes: isp.connectionTypes,
      });
    });

    return entries;
  }, [selection, stats]);

  if (!benchmarks || !stats || stats.avg === 0) return null;

  const currentPing = stats.avg;
  const maxBenchmark = Math.max(...benchmarks.map(b => b.expectedAvg), currentPing);

  return (
    <div className="benchmark-card">
      <div className="benchmark-header">
        <div className="benchmark-title-wrap">
          <GameIcon gameId={selection.game.id} size={22} />
          <h3 className="benchmark-heading">Sri Lankan ISP Benchmarks for {selection.game.name}</h3>
        </div>
        <span className="benchmark-server-tag">{selection.server.region}</span>
      </div>

      <p className="benchmark-sub">
        Compare your live latency against average Sri Lankan ISP baselines:
      </p>

      <div className="benchmark-list">
        {/* Your Result */}
        <div className="benchmark-row benchmark-row-yours">
          <div className="benchmark-meta">
            <span className="badge-yours">YOUR RESULT</span>
          </div>
          <div className="benchmark-bar-track">
            <div
              className="benchmark-bar-fill benchmark-bar-fill-yours"
              style={{
                width: `${Math.min((currentPing / maxBenchmark) * 100, 100)}%`,
              }}
            />
            <span className="benchmark-bar-value text-moss font-bold">
              {currentPing} ms
            </span>
          </div>
        </div>

        {/* ISP Benchmarks */}
        {benchmarks.map(bm => {
          const isAbove = currentPing > bm.expectedAvg;
          return (
            <div key={bm.name} className="benchmark-row">
              <div className="benchmark-meta">
                <span className="benchmark-isp-name">{bm.name}</span>
                <span className="benchmark-isp-tech">{bm.connectionTypes[0]}</span>
              </div>
              <div className="benchmark-bar-track">
                <div
                  className="benchmark-bar-fill"
                  style={{
                    width: `${Math.min((bm.expectedAvg / maxBenchmark) * 100, 100)}%`,
                  }}
                />
                <span className="benchmark-bar-value">
                  {bm.expected}
                </span>
              </div>
              <div className="benchmark-delta-col">
                {isAbove ? (
                  <span className="delta-tag delta-slower">+{currentPing - bm.expectedAvg}ms</span>
                ) : (
                  <span className="delta-tag delta-faster">−{bm.expectedAvg - currentPing}ms</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
