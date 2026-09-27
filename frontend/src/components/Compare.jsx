import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { initials } from '../lib/format';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function Compare({ students, initialIds = [] }) {
  const [picked, setPicked] = useState(new Set(initialIds));
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialIds.length) setPicked(new Set(initialIds));
  }, [initialIds.join(',')]);

  const sorted = useMemo(() => [...students].sort((a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  ), [students]);

  const filteredList = useMemo(() => {
    const q = search.toLowerCase();
    return sorted.filter((s) => `${s.studentId} ${s.firstName} ${s.lastName}`.toLowerCase().includes(q));
  }, [sorted, search]);

  const selected = sorted.filter((s) => picked.has(s.studentId)).slice(0, 4);

  const toggle = (id) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else if (next.size < 4) next.add(id);
    setPicked(next);
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18 }}>
      <div className="card" style={{ padding: 14 }}>
        <strong style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pick 2 – 4 students</strong>
        <input className="input" style={{ marginTop: 10 }} placeholder="Filter students…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ marginTop: 10, maxHeight: 520, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredList.map((s) => {
            const on = picked.has(s.studentId);
            return (
              <button key={s.studentId} type="button" onClick={() => toggle(s.studentId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: 8, borderRadius: 10, textAlign: 'left',
                  background: on ? 'var(--accent-soft)' : 'transparent',
                  border: `1px solid ${on ? 'var(--accent-ring)' : 'var(--border)'}`,
                  color: on ? 'var(--accent)' : 'var(--text)',
                }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: s.avatarColor || 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                  {initials(`${s.firstName} ${s.lastName}`)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.firstName} {s.lastName}</div>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>{s.studentId}</small>
                </div>
                {on && <Icon name="check" size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {selected.length < 2 ? (
          <div className="card empty" style={{ padding: 60 }}>
            <Icon name="users" size={28} />
            <h3 style={{ marginTop: 12 }}>Pick at least 2 students to compare</h3>
            <p>Select up to 4 students on the left. Comparison view includes GPAs across semesters, a radar profile, and key metrics side by side.</p>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="section-title">
                <h2>Side-by-side comparison</h2>
                <span className="badge info">{selected.length} students</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="elite" style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {selected.map((s, i) => (
                        <th key={s.studentId} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i] }} />
                            {s.firstName} {s.lastName?.[0]}.
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Reg No', (s) => s.studentId],
                      ['CGPA (S5)', (s) => (s.cgpa5 || 0).toFixed(2), true],
                      ['Attendance', (s) => `${s.attendance}%`, true],
                      ['Backlogs', (s) => s.backlogs, true],
                      ['Placement Score', (s) => Math.round(s.placementScore || 0), true],
                      ['Status', (s) => s.isAtRisk ? 'At-Risk' : s.cgpa5 >= 9 ? 'Elite' : s.cgpa5 >= 7.5 ? 'Ready' : 'Stable'],
                    ].map(([label, render, numeric]) => {
                      const values = selected.map((s) => render(s));
                      let best = null, worst = null;
                      if (numeric) {
                        const nums = values.map((v) => parseFloat(v));
                        best = Math.max(...nums);
                        worst = Math.min(...nums);
                      }
                      return (
                        <tr key={label}>
                          <td style={{ fontWeight: 600 }}>{label}</td>
                          {selected.map((s, i) => {
                            const v = render(s);
                            const n = numeric ? parseFloat(v) : null;
                            const isBest = numeric && n === best && best !== worst && label !== 'Backlogs';
                            const isWorst = numeric && n === worst && best !== worst && label !== 'Backlogs';
                            const backlogsBest = label === 'Backlogs' && n === worst; // 0 backlogs is best
                            return (
                              <td key={s.studentId} style={{
                                textAlign: 'center',
                                fontWeight: 700,
                                color: isBest || backlogsBest ? 'var(--success)' : isWorst ? 'var(--danger)' : 'var(--text)',
                                background: isBest || backlogsBest ? 'var(--success-soft)' : isWorst ? 'var(--danger-soft)' : 'transparent',
                              }}>{v}</td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <h3>Semester Trajectory</h3>
                <small style={{ color: 'var(--muted)' }}>Track each student's GPA across the 5 semesters.</small>
                <TrajectoryCompare selected={selected} colors={COLORS} />
              </div>
              <div className="card">
                <h3>Performance Radar</h3>
                <small style={{ color: 'var(--muted)' }}>Normalised profile across five dimensions.</small>
                <Radar selected={selected} colors={COLORS} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TrajectoryCompare({ selected, colors }) {
  const W = 520, H = 240, P = 36;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', marginTop: 12 }}>
      {[2, 4, 6, 8, 10].map((v) => {
        const y = H - P - (v * (H - 2 * P)) / 10;
        return <line key={v} x1={P} x2={W - P} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 4" />;
      })}
      {selected.map((s, idx) => {
        const pts = [1, 2, 3, 4, 5].map((n, i) => ({
          x: P + (i * (W - 2 * P)) / 4,
          y: H - P - ((s[`gpa${n}`] || 0) * (H - 2 * P)) / 10,
        }));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        return (
          <g key={s.studentId}>
            <path d={d} fill="none" stroke={colors[idx]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--surface)" stroke={colors[idx]} strokeWidth="2.5" />)}
          </g>
        );
      })}
      {[1, 2, 3, 4, 5].map((n, i) => {
        const x = P + (i * (W - 2 * P)) / 4;
        return <text key={n} x={x} y={H - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--muted)">S{n}</text>;
      })}
    </svg>
  );
}

function Radar({ selected, colors }) {
  const size = 280, c = size / 2, r = c - 30;
  const axes = [
    { key: 'cgpa5', label: 'CGPA', max: 10 },
    { key: 'attendance', label: 'Att%', max: 100 },
    { key: 'placementScore', label: 'Place', max: 100 },
    { key: 'gpa5', label: 'Sem5', max: 10 },
    { key: 'inverseBacklogs', label: 'No-BL', max: 5 },
  ];
  const angleFor = (i) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const valOf = (s, key, max) => {
    let v = key === 'inverseBacklogs' ? (5 - Math.min(5, s.backlogs)) : s[key];
    return Math.max(0, Math.min(1, (v || 0) / max));
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto', marginTop: 12 }}>
      {[0.25, 0.5, 0.75, 1].map((step) => {
        const pts = axes.map((_, i) => {
          const a = angleFor(i);
          return `${c + Math.cos(a) * r * step},${c + Math.sin(a) * r * step}`;
        }).join(' ');
        return <polygon key={step} points={pts} fill="none" stroke="var(--border)" strokeDasharray="3 4" />;
      })}
      {axes.map((ax, i) => {
        const a = angleFor(i);
        return (
          <g key={ax.key}>
            <line x1={c} y1={c} x2={c + Math.cos(a) * r} y2={c + Math.sin(a) * r} stroke="var(--border)" />
            <text x={c + Math.cos(a) * (r + 14)} y={c + Math.sin(a) * (r + 14)} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--muted)">{ax.label}</text>
          </g>
        );
      })}
      {selected.map((s, idx) => {
        const pts = axes.map((ax, i) => {
          const a = angleFor(i);
          const v = valOf(s, ax.key, ax.max);
          return `${c + Math.cos(a) * r * v},${c + Math.sin(a) * r * v}`;
        }).join(' ');
        return <polygon key={s.studentId} points={pts} fill={colors[idx]} fillOpacity="0.18" stroke={colors[idx]} strokeWidth="2" />;
      })}
    </svg>
  );
}
