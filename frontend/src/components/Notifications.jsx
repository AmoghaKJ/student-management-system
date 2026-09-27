import React, { useEffect, useRef } from 'react';
import Icon from './Icon';
import { formatTime } from '../lib/format';

const LEVEL = {
  success: { bg: 'var(--success-soft)', fg: 'var(--success)', icon: '✓' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)', icon: 'i' },
  warning: { bg: 'var(--warn-soft)', fg: 'var(--warn)', icon: '!' },
  danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)', icon: '⨯' },
};

export default function Notifications({ items, onClose, onMarkAllRead }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="notif-pop" ref={ref}>
      <header>
        <strong>Notifications</strong>
        <button className="btn btn-ghost btn-sm" onClick={onMarkAllRead}>Mark all read</button>
      </header>
      <div className="list">
        {(!items || items.length === 0) && (
          <div className="empty" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 14 }}>You're all caught up</h3>
            <p>New events will show up here in real time.</p>
          </div>
        )}
        {items?.map((n) => {
          const L = LEVEL[n.level] || LEVEL.info;
          return (
            <div key={n.id} className={`notif-row ${n.read ? '' : 'unread'}`}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: L.bg, color: L.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{L.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{n.title}</strong>
                <p style={{ marginTop: 2 }}>{n.message}</p>
                <small>{formatTime(n.timestamp)}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
