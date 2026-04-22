import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const INTERVAL_PRESETS = [50, 100, 250, 500, 1000];

function normalizeKey(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed === ' ') return 'Space';
  if (/^f\d{1,2}$/i.test(trimmed)) return trimmed.toUpperCase();
  if (trimmed.length === 1) return trimmed.toUpperCase();
  if (/^spacebar$/i.test(trimmed)) return 'Space';
  return trimmed;
}

function normalizeInterval(value) {
  const numeric = Number.parseInt(String(value || '').trim(), 10);
  if (!Number.isFinite(numeric) || numeric < 10 || numeric > 600000) {
    return null;
  }
  return numeric;
}

function parseRemoteUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Remote URL wajib diisi.' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Format URL tidak valid.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL harus diawali http:// atau https://.' };
  }

  const token = parsed.searchParams.get('token') || '';
  if (!token) {
    return {
      valid: false,
      error: 'Token tidak ditemukan. Copy URL dari panel desktop (ada ?token=...).',
    };
  }

  return {
    valid: true,
    baseUrl: `${parsed.protocol}//${parsed.host}`,
    token,
  };
}

function getRemoteUrlFromExpoLink(linkUrl) {
  if (!linkUrl) return '';

  try {
    const parsed = new URL(String(linkUrl));
    const remoteUrlFromQuery =
      parsed.searchParams.get('remoteUrl') || parsed.searchParams.get('remote_url') || '';
    return remoteUrlFromQuery ? remoteUrlFromQuery.trim() : '';
  } catch {
    return '';
  }
}

async function callRemoteApi(config, path, options = {}) {
  if (!config?.valid) {
    throw new Error('Remote belum terkoneksi.');
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-kac-token': config.token,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Request ke laptop gagal.');
  }
  return payload;
}

