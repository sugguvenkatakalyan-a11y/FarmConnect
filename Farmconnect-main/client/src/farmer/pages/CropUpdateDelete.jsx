import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { FiEdit, FiTrash2, FiSave, FiXCircle, FiPlusCircle, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// A beautifully redesigned modal for confirming deletions
const ConfirmationModal = ({ isOpen, onClose, onConfirm, cropName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Confirm Deletion</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <FiX size={24} />
            </button>
        </div>
        <p className="text-slate-600 mb-8">
          Are you sure you want to permanently delete <span className="font-semibold text-slate-800">{cropName}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition-colors font-semibold flex items-center shadow-sm hover:shadow-md"
          >
            <FiTrash2 className="mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const CropUpdateDelete = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState([]);
  const [editingCropId, setEditingCropId] = useState(null);
  const [cropToDelete, setCropToDelete] = useState(null);
  const [updatedData, setUpdatedData] = useState({ quantity: '', price: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCrops = async () => {
      if (!user?._id || !token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/crops/cropdata', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCrops(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch your crops.');
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, [user, token]);

  const handleEditClick = (crop) => {
    setEditingCropId(crop._id);
    setUpdatedData({ quantity: crop.quantity, price: crop.price });
  };

  const handleCancelEdit = () => {
    setEditingCropId(null);
    setUpdatedData({ quantity: '', price: '' });
  };

  const handleUpdate = async (cropId) => {
    const { quantity, price } = updatedData;
    if (!quantity || !price || parseFloat(quantity) <= 0 || parseFloat(price) <= 0) {
      toast.error('Please enter valid positive numbers for quantity and price.');
      return;
    }
    try {
      const res = await axios.put(
        `http://localhost:5000/api/crops/${cropId}`,
        { quantity: parseFloat(quantity), price: parseFloat(price) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCrops(res.data.crops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      toast.success('Crop updated successfully!');
      handleCancelEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update crop.');
    }
  };

  const handleDeleteClick = (crop) => setCropToDelete(crop);
  const confirmDelete = async () => {
    if (!cropToDelete) return;
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/crops/${cropToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCrops(res.data.crops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      toast.success('Crop deleted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete crop.');
    } finally {
      setCropToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ClipLoader color="#334155" size={50} />
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={!!cropToDelete}
        onClose={() => setCropToDelete(null)}
        onConfirm={confirmDelete}
        cropName={cropToDelete?.name}
      />
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
            <div>
                <h1 className="text-4xl font-bold text-slate-800">Your Listings</h1>
                <p className="text-slate-500 mt-2 text-lg">Manage your crops available for sale.</p>
            </div>
             <button
                onClick={() => navigate('/farmer/dashboard/upload')}
                className="mt-4 sm:mt-0 flex items-center bg-slate-700 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
            >
                <FiPlusCircle className="mr-2"/>
                Add New Crop
            </button>
          </div>

          {crops.length === 0 ? (
            <div className="text-center py-20 px-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-2xl font-semibold text-slate-700">No crops listed yet.</h3>
              <p className="text-slate-500 mt-3 max-w-md mx-auto">Ready to sell? Click 'Add New Crop' to list your first item and connect with buyers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {crops.map((crop) => (
                <div key={crop._id} className="bg-white rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden transition-transform duration-300 transform hover:-translate-y-1.5 flex flex-col">
                  <img src={crop.image} alt={crop.name} className="w-full h-52 object-cover" />
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-bold text-slate-800">{crop.name}</h3>
                        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">{crop.type}</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-5">Posted: {new Date(crop.createdAt).toLocaleDateString()}</p>
                    
                    {editingCropId === crop._id ? (
                      <div className="space-y-4">
                        <div>
                           <label className="text-sm font-semibold text-slate-600 block mb-1">Quantity ({crop.unit})</label>
                           <input
                             type="number"
                             value={updatedData.quantity}
                             onChange={(e) => setUpdatedData({...updatedData, quantity: e.target.value})}
                             className="w-full p-2.5 border border-slate-300 rounded-md transition duration-200 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                           />
                        </div>
                         <div>
                           <label className="text-sm font-semibold text-slate-600 block mb-1">Price (per {crop.unit})</label>
                           <input
                             type="number"
                             value={updatedData.price}
                             onChange={(e) => setUpdatedData({...updatedData, price: e.target.value})}
                             className="w-full p-2.5 border border-slate-300 rounded-md transition duration-200 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                           />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg text-slate-700"><span className="font-semibold text-slate-500">Quantity:</span> {crop.quantity} {crop.unit}</p>
                        <p className="text-lg text-slate-700"><span className="font-semibold text-slate-500">Price:</span> ₹{crop.price} <span className="text-base text-slate-500">per {crop.unit}</span></p>
                      </div>
                    )}
                  </div>
                   <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center gap-3">
                      {editingCropId === crop._id ? (
                        <>
                           <button onClick={() => handleUpdate(crop._id)} className="flex-1 text-sm font-semibold bg-teal-500 text-white py-2.5 rounded-md hover:bg-teal-600 transition-colors flex items-center justify-center"><FiSave className="mr-2"/>Save</button>
                           <button onClick={handleCancelEdit} className="flex-1 text-sm font-semibold bg-slate-200 text-slate-700 py-2.5 rounded-md hover:bg-slate-300 transition-colors flex items-center justify-center"><FiXCircle className="mr-2"/>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditClick(crop)} className="flex-1 text-sm font-semibold bg-slate-600 text-white py-2.5 rounded-md hover:bg-slate-700 transition-colors flex items-center justify-center"><FiEdit className="mr-2"/>Edit</button>
                          <button onClick={() => handleDeleteClick(crop)} className="flex-1 text-sm font-semibold bg-rose-500 text-white py-2.5 rounded-md hover:bg-rose-600 transition-colors flex items-center justify-center"><FiTrash2 className="mr-2"/>Delete</button>
                        </>
                      )}
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CropUpdateDelete;