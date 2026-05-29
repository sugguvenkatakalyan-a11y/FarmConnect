import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ApprovalWaiting = () => {
  const { user, farmerStatus, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "farmer") {
      navigate("/");
      return;
    }

    if (farmerStatus === "approved") {
      navigate("/farmer/dashboard");
      return;
    }

    if (farmerStatus === "rejected") {
      navigate("/farmer/rejected");
      return;
    }

    // Animation for loading dots
    const dotInterval = setInterval(() => {
      setDots(prev => (prev + 1) % 4);
    }, 500);

    // Polling for status updates
    const statusInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.data.farmerStatus === "approved") {
          navigate("/farmer/dashboard");
        } else if (response.data.farmerStatus === "rejected") {
          navigate("/farmer/rejected");
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(statusInterval);
    };
  }, [user, farmerStatus, navigate]);

  if (!user || user.role !== "farmer") return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-cyan-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-green-100">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Approval Pending
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Your registration is under review{".".repeat(dots)}
        </p>
        <p className="text-center text-gray-500 text-sm mb-8">
          You will be notified once the admin approves or rejects your application.
        </p>

        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-8">
          <div 
            className="bg-green-600 h-2.5 rounded-full animate-pulse" 
            style={{ width: `${(dots + 1) * 25}%` }}
          ></div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Logout
        </button>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-center text-gray-600">
            Back to{" "}
            <Link
              to="/"
              className="font-medium text-green-600 hover:text-green-800 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApprovalWaiting;
