import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { ScreeningSession } from '../types';

interface Stats {
  counts: { users: number; clinics: number; clubs: number; teams: number; athletes: number; sessions: number; completedSessions: number };
  riskDistribution: { category: string; count: number }[];
  recentSessions: ScreeningSession[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/stats').then(setStats).catch(() => {
      // Fallback if stats endpoint not available yet
      setStats({
        counts: { users: 0, clinics: 0, clubs: 0, teams: 0, athletes: 0, sessions: 0, completedSessions: 0 },
        riskDistribution: [],
        recentSessions: [],
      });
    });
  }, []);

  const riskColor = (cat?: string) => {
    switch (cat) {
      case 'low': return '#22c55e';
      case 'moderate': return '#eab308';
      case 'high': return '#f97316';
      case 'very_high': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const riskLabel = (cat: string) => cat.replace('_', ' ').toUpperCase();

  if (!stats) return <div className="loading">Loading...</div>;

  const { counts, riskDistribution, recentSessions } = stats;

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.firstName}!</h1>

      <div className="stats-grid">
        <Link to="/clubs" className="stat-card">
          <div className="stat-number">{counts.clubs}</div>
          <div className="stat-label">Clubs</div>
        </Link>
        <Link to="/teams" className="stat-card">
          <div className="stat-number">{counts.teams}</div>
          <div className="stat-label">Teams</div>
        </Link>
        <Link to="/athletes" className="stat-card">
          <div className="stat-number">{counts.athletes}</div>
          <div className="stat-label">Athletes</div>
        </Link>
        <Link to="/sessions" className="stat-card">
          <div className="stat-number">{counts.sessions}</div>
          <div className="stat-label">Screenings</div>
        </Link>
      </div>

      {/* Risk Distribution */}
      {riskDistribution.length > 0 && (
        <div className="section">
          <h2>Risk Distribution</h2>
          <div className="risk-bar-chart">
            {riskDistribution.map((r) => (
              <div key={r.category} className="risk-bar-row">
                <span className="risk-bar-label" style={{ color: riskColor(r.category) }}>
                  {riskLabel(r.category || 'unknown')}
                </span>
                <div className="risk-bar-track">
                  <div
                    className="risk-bar-fill"
                    style={{
                      width: `${Math.max((r.count / counts.completedSessions) * 100, 8)}%`,
                      backgroundColor: riskColor(r.category),
                    }}
                  />
                </div>
                <span className="risk-bar-count">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin quick links */}
      {user?.role === 'admin' && (
        <div className="section">
          <h2>Administration</h2>
          <div className="stats-grid">
            <Link to="/admin/users" className="stat-card">
              <div className="stat-number">{counts.users}</div>
              <div className="stat-label">Users</div>
            </Link>
            <Link to="/admin/clinics" className="stat-card">
              <div className="stat-number">{counts.clinics}</div>
              <div className="stat-label">Clinics</div>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Screenings */}
      <div className="section">
        <h2>Recent Screenings</h2>
        {recentSessions.length === 0 ? (
          <p className="empty-state">No screening sessions yet. <Link to="/sessions">Start one</Link></p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Athlete</th><th>Date</th><th>Status</th><th>Risk</th></tr></thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={`/sessions/${s.id}`}>
                      {s.athlete ? `${s.athlete.firstName} ${s.athlete.lastName}` : s.athleteId}
                    </Link>
                  </td>
                  <td>{new Date(s.date).toLocaleDateString()}</td>
                  <td>{s.status}</td>
                  <td>
                    <span style={{ color: riskColor(s.riskCategory), fontWeight: 'bold' }}>
                      {s.riskCategory ? riskLabel(s.riskCategory) : '—'}
                    </span>
                    {s.riskScore != null && ` (${s.riskScore})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
