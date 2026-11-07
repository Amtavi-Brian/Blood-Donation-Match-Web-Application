import { API_BASE_URL } from "../config/env";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getErrorMessage(detail, status) {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || "Invalid input").join(" ");
  }

  return `Request failed with status ${status}.`;
}

export async function apiRequest(path, { body, token, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  const accessToken = token ?? localStorage.getItem("token");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (response.status === 204) return null;

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(responseBody?.detail, response.status),
      response.status,
    );
  }

  return responseBody;
}