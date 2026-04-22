import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Laptop, QrCode, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';

const EXPO_FALLBACK_PORT = 8083;

const PANEL_COPY = {
  en: {
    title: 'Expo Go QR',
    subtitle:
      'Scan using Expo Go on the same Wi-Fi. This opens the mobile remote app instantly.',
    loading: 'Preparing Expo QR...',
    hostLabel: 'Laptop host',
    portLabel: 'Remote port',
    expoPortLabel: 'Expo port',
    copyLink: 'Copy link',
    copied: 'Copied',
    openHint: 'If camera fails, open this Expo URL manually:',
    stepsTitle: 'Flow',
    stepOne: 'Run desktop app + run Expo (`npm run dev:mobile`)',
    stepTwo: 'Scan QR with Expo Go',
    stepThree: 'Mobile remote opens and controls clicker running on laptop',
    noUrl: 'Expo URL is not available yet.',
    qrFailed: 'QR preview failed to load. Copy/open the Expo URL below.',
  },
  id: {
    title: 'QR Expo Go',
    subtitle:
      'Scan pakai Expo Go di Wi-Fi yang sama. Ini akan langsung membuka app remote mobile.',
    loading: 'Menyiapkan QR Expo...',
    hostLabel: 'Host laptop',
    portLabel: 'Port remote',
    expoPortLabel: 'Port Expo',
    copyLink: 'Copy link',
    copied: 'Tersalin',
    openHint: 'Kalau kamera gagal scan, buka URL Expo ini manual:',
    stepsTitle: 'Flow',
    stepOne: 'Jalankan app desktop + Expo (`npm run dev:mobile`)',
    stepTwo: 'Scan QR pakai Expo Go',
    stepThree: 'Remote mobile terbuka dan mengontrol clicker di laptop',
    noUrl: 'URL Expo belum tersedia.',
    qrFailed: 'Preview QR gagal dimuat. Salin/buka URL Expo di bawah.',
  },
};

function buildExpoUrl(host, expoPort, remoteUrl) {
  if (!host) return '';
  const normalizedPort = Number.isFinite(Number(expoPort)) ? Number(expoPort) : EXPO_FALLBACK_PORT;
  if (!remoteUrl) {
    return `exp://${host}:${normalizedPort}`;
  }
  return `exp://${host}:${normalizedPort}/--/?remoteUrl=${encodeURIComponent(remoteUrl)}`;
}

function normalizeRemoteInfo(rawInfo) {
  const host = typeof rawInfo?.host === 'string' ? rawInfo.host : '';
  const remoteUrl = typeof rawInfo?.url === 'string' ? rawInfo.url : '';
  const expoPort = Number.isFinite(Number(rawInfo?.expoPort))
    ? Number(rawInfo.expoPort)
    : EXPO_FALLBACK_PORT;
  const expoUrlFromBackend = typeof rawInfo?.expoUrl === 'string' ? rawInfo.expoUrl : '';

  return {
    enabled: Boolean(rawInfo?.enabled),
    host,
    port: Number.isFinite(Number(rawInfo?.port)) ? Number(rawInfo.port) : 0,
    url: remoteUrl,
    expoPort,
    expoUrl: expoUrlFromBackend || buildExpoUrl(host, expoPort, remoteUrl),
    error: typeof rawInfo?.error === 'string' ? rawInfo.error : '',
  };
}

function getWebFallbackInfo() {
  if (typeof window === 'undefined') {
    return {
      loading: false,
      enabled: false,
      host: '',
      port: 0,
      url: '',
      expoPort: EXPO_FALLBACK_PORT,
      expoUrl: '',
      error: 'Unable to detect browser host.',
    };
  }

  const host = window.location.hostname || 'localhost';
  const localhostLike = host === 'localhost' || host === '127.0.0.1';

  return {
    loading: false,
    enabled: false,
    host,
    port: 0,
    url: '',
    expoPort: EXPO_FALLBACK_PORT,
    expoUrl: buildExpoUrl(host, EXPO_FALLBACK_PORT, ''),
    error: localhostLike
      ? 'Expo QR is using localhost. Open the web app via LAN IP for phone scanning.'
      : '',
  };
}

function getPanelCopy(language) {
  return language === 'id' ? PANEL_COPY.id : PANEL_COPY.en;
}

