import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';

const NAV = [
  { to: '/',           icon: '📊', label: 'Dashboard' },
  { to: '/map',        icon: '🗺️',  label: 'Plot Map' },
  { to: '/finance',    icon: '💰', label: 'Finance' },
  { to: '/receipts',   icon: '🧾', label: 'Receipts' },
  { to: '/enquiries',  icon: '📞', label: 'Enquiries' },
  { to: '/seed',       icon: '⚙️',  label: 'Setup / Seed' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } catch {}
    navigate('/login');
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏡</div>
        <div className="sidebar-logo-title">Shree Dungar</div>
        <div className="sidebar-logo-sub">Residency — Admin</div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Main Menu</span>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <span className="user-email">{user?.email}</span>
          <button className="btn-logout" onClick={handleLogout} title="Sign out">⏻</button>
        </div>
      </div>
    </aside>
  );
}
