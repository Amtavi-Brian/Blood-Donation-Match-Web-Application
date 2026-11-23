import { Link } from "react-router-dom";
import useAuth from "../../context/useAuth";

const ROLE_HOME = {
  donor: "/donor",
  hospital_staff: "/hospital",
  admin: "/admin",
};

export default function NotFound() {
  const { user } = useAuth();
  const homePath = (user && ROLE_HOME[user.role]) || "/";

  return (
    <main style={{
      maxWidth: 680,
      margin: "12vh auto",
      padding: 32,
      textAlign: "center",
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      fontFamily: "Inter, Segoe UI, Arial, sans-serif",
    }}>
      <p style={{
        color: "#c8102e",
        fontWeight: 800,
        fontSize: "12px",
        letterSpacing: "1.5px",
        margin: "0 0 12px",
      }}>
        BLOODLINK / 404
      </p>
      <h1 style={{
        fontSize: "36px",
        fontWeight: 800,
        color: "#0b2142",
        margin: "0 0 16px",
      }}>
        Page Not Found
      </h1>
      <p style={{
        color: "#6b7280",
        fontSize: "15px",
        lineHeight: 1.6,
        marginBottom: 28,
      }}>
        The page you are looking for doesn't exist, has been removed, or has moved to another URL.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Link
          to={homePath}
          style={{
            display: "inline-block",
            background: "#c8102e",
            color: "#fff",
            textDecoration: "none",
            padding: "12px 24px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Return to {user ? "Dashboard" : "Home"}
        </Link>
      </div>
    </main>
  );
}
