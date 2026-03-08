import { useEffect, useState } from 'react';
import { Copy, Minus, Square, X, Keyboard, Moon, Sun } from 'lucide-react';

export default function TitleBar({ theme, onToggleTheme }) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    let isMounted = true;

    window.electronAPI
      .getWindowState?.()
      .then((state) => {
        if (isMounted) {
          setIsMaximized(Boolean(state?.isMaximized));
        }
      })
      .catch(() => {});

    const cleanup = window.electronAPI.onWindowStateChange?.((state) => {
      setIsMaximized(Boolean(state?.isMaximized));
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  };

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <div className="titlebar-icon">
          <Keyboard size={16} />
        </div>
        <div>
          <div className="titlebar-title">Keyboard Auto Clicker</div>
          <div className="titlebar-subtitle">by Ravano</div>
        </div>
      </div>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
          <Minus size={14} />
        </button>
        <button
          className="titlebar-btn"
          onClick={handleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button className="titlebar-btn close" onClick={handleClose} title="Close">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
