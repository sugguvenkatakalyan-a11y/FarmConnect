import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PurchasesPanel = ({ showNotification }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cropImages, setCropImages] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "descending",
  });

  useEffect(() => {
    const fetchCropImages = async () => {
      try {
        const response = await fetch("/api.json");
        const crops = await response.json();
        const imageMap = {};
        crops.forEach((crop) => {
          // Create case-insensitive mapping
          imageMap[crop.name.toLowerCase()] = crop.image;
        });
        setCropImages(imageMap);
      } catch (error) {
        console.error("Failed to load crop images:", error);
      }
    };

    fetchCropImages();
  }, []);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/admin/purchases`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setPurchases(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        showNotification("Failed to load purchases", "error");
      }
    };

    fetchPurchases();
  }, []);

  // Function to get crop image by name
  const getCropImage = (cropName) => {
    if (!cropName) return null;
    return cropImages[cropName.toLowerCase()] || null;
  };

  // Apply sorting
  const sortedPurchases = [...purchases].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  // Apply filtering
  const filteredPurchases =
    statusFilter === "all"
      ? sortedPurchases
      : sortedPurchases.filter((p) => p.status === statusFilter);

  // Get current purchases for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredPurchases.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSortIndicator = (columnName) => {
    if (sortConfig.key !== columnName) return null;
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        <span className="ml-4 text-gray-600">Loading purchases...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Purchase Transactions
          </h2>
          <p className="text-gray-600">Monitor and manage customer purchases</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4 md:mt-0">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="bg-cyan-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-semibold">
                {Math.min(indexOfFirstItem + 1, filteredPurchases.length)}
              </span>{" "}
              -
              <span className="font-semibold">
                {" "}
                {Math.min(indexOfLastItem, filteredPurchases.length)}
              </span>{" "}
              of
              <span className="font-semibold">
                {" "}
                {filteredPurchases.length}
              </span>{" "}
              purchases
            </span>
          </div>
        </div>
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
          <div className="mx-auto w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-cyan-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No purchases found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {statusFilter === "all"
              ? "There are no purchase records yet. Purchases will appear here once customers make orders."
              : `No purchases with status "${statusFilter}" found.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort("cropName")}
                >
                  <div className="flex items-center">
                    Crop
                    <span className="ml-1">{getSortIndicator("cropName")}</span>
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort("createdAt")}
                >
                  <div className="flex items-center">
                    Date
                    <span className="ml-1">
                      {getSortIndicator("createdAt")}
                    </span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    <span className="ml-1">{getSortIndicator("status")}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPurchases
                .filter((purchase) => purchase && purchase._id) // Filter out invalid purchases
                .map((purchase) => (
                  <tr
                    key={purchase._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg mr-3 overflow-hidden">
                          {getCropImage(purchase.cropName) ? (
                            <img
                              src={getCropImage(purchase.cropName)}
                              alt={purchase.cropName}
                              className="h-10 w-10 object-cover rounded-lg"
                              onError={(e) => {
                                // Fallback to default icon if image fails to load
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`h-10 w-10 bg-cyan-100 rounded-lg flex items-center justify-center ${
                              getCropImage(purchase.cropName) ? "hidden" : ""
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-cyan-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                              />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {purchase.cropName || "Unknown Crop"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {purchase._id?.slice(-6) || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {purchase.createdAt
                          ? new Date(purchase.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "No date"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {purchase.createdAt
                          ? new Date(purchase.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "No time"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-medium text-sm mr-2">
                          {purchase.farmerId?.name?.charAt(0) ||
                            purchase.farmerId?.email?.charAt(0) ||
                            "F"}
                        </div>
                        <div>
                          <div className="text-sm text-gray-900 font-medium">
                            {purchase.farmerId?.name || "Unknown Farmer"}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {purchase.farmerId?.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-medium text-sm mr-2">
                          {purchase.customerId?.name?.charAt(0) ||
                            purchase.customerId?.email?.charAt(0) ||
                            "C"}
                        </div>
                        <div>
                          <div className="text-sm text-gray-900 font-medium">
                            {purchase.customerId?.name || "Unknown Customer"}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {purchase.customerId?.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {purchase.quantity || 0} {purchase.unit || "units"} × ₹
                        {purchase.totalPrice && purchase.quantity
                          ? (purchase.totalPrice / purchase.quantity).toFixed(2)
                          : "0.00"}
                      </div>
                      <div className="text-sm text-gray-900 font-semibold">
                        Total: ₹{purchase.totalPrice?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          purchase.status || "unknown"
                        )}`}
                      >
                        {purchase.status
                          ? purchase.status.charAt(0).toUpperCase() +
                            purchase.status.slice(1)
                          : "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredPurchases.length > itemsPerPage && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Showing{" "}
            <span className="font-medium">
              {Math.min(indexOfFirstItem + 1, filteredPurchases.length)}
            </span>{" "}
            to
            <span className="font-medium">
              {" "}
              {Math.min(indexOfLastItem, filteredPurchases.length)}
            </span>{" "}
            of
            <span className="font-medium">
              {" "}
              {filteredPurchases.length}
            </span>{" "}
            results
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Previous
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Calculate page number considering current page position
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    currentPage === pageNumber
                      ? "bg-cyan-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Ellipsis for many pages */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-2 py-1.5 text-gray-500">...</span>
            )}

            {/* Last page if not shown */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => paginate(totalPages)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  currentPage === totalPages
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesPanel;
