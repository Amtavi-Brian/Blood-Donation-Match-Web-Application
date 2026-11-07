import { apiRequest } from "./apiClient";

export async function loginUser({ email, password }) {
  const tokenResponse = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const user = await apiRequest("/users/me", {
    token: tokenResponse.access_token,
  });

  return { token: tokenResponse.access_token, user };
}

export function registerUser({
  fullName,
  phone,
  email,
  password,
  bloodType,
  location,
}) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: {
      full_name: fullName,
      phone_number: phone,
      email,
      password,
      blood_group: bloodType,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      consent_to_share_location: Boolean(location),
    },
  });
}

export function verifyEmail(email, otp) {
  return apiRequest("/auth/verify-email", {
    method: "POST",
    body: { email, otp },
  });
}

export function resendVerificationOtp(email) {
  return apiRequest("/auth/resend-otp", {
    method: "POST",
    body: { email },
  });
}

export function getCurrentUser(token) {
  return apiRequest("/users/me", { token });
}