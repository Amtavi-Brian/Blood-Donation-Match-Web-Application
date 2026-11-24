const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (
  configuredApiUrl || "https://blood-donation-match-web-application.onrender.com"
).replace(/\/+$/, "");