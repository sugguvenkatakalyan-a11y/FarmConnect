import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  console.log(
    "PrivateRoute - user:",
    user,
    "loading:",
    loading,
    "required roles:",
    roles
  ); // Debug log

  if (loading) {
    console.log("PrivateRoute - Still loading"); // Debug log
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <svg
          className="animate-spin h-8 w-8 text-green-500"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (!user || (roles && !roles.includes(user.role))) {
    console.log("PrivateRoute - Access denied, redirecting to login"); // Debug log
    return <Navigate to="/" />;
  }

  console.log("PrivateRoute - Access granted"); // Debug log
  return children;
};

export default PrivateRoute;
