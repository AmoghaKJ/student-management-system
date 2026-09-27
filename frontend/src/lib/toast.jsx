import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = ++counter;
    const item = { id, level: 'info', timeout: 3800, ...toast };
    setToasts((t) => [...t, item]);
    if (item.timeout > 0) setTimeout(() => dismiss(id), item.timeout);
    return id;
  }, [dismiss]);

  const value = {
    push,
    dismiss,
    success: (title, message) => push({ title, message, level: 'success' }),
    info: (title, message) => push({ title, message, level: 'info' }),
    warning: (title, message) => push({ title, message, level: 'warning' }),
    danger: (title, message) => push({ title, message, level: 'danger' }),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const LEVEL_ICON = { success: '✓', info: 'i', warning: '!', danger: '⨯' };
const LEVEL_BG = {
  success: 'var(--success-soft)',
  info: 'var(--info-soft)',
  warning: 'var(--warn-soft)',
  danger: 'var(--danger-soft)',
};
const LEVEL_COLOR = {
  success: 'var(--success)',
  info: 'var(--info)',
  warning: 'var(--warn)',
  danger: 'var(--danger)',
};

function ToastStack({ toasts, dismiss }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.level}`} role="alert">
          <div className="ic-bubble" style={{ background: LEVEL_BG[t.level], color: LEVEL_COLOR[t.level], fontWeight: 800 }}>
            {LEVEL_ICON[t.level]}
          </div>
          <div className="body">
            {t.title && <strong>{t.title}</strong>}
            {t.message && <p>{t.message}</p>}
          </div>
          <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => dismiss(t.id)} aria-label="Dismiss">✕</button>
        </div>
      ))}
    </div>
  );
}
