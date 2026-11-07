import { apiRequest } from "./apiClient";

export function findDonorsForRequest(requestId) {
  return apiRequest(`/matching/requests/${requestId}/donors`);
}