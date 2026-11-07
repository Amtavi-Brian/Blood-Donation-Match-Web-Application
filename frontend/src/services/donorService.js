import { apiRequest } from "./apiClient";

export function getMyDonorProfile() {
  return apiRequest("/donors/me");
}

export function createMyDonorProfile(profile) {
  return apiRequest("/donors/me", { method: "POST", body: profile });
}

export function updateMyDonorProfile(profile) {
  return apiRequest("/donors/me", { method: "PUT", body: profile });
}

export function updateMyLocation(location) {
  return apiRequest("/donors/me/location", { method: "PUT", body: location });
}

export function getMyDonations() {
  return apiRequest("/donations/me");
}

export function getMyReminders() {
  return apiRequest("/reminders/me");
}

export function createReminder(reminder) {
  return apiRequest("/reminders/", { method: "POST", body: reminder });
}

export function cancelReminder(reminderId) {
  return apiRequest(`/reminders/${reminderId}/cancel`, { method: "PATCH" });
}