import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import StudentDetail from './components/StudentDetail';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import Predictor from './components/Predictor';
import Compare from './components/Compare';
import Announcements from './components/Announcements';
import Achievements from './components/Achievements';
import Icon from './components/Icon';
import { ToastProvider, useToast } from './lib/toast';
import { api, setActor, subscribeStream } from './lib/api';

const VIEWS = [
  { key: 'dashboard',    label: 'Dashboard',    icon: 'dashboard' },
  { key: 'students',     label: 'Students',     icon: 'users' },
  { key: 'top',          label: 'Hall of Fame', icon: 'trophy' },
  { key: 'predictor',    label: 'Predictor',    icon: 'spark' },
  { key: 'compare',      label: 'Compare',      icon: 'chart' },
  { key: 'achievements', label: 'Achievements', icon: 'shield' },
  { key: 'announcements',label: 'Announcements',icon: 'bell' },
  { key: 'profile',      label: 'Profile',      icon: 'user' },
];

function AppInner() {
  const toast = useToast();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sms-user')); } catch { return null; }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('sms-theme') || 'dark');
  const [view, setView] = useState('dashboard');

  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [detailStudent, setDetailStudent] = useState(null);
  const [predictStudent, setPredictStudent] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');

  const refreshTimer = useRef(null);

  const isAdmin = user?.role === 'ADMIN';

  // ---------- theme ----------
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('sms-theme', theme);
  }, [theme]);

  // ---------- data fetch ----------
  const refresh = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const [s, a, act, n, ann] = await Promise.all([
        api.list({ sortBy: 'name', order: 'asc' }),  // backend sorted A-Z too
        api.analytics(),
        api.activity(20),
        api.notifications(user.username),
        api.announcements(),
      ]);
      setStudents(s || []);
      setAnalytics(a || null);
      setActivity(act || []);
      setNotifications(n || []);
      setAnnouncements(ann || []);
    } catch (e) {
      if (!silent) toast.danger('Connection issue', e?.message || 'Backend unreachable.');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      setActor(user.username);
      refresh();
    }
  }, [user, refresh]);

  // ---------- realtime via SSE ----------
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeStream({
      onEvent: (name, payload) => {
        if (name === 'hello') setConnected(true);
        if (name === 'students-changed') {
          clearTimeout(refreshTimer.current);
          refreshTimer.current = setTimeout(() => refresh(true), 250);
        }
        if (name === 'activity' && payload) {
          setActivity((prev) => [payload, ...prev].slice(0, 25));
        }
        if (name === 'notification' && payload) {
          if (payload.forUser === '*' || payload.forUser?.toLowerCase?.() === user.username.toLowerCase()) {
            setNotifications((prev) => [payload, ...prev]);
          }
        }
        if (name === 'announcement' && payload) {
          setAnnouncements((prev) => {
            const without = prev.filter((p) => p.id !== payload.id);
            return [payload, ...without];
          });
          if (payload.author !== user.username) {
            toast.push({ level: payload.level || 'info', title: '📢 ' + (payload.title || 'Announcement'), message: payload.body });
          }
        }
        if (name === 'announcement-removed' && payload) {
          setAnnouncements((prev) => prev.filter((p) => p.id !== payload));
        }
      },
      onError: () => setConnected(false),
    });
    return () => { unsub?.(); setConnected(false); };
  }, [user, refresh, toast]);

  // ---------- handlers ----------
  const handleLogin = (u) => {
    setUser(u);
    setActor(u.username);
    toast.success('Welcome back', `Signed in as ${u.username}`);
  };

  const handleLogout = () => {
    if (window.confirm('Sign out?')) {
      setUser(null);
      localStorage.removeItem('sms-user');
      toast.info('Signed out', 'See you again soon.');
    }
  };

  const handleSave = async (payload) => {
    try {
      await (editStudent ? api.update(editStudent.studentId, payload) : api.create(payload));
      toast.success(editStudent ? 'Student updated' : 'Student enrolled', `${payload.firstName} ${payload.lastName}`);
      setShowForm(false);
      setEditStudent(null);
      refresh(true);
    } catch (e) {
      toast.danger('Save failed', e?.message || 'Could not save the student.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.remove(id);
      toast.info('Student removed', id);
      refresh(true);
    } catch (e) { toast.danger('Delete failed', e?.message); }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.bulkDelete(ids);
      toast.info('Bulk delete complete', `${ids.length} students removed.`);
      refresh(true);
    } catch (e) { toast.danger('Bulk delete failed', e?.message); }
  };

  const handleQuickAttendance = async (id, value) => {
    try {
      await api.attendance(id, value);
      toast.success('Attendance updated', `${id} → ${value}%`);
      refresh(true);
    } catch (e) { toast.danger('Update failed', e?.message); }
  };

  const handleSync = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await api.importData();
      toast.success('Matrix synchronised', 'Latest department data loaded.');
      await refresh(true);
    } catch (e) {
      toast.danger('Sync failed', e?.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (s) => { setEditStudent(s); setShowForm(true); setDetailStudent(null); };
  const openDetail = (s) => setDetailStudent(s);
  const openPredictor = (s) => { setPredictStudent(s); setView('predictor'); setDetailStudent(null); };
  const openCompare = (ids) => { setCompareIds(ids); setView('compare'); };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) return <Login onLogin={handleLogin} />;

  const filteredStudents = globalQuery
    ? students.filter((s) => `${s.studentId} ${s.firstName} ${s.lastName} ${s.email || ''}`.toLowerCase().includes(globalQuery.toLowerCase()))
    : students;

  return (
    <div className="app">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">SM</div>
          <div className="brand-text">
            <strong>Student Hub</strong>
            <small>CSE · 2023-27</small>
          </div>
        </div>

        <div className="nav-section">Workspace</div>
        <nav className="nav">
          {VIEWS.map((v) => (
            <button key={v.key} className={`nav-item ${view === v.key ? 'active' : ''}`} onClick={() => setView(v.key)}>
              <span className="ic"><Icon name={v.icon} size={17} /></span>
              {v.label}
              {v.key === 'announcements' && announcements.some((a) => a.pinned) && (
                <span className="bell-badge" style={{ position: 'static', marginLeft: 'auto' }}>📌</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleSync} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              <Icon name="refresh" size={14} /> {loading ? 'Syncing…' : 'Sync Matrix'}
            </button>
          )}
          <div className="user-pill">
            <div className="avatar" style={{ background: 'var(--grad-1)' }}>
              {user.username[0]?.toUpperCase()}
            </div>
            <div className="meta">
              <strong>{user.username}</strong>
              <small>{user.role}</small>
            </div>
            <button className="icon-btn danger" onClick={handleLogout} title="Sign out"><Icon name="logout" size={14} /></button>
          </div>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="main">
        <header className="topbar">
          <div className="title">
            <h1>{VIEWS.find((v) => v.key === view)?.label || 'Hub'}</h1>
            <small style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-dot" style={{ background: connected ? 'var(--success)' : 'var(--muted)', boxShadow: connected ? '0 0 0 4px var(--success-soft)' : 'none' }} />
              {connected ? 'Live · realtime stream connected' : 'Offline · reconnecting…'}
            </small>
          </div>

          {(view === 'dashboard' || view === 'top' || view === 'achievements') && (
            <div className="search-wrap">
              <Icon name="search" className="ic" size={16} />
              <input placeholder="Global search…" value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <button className="icon-btn" onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            </button>
            <button className="icon-btn bell-wrap" onClick={() => setShowNotif((s) => !s)} title="Notifications">
              <Icon name="bell" size={16} />
              {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {isAdmin && view === 'students' && (
              <button className="btn btn-primary btn-sm" onClick={() => { setEditStudent(null); setShowForm(true); }}>
                <Icon name="plus" size={14} /> New Student
              </button>
            )}
          </div>

          {showNotif && (
            <Notifications
              items={notifications}
              onClose={() => setShowNotif(false)}
              onMarkAllRead={async () => {
                try {
                  await api.notifReadAll(user.username);
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                } catch (e) { /* noop */ }
              }}
            />
          )}
        </header>

        <main className="content">
          {view === 'dashboard' && (
            <Dashboard
              students={filteredStudents}
              analytics={analytics}
              activity={activity}
              loading={loading}
              onOpenStudent={openDetail}
            />
          )}
          {view === 'students' && (
            <StudentList
              students={filteredStudents}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onOpenStudent={openDetail}
              onQuickAttendance={handleQuickAttendance}
              onCompare={openCompare}
            />
          )}
          {view === 'top' && (
            <div className="fade-in">
              <div className="section-title">
                <div>
                  <h2 style={{ fontSize: 20 }}>Hall of Fame</h2>
                  <small>Top 10 students by CGPA</small>
                </div>
              </div>
              <StudentList
                students={[...filteredStudents].sort((a, b) => b.cgpa5 - a.cgpa5).slice(0, 10)}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onOpenStudent={openDetail}
                onQuickAttendance={handleQuickAttendance}
                onCompare={openCompare}
              />
            </div>
          )}
          {view === 'predictor' && (
            <Predictor students={students} defaultStudent={predictStudent} />
          )}
          {view === 'compare' && (
            <Compare students={students} initialIds={compareIds} />
          )}
          {view === 'achievements' && (
            <Achievements students={filteredStudents} onOpenStudent={openDetail} />
          )}
          {view === 'announcements' && (
            <Announcements user={user} items={announcements} refresh={() => refresh(true)} />
          )}
          {view === 'profile' && <Profile user={user} students={students} activity={activity} onUpdate={() => refresh(true)} />}
        </main>
      </div>

      {/* ===== Mobile bottom nav ===== */}
      <nav className="mobile-nav">
        {VIEWS.slice(0, 5).map((v) => (
          <button key={v.key} className={`m-item ${view === v.key ? 'active' : ''}`} onClick={() => setView(v.key)}>
            <Icon name={v.icon} size={18} className="ic" />
            {v.label}
          </button>
        ))}
      </nav>

      {showForm && (
        <StudentForm
          student={editStudent}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditStudent(null); }}
        />
      )}

      {detailStudent && (
        <StudentDetail
          student={detailStudent}
          onClose={() => setDetailStudent(null)}
          onEdit={openEdit}
          onPredict={openPredictor}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
