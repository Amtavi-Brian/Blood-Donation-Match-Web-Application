import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";

export default function ProtectedRoute({ children }) {
  const { token, user } = useAuth();

  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}