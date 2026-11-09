
import { useEffect, useState } from 'react';
import { getBloodRequests } from '../../services/requestService';
import { getHospitals } from '../../services/hospitalService';

function SosAlerts() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getBloodRequests({ status: 'pending' }), getHospitals()])
      .then(([requestList, hospitalList]) => {
        if (!active) return;
        const hospitalsById = new Map(hospitalList.map((hospital) => [hospital.id, hospital]));
        setHospitals(hospitalList);
        setRequests(requestList.map((request) => {
          const hospital = hospitalsById.get(request.hospital_id);
          return {
            id: request.id,
            patient: `Blood request #${request.id}`,
            bloodGroup: request.blood_group,
            hospital: hospital?.name || 'Hospital',
            location: hospital?.city || 'Location unavailable',
            phone: hospital?.contact_phone || '',
            units: request.units_needed,
            urgency: request.urgency,
            neededBy: request.needed_by ? new Date(request.needed_by).toLocaleString() : 'As soon as possible',
            description: request.notes || 'No additional details were provided.',
          };
        }));
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load current blood requests.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesFilter =
      filter === 'All' || request.urgency === filter;

    const matchesSearch =
      request.hospital.toLowerCase().includes(search.toLowerCase()) ||
      request.bloodGroup.toLowerCase().includes(search.toLowerCase()) ||
      request.location.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const criticalCount = requests.filter(
    (request) => request.urgency === 'emergency'
  ).length;

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
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '18px',
      marginBottom: '25px',
    },
    statCard: {
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#991b1b',
      margin: '8px 0',
    },
    controls: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '22px',
    },
    input: {
      flex: '1',
      minWidth: '200px',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
    },
    select: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      background: 'white',
      fontSize: '14px',
    },
    alertCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '22px',
      marginBottom: '18px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: '5px solid #b91c1c',
    },
    button: {
      padding: '11px 18px',
      border: 'none',
      borderRadius: '8px',
      background: '#991b1b',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
    },
  };

  return (
    <div className="donor-page" style={styles.page}>
      <h1 style={styles.heading}>🚨 SOS Blood Requests</h1>

      <p style={styles.subtitle}>
        View urgent blood requests and help patients in need.
        Every donation can make a difference.
      </p>

      {/* SUMMARY */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div>Active Requests</div>
          <div style={styles.statNumber}>{requests.length}</div>
          <small style={{ color: '#6b7280' }}>Available requests</small>
        </div>

        <div style={styles.statCard}>
          <div>Critical Requests</div>
          <div style={{ ...styles.statNumber, color: '#dc2626' }}>
            {criticalCount}
          </div>
          <small style={{ color: '#6b7280' }}>Require urgent attention</small>
        </div>

        <div style={styles.statCard}>
          <div>Hospitals listed</div>
          <div style={styles.statNumber}>{hospitals.length}</div>
          <small style={{ color: '#6b7280' }}>Verified hospitals</small>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div style={styles.controls}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search hospital, location or blood group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.select}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All Urgency Levels</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="routine">Routine</option>
        </select>
      </div>

      {/* REQUEST CARDS */}
      <h2 style={{ fontSize: '20px', marginBottom: '18px' }}>
        Available Blood Requests
      </h2>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {loading && <p role="status">Loading current blood requests…</p>}

      {!loading && filteredRequests.length > 0 ? (
        filteredRequests.map((request) => (
          <div key={request.id} style={styles.alertCard}>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '15px',
            }}>
              <div>
                <h3 style={{ margin: '0 0 6px' }}>
                  {request.patient}
                </h3>
                <small style={{ color: '#6b7280' }}>
                  Request #{request.id}
                </small>
              </div>

              <span style={{
                padding: '7px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                height: 'fit-content',
                background:
                  request.urgency === 'emergency'
                    ? '#fee2e2'
                    : request.urgency === 'urgent'
                      ? '#ffedd5'
                      : '#dcfce7',
                color:
                  request.urgency === 'emergency'
                    ? '#b91c1c'
                    : request.urgency === 'urgent'
                      ? '#c2410c'
                      : '#166534',
              }}>
                {request.urgency} Priority
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              marginBottom: '15px',
            }}>
              <div>
                <small style={{ color: '#6b7280' }}>Blood Group</small>
                <h2 style={{ color: '#991b1b', margin: '5px 0' }}>
                  {request.bloodGroup}
                </h2>
              </div>

              <div>
                <small style={{ color: '#6b7280' }}>Units Required</small>
                <h3 style={{ margin: '5px 0' }}>{request.units} Units</h3>
              </div>

              <div>
                <small style={{ color: '#6b7280' }}>Hospital</small>
                <h3 style={{ fontSize: '14px', margin: '5px 0' }}>
                  {request.hospital}
                </h3>
              </div>

              <div>
                <small style={{ color: '#6b7280' }}>Location</small>
                <h3 style={{ fontSize: '14px', margin: '5px 0' }}>
                  {request.location}
                </h3>
              </div>
            </div>

            <p style={{ color: '#4b5563', fontSize: '14px' }}>
              {request.description}
            </p>

            <p style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#991b1b',
            }}>
              ⏰ Needed: {request.neededBy}
            </p>

            {request.phone && (
              <a style={styles.button} href={`tel:${request.phone}`}>
                Contact {request.hospital}
              </a>
            )}

          </div>
        ))
      ) : !loading && (
        <div style={{
          background: 'white',
          padding: '35px',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#6b7280',
        }}>
          No blood requests match your search.
        </div>
      )}

      <p style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '25px',
      }}>
        These requests and hospital contact details come from verified
        hospital records. Calling a hospital does not confirm donor
        eligibility; follow the hospital's screening and compatibility checks.
      </p>
    </div>
  );
}

export default SosAlerts;
