
import { useState } from 'react';

function Reminders() {
  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: 'Next Donation Eligibility',
      description: 'Check whether you are eligible to donate blood again.',
      date: '2027-01-20',
      type: 'Eligibility',
      completed: false,
    },
    {
      id: 2,
      title: 'Update Donor Profile',
      description: 'Review your contact details and availability.',
      date: '2026-11-10',
      type: 'Profile',
      completed: false,
    },
    {
      id: 3,
      title: 'Blood Donation Awareness',
      description: 'Remember that your donation can help save lives.',
      date: '2026-11-15',
      type: 'Awareness',
      completed: false,
    },
  ]);

  const [notifications, setNotifications] = useState(true);

  const toggleReminder = (id) => {
    setReminders((previous) =>
      previous.map((reminder) =>
        reminder.id === id
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    );
  };

  const completedCount = reminders.filter(
    (reminder) => reminder.completed
  ).length;

  const pendingCount = reminders.length - completedCount;

  const addReminder = () => {
    const title = prompt('Enter reminder title:');

    if (!title || !title.trim()) return;

    const date = prompt('Enter reminder date (YYYY-MM-DD):');

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      alert('Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    setReminders((previous) => [
      ...previous,
      {
        id: Date.now(),
        title: title.trim(),
        description: 'Personal reminder added by you.',
        date,
        type: 'Personal',
        completed: false,
      },
    ]);
  };

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
    card: {
      background: 'white',
      padding: '22px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    number: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#991b1b',
      margin: '8px 0',
    },
    reminder: {
      background: 'white',
      padding: '22px',
      borderRadius: '12px',
      marginBottom: '15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
    },
    button: {
      background: '#991b1b',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '11px 17px',
      cursor: 'pointer',
      fontWeight: '600',
    },
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>🔔 My Reminders</h1>

      <p style={styles.subtitle}>
        Stay informed about important donation dates and activities.
      </p>

      {/* SUMMARY */}
      <div style={styles.stats}>
        <div style={styles.card}>
          Total Reminders
          <div style={styles.number}>{reminders.length}</div>
        </div>

        <div style={styles.card}>
          Pending Reminders
          <div style={styles.number}>{pendingCount}</div>
        </div>

        <div style={styles.card}>
          Completed Reminders
          <div style={{ ...styles.number, color: '#15803d' }}>
            {completedCount}
          </div>
        </div>
      </div>

      {/* NOTIFICATION SETTINGS */}
      <div style={{ ...styles.card, marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>Notification Preferences</h3>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />

          <span>
            Receive donation reminder notifications
          </span>
        </label>

        <small style={{ color: '#6b7280' }}>
          {notifications
            ? 'Notifications are enabled in this demo.'
            : 'Notifications are switched off in this demo.'}
        </small>
      </div>

      {/* REMINDER LIST */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px',
      }}>
        <h2 style={{ fontSize: '20px' }}>Your Reminders</h2>

        <button style={styles.button} onClick={addReminder}>
          + Add Reminder
        </button>
      </div>

      {reminders.map((reminder) => (
        <div key={reminder.id} style={{
          ...styles.reminder,
          opacity: reminder.completed ? 0.65 : 1,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}>
              <h3 style={{
                margin: '0 0 8px',
                textDecoration: reminder.completed
                  ? 'line-through'
                  : 'none',
              }}>
                {reminder.title}
              </h3>

              <span style={{
                background: reminder.completed ? '#dcfce7' : '#fee2e2',
                color: reminder.completed ? '#166534' : '#991b1b',
                padding: '5px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600',
              }}>
                {reminder.completed ? 'Completed' : 'Pending'}
              </span>
            </div>

            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              {reminder.description}
            </p>

            <small style={{ color: '#991b1b', fontWeight: '600' }}>
              📅 {reminder.date} · {reminder.type}
            </small>
          </div>

          <button
            style={{
              ...styles.button,
              background: reminder.completed ? '#6b7280' : '#166534',
            }}
            onClick={() => toggleReminder(reminder.id)}
          >
            {reminder.completed
              ? 'Undo'
              : 'Mark Completed'}
          </button>
        </div>
      ))}

      <p style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '20px',
      }}>
        Demo reminder data. Notifications and reminders are not yet
        connected to the backend.
      </p>
    </div>
  );
}

export default Reminders;
