import { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import FarmerRegistrations from "./FarmerRegistrations";
import FarmersPanel from "./FarmerPanel";
import CropsPanel from "./CropPanel";
import CustomersPanel from "./CustomersPanel";
import PurchasesPanel from "./PurchasesPanel";
import {
  ClipboardDocumentIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  UserIcon,
  ShoppingCartIcon,
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckBadgeIcon,
  ClockIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  ClipboardDocumentIcon as ClipboardDocumentSolid,
  UserGroupIcon as UserGroupSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  UserIcon as UserSolid,
  ShoppingCartIcon as ShoppingCartSolid,
  ChartBarIcon as ChartBarSolid,
} from "@heroicons/react/24/solid";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      fetchDashboardData();
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      showNotification("Failed to load dashboard data", "error");
      setLoading(false);

      // Set empty data structure to prevent crashes
      setDashboardData({
        totalFarmers: 0,
        totalCustomers: 0,
        totalCrops: 0,
        totalPurchases: 0,
        pendingRegistrations: 0,
        revenue: {
          currentMonth: 0,
          previousMonth: 0,
          change: 0,
        },
        recentActivities: [],
        stats: [
          { name: "Active Farmers", value: "0", change: 0, positive: true },
          { name: "Avg. Order Value", value: "₹0", change: 0, positive: true },
          { name: "Pending Actions", value: "0", change: 0, positive: false },
        ],
      });
    }
  };

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  if (!user || user.role !== "admin") return null;

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: ChartBarIcon,
      activeIcon: ChartBarSolid,
    },
    {
      id: "registrations",
      label: "Registrations",
      icon: ClipboardDocumentIcon,
      activeIcon: ClipboardDocumentSolid,
    },
    {
      id: "farmers",
      label: "Farmers",
      icon: UserGroupIcon,
      activeIcon: UserGroupSolid,
    },
    {
      id: "crops",
      label: "Crops",
      icon: ShoppingBagIcon,
      activeIcon: ShoppingBagSolid,
    },
    {
      id: "customers",
      label: "Customers",
      icon: UserIcon,
      activeIcon: UserSolid,
    },
    {
      id: "purchases",
      label: "Purchases",
      icon: ShoppingCartIcon,
      activeIcon: ShoppingCartSolid,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview data={dashboardData} loading={loading} />;
      case "registrations":
        return <FarmerRegistrations showNotification={showNotification} />;
      case "farmers":
        return <FarmersPanel showNotification={showNotification} />;
      case "crops":
        return <CropsPanel showNotification={showNotification} />;
      case "customers":
        return <CustomersPanel showNotification={showNotification} />;
      case "purchases":
        return <PurchasesPanel showNotification={showNotification} />;
      default:
        return <DashboardOverview data={dashboardData} loading={loading} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 overflow-hidden">
      {/* Animated Notification */}
      {notification.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-medium transition-all duration-500 transform ${
            notification.type === "success" ? "bg-emerald-500" : "bg-rose-500"
          } ${
            notification.show
              ? "translate-x-0 opacity-100 scale-100"
              : "translate-x-full opacity-0 scale-95"
          }`}
        >
          <div className="flex items-center">
            <div className="mr-3">
              {notification.type === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 shadow-2xl border-b border-white/20 backdrop-blur-sm relative z-50">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 mr-4 shadow-xl">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    FarmConnect
                  </h1>
                  <p className="text-indigo-100 text-sm font-medium">
                    Administrator Dashboard
                  </p>
                </div>
              </div>

              <div className="lg:hidden flex items-center space-x-3">
                {/* Mobile navigation items removed */}
              </div>
            </div>

            <div className="flex items-center mt-4 lg:mt-0 space-x-4">
              <div className="relative user-dropdown z-[9999]">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl py-2 pl-2 pr-4 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-white font-bold border border-white/30 shadow-lg">
                    {user.name
                      ? user.name.charAt(0)
                      : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-white text-sm truncate max-w-[140px]">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-indigo-100 font-medium">
                      System Administrator
                    </p>
                  </div>
                  <ChevronDownIcon className={`w-5 h-5 ml-2 text-white transition-transform duration-200 ${
                    showUserDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="fixed top-20 right-6 w-56 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/50 py-2 z-[9999] animate-in slide-in-from-top-5 duration-200">
                    <div className="px-4 py-3 border-b border-gray-200/50">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 group"
                      >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="mt-6 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = activeTab === tab.id ? tab.activeIcon : tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-700 shadow-lg shadow-white/20 border border-white/30"
                      : "text-indigo-100 hover:bg-white/10 hover:text-white backdrop-blur-sm border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 ${
                      activeTab === tab.id
                        ? "text-indigo-600"
                        : "text-indigo-200"
                    }`}
                  />
                  {tab.label}
                  {tab.id === "registrations" && (
                    <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                      New
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area - Full Height */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar bg-gradient-to-br from-gray-50/80 to-white/50 backdrop-blur-sm">
          <div className="p-6 h-full">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden">
              <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-indigo-600 absolute top-0 left-0"></div>
        </div>
        <span className="mt-6 text-gray-600 font-medium text-lg">
          Loading dashboard analytics...
        </span>
        <span className="mt-2 text-gray-400 text-sm">
          Please wait while we fetch your data
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 h-full flex flex-col justify-center">
        <div className="mx-auto w-32 h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Failed to load dashboard data
        </h3>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          Unable to retrieve dashboard information. Please try refreshing the
          page or contact support if the issue persists.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 mx-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          Refresh Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full overflow-y-auto custom-scrollbar">
      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Farmers"
          value={data.totalFarmers}
          icon={UserGroupSolid}
          iconColor="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600"
          trend={12.5}
          subtitle="Active farmers"
        />
        <StatCard
          title="Total Customers"
          value={data.totalCustomers}
          icon={UserSolid}
          iconColor="bg-gradient-to-br from-green-100 to-green-200 text-green-600"
          trend={8.3}
          subtitle="Registered customers"
        />
        <StatCard
          title="Total Crops"
          value={data.totalCrops}
          icon={ShoppingBagSolid}
          iconColor="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600"
          trend={4.7}
          subtitle="Listed crops"
        />
        <StatCard
          title="Total Purchases"
          value={data.totalPurchases}
          icon={ShoppingCartSolid}
          iconColor="bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600"
          trend={18.2}
          subtitle="Completed orders"
        />
      </div>

      {/* Revenue and Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-100">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Revenue</h3>
              <p className="text-sm text-gray-500">Current month</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-1 flex items-center">
              <CalendarIcon className="w-4 h-4 text-gray-500 mr-1" />
              <span className="text-sm text-gray-700">June 2023</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline">
              <CurrencyRupeeIcon className="w-6 h-6 text-gray-700" />
              <span className="text-3xl font-bold text-gray-900 ml-1">
                {data.revenue.currentMonth.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-2 flex items-center">
              {data.revenue.change > 0 ? (
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
              )}
              <span
                className={`ml-1 font-medium ${
                  data.revenue.change > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {data.revenue.change}% from last month
              </span>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg p-4 border border-cyan-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Pending Registrations
                </h4>
                <p className="text-xs text-gray-500">Require your approval</p>
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {data.pendingRegistrations}
                </span>
                <button className="ml-3 bg-cyan-600 text-white rounded-lg px-3 py-1 text-sm font-medium hover:bg-cyan-700 transition-colors">
                  Review
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-6">
          {data.stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-700">{stat.name}</h3>
                <div className="bg-gray-100 rounded-lg px-2 py-1">
                  {stat.positive ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </span>
                <span
                  className={`ml-2 text-sm font-medium ${
                    stat.positive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.positive ? "+" : ""}
                  {stat.change}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 flex">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-teal-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.user}{" "}
                  <span className="font-normal text-gray-600">
                    {activity.action}
                  </span>
                </p>
                {activity.amount && (
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.amount}
                  </p>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="w-4 h-4 mr-1" />
                {activity.time}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button className="text-cyan-600 hover:text-cyan-700 font-medium text-sm">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stat Card Component
const StatCard = ({ title, value, icon: Icon, iconColor, trend, subtitle }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className={`p-3 rounded-xl ${iconColor} shadow-md group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-bold text-gray-900 tracking-tight">
          {value.toLocaleString()}
        </span>
        <div className="flex items-center">
          <span
            className={`text-sm font-semibold flex items-center px-2 py-1 rounded-full ${
              trend > 0
                ? "text-green-700 bg-green-100"
                : "text-red-700 bg-red-100"
            }`}
          >
            {trend > 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
            )}
            {Math.abs(trend)}%
          </span>
        </div>
      </div>
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(trend * 2, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
