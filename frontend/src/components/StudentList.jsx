import React, { useMemo, useState } from 'react';
import Icon from './Icon';
import { downloadCsv, initials } from '../lib/format';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'elite', label: 'Elite' },
  { key: 'ready', label: 'Placement Ready' },
  { key: 'stable', label: 'Stable' },
  { key: 'risk', label: 'At-Risk' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const fullName = (s) => `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();

export default function StudentList({
  students,
  isAdmin,
  onEdit,
  onDelete,
  onBulkDelete,
  onOpenStudent,
  onQuickAttendance,
  onCompare,
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');  // default A-Z by name
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = students.filter((s) => {
      if (!q) return true;
      const hay = `${s.studentId} ${s.firstName} ${s.lastName} ${s.email || ''}`.toLowerCase();
      return hay.includes(q);
    });
    list = list.filter((s) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'risk') return s.isAtRisk;
      if (statusFilter === 'elite') return s.cgpa5 >= 9.0;
      if (statusFilter === 'ready') return s.cgpa5 >= 7.5 && s.backlogs === 0 && !s.isAtRisk;
      if (statusFilter === 'stable') return !s.isAtRisk && s.cgpa5 < 7.5;
      return true;
    });
    list = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      let av, bv;
      switch (sortBy) {
        case 'name':
          av = fullName(a); bv = fullName(b);
          return av.localeCompare(bv, undefined, { sensitivity: 'base' }) * dir;
        case 'studentId':
          return String(a.studentId || '').localeCompare(String(b.studentId || ''), undefined, { numeric: true, sensitivity: 'base' }) * dir;
        case 'cgpa5':
        case 'attendance':
        case 'placementScore':
          av = Number(a[sortBy] || 0); bv = Number(b[sortBy] || 0);
          return (av - bv) * dir;
        default:
          return fullName(a).localeCompare(fullName(b)) * dir;
      }
    });
    return list;
  }, [students, query, statusFilter, sortBy, sortDir]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir(key === 'name' || key === 'studentId' ? 'asc' : 'desc'); }
  };

  const toggleSelectAll = () => {
    if (pageItems.every((s) => selected.has(s.studentId))) {
      const next = new Set(selected);
      pageItems.forEach((s) => next.delete(s.studentId));
      setSelected(next);
    } else {
      const next = new Set(selected);
      pageItems.forEach((s) => next.add(s.studentId));
      setSelected(next);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const exportCsv = () => {
    const rows = filtered.map((s) => ({
      RegNo: s.studentId,
      Name: `${s.firstName} ${s.lastName}`,
      Email: s.email,
      Phone: s.phone,
      Department: s.department,
      GPA1: s.gpa1, GPA2: s.gpa2, GPA3: s.gpa3, GPA4: s.gpa4, GPA5: s.gpa5,
      CGPA5: s.cgpa5,
      Attendance: s.attendance,
      Backlogs: s.backlogs,
      Placement: s.placementScore,
      Status: s.isAtRisk ? 'AT_RISK' : s.cgpa5 >= 7.5 ? 'PLACEMENT_READY' : 'STABLE',
    }));
    downloadCsv(`students-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="tbl-wrap fade-in">
      <div className="tbl-toolbar">
        <div className="search-wrap" style={{ maxWidth: 320, flex: '1 1 240px', position: 'relative' }}>
          <Icon name="search" className="ic" size={16} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            placeholder="Search by name, reg no or email…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>
        <div className="chip-row">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={`chip ${statusFilter === f.key ? 'on' : ''}`} onClick={() => { setStatusFilter(f.key); setPage(1); }}>
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  ({students.filter((s) => {
                    if (f.key === 'risk') return s.isAtRisk;
                    if (f.key === 'elite') return s.cgpa5 >= 9.0;
                    if (f.key === 'ready') return s.cgpa5 >= 7.5 && s.backlogs === 0 && !s.isAtRisk;
                    if (f.key === 'stable') return !s.isAtRisk && s.cgpa5 < 7.5;
                    return true;
                  }).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <small style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>SORT:</small>
          <select className="select" style={{ height: 32, width: 'auto', padding: '0 24px 0 10px' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="studentId">Reg No</option>
            <option value="cgpa5">CGPA</option>
            <option value="attendance">Attendance</option>
            <option value="placementScore">Placement</option>
          </select>
          <button className="icon-btn" onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')} title={`Sort ${sortDir === 'asc' ? 'A→Z' : 'Z→A'}`}>
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
          {selected.size > 0 && (
            <>
              {onCompare && selected.size >= 2 && selected.size <= 4 && (
                <button className="btn btn-outline btn-sm" onClick={() => onCompare([...selected])}>
                  <Icon name="chart" size={14} /> Compare {selected.size}
                </button>
              )}
              {isAdmin && (
                <button className="btn btn-danger btn-sm" onClick={async () => {
                  if (window.confirm(`Delete ${selected.size} selected students?`)) {
                    await onBulkDelete?.([...selected]);
                    setSelected(new Set());
                  }
                }}>
                  <Icon name="trash" size={14} /> Delete {selected.size}
                </button>
              )}
            </>
          )}
          <button className="btn btn-outline btn-sm" onClick={exportCsv}>
            <Icon name="download" size={14} /> Export
          </button>
        </div>
      </div>

      <div className="tbl-scroll">
        <table className="elite">
          <thead>
            <tr>
              <th style={{ width: 36, padding: '8px 12px' }}>
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={pageItems.length > 0 && pageItems.every((s) => selected.has(s.studentId))}
                  onChange={toggleSelectAll}
                />
              </th>
              <Th label="Reg No" onClick={() => toggleSort('studentId')} active={sortBy === 'studentId'} dir={sortDir} />
              <Th label="Student" onClick={() => toggleSort('name')} active={sortBy === 'name'} dir={sortDir} />
              <Th label="CGPA" onClick={() => toggleSort('cgpa5')} active={sortBy === 'cgpa5'} dir={sortDir} align="center" />
              <Th label="Attendance" onClick={() => toggleSort('attendance')} active={sortBy === 'attendance'} dir={sortDir} align="center" />
              <Th label="Placement" onClick={() => toggleSort('placementScore')} active={sortBy === 'placementScore'} dir={sortDir} align="center" />
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  <h3>No results</h3>
                  <p>Try a different search or filter, or sync the matrix from the sidebar.</p>
                </td>
              </tr>
            )}
            {pageItems.map((s) => (
              <React.Fragment key={s.studentId}>
                <tr
                  className={`row ${selected.has(s.studentId) ? 'selected' : ''}`}
                  onClick={() => setExpanded((id) => (id === s.studentId ? null : s.studentId))}
                >
                  <td style={{ width: 36 }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(s.studentId)} onChange={() => toggleSelect(s.studentId)} aria-label={`Select ${s.studentId}`} />
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12.5, color: 'var(--accent)' }}>{s.studentId}</td>
                  <td>
                    <div className="cell-name">
                      <div className="av" style={{ background: s.avatarColor || 'var(--accent)' }}>{initials(`${s.firstName} ${s.lastName}`)}</div>
                      <div className="nm">
                        <strong>{s.firstName} {s.lastName}</strong>
                        <small>{s.email || s.department || 'CSE'}</small>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="gpa-pill" style={{ color: s.cgpa5 >= 8 ? 'var(--success)' : s.cgpa5 < 7 ? 'var(--danger)' : 'var(--text)' }}>
                      {(s.cgpa5 || 0).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, background: 'var(--bg-2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${s.attendance}%`, height: '100%', background: s.attendance >= 90 ? 'var(--success)' : s.attendance >= 75 ? 'var(--warn)' : 'var(--danger)' }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 12.5, minWidth: 36 }}>{s.attendance}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{Math.round(s.placementScore || 0)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {s.isAtRisk ? <span className="badge risk">At-Risk</span>
                      : s.cgpa5 >= 9 ? <span className="badge warn">Elite</span>
                      : s.cgpa5 >= 7.5 ? <span className="badge ok">Ready</span>
                      : <span className="badge neutral">Stable</span>}
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" onClick={() => onOpenStudent?.(s)} title="View"><Icon name="search" size={14} /></button>
                    {isAdmin && <button className="icon-btn" onClick={() => onEdit?.(s)} title="Edit"><Icon name="edit" size={14} /></button>}
                    {isAdmin && (
                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          if (window.confirm(`Remove ${s.firstName} ${s.lastName}?`)) onDelete?.(s.studentId);
                        }}
                        title="Delete"
                      ><Icon name="trash" size={14} /></button>
                    )}
                  </td>
                </tr>
                {expanded === s.studentId && (
                  <tr className="expanded-row">
                    <td colSpan={8}>
                      <ExpandedDetail student={s} isAdmin={isAdmin} onQuickAttendance={onQuickAttendance} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexWrap: 'wrap', gap: 10 }}>
        <small style={{ color: 'var(--muted)' }}>
          Showing <strong style={{ color: 'var(--text)' }}>{Math.min((safePage - 1) * pageSize + 1, total)}–{Math.min(safePage * pageSize, total)}</strong> of {total}
          {sortBy === 'name' && <> · sorted <strong style={{ color: 'var(--accent)' }}>{sortDir === 'asc' ? 'A → Z' : 'Z → A'}</strong></>}
        </small>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="select" style={{ height: 32, padding: '0 24px 0 10px', width: 'auto' }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button className="btn btn-outline btn-sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{safePage} / {pages}</span>
          <button className="btn btn-outline btn-sm" disabled={safePage >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next ›</button>
        </div>
      </div>
    </div>
  );
}

function Th({ label, onClick, active, dir, align = 'left' }) {
  return (
    <th onClick={onClick} style={{ textAlign: align }}>
      {label} {active && <span className="sort">{dir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );
}

function ExpandedDetail({ student, isAdmin, onQuickAttendance }) {
  const sems = [1, 2, 3, 4, 5];
  const [att, setAtt] = useState(student.attendance);

  return (
    <div style={{ padding: 18, background: 'var(--bg-2)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {sems.map((n) => (
          <div key={n} style={{ background: 'var(--surface)', borderRadius: 12, padding: 12, border: '1px solid var(--border)' }}>
            <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>SEM {n}</small>
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: 17, fontFamily: 'JetBrains Mono, monospace' }}>{(student[`gpa${n}`] || 0).toFixed(2)}</strong>
              <small style={{ color: 'var(--muted)' }}>gpa</small>
            </div>
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: 'var(--accent)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{(student[`cgpa${n}`] || 0).toFixed(2)}</span>
              <small style={{ color: 'var(--muted)' }}>cgpa</small>
            </div>
            <div style={{ marginTop: 8, height: 4, background: 'var(--bg-2)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${((student[`cgpa${n}`] || 0) / 10) * 100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        <DetailStat label="Backlogs" value={student.backlogs} accent={student.backlogs > 0 ? 'var(--danger)' : 'var(--success)'} />
        <DetailStat label="Placement Score" value={`${Math.round(student.placementScore || 0)} / 100`} accent="var(--accent)" />
        <DetailStat label="Phone" value={student.phone || '—'} small />
        <DetailStat label="Address" value={student.address || '—'} small />
      </div>

      {isAdmin && (
        <div style={{ marginTop: 14, padding: 12, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quick update attendance</strong>
            <input type="range" min="0" max="100" value={att} onChange={(e) => setAtt(Number(e.target.value))} style={{ flex: 1, minWidth: 160 }} />
            <span className="gpa-pill" style={{ minWidth: 50, textAlign: 'center' }}>{att}%</span>
            <button className="btn btn-primary btn-sm" disabled={att === student.attendance} onClick={() => onQuickAttendance?.(student.studentId, att)}>
              <Icon name="check" size={12} /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailStat({ label, value, accent, small }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 12, border: '1px solid var(--border)' }}>
      <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>{label.toUpperCase()}</small>
      <div style={{ marginTop: 4, fontWeight: 700, fontSize: small ? 13 : 17, color: accent || 'var(--text)' }}>{value}</div>
    </div>
  );
}
