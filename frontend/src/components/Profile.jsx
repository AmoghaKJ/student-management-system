import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { initials, formatTime } from '../lib/format';
import Icon from './Icon';
import { BadgesPanel, computeBadges } from './Achievements';

const AVATAR_PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#84cc16', '#3b82f6', '#f97316'];

export default function Profile({ user, students, activity, onUpdate }) {
  const toast = useToast();

  // Find linked student record (for STUDENT role)
  const myRecord = useMemo(() => {
    const id = user.studentId || user.username;
    return students.find((s) => s.studentId === id) || null;
  }, [students, user]);

  const [data, setData] = useState({
    email: myRecord?.email || user.email || '',
    phone: myRecord?.phone || user.phone || '',
    department: myRecord?.department || user.department || 'CSE',
    age: myRecord?.age || user.age || 20,
    gender: myRecord?.gender || user.gender || 'Male',
    address: myRecord?.address || user.address || '',
    avatarColor: myRecord?.avatarColor || AVATAR_PALETTE[0],
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Refresh from latest student record when it changes
  useEffect(() => {
    if (myRecord) {
      setData((d) => ({
        ...d,
        email: myRecord.email ?? d.email,
        phone: myRecord.phone ?? d.phone,
        department: myRecord.department ?? d.department,
        age: myRecord.age ?? d.age,
        gender: myRecord.gender ?? d.gender,
        address: myRecord.address ?? d.address,
        avatarColor: myRecord.avatarColor ?? d.avatarColor,
      }));
    }
  }, [myRecord?.studentId, myRecord?.email, myRecord?.phone, myRecord?.attendance, myRecord?.cgpa5]);

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.danger('Password mismatch', 'New password and confirmation must match.');
      return;
    }
    setSaving(true);
    try {
      const id = user.studentId || user.username;
      await api.profile(id, {
        ...data,
        age: Number(data.age),
        ...(newPassword ? { newPassword } : {}),
      });
      toast.success('Profile updated', 'Your changes are now live across the matrix.');
      setNewPassword('');
      setConfirmPassword('');
      onUpdate?.();
    } catch (err) {
      toast.danger('Update failed', err?.message || 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const myActivity = (activity || []).filter((a) => a.actor === user.username || a.target === (user.studentId || user.username)).slice(0, 8);
  const badges = myRecord ? computeBadges(myRecord) : [];

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
      {/* ===== Identity card ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 110, height: 110, borderRadius: '28%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '8px auto 16px',
            background: `linear-gradient(135deg, ${data.avatarColor} 0%, var(--accent-2) 100%)`,
            color: 'white', fontSize: 36, fontWeight: 800,
            boxShadow: `0 16px 40px -10px ${data.avatarColor}66`,
          }}>
            {initials(user.username)}
          </div>
          <h3 style={{ fontSize: 18 }}>{user.username}</h3>
          <small style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{user.role}</small>

          <div style={{ marginTop: 14 }}>
            <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>AVATAR COLOUR</small>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              {AVATAR_PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => set('avatarColor')(c)} aria-label={`Pick ${c}`}
                  style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: c, cursor: 'pointer',
                    border: data.avatarColor === c ? '3px solid var(--text)' : '2px solid transparent',
                  }} />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InfoStrip label="Username" value={user.username} />
            <InfoStrip label="Registration" value={user.studentId || '—'} mono />
            {myRecord && (
              <>
                <InfoStrip label="Department" value={myRecord.department || 'CSE'} />
                <InfoStrip label="Batch" value={myRecord.batch || '2023-27'} />
              </>
            )}
          </div>
        </div>

        {/* My academic stats — only for student-linked accounts */}
        {myRecord && (
          <div className="card">
            <div className="section-title"><h2 style={{ fontSize: 16 }}>My Academic Snapshot</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Stat label="CGPA" value={(myRecord.cgpa5 || 0).toFixed(2)} accent="var(--success)" />
              <Stat label="Attendance" value={`${myRecord.attendance}%`} accent={myRecord.attendance >= 90 ? 'var(--success)' : myRecord.attendance >= 75 ? 'var(--warn)' : 'var(--danger)'} />
              <Stat label="Placement" value={`${Math.round(myRecord.placementScore || 0)}/100`} accent="var(--accent)" />
              <Stat label="Backlogs" value={myRecord.backlogs} accent={myRecord.backlogs > 0 ? 'var(--danger)' : 'var(--success)'} />
            </div>
          </div>
        )}
      </div>

      {/* ===== Right column ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Achievements */}
        {myRecord && (
          <div className="card">
            <div className="section-title">
              <div>
                <h2>Achievements</h2>
                <small>auto-awarded based on your academic record</small>
              </div>
              <span className="badge warn">{badges.length} earned</span>
            </div>
            <BadgesPanel student={myRecord} />
          </div>
        )}

        {/* Profile form */}
        <div className="card">
          <div className="section-title">
            <h2>Profile & Security</h2>
            <small>Updates broadcast to the matrix in real time</small>
          </div>
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Email"><input className="input" type="email" value={data.email} onChange={set('email')} /></Field>
            <Field label="Phone"><input className="input" value={data.phone} onChange={set('phone')} /></Field>
            <Field label="Department"><input className="input" value={data.department} onChange={set('department')} /></Field>
            <Field label="Age"><input className="input" type="number" value={data.age} onChange={set('age')} /></Field>
            <Field label="Gender">
              <select className="select" value={data.gender} onChange={set('gender')}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </Field>
            <Field label="Avatar colour">
              <input className="input" value={data.avatarColor} onChange={set('avatarColor')} />
            </Field>
            <Field label="Address" span={2}><textarea rows="2" className="input" value={data.address} onChange={set('address')} /></Field>

            <div style={{ gridColumn: 'span 2', padding: 14, background: 'var(--accent-soft)', borderRadius: 12, border: '1px solid var(--accent-ring)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <Icon name="shield" size={14} /> Change password
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <input className="input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <input className="input" type="password" placeholder="Confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <small style={{ display: 'block', marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>Leave blank to keep current password.</small>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        {/* My recent activity */}
        <div className="card">
          <div className="section-title">
            <h2>My recent activity</h2>
            <small>your actions and updates</small>
          </div>
          {myActivity.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>
              <p>No recent activity yet.</p>
            </div>
          ) : (
            <div className="feed">
              {myActivity.map((a) => (
                <div key={a.id} className="feed-item">
                  <div className="dot" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{(a.type || '?')[0]}</div>
                  <div className="meta">
                    <p>{a.message}</p>
                    <small>{a.actor} · {formatTime(a.timestamp)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, span = 1, children }) {
  return (
    <div className="field" style={{ gridColumn: `span ${span}` }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>{label.toUpperCase()}</small>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent || 'var(--text)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  );
}

function InfoStrip({ label, value, mono }) {
  return (
    <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>{label.toUpperCase()}</small>
      <div style={{ fontWeight: 700, fontSize: 13, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit' }}>{value}</div>
    </div>
  );
}