export default function MobileBridgePanel({ language }) {
  const copy = useMemo(() => getPanelCopy(language), [language]);
  const canReadRemoteAccess = Boolean(window.electronAPI?.getRemoteAccess);
  const [bridgeInfo, setBridgeInfo] = useState({
    ...(canReadRemoteAccess
      ? {
          loading: true,
          enabled: false,
          host: '',
          port: 0,
          url: '',
          expoPort: EXPO_FALLBACK_PORT,
          expoUrl: '',
          error: '',
        }
      : getWebFallbackInfo()),
  });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrRenderFailed, setQrRenderFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canReadRemoteAccess) {
      return;
    }

    let cancelled = false;

    const loadBridgeInfo = async () => {
      try {
        const nextInfo = await window.electronAPI.getRemoteAccess();
        if (cancelled) return;
        setBridgeInfo({
          loading: false,
          ...normalizeRemoteInfo(nextInfo),
        });
      } catch (error) {
        if (cancelled) return;
        const fallbackInfo = getWebFallbackInfo();
        setBridgeInfo({
          ...fallbackInfo,
          error: error?.message || 'Failed to fetch remote access info.',
        });
      }
    };

    loadBridgeInfo();
    const refreshTimer = window.setInterval(loadBridgeInfo, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [canReadRemoteAccess]);

  useEffect(() => {
    let active = true;
    const qrTarget = bridgeInfo.expoUrl || bridgeInfo.url;

    const buildQr = async () => {
      if (!qrTarget) {
        if (active) {
          setQrDataUrl('');
        }
        return;
      }

      try {
        const value = await QRCode.toDataURL(qrTarget, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#111827',
            light: '#FFFFFF',
          },
        });
        if (active) {
          setQrRenderFailed(false);
          setQrDataUrl(value);
        }
      } catch {
        if (active) {
          setQrRenderFailed(false);
          setQrDataUrl('');
        }
      }
    };

    buildQr();

    return () => {
      active = false;
    };
  }, [bridgeInfo.expoUrl, bridgeInfo.url]);

  const onCopyLink = async () => {
    const qrTarget = bridgeInfo.expoUrl || bridgeInfo.url;
    if (!qrTarget || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(qrTarget);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore copy permission errors.
    }
  };

  const qrTargetUrl = bridgeInfo.expoUrl || bridgeInfo.url;
  const hasRemoteUrl = Boolean(qrTargetUrl);

  return (
    <section className="settings-card mobile-bridge-card">
      <div className="card-header mobile-bridge-header">
        <div className="card-icon">
          <QrCode size={18} />
        </div>
        <div>
          <h3 className="card-title">{copy.title}</h3>
          <p className="card-subtitle">{copy.subtitle}</p>
        </div>
      </div>

      {bridgeInfo.loading ? (
        <div className="mobile-bridge-loading">{copy.loading}</div>
      ) : (
        <>
          {bridgeInfo.error ? (
            <div className="mobile-bridge-error">
              <AlertTriangle size={16} />
              <span>{bridgeInfo.error}</span>
            </div>
          ) : null}

          <div className="mobile-bridge-grid">
            <div className="mobile-bridge-qr-panel">
              {hasRemoteUrl && qrDataUrl && !qrRenderFailed ? (
                <img
                  className="mobile-bridge-qr-image"
                  src={qrDataUrl}
                  alt="Expo Go QR code"
                  loading="lazy"
                  onError={() => setQrRenderFailed(true)}
                />
              ) : (
                <div className="mobile-bridge-qr-placeholder">
                  {hasRemoteUrl && qrRenderFailed ? copy.qrFailed : copy.noUrl}
                </div>
              )}
            </div>

            <div className="mobile-bridge-info-panel">
              <div className="mobile-bridge-meta">
                <div className="mobile-bridge-meta-item">
                  <Laptop size={14} />
                  <span>{copy.hostLabel}</span>
                  <strong>{bridgeInfo.host || '-'}</strong>
                </div>
                <div className="mobile-bridge-meta-item">
                  <Smartphone size={14} />
                  <span>{copy.portLabel}</span>
                  <strong>{bridgeInfo.port || '-'}</strong>
                </div>
                <div className="mobile-bridge-meta-item">
                  <QrCode size={14} />
                  <span>{copy.expoPortLabel}</span>
                  <strong>{bridgeInfo.expoPort || EXPO_FALLBACK_PORT}</strong>
                </div>
              </div>

              <div className="mobile-bridge-link-wrap">
                <span className="mobile-bridge-link-label">{copy.openHint}</span>
                <code className="mobile-bridge-link">{qrTargetUrl || '-'}</code>
              </div>

              <button
                type="button"
                className="preset-btn mobile-bridge-copy-btn"
                onClick={onCopyLink}
                disabled={!hasRemoteUrl}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? copy.copied : copy.copyLink}
              </button>

              <div className="mobile-bridge-steps">
                <div className="mobile-bridge-steps-title">{copy.stepsTitle}</div>
                <ol>
                  <li>{copy.stepOne}</li>
                  <li>{copy.stepTwo}</li>
                  <li>{copy.stepThree}</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
