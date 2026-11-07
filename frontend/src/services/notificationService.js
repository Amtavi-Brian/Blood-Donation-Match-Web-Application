import { apiRequest } from "./apiClient";

export function getNotifications({ skip = 0, limit = 50 } = {}) {
  const query = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  return apiRequest(`/notifications/?${query}`);
}

export async function getUnreadNotificationCount() {
  const result = await apiRequest("/notifications/unread-count");
  return result.unread_count;
}

export function markNotificationRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", { method: "PATCH" });
}