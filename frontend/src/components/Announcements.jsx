import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { formatTime } from '../lib/format';
import Icon from './Icon';

const LEVELS = [
  { v: 'info', label: 'Info', accent: 'var(--info)' },
  { v: 'success', label: 'Success', accent: 'var(--success)' },
  { v: 'warning', label: 'Warning', accent: 'var(--warn)' },
  { v: 'danger', label: 'Alert', accent: 'var(--danger)' },
];

export default function Announcements({ user, items, refresh }) {
  const toast = useToast();
  const isAdmin = user.role === 'ADMIN';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [level, setLevel] = useState('info');
  const [busy, setBusy] = useState(false);

  const post = async (e) => {
    e?.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.warning('Missing fields', 'Title and message are required.');
      return;
    }
    setBusy(true);
    try {
      await api.postAnnouncement({ title, body, level });
      toast.success('Broadcast sent', 'All connected users have been notified.');
      setTitle(''); setBody('');
      refresh?.();
    } catch (err) {
      toast.danger('Broadcast failed', err?.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      toast.info('Announcement removed');
      refresh?.();
    } catch (err) { toast.danger('Delete failed', err?.message); }
  };

  const togglePin = async (a) => {
    try {
      await api.pinAnnouncement(a.id, !a.pinned);
      refresh?.();
    } catch (err) { toast.danger('Pin failed', err?.message); }
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '380px 1fr' : '1fr', gap: 18 }}>
      {isAdmin && (
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="section-title">
            <h2>Broadcast</h2>
            <span className="badge info">LIVE</span>
          </div>
          <small style={{ color: 'var(--muted)' }}>Posts appear instantly to all signed-in users via SSE.</small>

          <form onSubmit={post} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <div className="field">
              <label>Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-term exam schedule" maxLength={80} />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea className="input" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type the announcement here…" maxLength={400} />
              <small style={{ color: 'var(--muted)', fontSize: 11 }}>{body.length} / 400</small>
            </div>
            <div className="field">
              <label>Priority</label>
              <div className="chip-row">
                {LEVELS.map((L) => (
                  <button key={L.v} type="button" className={`chip ${level === L.v ? 'on' : ''}`} onClick={() => setLevel(L.v)}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: L.accent, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
                    {L.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ height: 40, justifyContent: 'center' }}>
              <Icon name="upload" size={14} /> {busy ? 'Broadcasting…' : 'Send to everyone'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="section-title">
          <h2>{isAdmin ? 'All announcements' : 'Announcements'}</h2>
          <span className="badge neutral">{(items || []).length}</span>
        </div>

        {(!items || items.length === 0) && (
          <div className="empty" style={{ padding: 40 }}>
            <Icon name="bell" size={24} />
            <h3 style={{ marginTop: 10 }}>No announcements yet</h3>
            <p>{isAdmin ? 'Use the composer to broadcast a message.' : "We'll show new posts here in real time."}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {(items || []).map((a) => {
            const L = LEVELS.find((l) => l.v === a.level) || LEVELS[0];
            return (
              <div key={a.id} style={{
                padding: 14, borderRadius: 14,
                background: 'var(--bg-2)',
                borderLeft: `4px solid ${L.accent}`,
                border: `1px solid ${a.pinned ? 'var(--accent-ring)' : 'var(--border)'}`,
                position: 'relative',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 14 }}>{a.title}</strong>
                      {a.pinned && <span className="badge warn">📌 Pinned</span>}
                      <span className="badge" style={{ background: 'transparent', color: L.accent, border: `1px solid ${L.accent}` }}>{L.label}</span>
                    </div>
                    <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{a.body}</p>
                    <small style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 600 }}>by {a.author} · {formatTime(a.timestamp)}</small>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="icon-btn" onClick={() => togglePin(a)} title={a.pinned ? 'Unpin' : 'Pin'}>
                        {a.pinned ? '📍' : '📌'}
                      </button>
                      <button className="icon-btn danger" onClick={() => remove(a.id)} title="Delete">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
