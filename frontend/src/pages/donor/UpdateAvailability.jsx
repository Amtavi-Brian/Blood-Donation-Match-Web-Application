
import { useEffect, useState } from 'react';
import { getMyDonorProfile, updateMyDonorProfile } from '../../services/donorService';

function UpdateAvailability() {
  const [availability, setAvailability] = useState(false);
  const [location, setLocation] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMyDonorProfile()
      .then((profile) => {
        if (!active) return;
        setAvailability(profile.available_to_contact);
        setLocation(profile.city || '');
        setContactConsent(profile.consent_to_contact);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load availability settings.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateMyDonorProfile({
        available_to_contact: availability,
        city: location.trim() || null,
        consent_to_contact: contactConsent,
      });
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save availability settings.');
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #cbd2dc',
    borderRadius: '14px',
    padding: '25px',
    marginBottom: '22px',
    boxShadow: '0 3px 12px rgba(31,41,55,0.04)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#263449',
    marginBottom: '9px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid #64748b',
    borderRadius: '8px',
    fontSize: '13px',
    boxSizing: 'border-box',
    color: '#172033',
    background: '#eff6ff',
  };

  return (
    <div className="donor-page" style={{
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

        <p style={{ color: '#4b5563', fontSize: '13px' }}>
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
      {error && <p role="alert" style={{ color: '#b91c1c', marginBottom: 16 }}>{error}</p>}
      {loading && <p role="status">Loading availability settings…</p>}

      <form onSubmit={handleSave}>

        {/* AVAILABILITY STATUS */}
        <section style={cardStyle}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>
            Your Availability Status
          </h2>

          <p style={{
            color: '#4b5563',
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
                color: '#4b5563',
                marginTop: '7px',
              }}>
                {availability
                  ? contactConsent
                    ? 'Hospitals may consider your profile for matching.'
                    : 'Enable contact consent below to be considered for matching.'
                  : 'You will not be considered for new donor matches.'}
              </p>
            </div>

            <button
              type="button"
              disabled={loading || saving}
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
            <label htmlFor="availability-location" style={labelStyle}>Your Current Location</label>

            <input
              id="availability-location"
              style={inputStyle}
              value={location}
              disabled={loading || saving}
              onChange={(e) => {
                setLocation(e.target.value);
                setSaved(false);
              }}
              placeholder="Enter your location"
            />
          </div>

        </section>

        {/* NOTIFICATION PREFERENCES */}
        <section style={cardStyle}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>
            Notification Preferences
          </h2>

          <p style={{
            color: '#4b5563',
            fontSize: '13px',
            marginBottom: '22px',
          }}>
            Consent to be contacted is required for hospitals to include you in donor matching.
          </p>

          {[
            {
              title: 'Allow hospitals to contact me',
              description: 'Hospitals can see your matching profile and contact details for requests.',
              value: contactConsent,
              setter: setContactConsent,
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
                  color: '#4b5563',
                  fontSize: '11px',
                  marginTop: '5px',
                }}>
                  {item.description}
                </p>
              </div>

              <input
                type="checkbox"
                checked={item.value}
                disabled={loading || saving}
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
            disabled={saving || loading}
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
            {saving ? 'Saving…' : 'Save Preferences →'}
          </button>
        </div>

      </form>

      <p style={{
        textAlign: 'center',
        color: '#4b5563',
        fontSize: '11px',
      }}>
        © 2026 BloodLink. Saving Lives Together ❤️
      </p>

    </div>
  );
}

export default UpdateAvailability;
