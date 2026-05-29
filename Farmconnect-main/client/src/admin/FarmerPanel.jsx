import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaIdCard, FaSeedling, 
         FaRupeeSign, FaInfoCircle, FaBan, FaCheck } from "react-icons/fa";

const FarmersPanel = ({ showNotification }) => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/admin/farmers`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setFarmers(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching farmers:", err);
        setLoading(false);
        showNotification("Failed to load farmers", "error");
      }
    };

    fetchFarmers();
  }, []);

  const openModal = (farmer) => {
    setSelectedFarmer(farmer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFarmer(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredFarmers = farmers.filter((farmer) => {
    if (filter === "all") return true;
    return farmer.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Farmers Management</h2>
          <p className="text-gray-600">All registered farmers with their status</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm">
              Pending: {farmers.filter((f) => f.status === "pending").length}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">
              Approved: {farmers.filter((f) => f.status === "approved").length}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">
              Rejected: {farmers.filter((f) => f.status === "rejected").length}
            </span>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Farmers
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg flex items-center ${
            filter === "pending"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span>Pending</span>
          {farmers.filter((f) => f.status === "pending").length > 0 && (
            <span className="ml-2 bg-white text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {farmers.filter((f) => f.status === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-lg flex items-center ${
            filter === "approved"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaCheck className="mr-1.5" />
          <span>Approved</span>
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-lg flex items-center ${
            filter === "rejected"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaBan className="mr-1.5" />
          <span>Rejected</span>
        </button>
      </div>

      {filteredFarmers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400"
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
            No farmers found
          </h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "There are no farmers in the system"
              : `There are no ${filter} farmers`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFarmers.map((farmer) => (
                <tr key={farmer._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">
                        {farmer.userId.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {farmer.userId.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {farmer.aadhaarNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {farmer.userId.email}
                    </div>
                    <div className="text-sm text-gray-500">{farmer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {farmer.district}, {farmer.state}
                    </div>
                    <div className="text-sm text-gray-500">
                      {farmer.villageMandal}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(farmer.status)}`}>
                      {farmer.status.charAt(0).toUpperCase() + farmer.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(farmer)}
                      className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg flex items-center transition-colors"
                    >
                      <FaInfoCircle className="mr-1.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Farmer Details Modal */}
      {isModalOpen && selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Farmer Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center">
                    <FaUser className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{selectedFarmer.userId.name}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem 
                      icon={<FaIdCard className="text-green-600" />}
                      label="Aadhaar Number" 
                      value={selectedFarmer.aadhaarNumber} 
                    />
                    <DetailItem 
                      icon={<FaEnvelope className="text-green-600" />}
                      label="Email" 
                      value={selectedFarmer.userId.email} 
                    />
                    <DetailItem 
                      icon={<FaPhone className="text-green-600" />}
                      label="Phone" 
                      value={selectedFarmer.phone || 'Not provided'} 
                    />
                    <DetailItem 
                      icon={<FaRupeeSign className="text-green-600" />}
                      label="UPI ID" 
                      value={selectedFarmer.upiId || 'Not provided'} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FaMapMarkerAlt className="text-green-600 mr-2" /> Location Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DetailItem label="Address" value={selectedFarmer.address} />
                  <DetailItem label="Village/Mandal" value={selectedFarmer.villageMandal} />
                  <DetailItem label="District" value={selectedFarmer.district} />
                  <DetailItem label="State" value={selectedFarmer.state} />
                  <DetailItem label="Pincode" value={selectedFarmer.pincode} />
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FaSeedling className="text-green-600 mr-2" /> Farming Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DetailItem 
                    label="Farm Size" 
                    value={`${selectedFarmer.farmSize || 'Not provided'} acres`} 
                  />
                  <DetailItem 
                    label="Soil Type" 
                    value={selectedFarmer.soilType || 'Not provided'} 
                  />
                  <DetailItem 
                    label="Water Source" 
                    value={selectedFarmer.waterSource || 'Not provided'} 
                  />
                  <div className="md:col-span-3">
                    <DetailItem 
                      label="Crops Grown" 
                      value={selectedFarmer.cropsGrown.join(", ")} 
                    />
                  </div>
                  <div className="md:col-span-3">
                    <DetailItem 
                      label="Certifications" 
                      value={selectedFarmer.certifications || 'None'} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Banking Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem 
                    label="Bank Name" 
                    value={selectedFarmer.bankName || 'Not provided'} 
                  />
                  <DetailItem 
                    label="Account Number" 
                    value={selectedFarmer.accountNumber || 'Not provided'} 
                  />
                  <DetailItem 
                    label="IFSC Code" 
                    value={selectedFarmer.ifscCode || 'Not provided'} 
                  />
                  <DetailItem 
                    label="Branch Name" 
                    value={selectedFarmer.branchName || 'Not provided'} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for detail items
const DetailItem = ({ icon, label, value }) => (
  <div>
    <dt className="text-sm font-medium text-gray-500 flex items-center">
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </dt>
    <dd className="mt-1 text-sm text-gray-900 font-medium">{value || '-'}</dd>
  </div>
);

export default FarmersPanel;