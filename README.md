<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=180&color=gradient&customColorList=12,14,20,24,30&text=Keyboard%20Auto%20Clicker&fontSize=38&fontColor=ffffff&animation=fadeIn&fontAlignY=35" alt="Keyboard Auto Clicker Banner" />
</p>

<p align="center">
  Desktop app untuk auto key press dan macro playback dengan React + Vite + Electron.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge" alt="Status Active" />
  <img src="https://img.shields.io/badge/Platform-Windows-3b82f6?style=for-the-badge" alt="Platform Windows" />
  <img src="https://img.shields.io/badge/Theme-Dark%20%2B%20Light-f59e0b?style=for-the-badge" alt="Theme Dark Light" />
  <img src="https://img.shields.io/badge/Macro-Recorder-e11d48?style=for-the-badge" alt="Macro Recorder" />
  <img src="https://img.shields.io/badge/Global-Hotkeys-7c3aed?style=for-the-badge" alt="Global Hotkeys" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Electron-40-47848f?style=flat-square&logo=electron&logoColor=white" alt="Electron 40" />
  <img src="https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/ESLint-9-4b32c3?style=flat-square&logo=eslint&logoColor=white" alt="ESLint 9" />
</p>

---

## ✨ Features

| Area         | Capability                | Detail                                                                          |
| ------------ | ------------------------- | ------------------------------------------------------------------------------- |
| Auto Clicker | Target Key                | Pilih key cepat atau deteksi langsung via keypress.                             |
| Auto Clicker | Interval                  | Input manual + preset `50ms`, `100ms`, `250ms`, `500ms`, `1s`, `2s`.            |
| Auto Clicker | Repeat Mode               | `Infinite` atau `Custom Count`.                                                 |
| Auto Clicker | Toggle                    | Global hotkey default `F6`.                                                     |
| Recorder     | Keyboard Recording        | Rekam urutan key untuk macro playback.                                          |
| Recorder     | Manual Macro Editor       | Tambah/edit/hapus step (`key` + `delay`).                                       |
| Recorder     | Playback Source           | Pilih `Recorded Keys` atau `Manual Editor`.                                     |
| Recorder     | Speed Control             | Preset `0.5x`, `1x`, `2x`, `100x` + custom speed.                               |
| Recorder     | Loop Mode                 | Continuous playback.                                                            |
| Hotkeys      | Global Config             | Hotkey clicker, record, playback bisa diubah manual (`F6`, `F7`, `F8` default). |
| Desktop      | Floating Window           | Always on top saat mode normal.                                                 |
| Desktop      | Smart Fullscreen Behavior | Auto non-floating saat maximize/full screen.                                    |
| Theme        | Design Tokens             | Dark/light mode pakai token terpusat.                                           |

## 🎨 Design System

Centralized styling ada di:

- `src/components/styles/typography.css`
- `src/components/styles/colors.css`

File tersebut dipakai langsung oleh komponen supaya style konsisten dan scalable.

## 🛠️ Tech Stack

- [React 19](https://react.dev/)
- [Vite 7](https://vite.dev/)
- [Electron 40](https://www.electronjs.org/)
- [Lucide React](https://lucide.dev/)
- [ESLint 9](https://eslint.org/)

---

## 🚀 Quick Start

### 📋 Prerequisite

- [Node.js](https://nodejs.org/) 18+
- npm

### 📦 Install

```bash
npm install
```

### 🖥️ Run Desktop (Recommended)

```bash
npm run dev
```

Menjalankan Vite + Electron bersamaan, jadi app langsung muncul sebagai desktop app.

### 🌐 Run Web Only (Optional)

```bash
npm run dev:web
```

### 🏗️ Build Production

```bash
npm run electron:build
```

Output installer/build ada di folder `release/`.

## 📜 Scripts

| Script                   | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run dev`            | Jalankan Vite + Electron (desktop development) |
| `npm run dev:web`        | Jalankan Vite web-only (tanpa Electron)        |
| `npm run build`          | Build frontend dengan Vite                     |
| `npm run preview`        | Preview hasil build frontend                   |
| `npm run lint`           | Jalankan ESLint                                |
| `npm run format`         | Format code dengan Prettier                    |
| `npm run electron:dev`   | Alias ke `npm run dev`                         |
| `npm run electron:start` | Jalankan Electron saja                         |
| `npm run electron:build` | Build frontend + package Electron app          |

---

## 🎮 Usage

### ⚡ Auto Clicker Flow

1. Pilih `Target Key`.
2. Atur `Click Interval`.
3. Pilih `Repeat Mode`.
4. Tekan `START AUTO CLICKER` atau hotkey aktif.

### ⌨️ Macro Recorder Flow

1. Tekan `Start Recording` (atau hotkey record).
2. Lakukan key press sesuai urutan.
3. Tekan `Stop Recording`.
4. Pilih playback source (`Recorded` / `Manual`).
5. Atur speed + loop mode, lalu `Start Playback`.

---

## 📁 Project Structure

```text
Keyboard Auto Clicker/
├── electron/
│   ├── main.cjs
│   └── preload.cjs
├── src/
│   ├── components/
│   │   ├── styles/
│   │   │   ├── colors.css
│   │   │   └── typography.css
│   │   ├── IntervalSettings.jsx
│   │   ├── KeyboardRecorder.jsx
│   │   ├── KeySelector.jsx
│   │   ├── RepeatMode.jsx
│   │   ├── StatsBar.jsx
│   │   ├── StatusOrb.jsx
│   │   └── TitleBar.jsx
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── public/
├── package.json
└── README.md
```

## 📝 Notes

- Saat berjalan di Electron, simulasi key dilakukan dari main process (PowerShell SendKeys di Windows).
- Global hotkey harus memakai kombinasi yang tidak bentrok dengan shortcut sistem/aplikasi lain.

## 📄 License

Project ini dibuat untuk keperluan personal oleh **Ravano**.
