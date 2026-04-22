function renderRemoteControlPage({ token }) {
  const safeToken = typeof token === 'string' ? token : '';

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Keyboard Auto Clicker Remote</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #05080f;
        --panel: #101726;
        --panel-strong: #151f33;
        --panel-border: rgba(95, 134, 209, 0.24);
        --text: #f7faff;
        --muted: #a9b7d4;
        --accent: #60a5fa;
        --accent-strong: #3b82f6;
        --danger: #ef4444;
        --success: #22c55e;
        --shadow: rgba(15, 23, 42, 0.45);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        background:
          radial-gradient(circle at 12% 0%, rgba(96, 165, 250, 0.22), transparent 35%),
          radial-gradient(circle at 92% 100%, rgba(56, 189, 248, 0.2), transparent 40%), var(--bg);
        color: var(--text);
        min-height: 100dvh;
      }

      .page {
        max-width: 560px;
        margin: 0 auto;
        padding: 16px;
        display: grid;
        gap: 12px;
      }

      .card {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 85%), var(--panel);
        border: 1px solid var(--panel-border);
        border-radius: 14px;
        padding: 14px;
        box-shadow: 0 12px 28px var(--shadow);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .title {
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .subtitle {
        margin-top: 4px;
        font-size: 13px;
        color: var(--muted);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--panel-border);
        background: rgba(255, 255, 255, 0.04);
        font-size: 12px;
        color: var(--muted);
        white-space: nowrap;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--muted);
        box-shadow: 0 0 0 5px rgba(169, 183, 212, 0.2);
      }

      .dot.running {
        background: var(--success);
        box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.22);
      }

      .dot.stopped {
        background: var(--danger);
        box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.2);
      }

      .grid {
        display: grid;
        gap: 10px;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      .field label {
        font-size: 12px;
        color: var(--muted);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .input {
        width: 100%;
        min-height: 44px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: var(--panel-strong);
        color: var(--text);
        padding: 10px 12px;
        font-size: 18px;
        font-weight: 600;
      }

      .input:focus {
        outline: none;
        border-color: rgba(96, 165, 250, 0.7);
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
      }

      .input.key {
        text-transform: uppercase;
      }

      .presets {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .preset-btn {
        min-height: 36px;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.32);
        background: rgba(255, 255, 255, 0.03);
        color: var(--muted);
        padding: 0 11px;
        font-weight: 600;
        font-size: 12px;
      }

      .actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .btn {
        min-height: 44px;
        border: none;
        border-radius: 10px;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #fff;
      }

      .btn.start {
        background: linear-gradient(135deg, #16a34a, #22c55e);
      }

      .btn.stop {
        background: linear-gradient(135deg, #dc2626, #ef4444);
      }

      .btn.apply {
        background: linear-gradient(135deg, var(--accent-strong), var(--accent));
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .stat {
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(255, 255, 255, 0.03);
        padding: 10px;
      }

      .stat-label {
        color: var(--muted);
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .stat-value {
        margin-top: 5px;
        font-size: 18px;
        font-weight: 700;
      }

      .notice {
        min-height: 22px;
        margin: 0;
        font-size: 12px;
        color: var(--muted);
      }

      .notice.error {
        color: #fca5a5;
      }

      .notice.ok {
        color: #86efac;
      }

      @media (max-width: 440px) {
        .actions,
        .stats {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="card">
        <div class="header">
          <div>
            <div class="title">Keyboard Auto Clicker Remote</div>
            <div class="subtitle">Kontrol dari HP, proses tetap jalan di laptop</div>
          </div>
          <div class="badge">
            <span id="statusDot" class="dot"></span>
            <span id="statusText">Menyambung...</span>
          </div>
        </div>
      </section>

      <section class="card grid">
        <div class="field">
          <label for="keyInput">Target Key</label>
          <input id="keyInput" class="input key" maxlength="24" placeholder="Space / A / F6" />
        </div>

        <div class="field">
          <label for="intervalInput">Interval (ms)</label>
          <input
            id="intervalInput"
            class="input"
            type="number"
            min="10"
            max="600000"
            step="10"
            inputmode="numeric"
            placeholder="100"
          />
        </div>

        <div class="presets">
          <button class="preset-btn" type="button" data-interval="50">50ms</button>
          <button class="preset-btn" type="button" data-interval="100">100ms</button>
          <button class="preset-btn" type="button" data-interval="250">250ms</button>
          <button class="preset-btn" type="button" data-interval="500">500ms</button>
          <button class="preset-btn" type="button" data-interval="1000">1s</button>
        </div>

        <div class="actions">
          <button id="startBtn" class="btn start" type="button">START</button>
          <button id="stopBtn" class="btn stop" type="button">STOP</button>
          <button id="applyBtn" class="btn apply" type="button">APPLY</button>
        </div>
      </section>

      <section class="card stats">
        <div class="stat">
          <div class="stat-label">Target</div>
          <div id="targetKey" class="stat-value">-</div>
        </div>
        <div class="stat">
          <div class="stat-label">Interval</div>
          <div id="targetInterval" class="stat-value">-</div>
        </div>
        <div class="stat">
          <div class="stat-label">Clicks</div>
          <div id="clickCount" class="stat-value">0</div>
        </div>
      </section>

      <p id="notice" class="notice"></p>
    </main>

    <script>
      (() => {
        const TOKEN = ${JSON.stringify(safeToken)};
        const REFRESH_MS = 900;
        const keyInput = document.getElementById('keyInput');
        const intervalInput = document.getElementById('intervalInput');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const targetKey = document.getElementById('targetKey');
        const targetInterval = document.getElementById('targetInterval');
        const clickCount = document.getElementById('clickCount');
        const notice = document.getElementById('notice');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const applyBtn = document.getElementById('applyBtn');

        function setNotice(message, mode) {
          notice.textContent = message || '';
          notice.className = 'notice';
          if (mode) {
            notice.classList.add(mode);
          }
        }

        function normalizeKey(value) {
          const trimmed = String(value || '').trim();
          if (!trimmed) return '';
          if (trimmed === ' ') return 'Space';
          if (/^f\\d{1,2}$/i.test(trimmed)) return trimmed.toUpperCase();
          if (trimmed.length === 1) return trimmed.toUpperCase();
          if (/^spacebar$/i.test(trimmed)) return 'Space';
          return trimmed;
        }

        function normalizeInterval(value) {
          const numeric = Number.parseInt(String(value || '').trim(), 10);
          if (!Number.isFinite(numeric)) return null;
          if (numeric < 10 || numeric > 600000) return null;
          return numeric;
        }

        async function callApi(path, { method = 'GET', body } = {}) {
          const headers = {
            'x-kac-token': TOKEN,
          };
          if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
          }

          const response = await fetch(path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
          });

          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(payload.error || 'Request gagal');
          }
          return payload;
        }

        function renderStatus(status) {
          const running = Boolean(status && status.running);
          statusDot.className = running ? 'dot running' : 'dot stopped';
          statusText.textContent = running ? 'Running' : 'Stopped';
          targetKey.textContent = status && status.key ? status.key : '-';
          targetInterval.textContent =
            status && Number.isFinite(status.interval) ? status.interval + 'ms' : '-';
          clickCount.textContent =
            status && Number.isFinite(status.clickCount) ? String(status.clickCount) : '0';

          if (document.activeElement !== keyInput) {
            keyInput.value = status && status.key ? status.key : '';
          }
          if (document.activeElement !== intervalInput) {
            intervalInput.value =
              status && Number.isFinite(status.interval) ? String(status.interval) : '';
          }
        }

        async function refreshStatus(showError) {
          try {
            const payload = await callApi('/api/status');
            renderStatus(payload);
            if (showError) setNotice('', '');
          } catch (error) {
            if (showError) {
              setNotice(error.message || 'Gagal mengambil status', 'error');
            }
          }
        }

        document.querySelectorAll('[data-interval]').forEach((button) => {
          button.addEventListener('click', () => {
            intervalInput.value = button.dataset.interval || '100';
          });
        });

        applyBtn.addEventListener('click', async () => {
          const key = normalizeKey(keyInput.value);
          const interval = normalizeInterval(intervalInput.value);
          if (!key) {
            setNotice('Target key wajib diisi', 'error');
            return;
          }
          if (!interval) {
            setNotice('Interval harus angka 10-600000', 'error');
            return;
          }
          try {
            const payload = await callApi('/api/update-settings', {
              method: 'POST',
              body: { key, interval },
            });
            renderStatus(payload.status || payload);
            setNotice('Setting tersimpan di laptop', 'ok');
          } catch (error) {
            setNotice(error.message || 'Gagal simpan setting', 'error');
          }
        });

        startBtn.addEventListener('click', async () => {
          const key = normalizeKey(keyInput.value);
          const interval = normalizeInterval(intervalInput.value);
          if (!key) {
            setNotice('Target key wajib diisi', 'error');
            return;
          }
          if (!interval) {
            setNotice('Interval harus angka 10-600000', 'error');
            return;
          }
          try {
            const payload = await callApi('/api/start-clicker', {
              method: 'POST',
              body: { key, interval },
            });
            renderStatus(payload.status || payload);
            setNotice('Auto clicker aktif di laptop', 'ok');
          } catch (error) {
            setNotice(error.message || 'Gagal start', 'error');
          }
        });

        stopBtn.addEventListener('click', async () => {
          try {
            const payload = await callApi('/api/stop-clicker', {
              method: 'POST',
            });
            renderStatus(payload.status || payload);
            setNotice('Auto clicker dihentikan', 'ok');
          } catch (error) {
            setNotice(error.message || 'Gagal stop', 'error');
          }
        });

        refreshStatus(true);
        window.setInterval(() => {
          refreshStatus(false);
        }, REFRESH_MS);
      })();
    </script>
  </body>
</html>`;
}

module.exports = { renderRemoteControlPage };
