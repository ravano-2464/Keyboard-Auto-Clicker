import { useEffect, useState } from 'react';
import { Copy, Globe2, Minus, Square, X, Keyboard, Moon, Sun } from 'lucide-react';

export default function TitleBar({ theme, onToggleTheme, language, onLanguageChange, copy }) {
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
          <div className="titlebar-title">{copy.title}</div>
          <div className="titlebar-subtitle">{copy.subtitle}</div>
        </div>
      </div>
      <div className="titlebar-controls">
        <div className="language-switcher" title={copy.languageLabel}>
          <span className="language-switcher-label">
            <Globe2 size={12} />
            {copy.languageLabel}
          </span>
          <div className="language-switcher-group" role="group" aria-label={copy.languageLabel}>
            <button
              type="button"
              className={`language-switcher-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => onLanguageChange('en')}
              title={copy.switchLanguage('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`language-switcher-btn ${language === 'id' ? 'active' : ''}`}
              onClick={() => onLanguageChange('id')}
              title={copy.switchLanguage('id')}
            >
              ID
            </button>
          </div>
        </div>
        <button
          type="button"
          className="titlebar-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={copy.themeToggle(theme)}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button type="button" className="titlebar-btn" onClick={handleMinimize} title={copy.minimize}>
          <Minus size={14} />
        </button>
        <button
          type="button"
          className="titlebar-btn"
          onClick={handleMaximize}
          title={isMaximized ? copy.restore : copy.maximize}
        >
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button type="button" className="titlebar-btn close" onClick={handleClose} title={copy.close}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
