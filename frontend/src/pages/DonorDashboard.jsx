import './DonorDashboard.css'

function DonorDashboard() {
  return (
    <div className="donor-dashboard">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🩸</div>
          <span>BloodLink</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span>⌂</span>
            Dashboard
          </a>

          <a href="#" className="nav-item">
            <span>🔎</span>
            Find a Match
          </a>

          <a href="#" className="nav-item">
            <span>🩸</span>
            My Donations
          </a>

          <a href="#" className="nav-item">
            <span>📋</span>
            Requests
          </a>

          <a href="#" className="nav-item">
            <span>📊</span>
            Reports & Analytics
          </a>

          <a href="#" className="nav-item">
            <span>👤</span>
            Profile
          </a>
        </nav>

        <button className="logout-btn">
          <span>↪</span>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">
          <div>
            <p className="header-label">DONOR PORTAL</p>
            <h1>Welcome back, Lisa! 👋</h1>
            <p className="header-subtitle">
              Thank you for helping save lives through blood donation.
            </p>
          </div>

          <div className="profile-area">
            <div className="notification">🔔</div>
            <div className="profile-avatar">L</div>
          </div>
        </header>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon donation-icon">🩸</div>
            <div>
              <p>Total Donations</p>
              <h2>8</h2>
              <span className="positive">+2 this year</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blood-icon">💉</div>
            <div>
              <p>Blood Type</p>
              <h2>O+</h2>
              <span className="status">Eligible</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon calendar-icon">📅</div>
            <div>
              <p>Next Eligible Date</p>
              <h2>12 Nov</h2>
              <span>16 days remaining</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon lives-icon">❤️</div>
            <div>
              <p>Lives Impacted</p>
              <h2>24</h2>
              <span className="positive">3 lives per donation</span>
            </div>
          </div>

        </section>

        {/* Dashboard Content */}
        <section className="dashboard-grid">

          {/* Recent Activity */}
          <div className="dashboard-card activity-card">
            <div className="card-header">
              <div>
                <p className="section-label">YOUR ACTIVITY</p>
                <h2>Recent Donations</h2>
              </div>

              <button className="view-btn">
                View All
              </button>
            </div>

            <div className="donation-list">

              <div className="donation-row">
                <div className="date-box">
                  <strong>18</strong>
                  <small>SEP</small>
                </div>

                <div className="donation-info">
                  <strong>Blood Donation</strong>
                  <span>Nairobi Hospital</span>
                </div>

                <span className="completed">Completed</span>
              </div>

              <div className="donation-row">
                <div className="date-box">
                  <strong>20</strong>
                  <small>JUN</small>
                </div>

                <div className="donation-info">
                  <strong>Blood Donation</strong>
                  <span>Kenyatta National Hospital</span>
                </div>

                <span className="completed">Completed</span>
              </div>

              <div className="donation-row">
                <div className="date-box">
                  <strong>15</strong>
                  <small>MAR</small>
                </div>

                <div className="donation-info">
                  <strong>Blood Donation</strong>
                  <span>MP Shah Hospital</span>
                </div>

                <span className="completed">Completed</span>
              </div>

            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card quick-card">
            <div className="card-header">
              <div>
                <p className="section-label">QUICK ACTIONS</p>
                <h2>What would you like to do?</h2>
              </div>
            </div>

            <div className="quick-actions">

              <button className="action-button primary-action">
                <span>🩸</span>
                <div>
                  <strong>Donate Blood</strong>
                  <small>Find a nearby centre</small>
                </div>
              </button>

              <button className="action-button">
                <span>🔎</span>
                <div>
                  <strong>Find a Match</strong>
                  <small>Help someone in need</small>
                </div>
              </button>

              <button className="action-button">
                <span>📊</span>
                <div>
                  <strong>View Reports</strong>
                  <small>See your donation impact</small>
                </div>
              </button>

            </div>
          </div>

        </section>

        {/* Eligibility Banner */}
        <section className="eligibility-banner">
          <div className="eligibility-icon">✓</div>

          <div>
            <p className="section-label">DONATION STATUS</p>
            <h2>You're eligible to donate!</h2>
            <p>
              Your next donation window opens on 12 November 2026.
            </p>
          </div>

          <button className="donate-now-btn">
            Find Donation Centre
          </button>
        </section>

      </main>
    </div>
  )
}

export default DonorDashboard