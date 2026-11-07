import { apiRequest } from "./apiClient";

export function getMyHospitals() {
  return apiRequest("/hospitals/me");
}

export function getHospitals({ city, verifiedOnly = true } = {}) {
  const query = new URLSearchParams();
  if (city) query.set("city", city);
  query.set("verified_only", String(verifiedOnly));
  return apiRequest(`/hospitals/?${query}`);
}

export function getVerifiedHospitalMap({ city } = {}) {
  const query = new URLSearchParams();
  if (city) query.set("city", city);
  const suffix = query.size ? `?${query}` : "";
  return apiRequest(`/hospitals/map${suffix}`);
}

export function getHospital(hospitalId) {
  return apiRequest(`/hospitals/${hospitalId}`);
}

export function registerHospital(hospital) {
  return apiRequest("/hospitals/", { method: "POST", body: hospital });
}

export function updateHospital(hospitalId, updates) {
  return apiRequest(`/hospitals/${hospitalId}`, {
    method: "PATCH",
    body: updates,
  });
}

export function setHospitalVerification(hospitalId, isVerified) {
  const query = new URLSearchParams({ is_verified: String(isVerified) });
  return apiRequest(`/hospitals/${hospitalId}/verification?${query}`, {
    method: "PATCH",
  });
}

export function getHospitalDonorMap(hospitalId) {
  return apiRequest(`/hospitals/${hospitalId}/donors/map`);
}

export function getHospitalDonations(hospitalId) {
  return apiRequest(`/donations/hospitals/${hospitalId}`);
}

export function createHospitalDonation(hospitalId, donation) {
  return apiRequest(`/donations/hospitals/${hospitalId}`, {
    method: "POST",
    body: donation,
  });
}

export function authorizeHospitalStaff(hospitalId, userId) {
  return apiRequest(`/hospitals/${hospitalId}/staff/${userId}/authorize`, {
    method: "POST",
  });
}

export function revokeHospitalStaff(hospitalId, userId) {
  return apiRequest(`/hospitals/${hospitalId}/staff/${userId}/authorization`, {
    method: "PATCH",
  });
}