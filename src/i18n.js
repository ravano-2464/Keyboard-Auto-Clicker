export const LANGUAGE_STORAGE_KEY = 'kac-language';
export const SUPPORTED_LANGUAGES = ['en', 'id'];

const KEY_LABELS = {
  en: {
    Space: 'Space',
    Escape: 'Escape',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'Page Up',
    PageDown: 'Page Down',
    ArrowUp: 'Arrow Up',
    ArrowDown: 'Arrow Down',
    ArrowLeft: 'Arrow Left',
    ArrowRight: 'Arrow Right',
  },
  id: {
    Space: 'Spasi',
    Escape: 'Esc',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'Page Up',
    PageDown: 'Page Down',
    ArrowUp: 'Panah Atas',
    ArrowDown: 'Panah Bawah',
    ArrowLeft: 'Panah Kiri',
    ArrowRight: 'Panah Kanan',
  },
};

const EN_RUNTIME_MESSAGES = {
  'No macro data in selected source': 'No macro data in selected source',
  'Manual macro is empty': 'Manual macro is empty',
  'Failed to start playback': 'Failed to start playback',
  'Failed to update hotkeys': 'Failed to update hotkeys',
  'Macro error occurred': 'Macro error occurred',
  'No recorded keys to play': 'No recorded keys to play',
  'Playback speed must be greater than 0': 'Playback speed must be greater than 0',
  'Key simulator not ready': 'Key simulator not ready',
  'Invalid interval value': 'Invalid interval value',
};

const ID_RUNTIME_MESSAGES = {
  'No macro data in selected source': 'Tidak ada data macro pada sumber yang dipilih',
  'Manual macro is empty': 'Macro manual masih kosong',
  'Failed to start playback': 'Gagal memulai playback',
  'Failed to update hotkeys': 'Gagal memperbarui hotkey',
  'Macro error occurred': 'Terjadi error pada macro',
  'No recorded keys to play': 'Belum ada tombol rekaman untuk diputar',
  'Playback speed must be greater than 0': 'Kecepatan playback harus lebih besar dari 0',
  'Key simulator not ready': 'Simulator tombol belum siap',
  'Invalid interval value': 'Nilai interval tidak valid',
};

function getLanguagePack(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
}

function stepLabel(language, count) {
  if (language === 'id') {
    return `${count} langkah`;
  }
  return `${count} step${count === 1 ? '' : 's'}`;
}

function readyStepLabel(language, count) {
  if (language === 'id') {
    return `${count} langkah macro siap`;
  }
  return `${count} macro step${count === 1 ? '' : 's'} ready`;
}

export function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en';

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(savedLanguage)) {
    return savedLanguage;
  }

  const browserLanguage = window.navigator?.language?.toLowerCase() || '';
  return browserLanguage.startsWith('id') ? 'id' : 'en';
}

export function getLocalizedKeyLabel(key, language) {
  if (!key) return '';

  const normalizedLanguage = getLanguagePack(language);
  const normalizedKey = key === ' ' ? 'Space' : key;
  const knownLabel = KEY_LABELS[normalizedLanguage]?.[normalizedKey];

  if (knownLabel) {
    return knownLabel;
  }

  if (normalizedKey.length === 1) {
    return normalizedKey.toUpperCase();
  }

  return normalizedKey;
}

export function translateRuntimeMessage(language, message) {
  if (!message) return '';

  const normalizedLanguage = getLanguagePack(language);
  const trimmedMessage = message.trim();
  const directMap =
    normalizedLanguage === 'id' ? ID_RUNTIME_MESSAGES[trimmedMessage] : EN_RUNTIME_MESSAGES[trimmedMessage];

  if (directMap) {
    return directMap;
  }

  const hotkeyRegistrationMatch = trimmedMessage.match(/^Unable to register hotkey\(s\):\s*(.+)$/);
  if (hotkeyRegistrationMatch) {
    return normalizedLanguage === 'id'
      ? `Tidak dapat mendaftarkan hotkey: ${hotkeyRegistrationMatch[1]}`
      : `Unable to register hotkey(s): ${hotkeyRegistrationMatch[1]}`;
  }

  const unsupportedKeyMatch = trimmedMessage.match(/^Unsupported key:\s*(.+)$/);
  if (unsupportedKeyMatch && normalizedLanguage === 'id') {
    return `Tombol tidak didukung: ${unsupportedKeyMatch[1]}`;
  }

  return trimmedMessage;
}

