import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import ProtectedRoute from "./ProtectedRoute";

export default function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {allowedRoles.includes(user?.role) ? (
        children
      ) : (
        <Navigate to="/" replace />
      )}
    </ProtectedRoute>
  );
}