
import { useState } from 'react';

function DonorSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    sosNotifications: true,
    profileVisibility: true,
    locationSharing: false,
    twoFactor: false,
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (setting) => {
    setSettings((previous) => ({
      ...previous,
      [setting]: !previous[setting],
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  const handlePasswordChange = () => {
    const newPassword = prompt('Enter your new password:');

    if (!newPassword) return;

    if (newPassword.length < 8) {
      alert('Your password must contain at least 8 characters.');
      return;
    }

    const confirmPassword = prompt('Confirm your new password:');

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    alert('Password change request validated! Backend integration is still required.');
  };

  const settingGroups = [
    {
      title: 'Notifications',
      description: 'Choose which updates you want to receive.',
      items: [
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          detail: 'Receive updates through your email.',
        },
        {
          key: 'smsNotifications',
          label: 'SMS Notifications',
          detail: 'Receive important updates through SMS.',
        },
        {
          key: 'sosNotifications',
          label: 'Emergency SOS Alerts',
          detail: 'Receive urgent blood donation requests.',
        },
      ],
    },
    {
      title: 'Privacy',
      description: 'Manage how your donor information is shared.',
      items: [
        {
          key: 'profileVisibility',
          label: 'Donor Profile Visibility',
          detail: 'Allow authorized hospitals to view your donor profile.',
        },
        {
          key: 'locationSharing',
          label: 'Location Sharing',
          detail: 'Allow your approximate location to be used for donor matching.',
        },
      ],
    },
    {
      title: 'Security',
      description: 'Protect your BloodLink account.',
      items: [
        {
          key: 'twoFactor',
          label: 'Two-Factor Authentication',
          detail: 'Enable an additional verification step when signing in.',
        },
      ],
    },
  ];

  const styles = {
    page: {
      padding: '30px',
      background: '#f8f9fc',
      minHeight: '100vh',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      color: '#1f2937',
    },
    heading: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#6b7280',
      marginBottom: '25px',
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '23px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    button: {
      background: '#991b1b',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
    },
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>⚙️ Donor Settings</h1>

      <p style={styles.subtitle}>
        Manage your account preferences, privacy and security.
      </p>

      {/* ACCOUNT INFORMATION */}
      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Account Information</h2>

        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Manage your BloodLink account and security preferences.
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          borderTop: '1px solid #eee',
          paddingTop: '18px',
          marginTop: '18px',
        }}>
          <div>
            <strong>Password & Security</strong>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>
              Update your account password.
            </p>
          </div>

          <button
            style={styles.button}
            onClick={handlePasswordChange}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* SETTINGS GROUPS */}
      {settingGroups.map((group) => (
        <div style={styles.card} key={group.title}>
          <h2 style={{ marginTop: 0 }}>{group.title}</h2>

          <p style={{
            color: '#6b7280',
            fontSize: '14px',
            marginBottom: '20px',
          }}>
            {group.description}
          </p>

          {group.items.map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '15px',
                padding: '17px 0',
                borderTop: '1px solid #eee',
              }}
            >
              <div>
                <strong>{item.label}</strong>
                <p style={{
                  color: '#6b7280',
                  fontSize: '13px',
                  marginBottom: 0,
                }}>
                  {item.detail}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={settings[item.key]}
                onClick={() => handleToggle(item.key)}
                style={{
                  minWidth: '54px',
                  height: '28px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  background: settings[item.key] ? '#15803d' : '#d1d5db',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '3px',
                  left: settings[item.key] ? '29px' : '3px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* SAVE SETTINGS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
      }}>
        <button style={styles.button} onClick={handleSave}>
          Save Settings
        </button>

        {saved && (
          <span style={{ color: '#15803d', fontWeight: '600' }}>
            ✓ Settings saved in this session!
          </span>
        )}
      </div>

      <p style={{
        color: '#9ca3af',
        fontSize: '12px',
        marginTop: '25px',
      }}>
        Settings currently apply locally in this session.
        Account security and notification preferences require backend integration.
      </p>
    </div>
  );
}

export default DonorSettings;
