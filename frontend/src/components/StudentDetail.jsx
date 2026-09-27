import React from 'react';
import Icon from './Icon';
import { initials } from '../lib/format';
import { BadgesPanel, computeBadges } from './Achievements';

export default function StudentDetail({ student, onClose, onEdit, onPredict, isAdmin }) {
  if (!student) return null;
  const s = student;
  const badges = computeBadges(s);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, background: s.avatarColor || 'var(--accent)' }}>
              {initials(`${s.firstName} ${s.lastName}`)}
            </div>
            <div>
              <h3>{s.firstName} {s.lastName}</h3>
              <small style={{ color: 'var(--muted)', fontSize: 12 }}>{s.studentId} · {s.department || 'CSE'} · Batch {s.batch || '2023-27'}</small>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Stat label="CGPA (S5)" value={(s.cgpa5 || 0).toFixed(2)} accent="var(--success)" />
          <Stat label="Placement Score" value={`${Math.round(s.placementScore || 0)} / 100`} accent="var(--accent)" />
          <Stat label="Attendance" value={`${s.attendance}%`} accent={s.attendance >= 90 ? 'var(--success)' : s.attendance >= 75 ? 'var(--warn)' : 'var(--danger)'} />
          <Stat label="Backlogs" value={s.backlogs} accent={s.backlogs > 0 ? 'var(--danger)' : 'var(--success)'} />

          {badges.length > 0 && (
            <div style={{ gridColumn: 'span 2', padding: 12, background: 'var(--warn-soft)', borderRadius: 12, border: '1px solid var(--warn)' }}>
              <strong style={{ fontSize: 12, color: 'var(--warn)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="trophy" size={14} /> Achievements
              </strong>
              <div style={{ marginTop: 8 }}>
                <BadgesPanel student={s} compact />
              </div>
            </div>
          )}

          <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} style={{ padding: 12, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>SEM {n}</small>
                <div style={{ marginTop: 6, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 17 }}>{(s[`gpa${n}`] || 0).toFixed(2)}</div>
                <small style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>cgpa {(s[`cgpa${n}`] || 0).toFixed(2)}</small>
              </div>
            ))}
          </div>

          <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <InfoRow icon="mail" label="Email" value={s.email || '—'} />
            <InfoRow icon="phone" label="Phone" value={s.phone || '—'} />
            <InfoRow icon="user" label="Age / Gender" value={`${s.age || '—'} · ${s.gender || '—'}`} />
            <InfoRow icon="graduation" label="Address" value={s.address || '—'} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          {onPredict && (
            <button className="btn btn-outline" onClick={() => onPredict(s)}>
              <Icon name="spark" size={14} /> Predict
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => onEdit?.(s)}>
              <Icon name="edit" size={14} /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>{label.toUpperCase()}</small>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent || 'var(--text)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--accent)', marginTop: 2 }}><Icon name={icon} size={16} /></div>
      <div style={{ minWidth: 0 }}>
        <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>{label.toUpperCase()}</small>
        <div style={{ fontSize: 13, marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
      </div>
    </div>
  );
}
