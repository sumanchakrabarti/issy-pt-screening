import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function SettingsHomePage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <p className="text-muted">
        Pick a section from the left to manage the app&apos;s reference data and administrative lists.
      </p>

      <div className="settings-home-grid">
        <Link to="/settings/clubs" className="settings-card">
          <h3>Clubs</h3>
          <p>Manage club records and club-to-clinic links.</p>
        </Link>
        <Link to="/settings/teams" className="settings-card">
          <h3>Teams</h3>
          <p>Manage team records and team membership.</p>
        </Link>
        <Link to="/settings/exercises" className="settings-card">
          <h3>Exercises</h3>
          <p>Create and manage the exercise library.</p>
        </Link>
        <Link to="/settings/muscle-groups" className="settings-card">
          <h3>Muscle Groups</h3>
          <p>Maintain the body-part tags used by exercises.</p>
        </Link>
        <Link to="/settings/ligament-groups" className="settings-card">
          <h3>Ligament Groups</h3>
          <p>Maintain the ligament tags used by exercises.</p>
        </Link>
        {user?.role === 'admin' && (
          <>
            <Link to="/settings/clinics" className="settings-card">
              <h3>Clinics</h3>
              <p>Manage clinic records and contact details.</p>
            </Link>
            <Link to="/settings/users" className="settings-card">
              <h3>Users</h3>
              <p>Manage logins, roles, and clinic assignments.</p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}