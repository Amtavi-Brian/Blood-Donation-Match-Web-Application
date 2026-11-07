import { apiRequest } from "./apiClient";

export function getBloodRequests({ status, hospitalId, includeCancelled = false } = {}) {
  const query = new URLSearchParams();
  if (status) query.set("status_filter", status);
  if (hospitalId) query.set("hospital_id", hospitalId);
  if (includeCancelled) query.set("include_cancelled", "true");
  const suffix = query.size ? `?${query}` : "";
  return apiRequest(`/blood-requests/${suffix}`);
}

export function createBloodRequest(request) {
  return apiRequest("/blood-requests/", { method: "POST", body: request });
}

export function updateBloodRequest(requestId, updates) {
  return apiRequest(`/blood-requests/${requestId}`, {
    method: "PATCH",
    body: updates,
  });
}

export function updateBloodRequestStatus(requestId, status) {
  return apiRequest(`/blood-requests/${requestId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function cancelBloodRequest(requestId) {
  return apiRequest(`/blood-requests/${requestId}`, { method: "DELETE" });
}