function createEnglishTranslations() {
  return {
    titleBar: {
      title: 'Keyboard Auto Clicker',
      subtitle: 'by Ravano',
      languageLabel: 'Language',
      switchLanguage: (nextLanguage) =>
        nextLanguage === 'id' ? 'Switch to Indonesian' : 'Switch to English',
      themeToggle: (theme) =>
        `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
      minimize: 'Minimize',
      maximize: 'Maximize',
      restore: 'Restore',
      close: 'Close',
    },
    actions: {
      start: 'START AUTO CLICKER',
      stop: 'STOP AUTO CLICKER',
    },
    keySelector: {
      title: 'Target Key',
      subtitle: 'Select the key to auto-press',
      listeningPrompt: 'Press any key...',
      selectedKey: (keyLabel) => `Key: ${keyLabel}`,
      noKeySelected: 'No key selected',
      listenIdle: 'Click to detect key press',
      listenActive: 'Listening... Press a key',
      quickSelect: 'Quick Select',
    },
    intervalSettings: {
      title: 'Click Interval',
      subtitle: 'Delay between each key press',
      placeholder: 'Enter interval',
      speedLabel: {
        veryFast: 'Very Fast',
        fast: 'Fast',
        normal: 'Normal',
        slow: 'Slow',
      },
    },
    repeatMode: {
      title: 'Repeat Mode',
      subtitle: 'Choose how many times to repeat',
      infinite: 'Infinite',
      customCount: 'Custom Count',
      countPlaceholder: 'Count',
      countUnit: 'times',
    },
    statsBar: {
      key: 'Key',
      clicks: 'Clicks',
      time: 'Time',
    },
    statusOrb: {
      notSet: 'Not Set',
      systemPulse: 'System Pulse',
      quickControl: 'Quick control',
      sourceLabel: (source) => (source === 'manual' ? 'Manual Editor' : 'Recorded Keys'),
      stepCount: (count) => stepLabel('en', count),
      readyMacroSteps: (count) => readyStepLabel('en', count),
      emptyMacroStack: 'Macro stack is empty',
      idle: {
        label: 'IDLE',
        eyebrow: 'System Ready',
        description:
          'Everything is armed. Pick a key or a macro source, then launch it instantly.',
        hotkeyLabel: 'to toggle auto clicker',
        hotkeyNote: 'Quick start or stop',
      },
      running: {
        label: 'RUNNING',
        eyebrow: 'Auto Clicker Live',
        description: (keyLabel, interval) =>
          `Auto clicker is pressing ${keyLabel} every ${interval} ms.`,
        hotkeyLabel: 'to stop auto clicker',
        hotkeyNote: 'Toggle active click loop',
      },
      recording: {
        label: 'RECORDING',
        eyebrow: 'Keyboard Capture Live',
        description: (duration) =>
          `Capturing live keystrokes now. Current session length: ${duration}.`,
        hotkeyLabel: 'to stop recording',
        hotkeyNote: 'Finish capture and save events',
      },
      playing: {
        label: 'PLAYING',
        eyebrow: 'Macro Playback Active',
        description: (sourceLabel, count, duration) =>
          `Running ${sourceLabel} with ${stepLabel('en', count)} across ${duration}.`,
        hotkeyLabel: 'to stop playback',
        hotkeyNote: 'Stop macro playback instantly',
      },
      cards: {
        playbackSource: 'Playback Source',
        inputFeed: 'Input Feed',
        targetKey: 'Target Key',
        liveKeyboard: 'Live Keyboard',
        recordingInputNote: 'Listening to live keyboard input',
        playingSourceNote: 'Source currently driving macro playback',
        runningTargetNote: 'Primary auto click target',
        idleTargetNote: 'Ready for the next trigger',
        captureBuffer: 'Capture Buffer',
        macroStack: 'Macro Stack',
        empty: 'Empty',
        activeMacroNote: 'Current loaded macro is executing',
        defaultMacroNote: 'Recorded and manual steps stay ready here',
        timeline: 'Timeline',
        recordingTime: 'Recording Time',
        cadence: 'Cadence',
        playbackDurationNote: 'Total macro playback duration',
        recordingDurationNote: 'Elapsed live capture length',
        cadenceNote: 'Current click interval',
        controlHotkey: 'Control Hotkey',
      },
    },
    keyboardRecorder: {
      title: 'Keyboard Recorder',
      subtitle: 'Record keystrokes, set playback speed, and run continuous loop',
      sourceLabel: (source) => (source === 'manual' ? 'Manual Editor' : 'Recorded Keys'),
      buttons: {
        startRecording: 'Start Recording',
        stopRecording: 'Stop Recording',
        clear: 'Clear',
        startPlayback: 'Start Playback',
        stopPlayback: 'Stop Playback',
        useRecorded: 'Use Recorded',
        useManual: 'Use Manual Editor',
        addStep: 'Add Step',
        saveManual: 'Save Manual Macro',
        remove: 'Remove',
        record: 'Record',
        listening: 'Press key...',
        applyHotkeys: 'Apply Hotkeys',
      },
      status: {
        idleBadge: 'Recorder Ready',
        recordingBadge: 'Recording Live',
        playingBadge: 'Playback Active',
        idleTitle: 'Macro Recorder Ready',
        recordingTitle: 'Recording Keyboard Input',
        playingTitle: (sourceLabel) => `Playing ${sourceLabel}`,
        idleDescription:
          'Record a new sequence, choose a playback source, or run a ready macro right from this panel.',
        recordingDescription: (recordHotkey) =>
          `Every keyboard key is being recorded now. Press ${recordHotkey} again to save the take.`,
        playingDescription: (sourceLabel, playbackHotkey) =>
          `Macro is running from ${sourceLabel}. Press ${playbackHotkey} to stop playback quickly.`,
        quickActionLabel: {
          idle: 'Start Playback',
          recording: 'Stop Recording',
          playing: 'Stop Playback',
        },
      },
      cards: {
        selectedSource: 'Selected Source',
        selectedSourceNote: (count) => `${count} item ready in this source`,
        capturedSteps: 'Captured Steps',
        activeSteps: 'Active Steps',
        capturedStepsNote: 'Number of events already captured',
        activeStepsNote: 'Steps that will be used during playback',
        recordingTime: 'Recording Time',
        timeline: 'Timeline',
        recordingTimeNote: 'Current recording duration',
        timelineNote: 'Total duration of the selected source',
        loopMode: 'Loop Mode',
        continuous: 'Continuous',
        continuousNote: 'Will repeat until you stop it',
        singleRun: 'Single Run',
        singleRunNote: 'Stops after one pass',
      },
      fields: {
        manualEditor: 'Manual Macro Editor',
        key: 'Key',
        delay: 'Delay',
        hold: 'Hold',
        playbackSpeed: 'Playback Speed',
        customSpeed: 'Custom speed',
        continuousPlayback: 'Continuous playback',
        clickerHotkey: 'Clicker Toggle Hotkey',
        recordHotkey: 'Record Hotkey',
        playbackHotkey: 'Playback Hotkey',
      },
      emptyManual:
        'No steps yet. Add steps manually or start recording inside the app.',
      stepLabel: (index) => `Step ${index}`,
      hotkeyCapture: {
        listeningValue: 'Press keys now...',
        listeningMeta: 'Esc cancel • Del clear',
        idleMeta: 'Click and press your hotkey',
      },
      hints: {
        manualIdle:
          'Tip: Delay waits before the step starts, and Hold keeps the key pressed for that many milliseconds.',
        manualListening:
          'Listening for a step key. Press Esc to cancel or Delete to clear the key.',
        hotkey:
          'Click one field, press the key or key combo you want, then click Apply Hotkeys.',
      },
      activeHotkeys: (clickerHotkey, recordHotkey, playbackHotkey) =>
        `Active: CLICKER ${clickerHotkey} | REC ${recordHotkey} | PLAY ${playbackHotkey}`,
    },
  };
}

function createIndonesianTranslations() {
  return {
    titleBar: {
      title: 'Keyboard Auto Clicker',
      subtitle: 'oleh Ravano',
      languageLabel: 'Bahasa',
      switchLanguage: (nextLanguage) =>
        nextLanguage === 'id' ? 'Ganti ke bahasa Indonesia' : 'Ganti ke bahasa Inggris',
      themeToggle: (theme) => `Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`,
      minimize: 'Minimalkan',
      maximize: 'Maksimalkan',
      restore: 'Pulihkan',
      close: 'Tutup',
    },
    actions: {
      start: 'MULAI AUTO CLICKER',
      stop: 'HENTIKAN AUTO CLICKER',
    },
    keySelector: {
      title: 'Tombol Target',
      subtitle: 'Pilih tombol yang akan ditekan otomatis',
      listeningPrompt: 'Tekan tombol apa pun...',
      selectedKey: (keyLabel) => `Tombol: ${keyLabel}`,
      noKeySelected: 'Belum ada tombol dipilih',
      listenIdle: 'Klik untuk mendeteksi tombol',
      listenActive: 'Mendengarkan... tekan tombol',
      quickSelect: 'Pilih Cepat',
    },
    intervalSettings: {
      title: 'Interval Klik',
      subtitle: 'Jeda antar penekanan tombol',
      placeholder: 'Masukkan interval',
      speedLabel: {
        veryFast: 'Sangat Cepat',
        fast: 'Cepat',
        normal: 'Normal',
        slow: 'Lambat',
      },
    },
    repeatMode: {
      title: 'Mode Pengulangan',
      subtitle: 'Pilih berapa kali pengulangan dilakukan',
      infinite: 'Tak Terbatas',
      customCount: 'Jumlah Kustom',
      countPlaceholder: 'Jumlah',
      countUnit: 'kali',
    },
    statsBar: {
      key: 'Tombol',
      clicks: 'Klik',
      time: 'Waktu',
    },
    statusOrb: {
      notSet: 'Belum Diatur',
      systemPulse: 'Status Sistem',
      quickControl: 'Kontrol cepat',
      sourceLabel: (source) => (source === 'manual' ? 'Editor Manual' : 'Rekaman Tombol'),
      stepCount: (count) => stepLabel('id', count),
      readyMacroSteps: (count) => readyStepLabel('id', count),
      emptyMacroStack: 'Tumpukan macro kosong',
      idle: {
        label: 'SIAGA',
        eyebrow: 'Sistem Siap',
        description:
          'Semua sudah siap. Pilih tombol atau sumber macro, lalu jalankan kapan saja.',
        hotkeyLabel: 'untuk aktif/nonaktifkan auto clicker',
        hotkeyNote: 'Mulai atau hentikan dengan cepat',
      },
      running: {
        label: 'BERJALAN',
        eyebrow: 'Auto Clicker Aktif',
        description: (keyLabel, interval) =>
          `Auto clicker menekan ${keyLabel} setiap ${interval} ms.`,
        hotkeyLabel: 'untuk menghentikan auto clicker',
        hotkeyNote: 'Toggle loop klik yang sedang aktif',
      },
      recording: {
        label: 'MEREKAM',
        eyebrow: 'Perekaman Keyboard Aktif',
        description: (duration) =>
          `Input keyboard sedang direkam. Durasi sesi saat ini: ${duration}.`,
        hotkeyLabel: 'untuk menghentikan rekaman',
        hotkeyNote: 'Selesaikan rekaman dan simpan event',
      },
      playing: {
        label: 'MEMUTAR',
        eyebrow: 'Playback Macro Aktif',
        description: (sourceLabel, count, duration) =>
          `Menjalankan ${sourceLabel} dengan ${stepLabel('id', count)} selama ${duration}.`,
        hotkeyLabel: 'untuk menghentikan playback',
        hotkeyNote: 'Hentikan playback macro seketika',
      },
      cards: {
        playbackSource: 'Sumber Playback',
        inputFeed: 'Sumber Input',
        targetKey: 'Tombol Target',
        liveKeyboard: 'Keyboard Langsung',
        recordingInputNote: 'Sedang mendengarkan input keyboard langsung',
        playingSourceNote: 'Sumber yang sedang digunakan untuk playback macro',
        runningTargetNote: 'Target utama auto clicker',
        idleTargetNote: 'Siap untuk pemicu berikutnya',
        captureBuffer: 'Buffer Rekaman',
        macroStack: 'Tumpukan Macro',
        empty: 'Kosong',
        activeMacroNote: 'Macro yang dimuat sedang dijalankan',
        defaultMacroNote: 'Langkah rekaman dan manual siap dipakai di sini',
        timeline: 'Timeline',
        recordingTime: 'Waktu Rekam',
        cadence: 'Cadence',
        playbackDurationNote: 'Total durasi playback macro',
        recordingDurationNote: 'Durasi rekam langsung yang sudah berjalan',
        cadenceNote: 'Interval klik saat ini',
        controlHotkey: 'Hotkey Kontrol',
      },
    },
    keyboardRecorder: {
      title: 'Perekam Keyboard',
      subtitle: 'Rekam tombol, atur kecepatan playback, dan jalankan loop kontinu',
      sourceLabel: (source) => (source === 'manual' ? 'Editor Manual' : 'Rekaman Tombol'),
      buttons: {
        startRecording: 'Mulai Rekam',
        stopRecording: 'Hentikan Rekam',
        clear: 'Bersihkan',
        startPlayback: 'Mulai Playback',
        stopPlayback: 'Hentikan Playback',
        useRecorded: 'Pakai Rekaman',
        useManual: 'Pakai Editor Manual',
        addStep: 'Tambah Langkah',
        saveManual: 'Simpan Macro Manual',
        remove: 'Hapus',
        record: 'Rekam',
        listening: 'Tekan tombol...',
        applyHotkeys: 'Terapkan Hotkey',
      },
      status: {
        idleBadge: 'Perekam Siap',
        recordingBadge: 'Merekam Langsung',
        playingBadge: 'Playback Aktif',
        idleTitle: 'Perekam Macro Siap',
        recordingTitle: 'Sedang Merekam Input Keyboard',
        playingTitle: (sourceLabel) => `Memutar ${sourceLabel}`,
        idleDescription:
          'Rekam urutan baru, pilih sumber playback, atau jalankan macro yang sudah siap langsung dari panel ini.',
        recordingDescription: (recordHotkey) =>
          `Setiap tombol keyboard sedang direkam sekarang. Tekan ${recordHotkey} lagi untuk menyimpan hasil rekaman.`,
        playingDescription: (sourceLabel, playbackHotkey) =>
          `Macro sedang berjalan dari ${sourceLabel}. Tekan ${playbackHotkey} untuk menghentikan playback dengan cepat.`,
        quickActionLabel: {
          idle: 'Mulai Playback',
          recording: 'Hentikan Rekam',
          playing: 'Hentikan Playback',
        },
      },
      cards: {
        selectedSource: 'Sumber Aktif',
        selectedSourceNote: (count) => `${count} item siap pada sumber ini`,
        capturedSteps: 'Langkah Terekam',
        activeSteps: 'Langkah Aktif',
        capturedStepsNote: 'Jumlah event yang sudah masuk',
        activeStepsNote: 'Langkah yang akan dipakai saat playback',
        recordingTime: 'Waktu Rekam',
        timeline: 'Timeline',
        recordingTimeNote: 'Durasi rekaman saat ini',
        timelineNote: 'Total durasi sumber yang dipilih',
        loopMode: 'Mode Loop',
        continuous: 'Kontinu',
        continuousNote: 'Akan berulang sampai dihentikan',
        singleRun: 'Sekali Jalan',
        singleRunNote: 'Berhenti setelah satu putaran',
      },
      fields: {
        manualEditor: 'Editor Macro Manual',
        key: 'Tombol',
        delay: 'Delay',
        hold: 'Tahan',
        playbackSpeed: 'Kecepatan Playback',
        customSpeed: 'Kecepatan kustom',
        continuousPlayback: 'Playback kontinu',
        clickerHotkey: 'Hotkey Toggle Clicker',
        recordHotkey: 'Hotkey Rekam',
        playbackHotkey: 'Hotkey Playback',
      },
      emptyManual:
        'Belum ada langkah. Tambahkan langkah manual atau mulai merekam di dalam aplikasi.',
      stepLabel: (index) => `Langkah ${index}`,
      hotkeyCapture: {
        listeningValue: 'Tekan tombol sekarang...',
        listeningMeta: 'Esc batal • Del hapus',
        idleMeta: 'Klik lalu tekan hotkey',
      },
      hints: {
        manualIdle:
          'Tip: Delay memberi jeda sebelum langkah dimulai, dan Tahan menjaga tombol tetap ditekan selama sejumlah milidetik.',
        manualListening:
          'Sedang menunggu tombol untuk langkah ini. Tekan Esc untuk batal atau Delete untuk mengosongkan tombol.',
        hotkey:
          'Klik satu field, tekan tombol atau kombinasi tombol yang diinginkan, lalu klik Terapkan Hotkey.',
      },
      activeHotkeys: (clickerHotkey, recordHotkey, playbackHotkey) =>
        `Aktif: CLICKER ${clickerHotkey} | REC ${recordHotkey} | PLAY ${playbackHotkey}`,
    },
  };
}

const TRANSLATION_BUILDERS = {
  en: createEnglishTranslations,
  id: createIndonesianTranslations,
};

export function getTranslations(language) {
  const normalizedLanguage = getLanguagePack(language);
  return TRANSLATION_BUILDERS[normalizedLanguage]();
}
