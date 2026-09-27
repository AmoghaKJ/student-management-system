import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { initials } from '../lib/format';

const BADGE_META = {
  dean:          { emoji: '🏆', tone: 'warn' },
  'perfect-att': { emoji: '🎯', tone: 'success' },
  'clean-slate': { emoji: '✨', tone: 'info' },
  'rising-star': { emoji: '🌟', tone: 'accent' },
  'placement-elite': { emoji: '💼', tone: 'success' },
  'top-score':   { emoji: '🥇', tone: 'warn' },
  'comeback-king': { emoji: '🔥', tone: 'info' },
};

const TONE = {
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  warn:    { bg: 'var(--warn-soft)',    fg: 'var(--warn)' },
  info:    { bg: 'var(--info-soft)',    fg: 'var(--info)' },
  accent:  { bg: 'var(--accent-soft)',  fg: 'var(--accent)' },
  danger:  { bg: 'var(--danger-soft)',  fg: 'var(--danger)' },
};

// Compute badges from a student record (mirrors backend logic)
export function computeBadges(s) {
  if (!s) return [];
  const out = [];
  if (s.cgpa5 >= 9.0) out.push({ code: 'dean', title: "Dean's List", desc: 'CGPA above 9.0' });
  if (s.attendance >= 95) out.push({ code: 'perfect-att', title: 'Perfect Attendance', desc: `${s.attendance}% attendance` });
  if (s.backlogs === 0 && s.cgpa5 >= 7.5) out.push({ code: 'clean-slate', title: 'Clean Slate', desc: 'No backlogs, placement ready' });

  const g = [s.gpa1, s.gpa2, s.gpa3, s.gpa4, s.gpa5];
  let streak = 0;
  for (let i = 1; i < g.length; i++) if (g[i] > g[i - 1]) streak++;
  if (streak >= 3) out.push({ code: 'rising-star', title: 'Rising Star', desc: `${streak} semesters of improvement` });

  if (s.cgpa5 >= 8.5 && s.attendance >= 90 && s.backlogs === 0)
    out.push({ code: 'placement-elite', title: 'Placement Elite', desc: 'Top hireable performer' });
  if (s.placementScore >= 85) out.push({ code: 'top-score', title: 'Top Score', desc: `Placement score ${Math.round(s.placementScore)}` });
  if (Math.abs(s.gpa1 - s.gpa5) >= 1.5 && s.gpa5 > s.gpa1)
    out.push({ code: 'comeback-king', title: 'Comeback Story', desc: `+${(s.gpa5 - s.gpa1).toFixed(2)} GPA growth` });
  return out;
}

export function BadgeChip({ badge, size = 'md' }) {
  const meta = BADGE_META[badge.code] || { emoji: '⭐', tone: 'info' };
  const tone = TONE[meta.tone] || TONE.info;
  const isSm = size === 'sm';
  return (
    <div title={badge.desc} style={{
      display: 'inline-flex', alignItems: 'center', gap: isSm ? 6 : 10,
      padding: isSm ? '5px 10px' : '8px 14px',
      borderRadius: 999,
      background: tone.bg, color: tone.fg,
      fontWeight: 700, fontSize: isSm ? 11 : 13,
      border: `1px solid ${tone.fg}`,
    }}>
      <span style={{ fontSize: isSm ? 14 : 18 }}>{meta.emoji}</span>
      <span>{badge.title}</span>
    </div>
  );
}

export function BadgesPanel({ student, compact }) {
  const badges = useMemo(() => computeBadges(student), [student]);
  if (!badges.length) {
    return (
      <div className="empty" style={{ padding: compact ? 16 : 32 }}>
        <h3 style={{ fontSize: 14 }}>No achievements yet</h3>
        <p style={{ fontSize: 12 }}>Earn badges by improving GPA, attendance and clearing backlogs.</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 10 }}>
      {badges.map((b) => <BadgeChip key={b.code} badge={b} size={compact ? 'sm' : 'md'} />)}
    </div>
  );
}

// Full Achievements view — leaderboard + per-student list
export default function Achievements({ students, onOpenStudent }) {
  const ranked = useMemo(() => {
    return [...students]
      .map((s) => ({ student: s, badges: computeBadges(s) }))
      .filter((x) => x.badges.length > 0)
      .sort((a, b) => b.badges.length - a.badges.length || b.student.cgpa5 - a.student.cgpa5);
  }, [students]);

  const totalBadgesGiven = ranked.reduce((sum, x) => sum + x.badges.length, 0);
  const distribution = {};
  ranked.forEach((x) => x.badges.forEach((b) => { distribution[b.code] = (distribution[b.code] || 0) + 1; }));

  return (
    <div className="fade-in">
      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <Stat label="Achievers" value={ranked.length} icon="trophy" accent="var(--warn)" />
        <Stat label="Badges awarded" value={totalBadgesGiven} icon="spark" accent="var(--accent)" />
        <Stat label="Top achiever" value={ranked[0]?.student?.firstName ? `${ranked[0].student.firstName} ${ranked[0].student.lastName?.[0] || ''}.` : '—'} icon="graduation" accent="var(--success)" />
        <Stat label="Badge types" value={Object.keys(distribution).length} icon="shield" accent="var(--info)" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">
            <h2>Leaderboard</h2>
            <small>students ranked by badges & CGPA</small>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ranked.slice(0, 10).map(({ student, badges }, i) => (
              <button key={student.studentId} type="button" onClick={() => onOpenStudent?.(student)}
                style={{
                  display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 12, textAlign: 'left',
                  background: i === 0 ? 'linear-gradient(90deg, var(--warn-soft), transparent)' : 'var(--bg-2)',
                  border: '1px solid var(--border)',
                }}>
                <strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, color: i < 3 ? 'var(--warn)' : 'var(--muted)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </strong>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: student.avatarColor || 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                  {initials(`${student.firstName} ${student.lastName}`)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{student.firstName} {student.lastName}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {badges.slice(0, 4).map((b) => <BadgeChip key={b.code} badge={b} size="sm" />)}
                    {badges.length > 4 && <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>+{badges.length - 4}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>{(student.cgpa5 || 0).toFixed(2)}</strong>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.08em' }}>CGPA</div>
                </div>
              </button>
            ))}
            {ranked.length === 0 && <div className="empty" style={{ padding: 24 }}>No badges have been earned yet.</div>}
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h2>Badge distribution</h2>
            <small>across the entire batch</small>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(BADGE_META).map(([code, meta]) => {
              const count = distribution[code] || 0;
              const maxCount = Math.max(1, ...Object.values(distribution));
              const tone = TONE[meta.tone];
              return (
                <div key={code} style={{ padding: 12, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                    <strong style={{ fontSize: 13, flex: 1 }}>{code.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</strong>
                    <span className="badge" style={{ background: tone.bg, color: tone.fg }}>{count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, background: tone.fg, transition: 'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }) {
  return (
    <div className="kpi">
      <div className="icon-bubble" style={{ background: 'var(--accent-soft)', color: accent }}>
        <Icon name={icon} size={16} />
      </div>
      <div className="label">{label}</div>
      <div className="value" style={{ color: accent, fontSize: 22 }}>{value}</div>
    </div>
  );
}
