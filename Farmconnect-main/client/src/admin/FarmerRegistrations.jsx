import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { FaCheck, FaTimes, FaEye, FaSpinner } from "react-icons/fa";

const FarmerRegistrations = ({ showNotification }) => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_URL}/api/admin/farmers`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        const pendingFarmers = response.data.filter(
          farmer => farmer.status === "pending"
        );
        
        setFarmers(pendingFarmers);
        setLoading(false);
      } catch (err) {
        console.error("Error loading farmers:", err);
        setLoading(false);
        showNotification("Failed to load farmers", "error");
      }
    };

    fetchFarmers();
  }, []);

  const handleAction = async (id, action) => {
    setProcessing(prev => ({ ...prev, [id]: action }));
    
    try {
      await axios.post(
        `${API_URL}/api/admin/farmer/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      setFarmers(farmers.filter(farmer => farmer._id !== id));
      showNotification(`Farmer ${action}ed successfully`, "success");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showNotification(`Failed to ${action} farmer`, "error");
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const openModal = (farmer) => {
    setSelectedFarmer(farmer);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            New Farmer Registrations
          </h2>
          <p className="text-gray-600">Review and approve new farmer applications</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center">
          <div className="flex items-center mr-6">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm">Pending: {farmers.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : farmers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No pending registrations
          </h3>
          <p className="text-gray-500">
            All new farmer applications have been processed
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aadhaar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crops
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {farmers.map(farmer => (
                <tr key={farmer._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium">
                          {farmer.userId.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{farmer.userId.name}</div>
                        <div className="text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{farmer.userId.email}</div>
                    <div className="text-sm text-gray-500">{farmer.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {farmer.aadhaarNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{farmer.villageMandal}</div>
                    <div className="text-sm text-gray-500">{farmer.district}, {farmer.state}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {farmer.cropsGrown.join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(farmer)}
                      className="text-green-600 hover:text-green-900 flex items-center justify-end w-full"
                    >
                      <FaEye className="mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-800">
                  Farmer Details
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                    <p className="mt-1 text-gray-900">{selectedFarmer.userId.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="mt-1 text-gray-900">{selectedFarmer.userId.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                    <p className="mt-1 text-gray-900">{selectedFarmer.phoneNumber}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Aadhaar Number</h4>
                    <p className="mt-1 text-gray-900">{selectedFarmer.aadhaarNumber}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Address</h4>
                    <p className="mt-1 text-gray-900">
                      {selectedFarmer.address},<br />
                      {selectedFarmer.villageMandal},<br />
                      {selectedFarmer.district}, {selectedFarmer.state} - {selectedFarmer.pincode}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Land Size</h4>
                    <p className="mt-1 text-gray-900">{selectedFarmer.landSize} acres</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Crops Grown</h4>
                    <p className="mt-1 text-gray-900">
                      {selectedFarmer.cropsGrown.join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex space-x-4 justify-end border-t pt-6">
                <button
                  onClick={() => handleAction(selectedFarmer._id, "reject")}
                  disabled={processing[selectedFarmer._id]}
                  className={`flex items-center justify-center px-6 py-2 rounded-lg transition-all ${
                    processing[selectedFarmer._id] === "reject"
                      ? "bg-gray-300"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {processing[selectedFarmer._id] === "reject" ? (
                    <FaSpinner className="animate-spin mr-1.5" />
                  ) : (
                    <FaTimes className="mr-1.5" />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedFarmer._id, "approve")}
                  disabled={processing[selectedFarmer._id]}
                  className={`flex items-center justify-center px-6 py-2 rounded-lg transition-all ${
                    processing[selectedFarmer._id] === "approve"
                      ? "bg-gray-300"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {processing[selectedFarmer._id] === "approve" ? (
                    <FaSpinner className="animate-spin mr-1.5" />
                  ) : (
                    <FaCheck className="mr-1.5" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerRegistrations;