import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';

const DEFAULT = {
  studentId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: 'CSE',
  batch: '2023-27',
  age: 20,
  gender: 'Male',
  address: '',
  gpa1: 0, gpa2: 0, gpa3: 0, gpa4: 0, gpa5: 0,
  attendance: 85,
  backlogs: 0,
};

export default function StudentForm({ student, onSave, onClose }) {
  const [data, setData] = useState({ ...DEFAULT, ...(student || {}) });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setData({ ...DEFAULT, ...(student || {}) });
    setStep(1);
    setErrors({});
  }, [student]);

  const liveCgpa = useMemo(() => {
    const g = [data.gpa1, data.gpa2, data.gpa3, data.gpa4, data.gpa5].map(Number);
    let sum = 0, n = 0;
    g.forEach((v) => { if (!Number.isNaN(v) && v > 0) { sum += v; n++; } });
    return n > 0 ? Math.round((sum / n) * 100) / 100 : 0;
  }, [data.gpa1, data.gpa2, data.gpa3, data.gpa4, data.gpa5]);

  const projectedPlacement = useMemo(() => {
    return Math.max(0, Math.min(100, liveCgpa * 10 - data.backlogs * 12 + (Number(data.attendance) - 75) * 0.4));
  }, [liveCgpa, data.backlogs, data.attendance]);

  const set = (k) => (v) => setData((d) => ({ ...d, [k]: v }));

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!data.studentId?.trim()) e.studentId = 'Required';
      else if (!/^[A-Z0-9\-]{3,20}$/.test(data.studentId.trim())) e.studentId = 'Use letters / numbers (e.g. CSE23029)';
      if (!data.firstName?.trim()) e.firstName = 'Required';
      if (!data.lastName?.trim()) e.lastName = 'Required';
      if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) e.email = 'Invalid email';
      if (data.phone && !/^[\d+\-\s()]{6,18}$/.test(data.phone)) e.phone = 'Invalid phone';
      if (data.age && (Number(data.age) < 15 || Number(data.age) > 60)) e.age = '15–60';
    }
    if (s === 2) {
      [1, 2, 3, 4, 5].forEach((n) => {
        const v = Number(data[`gpa${n}`]);
        if (Number.isNaN(v) || v < 0 || v > 10) e[`gpa${n}`] = '0–10';
      });
      if (Number(data.attendance) < 0 || Number(data.attendance) > 100) e.attendance = '0–100';
      if (Number(data.backlogs) < 0) e.backlogs = '≥ 0';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(3, s + 1)); };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!validateStep(1) || !validateStep(2)) {
      const step1Errors = ['studentId', 'firstName', 'lastName', 'email', 'phone', 'age'];
      setStep(Object.keys(errors).some((k) => step1Errors.includes(k)) ? 1 : 2);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...data,
        age: Number(data.age),
        attendance: Number(data.attendance),
        backlogs: Number(data.backlogs),
        gpa1: Number(data.gpa1), gpa2: Number(data.gpa2), gpa3: Number(data.gpa3), gpa4: Number(data.gpa4), gpa5: Number(data.gpa5),
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{student ? 'Edit Student' : 'Enroll New Student'}</h3>
            <small style={{ color: 'var(--muted)', fontSize: 12 }}>
              Step {step} of 3 · {['Personal details', 'Academic & attendance', 'Review & save'][step - 1]}
            </small>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={14} /></button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ flex: 1, height: 4, borderRadius: 4, background: n <= step ? 'var(--accent)' : 'var(--bg-2)' }} />
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Registration No." span={2} error={errors.studentId}>
                <input className={`input ${errors.studentId ? 'error' : ''}`} value={data.studentId} disabled={!!student}
                       onChange={(e) => set('studentId')(e.target.value.toUpperCase())} placeholder="e.g. CSE23029" />
                <small className="input-help">Letters/numbers, 3–20 chars. Used as login username.</small>
              </Field>
              <Field label="First Name" error={errors.firstName}>
                <input className={`input ${errors.firstName ? 'error' : ''}`} value={data.firstName} onChange={(e) => set('firstName')(e.target.value)} />
              </Field>
              <Field label="Last Name" error={errors.lastName}>
                <input className={`input ${errors.lastName ? 'error' : ''}`} value={data.lastName} onChange={(e) => set('lastName')(e.target.value)} />
              </Field>
              <Field label="Email" error={errors.email}>
                <input className={`input ${errors.email ? 'error' : ''}`} type="email" value={data.email || ''} onChange={(e) => set('email')(e.target.value)} placeholder="student@univ.edu" />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input className={`input ${errors.phone ? 'error' : ''}`} value={data.phone || ''} onChange={(e) => set('phone')(e.target.value)} placeholder="+91 9xxxxxxxxx" />
              </Field>
              <Field label="Department">
                <input className="input" value={data.department || 'CSE'} onChange={(e) => set('department')(e.target.value)} />
              </Field>
              <Field label="Batch">
                <input className="input" value={data.batch || '2023-27'} onChange={(e) => set('batch')(e.target.value)} />
              </Field>
              <Field label="Age" error={errors.age}>
                <input className={`input ${errors.age ? 'error' : ''}`} type="number" min={15} max={60} value={data.age || ''} onChange={(e) => set('age')(e.target.value)} />
              </Field>
              <Field label="Gender">
                <select className="select" value={data.gender || 'Male'} onChange={(e) => set('gender')(e.target.value)}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
              <Field label="Address" span={2}>
                <textarea className="input" rows="2" value={data.address || ''} onChange={(e) => set('address')(e.target.value)} placeholder="Optional" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div>
              <small style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Semester GPAs (out of 10) — backend recomputes CGPA on save
              </small>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 10, marginBottom: 18 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Field key={n} label={`Sem ${n}`} error={errors[`gpa${n}`]}>
                    <input className={`input ${errors[`gpa${n}`] ? 'error' : ''}`} type="number" step="0.01" min="0" max="10"
                           value={data[`gpa${n}`] ?? 0}
                           onChange={(e) => set(`gpa${n}`)(e.target.value)}
                           style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }} />
                  </Field>
                ))}
              </div>

              {/* Live preview */}
              <div style={{ padding: 14, borderRadius: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent-ring)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
                <Preview label="Live CGPA" value={liveCgpa.toFixed(2)} accent="var(--accent)" />
                <Preview label="Predicted Placement" value={`${Math.round(projectedPlacement)} / 100`} accent="var(--success)" />
                <Preview label="Status" value={liveCgpa >= 9 ? 'Elite' : liveCgpa >= 8 ? 'Advanced' : liveCgpa >= 7 ? 'Stable' : 'Watch'} accent="var(--warn)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Attendance %" error={errors.attendance}>
                  <input type="range" min="0" max="100" value={data.attendance || 0} onChange={(e) => set('attendance')(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <small className="input-help">0%</small>
                    <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>{data.attendance}%</strong>
                    <small className="input-help">100%</small>
                  </div>
                </Field>
                <Field label="Active Backlogs" error={errors.backlogs}>
                  <input className={`input ${errors.backlogs ? 'error' : ''}`} type="number" min="0"
                         value={data.backlogs || 0} onChange={(e) => set('backlogs')(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <small style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Review before saving</small>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <ReviewRow label="Reg No" value={data.studentId} mono />
                <ReviewRow label="Name" value={`${data.firstName} ${data.lastName}`} />
                <ReviewRow label="Email" value={data.email || '—'} />
                <ReviewRow label="Phone" value={data.phone || '—'} />
                <ReviewRow label="Department" value={data.department} />
                <ReviewRow label="Batch" value={data.batch} />
                <ReviewRow label="Age / Gender" value={`${data.age} · ${data.gender}`} />
                <ReviewRow label="Address" value={data.address || '—'} />
              </div>

              <div style={{ marginTop: 14 }}>
                <small style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Academic</small>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
                      <small style={{ color: 'var(--muted)', fontSize: 10, fontWeight: 800 }}>SEM {n}</small>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 17, fontWeight: 800 }}>{Number(data[`gpa${n}`] || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: 'var(--success-soft)', border: '1px solid var(--success)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="check" size={16} style={{ color: 'var(--success)' }} />
                  <strong style={{ color: 'var(--success)' }}>Ready to save</strong>
                </div>
                <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-2)' }}>
                  This student will be synced to the backend in real time. Final CGPA: <strong style={{ color: 'var(--success)' }}>{liveCgpa.toFixed(2)}</strong> · Predicted placement score: <strong>{Math.round(projectedPlacement)} / 100</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {step > 1 && <button className="btn btn-outline" onClick={back}>← Back</button>}
          {step < 3 && <button className="btn btn-primary" onClick={next}>Next →</button>}
          {step === 3 && (
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              <Icon name="check" size={14} /> {saving ? 'Saving…' : (student ? 'Save changes' : 'Enroll student')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, span = 1, children }) {
  return (
    <div className="field" style={{ gridColumn: `span ${span}` }}>
      <label>{label}</label>
      {children}
      {error && <small className="input-error">{error}</small>}
    </div>
  );
}

function Preview({ label, value, accent }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>{label.toUpperCase()}</small>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>{value}</div>
    </div>
  );
}

function ReviewRow({ label, value, mono }) {
  return (
    <div style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <small style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em' }}>{label.toUpperCase()}</small>
      <div style={{ fontWeight: 700, fontSize: 13, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit', marginTop: 4 }}>{value}</div>
    </div>
  );
}
