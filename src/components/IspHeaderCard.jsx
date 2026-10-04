import { useState, useEffect } from 'react';
import { Wifi, Globe, MapPin, Signal, Server, ChevronDown, CheckCircle2 } from 'lucide-react';
import { detectISP } from '../services/ipDetectService';

export default function IspHeaderCard({ onIspDetected }) {
  const [ispData, setIspData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    detectISP().then(data => {
      setIspData(data);
      setLoading(false);
      if (onIspDetected) onIspDetected(data);
    });
  }, [onIspDetected]);

  if (loading) {
    return (
      <div className="isp-card isp-card-loading">
        <div className="isp-loading-pulse">
          <Wifi className="animate-spin text-moss" size={24} />
          <span>Auto-detecting your Sri Lankan ISP & IP address...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="isp-card">
      <div className="isp-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="isp-main-info">
          <div className="isp-icon-circle">
            <Wifi size={22} className="text-moss" />
          </div>
          <div className="isp-text">
            <div className="isp-title-row">
              <h3 className="isp-name">{ispData.ispName}</h3>
              {ispData.isSriLankan && (
                <span className="isp-badge-sl">
                  <CheckCircle2 size={12} />
                  Sri Lanka ISP
                </span>
              )}
            </div>
            <div className="isp-tags-row">
              <span className="isp-chip isp-chip-type">{ispData.connectionType}</span>
              <span className="isp-chip">{ispData.city || 'Colombo'}, LK</span>
            </div>
          </div>
        </div>

        <div className="isp-ip-section">
          <span className="isp-ip-label">Public IP</span>
          <span className="isp-ip-value">{ispData.ip}</span>
        </div>

        <button type="button" className="isp-toggle-btn" aria-label="Toggle network details">
          <ChevronDown
            size={18}
            className={`isp-expand-icon ${expanded ? 'rotated' : ''}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="isp-card-details">
          <div className="isp-details-grid">
            <div className="isp-detail-box">
              <Globe size={15} className="detail-icon" />
              <div>
                <span className="detail-box-label">Network Operator</span>
                <span className="detail-box-value">{ispData.org || ispData.ispName}</span>
              </div>
            </div>
            <div className="isp-detail-box">
              <Server size={15} className="detail-icon" />
              <div>
                <span className="detail-box-label">Autonomous System (ASN)</span>
                <span className="detail-box-value">{ispData.asn || 'AS45489'}</span>
              </div>
            </div>
            <div className="isp-detail-box">
              <MapPin size={15} className="detail-icon" />
              <div>
                <span className="detail-box-label">Geographic Region</span>
                <span className="detail-box-value">{ispData.city}{ispData.district ? `, ${ispData.district}` : ''}, Sri Lanka</span>
              </div>
            </div>
            <div className="isp-detail-box">
              <Signal size={15} className="detail-icon" />
              <div>
                <span className="detail-box-label">Access Medium</span>
                <span className="detail-box-value">{ispData.connectionType}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
