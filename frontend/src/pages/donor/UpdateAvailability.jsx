
import { useState } from 'react';

function UpdateAvailability() {
  const [availability, setAvailability] = useState(true);
  const [location, setLocation] = useState('Nairobi, Kenya');
  const [radius, setRadius] = useState('10');
  const [notifications, setNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
  };

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #eceef2',
    borderRadius: '14px',
    padding: '25px',
    marginBottom: '22px',
    boxShadow: '0 3px 12px rgba(31,41,55,0.04)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '9px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    boxSizing: 'border-box',
    color: '#172033',
    background: 'white',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fc',
      padding: '30px',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      color: '#172033',
    }}>

      {/* HEADER */}
      <div style={{ marginBottom: '30px' }}>
        <p style={{
          color: '#b91c1c',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '1px',
        }}>
          DONOR PORTAL / AVAILABILITY
        </p>

        <h1 style={{ fontSize: '28px', margin: '8px 0' }}>
          Update Availability
        </h1>

        <p style={{ color: '#6b7280', fontSize: '13px' }}>
          Let hospitals know when you are ready to donate blood.
        </p>
      </div>

      {saved && (
        <div style={{
          background: '#dcfce7',
          color: '#166534',
          padding: '14px',
          borderRadius: '9px',
          marginBottom: '20px',
          fontSize: '13px',
        }}>
          ✓ Your availability preferences have been saved!
        </div>
      )}

      <form onSubmit={handleSave}>

        {/* AVAILABILITY STATUS */}
        <section style={cardStyle}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>
            Your Availability Status
          </h2>

          <p style={{
            color: '#6b7280',
            fontSize: '13px',
            marginBottom: '22px',
          }}>
            Choose whether you are currently available to receive blood donation requests.
          </p>

          <div style={{
            padding: '20px',
            background: availability ? '#f0fdf4' : '#fff1f2',
            border: `1px solid ${availability ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            flexWrap: 'wrap',
          }}>
            <div>
              <strong style={{
                color: availability ? '#15803d' : '#b91c1c',
                fontSize: '16px',
              }}>
                {availability ? '🟢 Available to Donate' : '🔴 Currently Unavailable'}
              </strong>

              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '7px',
              }}>
                {availability
                  ? 'Hospitals may identify you for matching.'
                  : 'You will not be considered for new donor matches.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAvailability(!availability);
                setSaved(false);
              }}
              style={{
                border: 'none',
                background: availability ? '#15803d' : '#b91c1c',
                color: 'white',
                padding: '11px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {availability ? 'Go Unavailable' : 'Go Available'}
            </button>
          </div>
        </section>

        {/* LOCATION SETTINGS */}
        <section style={cardStyle}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>
            Location Preferences
          </h2>

          <p style={{
            color: '#6b7280',
            fontSize: '13px',
            marginBottom: '22px',
          }}>
            Help nearby hospitals find you when blood is needed.
          </p>

          <div style={{ marginBottom: '22px' }}>
            <label style={labelStyle}>Your Current Location</label>

            <input
              style={inputStyle}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setSaved(false);
              }}
              placeholder="Enter your location"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Preferred Donation Radius</label>

            <select
              style={inputStyle}
              value={radius}
              onChange={(e) => {
                setRadius(e.target.value);
                setSaved(false);
              }}
            >
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="20">Within 20 km</option>
              <option value="30">Within 30 km</option>
              <option value="50">Within 50 km</option>
            </select>

            <p style={{
              color: '#9ca3af',
              fontSize: '11px',
              marginTop: '8px',
            }}>
              This is your preferred search radius, not a guarantee of distance.
            </p>
          </div>
        </section>

        {/* NOTIFICATION PREFERENCES */}
        <section style={cardStyle}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>
            Notification Preferences
          </h2>

          <p style={{
            color: '#6b7280',
            fontSize: '13px',
            marginBottom: '22px',
          }}>
            Choose how you would like to receive donation alerts.
          </p>

          {[
            {
              title: 'Push Notifications',
              description: 'Receive alerts when hospitals need your blood group.',
              value: notifications,
              setter: setNotifications,
            },
            {
              title: 'SMS Notifications',
              description: 'Receive urgent blood requests through SMS.',
              value: smsAlerts,
              setter: setSmsAlerts,
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '17px 0',
                borderBottom: '1px solid #f0f1f3',
                gap: '15px',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px' }}>
                  {item.title}
                </strong>

                <p style={{
                  color: '#9ca3af',
                  fontSize: '11px',
                  marginTop: '5px',
                }}>
                  {item.description}
                </p>
              </div>

              <input
                type="checkbox"
                checked={item.value}
                onChange={(e) => {
                  item.setter(e.target.checked);
                  setSaved(false);
                }}
                style={{
                  width: '19px',
                  height: '19px',
                  accentColor: '#b91c1c',
                  cursor: 'pointer',
                }}
              />
            </div>
          ))}
        </section>

        {/* SAVE */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '25px',
        }}>
          <button
            type="submit"
            style={{
              background: '#991b1b',
              color: 'white',
              border: 'none',
              padding: '14px 27px',
              borderRadius: '9px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Save Preferences →
          </button>
        </div>

      </form>

      <p style={{
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '11px',
      }}>
        © 2026 BloodLink. Saving Lives Together ❤️
      </p>

    </div>
  );
}

export default UpdateAvailability;
