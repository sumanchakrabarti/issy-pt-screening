import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="nav-top">
          {user && (
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            </button>
          )}
          <div className="nav-brand">
            <Link to="/" onClick={handleNavClick}>🏥 IPT ACL Screening</Link>
          </div>
        </div>
        {user && (
          <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
            {user.role === 'parent' ? (
              <Link to="/athletes" className={location.pathname.startsWith('/athletes') ? 'active' : ''} onClick={handleNavClick}>Athletes</Link>
            ) : (
              <>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={handleNavClick}>Dashboard</Link>
                <Link to="/clubs" className={location.pathname.startsWith('/clubs') ? 'active' : ''} onClick={handleNavClick}>Clubs</Link>
                <Link to="/teams" className={location.pathname.startsWith('/teams') ? 'active' : ''} onClick={handleNavClick}>Teams</Link>
                <Link to="/athletes" className={location.pathname.startsWith('/athletes') ? 'active' : ''} onClick={handleNavClick}>Athletes</Link>
                <Link to="/sessions" className={location.pathname.startsWith('/sessions') ? 'active' : ''} onClick={handleNavClick}>Sessions</Link>
                {user.role === 'admin' && (
                  <>
                    <div className="nav-divider" />
                    <Link to="/admin/users" className={location.pathname === '/admin/users' ? 'active' : ''} onClick={handleNavClick}>Users</Link>
                    <Link to="/admin/clinics" className={location.pathname === '/admin/clinics' ? 'active' : ''} onClick={handleNavClick}>Clinics</Link>
                  </>
                )}
              </>
            )}
            <div className="nav-divider" />
            <span className="nav-user">
              {user.firstName} {user.lastName} ({user.role})
            </span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        )}
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
