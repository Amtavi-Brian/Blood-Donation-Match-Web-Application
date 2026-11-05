
import { useLocation, useNavigate } from 'react-router-dom';
import './DonorDashboard.css';

import MyProfile from './donor/MyProfile';
import UpdateAvailability from './donor/UpdateAvailability';
import DonationHistory from './donor/DonationHistory';
import SosAlerts from './donor/SosAlerts';
import Reminders from './donor/Reminders';
import DonorSettings from './donor/DonorSettings';
import ReportsAnalytics from './donor/ReportsAnalytics';


function DonorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const pagePaths = {
    Dashboard: '/donor',
    'My Profile': '/donor/profile',
    'Update Availability': '/donor/availability',
    'Donation History': '/donor/history',
    'SOS Alerts': '/donor/sos-alerts',
    Reminders: '/donor/reminders',
    Settings: '/donor/settings',
    'Reports & Analytics': '/donor/analytics',
    Notifications: '/notifications',
  };
  const pathPages = Object.fromEntries(
    Object.entries(pagePaths).map(([page, path]) => [path, page]),
  );
  const currentPath = location.pathname.replace(/\/+$/, '') || '/donor';
  const activePage = pathPages[currentPath] || 'Dashboard';

  // Temporary demo data until backend integration
  const donor = {
    name: 'John Doe',
    bloodGroup: 'O+',
    donations: 8,
    livesSaved: 24,
    nextEligibleDate: '20 Jan 2027',
    status: 'Active',
  };

  const navigation = [
    { name: 'Dashboard', icon: '▦' },
    { name: 'My Profile', icon: '♙' },
    { name: 'Update Availability', icon: '✓' },
    { name: 'Donation History', icon: '♡' },
    { name: 'SOS Alerts', icon: '⚠' },
    { name: 'Reminders', icon: '◷' },
    { name: 'Settings', icon: '⚙' },
    { name: 'Reports & Analytics', icon: '▥' },
  ];

  const donations = [
    { day: '20', month: 'OCT', hospital: 'Kenyatta National Hospital', date: '20 October 2026' },
    { day: '15', month: 'JUL', hospital: 'Nairobi Hospital', date: '15 July 2026' },
    { day: '10', month: 'APR', hospital: 'Aga Khan University Hospital', date: '10 April 2026' },
  ];

  const handleNavigation = (page) => {
    navigate(pagePaths[page] || '/donor');
  };

  // Connect the pages we have already created
  const pageComponents = {
    'My Profile': <MyProfile />,
    'Update Availability': <UpdateAvailability />,
    'Donation History': <DonationHistory />,
    'SOS Alerts': <SosAlerts />,
    'Reminders': <Reminders />,
    'Settings': <DonorSettings />,
    'Reports & Analytics': <ReportsAnalytics />,
  
  };

  return (
    <div className="donor-dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">🩸</div>
          <span>BloodLink</span>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">JD</div>
          <div>
            <strong>{donor.name}</strong>
            <small>Verified Donor</small>
          </div>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activePage === item.name ? 'active' : ''}`}
              onClick={() => handleNavigation(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <button
          className="logout-btn"
          onClick={() => alert('Logout will be connected to authentication.')}
        >
          <span>↪</span> Log Out
        </button>

      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="header-label">BLOODLINK / DONOR PORTAL</p>
            <h1>Welcome back, {donor.name}!</h1>
            <p className="header-subtitle">
              Thank you for being a lifesaver. Your generosity makes a difference.
            </p>
          </div>

          <div className="profile-area">
            <button
              className="notification"
              onClick={() => handleNavigation('Notifications')}
              aria-label="Notifications"
            >
              🔔
            </button>
            <div className="profile-avatar">JD</div>
          </div>
        </header>

        {/* DASHBOARD PAGE */}
        {activePage === 'Dashboard' && (
          <>
            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon donation-icon">🩸</div>
                <div>
                  <p>Total Donations</p>
                  <h2>{donor.donations}</h2>
                  <span>Completed donations</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon lives-icon">💚</div>
                <div>
                  <p>Lives Saved</p>
                  <h2>{donor.livesSaved}</h2>
                  <span className="positive">Making a difference!</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon calendar-icon">📅</div>
                <div>
                  <p>Next Eligible Date</p>
                  <h2>{donor.nextEligibleDate}</h2>
                  <span>Estimated date</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blood-icon">🩸</div>
                <div>
                  <p>Blood Group</p>
                  <h2>{donor.bloodGroup}</h2>
                  <span className="status">{donor.status} Donor</span>
                </div>
              </div>

            </section>

            <section className="dashboard-grid">

              {/* RECENT DONATIONS */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div>
                    <h2>Recent Donations</h2>
                    <p className="header-subtitle">Your donation journey</p>
                  </div>

                  <button
                    className="view-btn"
                    onClick={() => handleNavigation('Donation History')}
                  >
                    View All →
                  </button>
                </div>

                <div className="donation-list">
                  {donations.map((donation, index) => (
                    <div className="donation-row" key={index}>
                      <div className="date-box">
                        <strong>{donation.day}</strong>
                        <small>{donation.month}</small>
                      </div>

                      <div className="donation-info">
                        <strong>Blood Donation</strong>
                        <span>{donation.hospital}</span>
                        <span>{donation.date}</span>
                      </div>

                      <span className="completed">Completed</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div>
                    <h2>Quick Actions</h2>
                    <p className="header-subtitle">Manage your donor account</p>
                  </div>
                </div>

                <div className="quick-actions">

                  <button
                    className="action-button"
                    onClick={() => handleNavigation('My Profile')}
                  >
                    <span>👤</span>
                    <div>
                      <strong>My Profile</strong>
                      <small>Update personal information</small>
                    </div>
                  </button>

                  <button
                    className="action-button"
                    onClick={() => handleNavigation('Update Availability')}
                  >
                    <span>🟢</span>
                    <div>
                      <strong>Update Availability</strong>
                      <small>Manage your donor status</small>
                    </div>
                  </button>

                  <button
                    className="action-button"
                    onClick={() => handleNavigation('Reminders')}
                  >
                    <span>🔔</span>
                    <div>
                      <strong>Donation Reminders</strong>
                      <small>Manage upcoming reminders</small>
                    </div>
                  </button>

                  <button
                    className="action-button primary-action"
                    onClick={() => handleNavigation('SOS Alerts')}
                  >
                    <span>🚨</span>
                    <div>
                      <strong>View SOS Alerts</strong>
                      <small>Help patients in urgent need</small>
                    </div>
                  </button>

                </div>
              </div>

            </section>

            {/* ELIGIBILITY BANNER */}
            <section className="eligibility-banner">
              <div className="eligibility-icon">♥</div>

              <div>
                <p className="section-label">BE SOMEONE'S HERO</p>
                <h2>Your blood can save lives!</h2>
                <p>
                  Keep your profile updated and stay ready to help
                  patients who need your blood group.
                </p>
              </div>

              <button
                className="donate-now-btn"
                onClick={() => handleNavigation('SOS Alerts')}
              >
                View Requests →
              </button>
            </section>
          </>
        )}

        {/* CONNECTED PAGES */}
        {pageComponents[activePage] && (
          <>
            <button
              className="view-btn"
              onClick={() => handleNavigation('Dashboard')}
              style={{ marginBottom: '20px' }}
            >
              ← Back to Dashboard
            </button>

            {pageComponents[activePage]}
          </>
        )}

        {/* PAGES WE HAVE NOT BUILT YET */}
        {!pageComponents[activePage] &&
          activePage !== 'Dashboard' && (
            <section className="dashboard-card">
              <button
                className="view-btn"
                onClick={() => handleNavigation('Dashboard')}
              >
                ← Back to Dashboard
              </button>

              <h2 style={{ marginTop: '25px' }}>{activePage}</h2>

              <p className="header-subtitle" style={{ marginTop: '10px' }}>
                This page is not connected yet. We'll build and integrate it next.
              </p>
            </section>
          )}

        <footer style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '25px 0',
          color: '#9ca3af',
          fontSize: '11px'
        }}>
          <span>© 2026 BloodLink. All rights reserved.</span>
          <span>Saving Lives Together ❤️</span>
        </footer>

      </main>
    </div>
  );
}

export default DonorDashboard;
