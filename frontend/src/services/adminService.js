import { apiRequest } from "./apiClient";

export function getUsers({ skip = 0, limit = 100 } = {}) {
  const query = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  return apiRequest(`/admin/users?${query}`);
}

export function updateUserActivation(userId, isActive) {
  return apiRequest(`/admin/users/${userId}/activation`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

export function createHospitalStaffAccount(staff) {
  return apiRequest("/admin/hospital-staff", { method: "POST", body: staff });
}

export function getAuditLogs({ skip = 0, limit = 50 } = {}) {
  const query = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  return apiRequest(`/audit/?${query}`);
}