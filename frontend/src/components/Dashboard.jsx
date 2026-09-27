import React, { useMemo } from 'react';
import Icon from './Icon';
import { formatTime, initials } from '../lib/format';

const COLORS = ['var(--accent)', 'var(--info)', 'var(--success)', 'var(--warn)', 'var(--danger)'];

export default function Dashboard({ students, analytics, activity, onOpenStudent, loading }) {
  const total = students.length;
  const a = analytics || {};
  const trajectory = a.trajectoryAvg || [0, 0, 0, 0, 0];
  const grade = a.gradeSpread || {};
  const buckets = a.attendanceBuckets || {};
  const placement = Number(a.placementEligible || 0);
  const atRisk = Number(a.atRisk || 0);
  const avgCgpa = Number(a.avgCgpa || 0);
  const avgAtt = Number(a.avgAttendance || 0);

  const topPerformers = useMemo(() => [...students].sort((x, y) => y.cgpa5 - x.cgpa5).slice(0, 5), [students]);
  const watchList = useMemo(() => students.filter((s) => s.isAtRisk).sort((x, y) => x.cgpa5 - y.cgpa5).slice(0, 5), [students]);

  return (
    <div className="fade-in">
      {/* KPIs */}
      <div className="kpi-grid">
        <Kpi icon="users" label="Total Students" value={total} accent="var(--accent)" trend={total ? { up: true, text: 'Live sync' } : null} loading={loading} />
        <Kpi icon="trophy" label="Placement Ready" value={placement} accent="var(--success)" trend={placement ? { up: true, text: `${Math.round((placement / Math.max(1, total)) * 100)}% of batch` } : null} />
        <Kpi icon="spark" label="Average CGPA" value={avgCgpa.toFixed(2)} accent="var(--info)" trend={{ up: avgCgpa >= 7.5, text: 'Updated now' }} />
        <Kpi icon="shield" label="At-Risk" value={atRisk} accent="var(--danger)" trend={{ up: false, text: 'Needs attention' }} />
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="section-title">
            <div>
              <h2>Department Trajectory</h2>
              <small style={{ color: 'var(--muted)' }}>Average GPA across semesters 1–5</small>
            </div>
            <span className="badge info">S1 → S5</span>
          </div>
          <Trajectory data={trajectory} />
        </div>

        <div className="card">
          <div className="section-title">
            <div>
              <h2>Grade Distribution</h2>
              <small style={{ color: 'var(--muted)' }}>CGPA buckets across the batch</small>
            </div>
            <span className="badge neutral">{total} records</span>
          </div>
          <Donut data={Object.entries(grade).map(([k, v]) => ({ label: k, value: Number(v) }))} />
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(grade).map(([label, count], i) => (
              <div key={label} className="progress-row" style={{ padding: '6px 0' }}>
                <div className="pr-head">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: COLORS[i % COLORS.length] }} />
                    {label}
                  </strong>
                  <span className="v">{count}</span>
                </div>
                <div className="progress-bar"><span style={{ width: `${total ? (count / total) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary row */}
      <div className="grid-3" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="section-title"><h2>Attendance Health</h2></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 180, padding: '0 8px' }}>
            {Object.entries(buckets).map(([k, v], i) => {
              const max = Math.max(1, ...Object.values(buckets).map(Number));
              const h = (Number(v) / max) * 150;
              return (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{v}</div>
                  <div style={{
                    width: '60%',
                    height: h,
                    minHeight: 6,
                    background: i === 0 ? 'var(--success)' : i === 1 ? 'var(--warn)' : 'var(--danger)',
                    borderRadius: '8px 8px 4px 4px',
                    transition: 'height 0.6s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                  <small style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700 }}>{k}</small>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
            Average attendance: <strong style={{ color: 'var(--text)' }}>{avgAtt}%</strong>
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h2>Top Performers</h2>
            <small>by CGPA</small>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topPerformers.length === 0 && <Empty message="No data yet" />}
            {topPerformers.map((s, i) => (
              <button
                key={s.studentId}
                className="feed-item"
                style={{ textAlign: 'left', width: '100%', background: 'transparent', border: 'none' }}
                onClick={() => onOpenStudent && onOpenStudent(s)}
              >
                <div className="dot" style={{ background: s.avatarColor || 'var(--accent)', color: 'white' }}>
                  {i + 1}
                </div>
                <div className="meta">
                  <p style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</p>
                  <small>{s.studentId} · CGPA <strong style={{ color: 'var(--success)' }}>{(s.cgpa5 || 0).toFixed(2)}</strong></small>
                </div>
                <span className="badge ok" style={{ alignSelf: 'center' }}>{Math.round(s.placementScore)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h2>Watch List</h2>
            <small>at-risk students</small>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {watchList.length === 0 && <Empty message="No at-risk students" />}
            {watchList.map((s) => (
              <button
                key={s.studentId}
                className="feed-item"
                style={{ textAlign: 'left', width: '100%', background: 'transparent', border: 'none' }}
                onClick={() => onOpenStudent && onOpenStudent(s)}
              >
                <div className="dot" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>!</div>
                <div className="meta">
                  <p style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</p>
                  <small>{s.studentId} · CGPA {(s.cgpa5 || 0).toFixed(2)} · {s.attendance}% att.</small>
                </div>
                <span className="badge risk" style={{ alignSelf: 'center' }}>{s.backlogs > 0 ? `${s.backlogs} BL` : 'WATCH'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live activity */}
      <div className="card">
        <div className="section-title">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-dot" /> Live Activity
          </h2>
          <small>most recent events</small>
        </div>
        <div className="feed">
          {(activity || []).length === 0 && <Empty message="Activity will appear here in real time" />}
          {(activity || []).map((act) => (
            <div key={act.id} className="feed-item">
              <div className="dot" style={{ background: bgFor(act.type), color: fgFor(act.type), fontWeight: 800 }}>
                {iconFor(act.type)}
              </div>
              <div className="meta">
                <p>{act.message}</p>
                <small>{act.actor} · {formatTime(act.timestamp)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function bgFor(t) { return { CREATE: 'var(--success-soft)', UPDATE: 'var(--info-soft)', DELETE: 'var(--danger-soft)', LOGIN: 'var(--accent-soft)', IMPORT: 'var(--warn-soft)' }[t] || 'var(--surface-2)'; }
function fgFor(t) { return { CREATE: 'var(--success)', UPDATE: 'var(--info)', DELETE: 'var(--danger)', LOGIN: 'var(--accent)', IMPORT: 'var(--warn)' }[t] || 'var(--muted)'; }
function iconFor(t) { return { CREATE: '+', UPDATE: '✎', DELETE: '×', LOGIN: '→', IMPORT: '↻' }[t] || '•'; }

function Empty({ message }) {
  return <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{message}</div>;
}

function Kpi({ icon, label, value, accent, trend, loading }) {
  return (
    <div className="kpi">
      <div className="icon-bubble" style={{ background: 'var(--accent-soft)', color: accent }}>
        <Icon name={icon} size={18} />
      </div>
      <div className="label">{label}</div>
      <div className="value" style={{ color: accent }}>
        {loading ? '…' : value}
      </div>
      {trend && <span className={`trend ${trend.up ? 'up' : 'down'}`}>{trend.up ? '▲' : '▼'} {trend.text}</span>}
    </div>
  );
}

function Trajectory({ data }) {
  const W = 720, H = 240, P = 36;
  const max = 10, min = 0;
  const points = (data || []).map((v, i) => ({
    x: P + (i * (W - 2 * P)) / Math.max(1, data.length - 1),
    y: H - P - ((Math.min(10, Number(v) || 0) - min) * (H - 2 * P)) / (max - min),
  }));
  const path = points.length
    ? points.reduce((d, p, i) => i === 0 ? `M${p.x},${p.y}` : `${d} L${p.x},${p.y}`, '')
    : '';
  return (
    <div className="chart-area">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="aria" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[2, 4, 6, 8, 10].map((v) => {
          const y = H - P - (v * (H - 2 * P)) / 10;
          return (
            <g key={v}>
              <line x1={P} x2={W - P} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 4" />
              <text x={P - 6} y={y + 3} fontSize="10" fill="var(--muted)" textAnchor="end">{v}</text>
            </g>
          );
        })}
        {points.length > 0 && (
          <>
            <path d={`${path} L${points[points.length - 1].x},${H - P} L${points[0].x},${H - P} Z`} fill="url(#aria)" />
            <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" />
                <text x={p.x} y={p.y - 12} fontSize="11" fontWeight="800" fill="var(--text)" textAnchor="middle">{(Number(data[i]) || 0).toFixed(2)}</text>
                <text x={p.x} y={H - 14} fontSize="11" fontWeight="700" fill="var(--muted)" textAnchor="middle">S{i + 1}</text>
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

function Donut({ data }) {
  const size = 200, r = 76, cx = size / 2, cy = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const startAngle = (acc / total) * 2 * Math.PI;
          acc += d.value;
          const endAngle = (acc / total) * 2 * Math.PI;
          const large = endAngle - startAngle > Math.PI ? 1 : 0;
          const x1 = cx + r * Math.sin(startAngle);
          const y1 = cy - r * Math.cos(startAngle);
          const x2 = cx + r * Math.sin(endAngle);
          const y2 = cy - r * Math.cos(endAngle);
          if (d.value === 0) return null;
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={COLORS[i % COLORS.length]}
              opacity="0.92"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--surface)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--muted)">STUDENTS</text>
      </svg>
    </div>
  );
}
