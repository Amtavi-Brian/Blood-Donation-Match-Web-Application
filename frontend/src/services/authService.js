const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Test: any email + password "password123".
// Emails starting with "hospital" or "admin" log in as those roles.
export async function loginUser({ email, password }) {
  await wait(700);
  if (password !== "password123") throw new Error("Wrong email or password.");

  let role = "donor";
  if (email.startsWith("hospital")) role = "hospital";
  if (email.startsWith("admin")) role = "admin";

  return { token: "fake-token", user: { email, role } };
}

// Test the error with taken@example.com
export async function registerUser(data) {
  await wait(700);
  if (data.email === "taken@example.com") throw new Error("That email is already registered.");
  return { id: 1, email: data.email, role: "donor" };
}