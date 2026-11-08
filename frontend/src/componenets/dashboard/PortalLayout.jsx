import { Link, NavLink, useNavigate } from "react-router-dom";
import "./PortalLayout.css";

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function BloodLinkLogo() {
  return (
    <span className="portal-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 38" role="presentation">
        <path d="M16 1.5C13.4 7 3.5 18.1 3.5 25a12.5 12.5 0 0 0 25 0C28.5 18.1 18.6 7 16 1.5Z" fill="currentColor" />
        <path d="M10 25.5a6.2 6.2 0 0 0 6.2 6.2" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2.4" />
      </svg>
    </span>
  );
}

export default function PortalLayout({
  role,
  userName,
  userRole,
  title,
  subtitle,
  navigation,
  notificationCount = 0,
  onLogout,
  children,
}) {
  const navigate = useNavigate();
  const avatar = initials(userName || "BloodLink");

  return (
    <div className={`portal-app portal-app--${role}`}>
      <aside className="portal-sidebar">
        <Link className="portal-brand" to="/" aria-label="BloodLink home">
          <BloodLinkLogo />
          <span>BloodLink</span>
        </Link>

        <div className="portal-user">
          <span className="portal-user-avatar">{avatar}</span>
          <span className="portal-user-copy">
            <strong>{userName}</strong>
            <small>{userRole}</small>
          </span>
        </div>

        <p className="portal-menu-heading">MAIN MENU</p>
        <nav className="portal-nav" aria-label="Main menu">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role}`}
              title={item.label}
              className={({ isActive }) => `portal-nav-link${isActive ? " is-active" : ""}`}
            >
              <span className="portal-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="portal-logout" type="button" onClick={onLogout}>
          <span aria-hidden="true">↪</span>
          <span>Logout</span>
        </button>
      </aside>

      <div className="portal-frame">
        <header className="portal-header">
          <div className="portal-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="portal-header-actions">
            <Link
              className="portal-notifications"
              to="/notifications"
              aria-label={notificationCount > 0 ? `${notificationCount} notifications` : "Notifications"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
              {notificationCount > 0 && <span className="portal-notification-count">{notificationCount}</span>}
            </Link>
            <button
              className="portal-header-avatar"
              type="button"
              aria-label="View account"
              onClick={() => navigate(`/${role}/settings`)}
            >
              {avatar}
            </button>
          </div>
        </header>
        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
