import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import Icon from './Icon';

const TONE = {
  Elite: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  Advanced: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  Stable: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  'At-Risk': { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
};

export default function Predictor({ students, defaultStudent }) {
  const [studentId, setStudentId] = useState(defaultStudent?.studentId || '');
  const [g, setG] = useState([7.5, 7.6, 7.8, 8.0, 8.2]);
  const [attendance, setAttendance] = useState(88);
  const [backlogs, setBacklogs] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [busy, setBusy] = useState(false);

  // Pre-fill when picking a student
  useEffect(() => {
    if (!studentId) return;
    const s = students.find((x) => x.studentId === studentId);
    if (!s) return;
    setG([s.gpa1 || 0, s.gpa2 || 0, s.gpa3 || 0, s.gpa4 || 0, s.gpa5 || 0]);
    setAttendance(s.attendance || 80);
    setBacklogs(s.backlogs || 0);
  }, [studentId, students]);

  const payload = useMemo(() => ({
    gpa1: g[0], gpa2: g[1], gpa3: g[2], gpa4: g[3], gpa5: g[4],
    attendance, backlogs,
  }), [g, attendance, backlogs]);

  // Compute on-the-fly (so it feels instant)
  const local = useMemo(() => quickPredict(payload), [payload]);

  // Also confirm with backend (debounced)
  useEffect(() => {
    const id = setTimeout(async () => {
      setBusy(true);
      try { setPrediction(await api.predict(payload)); }
      catch (_) { setPrediction(local); }
      finally { setBusy(false); }
    }, 250);
    return () => clearTimeout(id);
  }, [payload]);

  const p = prediction || local;
  const tone = TONE[p.label] || TONE.Stable;
  const sortedStudents = [...students].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 18 }}>
      <div className="card">
        <div className="section-title">
          <div>
            <h2>What-If Simulator</h2>
            <small style={{ color: 'var(--muted)' }}>Drag the sliders to predict CGPA, placement readiness and risk in real time.</small>
          </div>
          <span className="badge info">AI POWERED</span>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Load from existing student</label>
          <select className="select" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">— Start from scratch —</option>
            {sortedStudents.map((s) => (
              <option key={s.studentId} value={s.studentId}>
                {s.firstName} {s.lastName} · {s.studentId}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map((sem, idx) => (
            <Slider key={sem}
              label={`Semester ${sem} GPA`}
              value={g[idx]}
              min={0} max={10} step={0.1}
              onChange={(v) => { const next = [...g]; next[idx] = Number(v); setG(next); }}
              accent="var(--accent)"
              format={(v) => v.toFixed(2)}
            />
          ))}
          <Slider label="Attendance %" value={attendance} min={0} max={100} step={1}
            onChange={(v) => setAttendance(Number(v))}
            accent={attendance >= 90 ? 'var(--success)' : attendance >= 75 ? 'var(--warn)' : 'var(--danger)'}
            format={(v) => `${v}%`} />
          <Slider label="Active Backlogs" value={backlogs} min={0} max={6} step={1}
            onChange={(v) => setBacklogs(Number(v))}
            accent={backlogs === 0 ? 'var(--success)' : 'var(--danger)'}
            format={(v) => `${v}`} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card" style={{ borderLeft: `4px solid ${tone.fg}` }}>
          <small style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' }}>PREDICTED OUTCOME {busy && '· …'}</small>
          <h2 style={{ fontSize: 30, fontFamily: 'JetBrains Mono, monospace', marginTop: 6, color: tone.fg }}>
            CGPA {Number(p.cgpa || 0).toFixed(2)}
          </h2>
          <span className="badge" style={{ background: tone.bg, color: tone.fg, marginTop: 6 }}>{p.label}</span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
            <Gauge label="Placement Probability" value={p.placementProbability} accent="var(--success)" />
            <Gauge label="Risk Score" value={p.riskScore} accent="var(--danger)" invert />
          </div>

          <div style={{ marginTop: 18, padding: 12, background: tone.bg, borderRadius: 12 }}>
            <strong style={{ fontSize: 12, color: tone.fg, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <Icon name="spark" size={14} /> Recommendation
            </strong>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text)' }}>{p.recommendation}</p>
          </div>
        </div>

        <div className="card">
          <h3>3-Semester Projection</h3>
          <small style={{ color: 'var(--muted)' }}>Linear-trend forecast based on the current trajectory.</small>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {(p.projection || [0, 0, 0]).map((v, i) => (
              <div key={i} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'var(--bg-2)', textAlign: 'center', border: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800 }}>S{6 + i}</small>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>
                  {Number(v || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            Trend: <strong style={{ color: p.trend >= 0 ? 'var(--success)' : 'var(--danger)' }}>{p.trend >= 0 ? '▲' : '▼'} {Math.abs(Number(p.trend || 0)).toFixed(2)}</strong> per semester
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format, accent }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
        <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: accent, fontSize: 13 }}>{format(value)}</strong>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', accentColor: accent,
        }}
      />
    </div>
  );
}

function Gauge({ label, value, accent, invert }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  const r = 38, c = 2 * Math.PI * r;
  const dash = (v / 100) * c;
  return (
    <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
      <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>{label.toUpperCase()}</small>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ display: 'block', margin: '6px auto' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-strong)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`} transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.4s ease' }} />
        <text x="50" y="54" textAnchor="middle" fontWeight="800" fontFamily="JetBrains Mono, monospace" fontSize="18" fill="var(--text)">{Math.round(v)}%</text>
      </svg>
    </div>
  );
}

function quickPredict({ gpa1, gpa2, gpa3, gpa4, gpa5, attendance, backlogs }) {
  const g = [gpa1, gpa2, gpa3, gpa4, gpa5].map(Number);
  let sum = 0, n = 0;
  g.forEach((v) => { if (v > 0) { sum += v; n++; } });
  const cgpa = n ? sum / n : 0;
  let trend = 0;
  if (n >= 2) {
    const first = g[0];
    let last = 0; for (let i = 4; i >= 0; i--) if (g[i] > 0) { last = g[i]; break; }
    trend = (last - first) / Math.max(1, n - 1);
  }
  const projection = [];
  let base = cgpa;
  for (let i = 0; i < 3; i++) { base = Math.max(0, Math.min(10, base + trend * 0.4)); projection.push(round(base)); }
  const placement = Math.max(0, Math.min(100, cgpa * 9 + (attendance - 75) * 0.6 - backlogs * 12 + trend * 8));
  const risk = Math.max(0, Math.min(100, (7 - cgpa) * 14 + (75 - attendance) * 0.8 + backlogs * 18 - trend * 6));
  const label = cgpa >= 9 ? 'Elite' : cgpa >= 8 ? 'Advanced' : cgpa >= 7 ? 'Stable' : 'At-Risk';
  return { cgpa: round(cgpa), trend: round(trend), projection, placementProbability: round(placement), riskScore: round(risk), label, recommendation: 'Computing…' };
}
function round(v) { return Math.round(v * 100) / 100; }
