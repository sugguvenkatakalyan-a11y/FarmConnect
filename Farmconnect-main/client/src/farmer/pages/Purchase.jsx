import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { FiShoppingCart } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // A small component for the summary stat cards
  const StatCard = ({ image, title, value }) => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50 flex items-center space-x-4">
        <div className="p-3 rounded-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-10 h-10 object-cover rounded-full"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/40')} // Fallback image
          />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    );
  };

  const FarmerPurchases = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [purchaseData, setPurchaseData] = useState({
      purchases: [],
      summary: [],
      totalPurchases: 0,
    });
    const token = localStorage.getItem('token');

    const fetchPurchases = async () => {
      if (!user?._id || !token) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/purchases/farmer/${user._id}`, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const sortedPurchases = res.data.purchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPurchaseData({ ...res.data, purchases: sortedPurchases });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch your sales history.');
        console.error("Fetch Purchases Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleStatusUpdate = async (purchaseId, newStatus) => {
      try {
        const res = await axios.patch(
          `${API_URL}/api/purchases/${purchaseId}/status`,
          { status: newStatus },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success(res.data.message);
        
        setPurchaseData((prev) => ({
          ...prev,
          purchases: prev.purchases.map((p) =>
            p.purchaseId === purchaseId ? { ...p, status: newStatus } : p
          ),
        }));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update purchase status.');
        console.error("Update Status Error:", err);
      }
    };

    useEffect(() => {
      fetchPurchases();
    }, [user, token]);

    if (loading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <ClipLoader color="#334155" size={50} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-slate-800">Your Sales History</h1>
            <p className="text-slate-500 mt-2 text-lg">
              A summary and detailed list of all your crop sales.
            </p>
          </div>

          {purchaseData.totalPurchases === 0 ? (
            <div className="text-center py-20 px-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <FiShoppingCart size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-2xl font-semibold text-slate-700">No sales recorded yet.</h3>
              <p className="text-slate-500 mt-3 max-w-md mx-auto">
                Once customers start buying your listed crops, all sales transactions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-slate-700 mb-6">Sales Summary by Crop</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchaseData.summary.map((stat) => (
                    <StatCard
                      key={stat.cropName}
                      image={stat.image}
                      title={stat.cropName}
                      value={`${stat.totalQuantity.toLocaleString()} units sold`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-700 mb-6">All Transactions ({purchaseData.totalPurchases})</h2>
                <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                          <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                              <tr>
                                  <th scope="col" className="px-6 py-4">Date</th>
                                  <th scope="col" className="px-6 py-4">Crop Name</th>
                                  <th scope="col" className="px-6 py-4">Quantity</th>
                                  <th scope="col" className="px-6 py-4">Total Revenue</th>
                                  <th scope="col" className="px-6 py-4">Status</th>
                                  <th scope="col" className="px-6 py-4">Customer Name</th>
                                  <th scope="col" className="px-6 py-4 hidden md:table-cell">Customer Email</th>
                                  <th scope="col" className="px-6 py-4 hidden lg:table-cell">Customer ID</th>
                                  <th scope="col" className="px-6 py-4">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {purchaseData.purchases.map((p) => (
                                  <tr key={p.purchaseId} className="bg-white border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 font-medium text-slate-800">
                                          {new Date(p.createdAt).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 font-semibold text-slate-900">
                                          {p.cropName}
                                      </td>
                                      <td className="px-6 py-4">
                                          {p.quantity} {p.unit}
                                      </td>
                                      <td className="px-6 py-4 font-medium text-teal-600">
                                          {p.totalPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                                              p.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                              p.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                              p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-rose-100 text-rose-800'
                                          }`}>
                                              {p.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 font-medium text-slate-800">
                                          {p.customerName}
                                      </td>
                                      <td className="px-6 py-4 text-slate-500 hidden md:table-cell">
                                          {p.customerEmail}
                                      </td>
                                      <td className="px-6 py-4 text-slate-500 font-mono text-xs hidden lg:table-cell">
                                          {p.customerId}
                                      </td>
                                      <td className="px-6 py-4">
                                          {p.status === 'pending' && (
                                              <button
                                                  onClick={() => handleStatusUpdate(p.purchaseId, 'confirmed')}
                                                  className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                              >
                                                  Confirm
                                              </button>
                                          )}
                                          {p.status === 'confirmed' && (
                                              <button
                                                  onClick={() => handleStatusUpdate(p.purchaseId, 'delivered')}
                                                  className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                                              >
                                                  Deliver
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  export default FarmerPurchases;