
import { useCallback, useEffect, useState } from 'react';
import { cancelReminder, createReminder, getMyReminders } from '../../services/donorService';

function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reminderForm, setReminderForm] = useState({
    title: '',
    scheduled_at: '',
  });

  const loadReminders = useCallback(async () => {
    await Promise.resolve();
    setError('');
    try {
      setReminders(await getMyReminders());
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your reminders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadReminders(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReminders]);

  const toggleReminder = async (id) => {
    setBusy(true);
    setError('');
    try {
      await cancelReminder(id);
      await loadReminders();
    } catch (cancelError) {
      setError(cancelError.message || 'Unable to cancel this reminder.');
    } finally {
      setBusy(false);
    }
  };

  const completedCount = reminders.filter(
    (reminder) => reminder.status === 'sent'
  ).length;

  const pendingCount = reminders.filter(
    (reminder) => reminder.status === 'pending'
  ).length;

  const addReminder = async (event) => {
    event.preventDefault();
    if (new Date(reminderForm.scheduled_at) <= new Date()) {
      setError('Choose a future date and time for your reminder.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await createReminder({
        title: reminderForm.title.trim(),
        message: 'Personal reminder added by you.',
        reminder_type: 'personal',
        scheduled_at: new Date(reminderForm.scheduled_at).toISOString(),
      });
      setReminderForm({
        title: '',
        scheduled_at: '',
      });
      setNotice('Reminder saved to your account.');
      await loadReminders();
    } catch (createError) {
      setError(createError.message || 'Unable to create this reminder.');
    } finally {
      setBusy(false);
    }
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
    <div className="donor-page" style={styles.page}>
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

      <div style={{ ...styles.card, marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>Reminder delivery</h3>
        <small style={{ color: '#6b7280' }}>
          Reminders are saved to your account. Email delivery requires the backend email service to be configured.
        </small>
      </div>

      {/* REMINDER LIST */}
      <form onSubmit={addReminder} style={{ ...styles.card, marginBottom: '22px' }}>
        <h2 style={{ marginTop: 0 }}>Add a personal reminder</h2>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Choose a future date and time. The reminder will be stored in your account.
        </p>
        <div className="donor-reminder-form">
          <label>
            Reminder title
            <input
              required
              minLength="3"
              maxLength="150"
              value={reminderForm.title}
              onChange={(event) => setReminderForm((current) => ({
                ...current,
                title: event.target.value,
              }))}
              disabled={busy}
              placeholder="For example, check donation eligibility"
            />
          </label>
          <label>
            Date and time
            <input
              type="datetime-local"
              required
              value={reminderForm.scheduled_at}
              onChange={(event) => setReminderForm((current) => ({
                ...current,
                scheduled_at: event.target.value,
              }))}
              disabled={busy}
            />
          </label>
          <button type="submit" style={styles.button} disabled={busy || loading}>
            {busy ? 'Saving…' : 'Add reminder'}
          </button>
        </div>
      </form>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {notice && <p role="status" style={{ color: '#15803d' }}>{notice}</p>}
      {loading && <p role="status">Loading reminders…</p>}
      <h2>Your Reminders</h2>

      {!loading && reminders.map((reminder) => (
        <div key={reminder.reminder_id} style={{
          ...styles.reminder,
          opacity: reminder.status === 'cancelled' ? 0.65 : 1,
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
                textDecoration: reminder.status === 'cancelled'
                  ? 'line-through'
                  : 'none',
              }}>
                {reminder.title}
              </h3>

              <span style={{
                background: reminder.status === 'pending' ? '#fee2e2' : '#dcfce7',
                color: reminder.status === 'pending' ? '#991b1b' : '#166534',
                padding: '5px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600',
              }}>
                {reminder.status}
              </span>
            </div>

            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              {reminder.message}
            </p>

            <small style={{ color: '#991b1b', fontWeight: '600' }}>
              📅 {new Date(reminder.scheduled_at).toLocaleString()} · {reminder.reminder_type}
            </small>
          </div>

          <button
            style={{
              ...styles.button,
              background: reminder.status !== 'pending' ? '#6b7280' : '#166534',
            }}
            onClick={() => toggleReminder(reminder.reminder_id)}
            disabled={busy || reminder.status !== 'pending'}
          >
            {reminder.status === 'pending' ? 'Cancel reminder' : reminder.status}
          </button>
        </div>
      ))}

      <p style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '20px',
      }}>
        Only pending reminders can be cancelled.
      </p>
    </div>
  );
}

export default Reminders;
