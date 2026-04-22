<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=180&color=gradient&customColorList=12,14,20,24,30&text=Keyboard%20Auto%20Clicker&fontSize=38&fontColor=ffffff&animation=fadeIn&fontAlignY=35" alt="Keyboard Auto Clicker Banner" />
</p>

<p align="center">
  Desktop app for automatic key presses and macro playback built with React + Vite + Electron.
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
| Auto Clicker | Target Key                | Quickly choose a key or detect it directly via keypress.                        |
| Auto Clicker | Interval                  | Manual input + presets `50ms`, `100ms`, `250ms`, `500ms`, `1s`, `2s`.          |
| Auto Clicker | Repeat Mode               | `Infinite` or `Custom Count`.                                                   |
| Auto Clicker | Toggle                    | Default global hotkey `F6`.                                                     |
| Recorder     | Keyboard Recording        | Record key sequences for macro playback.                                        |
| Recorder     | Manual Macro Editor       | Add/edit/remove steps (`key` + `delay`).                                        |
| Recorder     | Playback Source           | Choose `Recorded Keys` or `Manual Editor`.                                      |
| Recorder     | Speed Control             | Presets `0.5x`, `1x`, `2x`, `100x` + custom speed.                              |
| Recorder     | Loop Mode                 | Continuous playback.                                                            |
| Hotkeys      | Global Config             | Clicker, record, and playback hotkeys can be customized manually (`F6`, `F7`, `F8` by default). |
| Desktop      | Floating Window           | Always on top in normal mode.                                                   |
| Desktop      | Smart Fullscreen Behavior | Automatically disables floating mode when maximized/full screen.                |
| Theme        | Design Tokens             | Dark/light mode with centralized tokens.                                        |

## 🎨 Design System

Centralized styling lives in:

- `src/components/styles/typography.css`
- `src/components/styles/colors.css`

These files are used directly by the components to keep styling consistent and scalable.

## 🛠️ Tech Stack

<p align="center">
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  </a>
  <a href="https://vite.dev/">
    <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 7" />
  </a>
  <a href="https://www.electronjs.org/">
    <img src="https://img.shields.io/badge/Electron-40-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron 40" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 18+" />
  </a>
</p>

<p align="center">
  <a href="https://lucide.dev/">
    <img src="https://img.shields.io/badge/Lucide%20React-Icons-F56565?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide React" />
  </a>
  <a href="https://eslint.org/">
    <img src="https://img.shields.io/badge/ESLint-9-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint 9" />
  </a>
  <a href="https://prettier.io/">
    <img src="https://img.shields.io/badge/Prettier-3-F7B93E?style=for-the-badge&logo=prettier&logoColor=1A2B34" alt="Prettier 3" />
  </a>
  <a href="https://www.electron.build/">
    <img src="https://img.shields.io/badge/Electron%20Builder-26-8DD6F9?style=for-the-badge&logo=electronbuilder&logoColor=white" alt="Electron Builder 26" />
  </a>
</p>

---

## 🚀 Quick Start

### 📋 Prerequisites

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

Runs Vite + Electron together, so the app opens immediately as a desktop app.

### 🌐 Run Web Only (Optional)

```bash
npm run dev:web
```

### 📱 Run Mobile Remote via Expo Go

1. Start desktop app first:

```bash
npm run dev
```

2. Install mobile dependencies once:

```bash
npm run install:mobile
```

3. In another terminal, start Expo:

```bash
npm run dev:mobile
```

4. In desktop app panel `Expo Go QR`, scan QR with **Expo Go**.
5. URL remote akan terisi otomatis di app Expo. Tap **Connect Remote**.

### 🏗️ Build Production

```bash
npm run electron:build
```

Installer/build output is generated in the `release/` folder.

## 📜 Scripts

| Script                   | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run dev`            | Run Vite + Electron (desktop development)      |
| `npm run dev:web`        | Run Vite in web-only mode (without Electron)   |
| `npm run install:mobile` | Install Expo mobile dependencies               |
| `npm run dev:mobile`     | Start Expo dev server (port `8083`)            |
| `npm run dev:mobile:clear` | Start Expo dev server with cleared cache     |
| `npm run build`          | Build the frontend with Vite                   |
| `npm run preview`        | Preview the frontend build                     |
| `npm run lint`           | Run ESLint                                     |
| `npm run format`         | Format code with Prettier                      |
| `npm run electron:dev`   | Alias for `npm run dev`                        |
| `npm run electron:start` | Run Electron only                              |
| `npm run electron:build` | Build the frontend + package the Electron app  |

---

## 🎮 Usage

### ⚡ Auto Clicker Flow

1. Choose the `Target Key`.
2. Set the `Click Interval`.
3. Choose the `Repeat Mode`.
4. Press `START AUTO CLICKER` or the active hotkey.

### ⌨️ Macro Recorder Flow

1. Press `Start Recording` (or the record hotkey).
2. Perform key presses in the desired order.
3. Press `Stop Recording`.
4. Choose the playback source (`Recorded` / `Manual`).
5. Set the speed + loop mode, then press `Start Playback`.

---

## 📁 Project Structure

```text
Keyboard Auto Clicker/
├── electron/                          # Electron-side code (main process + bridge)
│   ├── main.cjs                       # Creates the window, IPC handlers, global hotkeys, clicker & macro engine
│   └── preload.cjs                    # Exposes a safe API to the renderer via contextBridge
├── src/                               # React UI code (renderer process)
│   ├── components/                    # Modular UI components
│   │   ├── styles/                    # Centralized design tokens for components
│   │   │   ├── colors.css             # Dark/light mode color tokens
│   │   │   └── typography.css         # Typography tokens (font-size, line-height, font-weight, etc.)
│   │   ├── IntervalSettings.jsx       # Auto clicker interval settings UI
│   │   ├── KeyboardRecorder.jsx       # Macro recording/playback UI + manual editor + hotkey settings
│   │   ├── KeySelector.jsx            # Target key selector UI for the auto clicker
│   │   ├── RepeatMode.jsx             # Repeat mode UI (Infinite / Custom Count)
│   │   ├── StatsBar.jsx               # Runtime stats panel (clicks, time, active key)
│   │   ├── StatusOrb.jsx              # Idle/running status indicator
│   │   └── TitleBar.jsx               # Custom title bar (minimize, maximize, close, toggle theme)
│   ├── hooks/                         # Logic layer (state + effects + helpers)
│   │   ├── appHelpers.js              # App helper functions & utility constants
│   │   └── useAppController.js        # Centralized app state/effects/callbacks
│   ├── App.css                        # Main application layout styling
│   ├── App.jsx                        # Root UI; consumes `useAppController` and renders components
│   ├── index.css                      # Global styles/reset
│   └── main.jsx                       # React entry point (mounts to the DOM)
├── public/                            # Public assets (icons/static files)
├── package.json                       # npm scripts, dependencies, project metadata, build config
└── README.md                          # Project documentation
```

## 📝 Notes

- When running in Electron, key simulation is performed from the main process (PowerShell SendKeys on Windows).
- Global hotkeys should use key combinations that do not conflict with system or application shortcuts.

## 📄 License

This project was created for personal use by **Ravano**.
