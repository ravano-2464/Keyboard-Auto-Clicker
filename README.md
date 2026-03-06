# ⌨️ Keyboard Auto Clicker

Aplikasi desktop **Keyboard Auto Clicker** yang dibuat menggunakan **React**, **Vite**, **Electron**, dan **Lucide React**. Aplikasi ini memungkinkan kamu untuk melakukan simulasi penekanan tombol keyboard secara otomatis dengan interval yang bisa disesuaikan.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Electron](https://img.shields.io/badge/Electron-40-47848f)
![Vite](https://img.shields.io/badge/Vite-7-646cff)

---

## ✨ Fitur

| Fitur                  | Deskripsi                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| 🎯 **Target Key**      | Pilih tombol yang ingin di-auto-click secara langsung atau deteksi otomatis via keypress     |
| ⏱️ **Click Interval**  | Atur delay antar penekanan tombol (input manual + preset: 50ms, 100ms, 250ms, 500ms, 1s, 2s) |
| 🔄 **Repeat Mode**     | Pilih mode **Infinite** (tanpa batas) atau **Custom Count** (jumlah tertentu)                |
| ⌨️ **Hotkey F6**       | Toggle start/stop kapan saja menggunakan global shortcut `F6`                                |
| 📊 **Live Stats**      | Pantau real-time: tombol aktif, total clicks, dan elapsed time                               |
| 🖥️ **Custom Titlebar** | Frameless window dengan titlebar custom yang elegan                                          |
| 🎨 **Premium Dark UI** | Glassmorphism, animasi pulse, gradient, dan micro-animations                                 |

---

## 🛠️ Tech Stack

- **[React 19](https://react.dev/)** — UI library
- **[Vite 7](https://vite.dev/)** — Build tool & dev server
- **[Electron 40](https://www.electronjs.org/)** — Desktop application framework
- **[Lucide React](https://lucide.dev/)** — Icon library
- **[ESLint 9](https://eslint.org/)** — Linting & code quality

---

## 📁 Struktur Project

```
Keyboard Auto Clicker/
├── electron/
│   ├── main.cjs              # Electron main process
│   └── preload.cjs           # IPC bridge (contextBridge)
├── src/
│   ├── styles/
│   │   ├── colors.css        # Color palette
│   │   └── typography.css    # Typography
│   ├── components/
│   │   ├── TitleBar.jsx      # Custom frameless titlebar
│   │   ├── StatusOrb.jsx     # Animated status indicator (idle/running)
│   │   ├── KeySelector.jsx   # Key selection + real-time key detection
│   │   ├── IntervalSettings.jsx  # Interval control + preset buttons
│   │   ├── RepeatMode.jsx    # Infinite / Custom count toggle
│   │   └── StatsBar.jsx      # Bottom stats bar (key/clicks/time)
│   ├── App.jsx               # Main application logic & state management
│   ├── App.css               # Component styles (glassmorphism, animations)
│   ├── index.css             # Global styles, design tokens & CSS variables
│   └── main.jsx              # React entry point
├── public/
│   └── vite.svg              # App favicon
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration
├── eslint.config.js          # ESLint configuration
├── package.json              # Dependencies & scripts
└── README.md                 # Dokumentasi ini
```

---

## 🚀 Cara Menjalankan

### Prasyarat

- **[Node.js](https://nodejs.org/)** versi 18 atau lebih baru
- **npm** (sudah termasuk dalam instalasi Node.js)

### Instalasi

```bash
# Clone atau masuk ke direktori project
cd "Keyboard Auto Clicker"

# Install dependencies
npm install
```

### Development Mode

Jalankan Vite dev server dan Electron secara bersamaan:

```bash
npm run electron:dev
```

Atau jalankan secara terpisah di dua terminal:

```bash
# Terminal 1 — Start Vite dev server
npm run dev

# Terminal 2 — Start Electron
npx electron .
```

### Build Production

```bash
# Build Vite + Electron
npm run electron:build
```

Hasil build akan tersedia di folder `release/`.

---

## 📜 Available Scripts

| Script                   | Deskripsi                                               |
| ------------------------ | ------------------------------------------------------- |
| `npm run dev`            | Jalankan Vite dev server saja (tanpa Electron)          |
| `npm run build`          | Build production bundle Vite                            |
| `npm run lint`           | Jalankan ESLint untuk cek code quality                  |
| `npm run preview`        | Preview hasil build production                          |
| `npm run electron:dev`   | Jalankan Vite + Electron secara bersamaan (development) |
| `npm run electron:build` | Build production + package Electron app                 |
| `npm run electron:start` | Jalankan Electron saja (harus build Vite dulu)          |

---

## 🎮 Cara Penggunaan

1. **Pilih Target Key** — Klik tombol di quick select grid atau klik "Click to detect key press" lalu tekan tombol yang diinginkan
2. **Atur Interval** — Masukkan delay dalam milidetik atau pilih dari preset (50ms - 2s)
3. **Pilih Repeat Mode** — `Infinite` untuk tanpa batas atau `Custom Count` untuk jumlah tertentu
4. **Start/Stop** — Klik tombol **START AUTO CLICKER** atau tekan `F6` kapan saja untuk toggle

> ⚠️ **Catatan:** Hotkey `F6` bersifat global, artinya bisa digunakan meskipun aplikasi sedang tidak fokus/minimize.

---

## 🎨 UI Preview

Aplikasi menggunakan design system premium dengan:

- **Dark theme** dengan warna indigo/violet accent
- **Glassmorphism** cards dengan backdrop blur
- **Animated status orb** yang berubah warna dan animasi saat running
- **Gradient buttons** dengan hover shimmer effect
- **Micro-animations** pada setiap interaksi

---

## 📝 Lisensi

Project ini dibuat oleh **Ravano** untuk keperluan personal.

---

<p align="center">
  Made with ❤️ using React + Vite + Electron
</p>
