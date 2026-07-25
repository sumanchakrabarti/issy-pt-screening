import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type SettingsLink = {
  to: string;
  label: string;
  roles: Array<'admin' | 'clinician' | 'coach'>;
};

const SETTINGS_LINKS: SettingsLink[] = [
  { to: '/settings/clubs', label: 'Clubs', roles: ['admin', 'clinician', 'coach'] },
  { to: '/settings/teams', label: 'Teams', roles: ['admin', 'clinician', 'coach'] },
  { to: '/settings/exercises', label: 'Exercises', roles: ['admin', 'clinician'] },
  { to: '/settings/muscle-groups', label: 'Muscle Groups', roles: ['admin', 'clinician'] },
  { to: '/settings/ligament-groups', label: 'Ligament Groups', roles: ['admin', 'clinician'] },
  { to: '/settings/clinics', label: 'Clinics', roles: ['admin'] },
  { to: '/settings/users', label: 'Users', roles: ['admin'] },
];

export function SettingsLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const links = SETTINGS_LINKS.filter((link) => user?.role && link.roles.includes(user.role as 'admin' | 'clinician' | 'coach'));

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <p className="settings-eyebrow">Settings</p>
          <h1>Administration</h1>
          <p className="settings-summary">Reference data and user management live here.</p>
        </div>

        <nav className="settings-nav" aria-label="Settings sections">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={location.pathname === link.to ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="settings-panel">
        <Outlet />
      </section>
    </div>
  );
}