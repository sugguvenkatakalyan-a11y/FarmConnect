import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./auth/Login";
import Register from "./auth/Register";
import RegisterFarmer from "./auth/RegisterFarmer";
import AdminDashboard from "./admin/AdminDashboard";
import FarmerDashboard from "./farmer/FarmerDashboard";
import CustomerDashboard from "./customer/CustomerDashboard";
import CustomerProfile from "./customer/CustomerProfile";
import ApprovalWaiting from "./admin/ApprovalWaiting";
import Rejected from "./admin/Rejected";
import PrivateRoute from "./auth/PrivateRoute";
import ErrorBoundary from "./auth/ErrorBoundary";
import CartPage from "./customer/CartPage";
import Home from "./customer/HomePage";
import CropDetailPage from "./customer/CropDetailPage";
import "./App.css"; // Assuming you have a CSS file for global styles

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/customer/home" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-farmer" element={<RegisterFarmer />} />
            <Route
              path="/admin/dashboard/*" // It's good practice to add /* here too if AdminDashboard has nested routes
              element={
                <PrivateRoute roles={["admin"]}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/farmer/dashboard/*" // <-- The fix is here
              element={
                <PrivateRoute roles={["farmer"]} requireApproved={true}>
                  <FarmerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer/dashboard/*"
              element={
                <PrivateRoute roles={["customer"]}>
                  <CustomerDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route path="/crop/:cropId" element={<CropDetailPage />} />

            <Route
              path="/farmer/approval-waiting"
              element={
                <PrivateRoute roles={["farmer"]}>
                  <ApprovalWaiting />
                </PrivateRoute>
              }
            />
            <Route
              path="/farmer/rejected"
              element={
                <PrivateRoute roles={["farmer"]}>
                  <Rejected />
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
