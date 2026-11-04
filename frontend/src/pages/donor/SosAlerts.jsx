
import { useState } from 'react';

function SosAlerts() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [responded, setResponded] = useState([]);

  // Sample SOS requests - temporary until backend integration
  const [requests] = useState([
    {
      id: 1,
      patient: 'Emergency Patient #001',
      bloodGroup: 'O+',
      hospital: 'Kenyatta National Hospital',
      location: 'Nairobi',
      units: 2,
      urgency: 'Critical',
      neededBy: 'Today',
      description: 'Urgent blood needed for an emergency patient.',
    },
    {
      id: 2,
      patient: 'Emergency Patient #002',
      bloodGroup: 'A+',
      hospital: 'Nairobi Hospital',
      location: 'Nairobi',
      units: 1,
      urgency: 'High',
      neededBy: 'Tomorrow',
      description: 'Blood required for a scheduled medical procedure.',
    },
    {
      id: 3,
      patient: 'Emergency Patient #003',
      bloodGroup: 'O-',
      hospital: 'Aga Khan University Hospital',
      location: 'Nairobi',
      units: 3,
      urgency: 'Critical',
      neededBy: 'Today',
      description: 'Urgent request for a patient requiring blood transfusion.',
    },
    {
      id: 4,
      patient: 'Emergency Patient #004',
      bloodGroup: 'B+',
      hospital: 'MP Shah Hospital',
      location: 'Nairobi',
      units: 2,
      urgency: 'Normal',
      neededBy: 'Within 3 days',
      description: 'Blood donation requested for patient treatment.',
    },
  ]);

  const handleResponse = (id) => {
    setResponded((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

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
    (request) => request.urgency === 'Critical'
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
    <div style={styles.page}>
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
          <div>Your Responses</div>
          <div style={styles.statNumber}>{responded.length}</div>
          <small style={{ color: '#6b7280' }}>Requests you've responded to</small>
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
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
        </select>
      </div>

      {/* REQUEST CARDS */}
      <h2 style={{ fontSize: '20px', marginBottom: '18px' }}>
        Available Blood Requests
      </h2>

      {filteredRequests.length > 0 ? (
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
                  request.urgency === 'Critical'
                    ? '#fee2e2'
                    : request.urgency === 'High'
                      ? '#ffedd5'
                      : '#dcfce7',
                color:
                  request.urgency === 'Critical'
                    ? '#b91c1c'
                    : request.urgency === 'High'
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

            <button
              style={{
                ...styles.button,
                background: responded.includes(request.id)
                  ? '#166534'
                  : '#991b1b',
              }}
              onClick={() => handleResponse(request.id)}
            >
              {responded.includes(request.id)
                ? '✓ Interest Recorded'
                : 'I Can Donate'}
            </button>

          </div>
        ))
      ) : (
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
        Demo data only. Responding records your interest locally;
        it does not contact a hospital or confirm donor eligibility.
        Always follow the hospital's screening and compatibility checks.
      </p>
    </div>
  );
}

export default SosAlerts;
