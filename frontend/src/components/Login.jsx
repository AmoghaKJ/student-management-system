import React, { useEffect, useState } from 'react';
import { api, probeBackend, API_ROOT } from '../lib/api';
import Icon from './Icon';

const DEMO = {
  admin: { username: 'admin', password: 'admin123', label: 'Admin', hint: 'Full access' },
  student: { username: 'demo', password: 'demo123', label: 'Student', hint: 'Read-only view' },
};

export default function Login({ onLogin }) {
  const [tab, setTab] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [backendUp, setBackendUp] = useState(null); // null = probing

  const checkBackend = async () => {
    setBackendUp(null);
    const ok = await probeBackend();
    setBackendUp(ok);
  };

  useEffect(() => { checkBackend(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await api.login(username.trim(), password);
      if (remember) localStorage.setItem('sms-user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      if (err.network) {
        setBackendUp(false);
        setError(`Cannot reach the backend at ${API_ROOT}. Start the Spring Boot server: cd backend && mvn spring-boot:run`);
      } else if (err.status === 401) {
        setError('Invalid credentials. Try one of the demo accounts below.');
      } else {
        setError(err?.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const applyDemo = (which) => {
    setTab(which);
    setUsername(DEMO[which].username);
    setPassword(DEMO[which].password);
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="brand">
          <div className="brand-logo">SMS</div>
          <div className="brand-text">
            <strong style={{ fontSize: 20 }}>Student Management Hub</strong>
            <small>Real-time academic intelligence • CSE 2023-27</small>
          </div>
        </div>

        {/* Connection status banner */}
        <ConnectionBanner status={backendUp} onRetry={checkBackend} />

        <div className="tabs">
          <button type="button" className={tab === 'admin' ? 'on' : ''} onClick={() => setTab('admin')}>Admin</button>
          <button type="button" className={tab === 'student' ? 'on' : ''} onClick={() => setTab('student')}>Student</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Username</label>
            <input
              className="input"
              placeholder={tab === 'admin' ? 'e.g. admin' : 'e.g. CSE23001'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="icon-btn"
                style={{ position: 'absolute', right: 4, top: 3, width: 34, height: 34 }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Keep me signed in
          </label>

          {error && (
            <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 10, fontSize: 12.5, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="shield" size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ wordBreak: 'break-word' }}>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ height: 44, width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 700 }} disabled={busy || backendUp === false}>
            {busy ? 'Signing in…' : backendUp === false ? 'Backend offline' : 'Continue'}
          </button>
        </form>

        <div className="demo-bank">
          <strong>Try a demo account</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {Object.entries(DEMO).map(([k, v]) => (
              <button key={k} type="button" className="chip" onClick={() => applyDemo(k)}>
                {v.label} · <code>{v.username}</code>/<code>{v.password}</code>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
          v6.0 · API at <code>{API_ROOT}</code>
        </div>
      </div>
    </div>
  );
}

function ConnectionBanner({ status, onRetry }) {
  if (status === null) {
    return (
      <div style={{
        padding: '10px 12px', borderRadius: 10, marginBottom: 14,
        background: 'var(--info-soft)', color: 'var(--info)', fontSize: 12.5, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span className="live-dot" style={{ background: 'var(--info)', boxShadow: '0 0 0 4px var(--info-soft)' }} />
        Probing backend…
      </div>
    );
  }
  if (status === true) {
    return (
      <div style={{
        padding: '10px 12px', borderRadius: 10, marginBottom: 14,
        background: 'var(--success-soft)', color: 'var(--success)', fontSize: 12.5, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span className="live-dot" />
        Backend online · realtime stream ready
      </div>
    );
  }
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10, marginBottom: 14,
      background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 12.5, fontWeight: 600,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name="shield" size={14} />
        Backend offline
      </div>
      <p style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
        Spring Boot server not reachable. In a terminal run:
      </p>
      <code style={{
        display: 'block', padding: '6px 10px', background: 'var(--bg-2)', borderRadius: 6,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--text)',
      }}>
        cd backend &amp;&amp; mvn spring-boot:run
      </code>
      <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={onRetry}>
        <Icon name="refresh" size={12} /> Retry
      </button>
    </div>
  );
}
