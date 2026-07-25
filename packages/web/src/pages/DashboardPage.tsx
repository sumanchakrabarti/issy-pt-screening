import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { ScreeningSession } from '../types';
import { statusLabel, statusBadgeClass } from '../services/sessionStatus';

interface Stats {
  counts: { users: number; clinics: number; clubs: number; teams: number; athletes: number; sessions: number; completedSessions: number; needsReview: number };
  riskDistribution: { category: string; count: number }[];
  recentSessions: ScreeningSession[];
  reviewSessions: ScreeningSession[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/stats').then(setStats).catch(() => {
      // Fallback if stats endpoint not available yet
      setStats({
        counts: { users: 0, clinics: 0, clubs: 0, teams: 0, athletes: 0, sessions: 0, completedSessions: 0, needsReview: 0 },
        riskDistribution: [],
        recentSessions: [],
        reviewSessions: [],
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

  const { counts, riskDistribution, recentSessions, reviewSessions } = stats;
  const screeningsByDay = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - offset));
    const key = date.toDateString();
    const count = recentSessions.filter((session) => new Date(session.date).toDateString() === key).length;
    return {
      label: date.toLocaleDateString([], { weekday: 'short' }),
      count,
    };
  });
  const screeningsLastWeek = screeningsByDay.reduce((total, day) => total + day.count, 0);
  const maxDailyScreenings = Math.max(...screeningsByDay.map((day) => day.count), 1);

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.firstName}!</h1>
      <p className="dashboard-intro">A quick view of current risk patterns and recent screening activity.</p>

      <div className="dashboard-panels">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Athlete Risk Distribution</h2>
              <p className="dashboard-panel-subtitle">Completed screenings by risk category.</p>
            </div>
            <span className="dashboard-panel-pill">{counts.completedSessions} completed</span>
          </div>
          {riskDistribution.length > 0 ? (
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
          ) : (
            <p className="empty-state">No completed screenings yet.</p>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>New Screenings</h2>
              <p className="dashboard-panel-subtitle">The last 7 days of activity.</p>
            </div>
            <span className="dashboard-panel-pill">{screeningsLastWeek} total</span>
          </div>
          <div className="weekly-chart" aria-label="New screenings in the last seven days">
            {screeningsByDay.map((day) => (
              <div key={day.label} className="weekly-chart-bar-group">
                <div className="weekly-chart-bar-track">
                  <div
                    className="weekly-chart-bar-fill"
                    style={{ height: `${Math.max((day.count / maxDailyScreenings) * 100, day.count > 0 ? 12 : 4)}%` }}
                  />
                </div>
                <span className="weekly-chart-bar-count">{day.count}</span>
                <span className="weekly-chart-bar-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screenings needing review */}
      <div className="section">
        <div className="dashboard-panel-header">
          <div>
            <h2>Screenings Needing Review</h2>
            <p className="dashboard-panel-subtitle">Scored screenings awaiting clinician review, plus completed screenings with a requested consultation.</p>
          </div>
          <span className="dashboard-panel-pill">{counts.needsReview} pending</span>
        </div>
        {reviewSessions.length === 0 ? (
          <p className="empty-state">Nothing to review right now. 🎉</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Athlete</th><th>Team</th><th>Date</th><th>Risk</th><th></th></tr></thead>
            <tbody>
              {reviewSessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={`/sessions/${s.id}`}>
                      {s.athlete ? `${s.athlete.firstName} ${s.athlete.lastName}` : s.athleteId}
                    </Link>
                  </td>
                  <td>{s.team?.name || '—'}</td>
                  <td>{new Date(s.date).toLocaleDateString()}</td>
                  <td>
                    <span style={{ color: riskColor(s.riskCategory), fontWeight: 'bold' }}>
                      {s.riskCategory ? riskLabel(s.riskCategory) : '—'}
                    </span>
                    {s.riskScore != null && ` (${s.riskScore})`}
                  </td>
                  <td><Link to={`/sessions/${s.id}`} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}>Review →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
                  <td><span className={`badge ${statusBadgeClass(s.status)}`}>{statusLabel(s.status)}</span></td>
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
