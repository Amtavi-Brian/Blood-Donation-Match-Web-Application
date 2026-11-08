
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './DonorDashboard.css';

import MyProfile from './donor/MyProfile';
import UpdateAvailability from './donor/UpdateAvailability';
import DonationHistory from './donor/DonationHistory';
import SosAlerts from './donor/SosAlerts';
import Reminders from './donor/Reminders';
import DonorSettings from './donor/DonorSettings';
import ReportsAnalytics from './donor/ReportsAnalytics';
import PortalLayout from '../componenets/dashboard/PortalLayout';
import useAuth from '../context/useAuth';
import { getMyDonations, getMyDonorProfile } from '../services/donorService';
import { getHospitals } from '../services/hospitalService';
import { getUnreadNotificationCount } from '../services/notificationService';


function DonorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getMyDonorProfile(), getMyDonations(), getHospitals()])
      .then(([donorProfile, donationRecords, hospitalList]) => {
        if (!active) return;
        setProfile(donorProfile);
        setDonations(donationRecords);
        setHospitals(hospitalList);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Unable to load donor data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getUnreadNotificationCount()
      .then((count) => { if (active) setUnreadCount(count); })
      .catch((error) => { if (active) setNotificationError(error.message || 'Unable to load notification count.'); });
    return () => { active = false; };
  }, []);

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

  const donor = {
    name: user?.full_name || 'Donor',
    bloodGroup: profile?.blood_group || 'Not set',
    donations: donations.filter((item) => item.verified).length,
    livesSaved: '—',
    nextEligibleDate: 'Check with your hospital',
    status: profile?.available_to_contact ? 'Available' : 'Unavailable',
  };

  const navigation = [
    { name: 'Dashboard', icon: '⌂' },
    { name: 'My Profile', icon: '♙' },
    { name: 'Update Availability', icon: '◉' },
    { name: 'Donation History', icon: '▤' },
    { name: 'SOS Alerts', icon: '♧' },
    { name: 'Reminders', icon: '◷' },
    { name: 'Settings', icon: '⚙' },
    { name: 'Reports & Analytics', icon: '▥' },
  ];

  const recentDonations = useMemo(() => donations
    .filter((donation) => donation.verified)
    .slice()
    .sort((a, b) => new Date(b.donated_at) - new Date(a.donated_at))
    .slice(0, 3)
    .map((donation) => {
      const donatedAt = new Date(donation.donated_at);
      const hospital = hospitals.find((item) => item.id === donation.hospital_id);
      return {
        day: donatedAt.toLocaleDateString(undefined, { day: '2-digit' }),
        month: donatedAt.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
        hospital: hospital?.name || 'Hospital',
        date: donatedAt.toLocaleDateString(),
      };
    }), [donations, hospitals]);

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
    <PortalLayout
      role="donor"
      userName={donor.name}
      userRole="Donor"
      title="Donor Dashboard"
      subtitle="Thank you for being a hero!"
      navigation={navigation.map((item) => ({
        label: item.name,
        icon: item.icon,
        to: pagePaths[item.name],
      }))}
      notificationCount={unreadCount}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
    >
      <div className="donor-dashboard">
        {loadError && <p role="alert" style={{ color: '#b91c1c' }}>{loadError}</p>}
        {notificationError && <p role="alert" style={{ color: '#b91c1c' }}>{notificationError}</p>}
        {loading && <p role="status">Loading your donor information…</p>}

        {/* DASHBOARD PAGE */}
        {!loading && !loadError && activePage === 'Dashboard' && (
          <>
            <section className="stats-grid">
              <article className="stat-card stat-card--donations">
                <div className="stat-icon donation-icon" aria-hidden="true">♥</div>
                <div>
                  <p>Total Donations</p>
                  <h2>{donor.donations}</h2>
                </div>
              </article>
              <article className="stat-card stat-card--eligibility">
                <div className="stat-icon calendar-icon" aria-hidden="true">▦</div>
                <div>
                  <p>Next Eligible Date</p>
                  <h2>{donor.nextEligibleDate}</h2>
                </div>
              </article>
              <article className="stat-card stat-card--blood">
                <div className="stat-icon blood-icon" aria-hidden="true">♥</div>
                <div>
                  <p>Blood Type</p>
                  <h2>{donor.bloodGroup}</h2>
                </div>
              </article>
            </section>

            <section className="dashboard-grid">
              <section className="dashboard-card donor-activity">
                <div className="card-header">
                  <div><h2>Recent Activity</h2></div>
                </div>
                {recentDonations.length ? (
                  <div className="donor-activity-list">
                    {recentDonations.map((donation, index) => (
                      <article className="donor-activity-row" key={`${donation.date}-${index}`}>
                        <span className={`donor-activity-icon donor-activity-icon--${index % 2 ? 'blue' : 'green'}`} aria-hidden="true">✓</span>
                        <div>
                          <strong>Donation completed</strong>
                          <span>{donation.hospital}</span>
                          <small>{donation.date}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="donor-empty">Your verified donation activity will appear here.</p>
                )}
              </section>

              <section className="dashboard-card donor-hospitals">
                <div className="card-header">
                  <div><h2>Nearby Hospitals</h2></div>
                  <span className="donor-section-note">{hospitals.length} available</span>
                </div>
                {hospitals.length ? (
                  <div className="donor-hospital-list">
                    {hospitals.slice(0, 3).map((hospital) => (
                      <article className="donor-hospital-row" key={hospital.id}>
                        <span className="donor-hospital-icon" aria-hidden="true">✚</span>
                        <div>
                          <strong>{hospital.name}</strong>
                          <small>{hospital.city || 'Location available'}</small>
                        </div>
                        <button type="button" onClick={() => handleNavigation('SOS Alerts')}>Request Blood</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="donor-empty">No verified hospitals are available right now.</p>
                )}
              </section>
            </section>

            <section className="eligibility-banner">
              <span className="eligibility-icon" aria-hidden="true">♥</span>
              <div>
                <h2>Your blood can make a difference</h2>
                <p>Keep your profile updated and be ready to help when needed.</p>
              </div>
              <span className="eligibility-heart" aria-hidden="true">♥</span>
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

      </div>
    </PortalLayout>
  );
}

export default DonorDashboard;
