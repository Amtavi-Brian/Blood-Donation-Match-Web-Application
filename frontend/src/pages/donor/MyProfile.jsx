
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/authService';
import { getMyDonorProfile, updateMyDonorProfile } from '../../services/donorService';

function MyProfile() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedProfile, setSavedProfile] = useState(null);

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    bloodGroup: '',
    location: '',
    availability: 'Unavailable',
    verified: '',
  });

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentUser(), getMyDonorProfile()])
      .then(([user, donor]) => {
        if (!active) return;
        const loadedProfile = {
          fullName: user.full_name,
          email: user.email,
          phone: user.phone_number || '',
          bloodGroup: donor.blood_group,
          location: donor.city || '',
          availability: donor.available_to_contact ? 'Available' : 'Unavailable',
          verified: user.is_email_verified ? 'Email verified' : 'Email not verified',
        };
        setProfile(loadedProfile);
        setSavedProfile(loadedProfile);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load your profile.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const donor = await updateMyDonorProfile({
        blood_group: profile.bloodGroup,
        city: profile.location || null,
        available_to_contact: profile.availability === 'Available',
      });
      setProfile((current) => ({
        ...current,
        bloodGroup: donor.blood_group,
        location: donor.city || '',
        availability: donor.available_to_contact ? 'Available' : 'Unavailable',
      }));
      setSavedProfile((current) => ({
        ...current,
        bloodGroup: donor.blood_group,
        location: donor.city || '',
        availability: donor.available_to_contact ? 'Available' : 'Unavailable',
      }));
      setEditing(false);
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (isEditable) => ({
    width: '100%',
    minHeight: '44px',
    padding: '10px 12px',
    border: `2px solid ${isEditable ? '#64748b' : '#a1aab8'}`,
    borderRadius: '8px',
    fontSize: '13px',
    boxSizing: 'border-box',
    background: isEditable ? '#eff6ff' : '#e9edf2',
    color: '#172033',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#263449',
    marginBottom: '8px',
  };

  const fieldStyle = {
    marginBottom: '12px',
  };

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #cbd2dc',
    borderRadius: '14px',
    padding: '25px',
    boxShadow: '0 3px 12px rgba(31,41,55,0.04)',
    marginBottom: '22px',
  };

  const field = (label, name, type = 'text') => (
    <div style={fieldStyle}>
      <label htmlFor={`profile-${name}`} style={labelStyle}>{label}</label>
      <input
        id={`profile-${name}`}
        type={type}
        name={name}
        value={profile[name]}
        onChange={handleChange}
        disabled={!editing || saving || !['location'].includes(name)}
        style={inputStyle(editing && name === 'location')}
        required={name !== 'location'}
      />
    </div>
  );

  return (
    <div className="donor-page" style={{
      minHeight: '100vh',
      background: '#f8f9fc',
      padding: '30px',
      color: '#172033',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    }}>

      {/* PAGE HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '15px',
      }}>
        <div>
          <p style={{
            color: '#b91c1c',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1px',
          }}>
            DONOR PORTAL / MY PROFILE
          </p>
          <h1 style={{ fontSize: '28px', margin: '8px 0' }}>
            My Profile
          </h1>
          <p style={{ color: '#4b5563', fontSize: '13px' }}>
            Manage your personal information and donor details.
          </p>
        </div>

      {loading && <p role="status">Loading your profile…</p>}
      {error && <p role="alert" style={{ color: '#b91c1c', marginBottom: 16 }}>{error}</p>}

        <button
          type="button"
          disabled={loading || saving}
          onClick={() => {
            if (editing) {
              setProfile(savedProfile);
              setEditing(false);
              setSaved(false);
            } else {
              setEditing(true);
            }
          }}
          style={{
            background: editing ? '#374151' : '#b91c1c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {editing ? 'Cancel Editing' : '✎ Edit Profile'}
        </button>
      </div>

      {/* PROFILE SUMMARY */}
      <div style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: '75px',
          height: '75px',
          borderRadius: '50%',
          background: '#fee2e2',
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '25px',
          fontWeight: '700',
        }}>
          {profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '21px' }}>
            {profile.fullName}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            {profile.email}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#dcfce7',
              color: '#15803d',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
            }}>
              ✓ {profile.verified}
            </span>

            <span style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
            }}>
              🩸 {profile.bloodGroup}
            </span>
          </div>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {saved && (
        <div style={{
          background: '#dcfce7',
          color: '#166534',
          padding: '13px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
        }}>
          ✓ Your profile changes have been saved successfully!
        </div>
      )}

      {/* PROFILE FORM */}
      <form onSubmit={handleSave}>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '17px', marginBottom: '8px' }}>
            Personal Information
          </h2>
          <p style={{ color: '#4b5563', fontSize: '12px', marginBottom: '25px' }}>
            Your basic personal details.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px 25px',
          }}>
            {field('Full Name', 'fullName')}
            {field('Email Address', 'email', 'email')}
            {field('Phone Number', 'phone', 'tel')}
            {field('Location', 'location')}
          </div>
        </div>

        {/* DONOR INFORMATION */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '17px', marginBottom: '8px' }}>
            Donor Information
          </h2>
          <p style={{ color: '#4b5563', fontSize: '12px', marginBottom: '25px' }}>
            Your blood donation information.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px 25px',
          }}>
            <div style={fieldStyle}>
              <label htmlFor="profile-blood-group" style={labelStyle}>Blood Group</label>
              <select
                id="profile-blood-group"
                name="bloodGroup"
                value={profile.bloodGroup}
                onChange={handleChange}
                disabled={!editing || saving}
                style={inputStyle(editing)}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                  <option key={group}>{group}</option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="profile-availability" style={labelStyle}>Donor Availability</label>
              <select
                id="profile-availability"
                name="availability"
                value={profile.availability}
                onChange={handleChange}
                disabled={!editing || saving}
                style={inputStyle(editing)}
              >
                <option>Available</option>
                <option>Unavailable</option>
              </select>
            </div>
          </div>

          <div style={{
            padding: '15px',
            background: '#fff7ed',
            borderRadius: '9px',
            color: '#9a3412',
            fontSize: '12px',
          }}>
            🩸 Your blood group is important for accurate donor matching.
            Please ensure that your information is correct.
          </div>
        </div>

        {/* SAVE BUTTON */}
        {editing && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginBottom: '25px',
          }}>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setProfile(savedProfile);
                setEditing(false);
                setSaved(false);
              }}
              style={{
                padding: '12px 20px',
                border: '2px solid #64748b',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loading}
              style={{
                padding: '12px 25px',
                border: 'none',
                borderRadius: '8px',
                background: '#b91c1c',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

      </form>

      <p style={{
        textAlign: 'center',
        color: '#4b5563',
        fontSize: '11px',
        marginTop: '30px',
      }}>
        © 2026 BloodLink. Saving Lives Together ❤️
      </p>

    </div>
  );
}

export default MyProfile;
