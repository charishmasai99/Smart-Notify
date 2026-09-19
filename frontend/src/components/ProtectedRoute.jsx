import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const {
    token,
    currentUser,
  } = useAuth();

  if (!token) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    currentUser &&
    !allowedRoles.includes(
      currentUser.role
    )
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}