function App() {
  const [remoteUrl, setRemoteUrl] = useState('');
  const [sessionConfig, setSessionConfig] = useState(null);
  const [selectedKey, setSelectedKey] = useState('Space');
  const [interval, setIntervalValue] = useState('100');
  const [status, setStatus] = useState({
    running: false,
    key: 'Space',
    interval: 100,
    clickCount: 0,
  });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const connectionLabel = useMemo(() => {
    if (!sessionConfig?.valid) return 'Belum terkoneksi';
    return `Terkoneksi ke ${sessionConfig.baseUrl}`;
  }, [sessionConfig]);

  useEffect(() => {
    let isMounted = true;

    const applyIncomingExpoLink = (incomingUrl) => {
      const remoteUrlFromExpoLink = getRemoteUrlFromExpoLink(incomingUrl);
      if (!remoteUrlFromExpoLink || !isMounted) return;
      setRemoteUrl(remoteUrlFromExpoLink);
      setError('');
      setNotice('Remote URL terisi dari QR Expo. Lanjut tap Connect Remote.');
    };

    Linking.getInitialURL()
      .then((initialUrl) => {
        applyIncomingExpoLink(initialUrl);
      })
      .catch(() => {
        // Ignore initial URL read errors.
      });

    const subscription = Linking.addEventListener('url', (event) => {
      applyIncomingExpoLink(event?.url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const withBusy = async (runner) => {
    setIsBusy(true);
    try {
      await runner();
    } finally {
      setIsBusy(false);
    }
  };

  const connectRemote = async () => {
    setError('');
    setNotice('');
    const parsed = parseRemoteUrl(remoteUrl);
    if (!parsed.valid) {
      setSessionConfig(null);
      setError(parsed.error);
      return;
    }

    await withBusy(async () => {
      const nextStatus = await callRemoteApi(parsed, '/api/status');
      setSessionConfig(parsed);
      setStatus({
        running: Boolean(nextStatus.running),
        key: nextStatus.key || 'Space',
        interval: Number.isFinite(nextStatus.interval) ? nextStatus.interval : 100,
        clickCount: Number.isFinite(nextStatus.clickCount) ? nextStatus.clickCount : 0,
      });
      setSelectedKey(nextStatus.key || 'Space');
      setIntervalValue(
        Number.isFinite(nextStatus.interval) ? String(nextStatus.interval) : '100'
      );
      setNotice('Remote tersambung. Kamu bisa kontrol dari HP.');
    }).catch((connectError) => {
      setSessionConfig(null);
      setError(connectError.message || 'Gagal konek ke laptop.');
    });
  };

  const refreshStatus = async (config = sessionConfig) => {
    if (!config?.valid) return;

    await withBusy(async () => {
      const nextStatus = await callRemoteApi(config, '/api/status');
      setStatus({
        running: Boolean(nextStatus.running),
        key: nextStatus.key || selectedKey,
        interval: Number.isFinite(nextStatus.interval) ? nextStatus.interval : Number(interval) || 100,
        clickCount: Number.isFinite(nextStatus.clickCount) ? nextStatus.clickCount : 0,
      });
      setNotice('Status terbaru berhasil diambil.');
    }).catch((refreshError) => {
      setError(refreshError.message || 'Gagal refresh status.');
    });
  };

  const applySettings = async () => {
    setError('');
    setNotice('');
    if (!sessionConfig?.valid) {
      setError('Konek dulu ke remote laptop.');
      return;
    }

    const key = normalizeKey(selectedKey);
    const intervalMs = normalizeInterval(interval);
    if (!key) {
      setError('Target key wajib diisi.');
      return;
    }
    if (!intervalMs) {
      setError('Interval harus 10 sampai 600000 ms.');
      return;
    }

    await withBusy(async () => {
      const payload = await callRemoteApi(sessionConfig, '/api/update-settings', {
        method: 'POST',
        body: { key, interval: intervalMs },
      });
      const updated = payload.status || payload;
      setStatus({
        running: Boolean(updated.running),
        key: updated.key || key,
        interval: Number.isFinite(updated.interval) ? updated.interval : intervalMs,
        clickCount: Number.isFinite(updated.clickCount) ? updated.clickCount : 0,
      });
      setNotice('Setting diterapkan di laptop.');
    }).catch((applyError) => {
      setError(applyError.message || 'Gagal apply setting.');
    });
  };

  const startClicker = async () => {
    setError('');
    setNotice('');
    if (!sessionConfig?.valid) {
      setError('Konek dulu ke remote laptop.');
      return;
    }

    const key = normalizeKey(selectedKey);
    const intervalMs = normalizeInterval(interval);
    if (!key) {
      setError('Target key wajib diisi.');
      return;
    }
    if (!intervalMs) {
      setError('Interval harus 10 sampai 600000 ms.');
      return;
    }

    await withBusy(async () => {
      const payload = await callRemoteApi(sessionConfig, '/api/start-clicker', {
        method: 'POST',
        body: { key, interval: intervalMs },
      });
      const updated = payload.status || payload;
      setStatus({
        running: Boolean(updated.running),
        key: updated.key || key,
        interval: Number.isFinite(updated.interval) ? updated.interval : intervalMs,
        clickCount: Number.isFinite(updated.clickCount) ? updated.clickCount : 0,
      });
      setNotice('Auto clicker aktif di laptop.');
    }).catch((startError) => {
      setError(startError.message || 'Gagal start auto clicker.');
    });
  };

  const stopClicker = async () => {
    setError('');
    setNotice('');
    if (!sessionConfig?.valid) {
      setError('Konek dulu ke remote laptop.');
      return;
    }

    await withBusy(async () => {
      const payload = await callRemoteApi(sessionConfig, '/api/stop-clicker', {
        method: 'POST',
      });
      const updated = payload.status || payload;
      setStatus({
        running: Boolean(updated.running),
        key: updated.key || selectedKey,
        interval: Number.isFinite(updated.interval) ? updated.interval : Number(interval) || 100,
        clickCount: Number.isFinite(updated.clickCount) ? updated.clickCount : 0,
      });
      setNotice('Auto clicker dihentikan.');
    }).catch((stopError) => {
      setError(stopError.message || 'Gagal stop auto clicker.');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Keyboard Auto Clicker - Expo Remote</Text>
        <Text style={styles.subtitle}>
          1) Jalankan desktop app di laptop. 2) Copy URL remote dari panel desktop. 3) Paste di sini.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Remote URL dari Desktop</Text>
          <TextInput
            value={remoteUrl}
            onChangeText={setRemoteUrl}
            placeholder="http://192.168.x.x:39227/remote?token=..."
            placeholderTextColor="#91a4c8"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={connectRemote} disabled={isBusy}>
            <Text style={styles.primaryButtonText}>{isBusy ? 'Connecting...' : 'Connect Remote'}</Text>
          </TouchableOpacity>
          <Text style={styles.connectionText}>{connectionLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Target Key</Text>
          <TextInput
            value={selectedKey}
            onChangeText={setSelectedKey}
            placeholder="Space / A / F6"
            placeholderTextColor="#91a4c8"
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.label}>Interval (ms)</Text>
          <TextInput
            value={interval}
            onChangeText={setIntervalValue}
            placeholder="100"
            placeholderTextColor="#91a4c8"
            keyboardType="number-pad"
            style={styles.input}
          />

          <View style={styles.presetRow}>
            {INTERVAL_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={styles.presetButton}
                onPress={() => setIntervalValue(String(preset))}
              >
                <Text style={styles.presetButtonText}>{preset >= 1000 ? `${preset / 1000}s` : `${preset}ms`}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.applyButton]}
              onPress={applySettings}
              disabled={isBusy}
            >
              <Text style={styles.actionButtonText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={startClicker}
              disabled={isBusy}
            >
              <Text style={styles.actionButtonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.stopButton]}
              onPress={stopClicker}
              disabled={isBusy}
            >
              <Text style={styles.actionButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, status.running ? styles.running : styles.stopped]}>
              {status.running ? 'RUNNING' : 'STOPPED'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Key</Text>
            <Text style={styles.statValue}>{status.key || '-'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Interval</Text>
            <Text style={styles.statValue}>{status.interval || 0} ms</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Clicks</Text>
            <Text style={styles.statValue}>{status.clickCount || 0}</Text>
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => refreshStatus()} disabled={isBusy}>
            <Text style={styles.secondaryButtonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>

        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080d19',
  },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  title: {
    color: '#f5f8ff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#b3c0dc',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#111b2e',
    borderColor: '#233455',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  label: {
    color: '#b7c5e3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#16233d',
    borderColor: '#304a75',
    borderWidth: 1,
    borderRadius: 10,
    color: '#f7faff',
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 6,
    borderRadius: 10,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f5783',
    backgroundColor: '#16233d',
  },
  secondaryButtonText: {
    color: '#dbe7ff',
    fontWeight: '700',
    fontSize: 14,
  },
  connectionText: {
    color: '#a9badb',
    fontSize: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3a5076',
    backgroundColor: '#182745',
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetButtonText: {
    color: '#ccdbf7',
    fontSize: 12,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  applyButton: {
    backgroundColor: '#2563eb',
  },
  startButton: {
    backgroundColor: '#16a34a',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#223452',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  statLabel: {
    color: '#9fb0d2',
    fontSize: 13,
  },
  statValue: {
    color: '#f4f8ff',
    fontSize: 14,
    fontWeight: '700',
  },
  running: {
    color: '#86efac',
  },
  stopped: {
    color: '#fca5a5',
  },
  noticeText: {
    color: '#86efac',
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: '#fda4af',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default App;
