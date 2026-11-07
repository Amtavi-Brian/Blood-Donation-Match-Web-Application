import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    await Promise.resolve();
    setError("");
    setLoading(true);
    try {
      const [items, unread] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(items);
      setUnreadCount(unread);
    } catch (loadError) {
      setError(loadError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadNotifications(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  async function handleMarkRead(id) {
    setBusy(true);
    setError("");
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.message || "Unable to update this notification.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkAllRead() {
    setBusy(true);
    setError("");
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.message || "Unable to update notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</p>
        </div>
        <button type="button" onClick={handleMarkAllRead} disabled={busy || unreadCount === 0}>
          Mark all as read
        </button>
      </header>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {loading ? <p role="status">Loading notifications…</p> : notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : notifications.map((notification) => (
        <article key={notification.notification_id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, margin: 0 }}>{notification.title}</h2>
              <p>{notification.message}</p>
              <small>{new Date(notification.created_at).toLocaleString()}</small>
            </div>
            {!notification.is_read && (
              <button type="button" onClick={() => handleMarkRead(notification.notification_id)} disabled={busy}>
                Mark as read
              </button>
            )}
          </div>
        </article>
      ))}
    </main>
  );
}