import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', path: '/hospital/dashboard', icon: '⌂' },
  { label: 'Request Blood', path: '/hospital/requests', icon: '♧' },
  { label: 'Donor Search', path: '/hospital/donors', icon: '⌕' },
  { label: 'Blood Stock', path: '/hospital/stock', icon: '▤' },
  { label: 'Record Donation', path: '/hospital/donations', icon: '♡' },
  { label: 'Analytics', path: '/hospital/analytics', icon: '▥' },
  { label: 'Settings', path: '/hospital/settings', icon: '⚙' },
]

function Sidebar() {
  return (
    <aside className="bl-sidebar">
      <div className="bl-brand">
        <span className="brand-drop">♦</span>
        <span>BloodLink</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">KN</div>
        <div>
          <strong>Hospital Staff</strong>
          <small>Hospital Account</small>
        </div>
      </div>

      <nav className="sidebar-navigation" aria-label="Hospital main navigation">
        <p className="sidebar-label">MAIN MENU</p>

        {navItems.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <a href="/logout" className="sidebar-logout">
        ⇥ Logout
      </a>
    </aside>
  )
}

export default Sidebar
