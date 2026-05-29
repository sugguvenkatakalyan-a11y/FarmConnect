import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { ClipLoader } from 'react-spinners';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import {
  HiOutlineUpload,
  HiOutlineScale,
  HiOutlineCurrencyRupee,
  HiCheckCircle,
  HiExclamationCircle,
} from 'react-icons/hi';
import { GiGrapes, GiFarmer, GiFarmTractor } from 'react-icons/gi'; // Added some new icons for a fresh look

// --- ENHANCEMENT: Reusable Themed Components ---

// A styled input field with an optional icon
const InputField = ({ icon: Icon, label, name, value, onChange, error, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {Icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>}
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-2.5 rounded-lg border transition-colors ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]'}`}
        {...props}
      />
    </div>
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

// A live preview card for the crop being listed
const CropPreviewCard = ({ crop, quantity, price, totalValue }) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-28"> {/* Enhanced shadow and border */}
        <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Listing Preview</h3> {/* Slightly bolder title */}
        {crop.cropName ? (
            <div className="space-y-4">
                <img src={crop.image} alt={crop.cropName} className="w-full h-48 object-cover rounded-2xl shadow-md" /> {/* More rounded image */}
                <h4 className="text-2xl font-bold text-[#16a34a] pt-2">{crop.cropName}</h4>
                <p className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full inline-block">{crop.type}</p>
                <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center"><span className="text-gray-500">List Quantity</span><span className="font-semibold text-gray-800">{quantity || 0} {crop.unit}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-500">Price / {crop.unit}</span><span className="font-semibold text-gray-800">{price > 0 ? price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '₹0.00'}</span></div>
                    <div className="flex justify-between items-center text-base bg-[#16a34a]/10 p-3 rounded-lg"><span className="font-bold text-[#16a34a]">Total Value</span><span className="font-bold text-[#16a34a]">{totalValue > 0 ? totalValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '₹0.00'}</span></div>
                </div>
            </div>
        ) : (
            <div className="text-center py-10">
                <GiGrapes className="mx-auto text-gray-300 h-16 w-16 mb-4" /> {/* Changed icon for better visual */}
                <p className="mt-2 text-gray-500 font-medium">Your crop preview will appear here once you select a crop.</p>
            </div>
        )}
    </div>
);

// A styled alert box for success or error messages
const Alert = ({ type, message }) => {
    if (!message) return null;
    const isError = type === 'error';
    return (
        <div className={`p-4 mb-4 rounded-lg flex items-start ${isError ? 'bg-red-50/70 text-red-800' : 'bg-green-50/70 text-green-800'}`}> {/* Softer background for alerts */}
            {isError ? <HiExclamationCircle className="h-5 w-5 mr-3 flex-shrink-0" /> : <HiCheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

const CropUpload = () => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cropList, setCropList] = useState([]);
  const [formData, setFormData] = useState({ cropName: '', quantity: '', unit: '', price: '', image: '', type: '' });
  const [totalValue, setTotalValue] = useState(0);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fetch initial data (user and crops)
  useEffect(() => {
    const fetchData = async () => {
      // User verification
      if (!token) {
        toast.error('Authentication required. Please log in.');
        navigate('/login');
        return;
      }
      if (!user) {
        try {
          const userRes = await axios.get(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          setUser(userRes.data);
        } catch (err) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
          return;
        }
      }
      // Fetch crop list
      try {
        const response = await fetch('/api.json'); // Assuming api.json is in public folder or accessible
        const data = await response.json();
        setCropList(data);
      } catch (err) {
        toast.error('Failed to load crop definitions.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, setUser, navigate, token]);

  // ENHANCEMENT: Calculate total value for live preview
  useEffect(() => {
    const qty = parseFloat(formData.quantity);
    const prc = parseFloat(formData.price);
    if (!isNaN(qty) && !isNaN(prc) && qty > 0 && prc > 0) {
      setTotalValue(qty * prc);
    } else {
      setTotalValue(0);
    }
  }, [formData.quantity, formData.price]);

  const handleCropSelect = (selectedOption) => {
    if (selectedOption) {
      const selectedCrop = cropList.find((crop) => crop.name === selectedOption.value);
      if (selectedCrop) { // Ensure selectedCrop is found
        setFormData({ ...formData, cropName: selectedCrop.name, image: selectedCrop.image, type: selectedCrop.type, unit: selectedCrop.unit, quantity: '', price: '' });
      } else { // Handle case where option is not found (shouldn't happen if options generated correctly)
        setFormData({ cropName: '', quantity: '', unit: '', price: '', image: '', type: '' });
      }
    } else {
      setFormData({ cropName: '', quantity: '', unit: '', price: '', image: '', type: '' });
    }
    setErrors({});
    setAlert({type: '', message: ''});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
        setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.cropName) newErrors.cropName = 'Please select a crop.';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required.';
    else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) newErrors.quantity = 'Please enter a valid, positive quantity.';
    if (!formData.price) newErrors.price = 'Price is required.';
    else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) newErrors.price = 'Please enter a valid, positive price.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });
    if (!validateForm()) {
        toast.error('Please fix the errors before submitting.');
        return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, farmerId: user._id };
      const res = await axios.post(`${API_URL}/api/crops/crop`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setAlert({ type: 'success', message: res.data.message || 'Crop listed successfully!' });
      toast.success('Crop listed successfully!');
      setFormData({ cropName: '', quantity: '', unit: '', price: '', image: '', type: '' });
      // Optionally navigate away after success
      // setTimeout(() => navigate('/farmer/dashboard/update-delete'), 2000);
    } catch (err) {
      const message = err.response?.data?.message || 'An unexpected error occurred.';
      setAlert({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ENHANCEMENT: Custom styles for react-select to match the theme
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderColor: state.isFocused ? '#16a34a' : (state.hasValue && !state.selectProps.isClearable) ? provided.borderColor : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #16a34a' : 'none',
      '&:hover': {
        borderColor: '#16a34a',
      },
      borderRadius: '8px', // Match input field border-radius
      paddingLeft: '6px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#16a34a' : state.isFocused ? '#e6ffe6' : 'white', // Lighter hover, darker selected
      color: state.isSelected ? 'white' : '#1f2937',
      padding: '10px 14px',
    }),
    singleValue: (provided) => ({ ...provided, color: '#1f2937' }),
    placeholder: (provided) => ({ ...provided, color: '#9ca3af' }),
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fcf8] flex items-center justify-center"> {/* Updated background */}
        <ClipLoader color="#16a34a" size={50} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fcf8] pb-10"> {/* Changed overall background color */}
      {/* Enhanced Header Section */}
      <header className="bg-[#16a34a] py-12 px-6 sm:px-8 rounded-b-3xl shadow-lg">
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">
          <GiFarmTractor className="h-16 w-16 text-white text-opacity-80 drop-shadow-md" />
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-2 leading-tight">
              List Your Harvest
            </h1>
            <p className="text-white text-opacity-80 text-lg max-w-2xl">
              Showcase your crops to a wider market and connect directly with buyers. Fill out the details below.
            </p>
          </div>
        </div>
      </header>

      <div className="container max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 mt-[-40px] relative z-10"> {/* Negative margin to overlap with header */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <main className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl"> {/* Enhanced shadow and border */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">Crop Details</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Alert type={alert.type} message={alert.message} />

                    <div>
                        <label htmlFor="crop-select" className="block text-sm font-medium text-gray-700 mb-1">Select Crop</label>
                        <Select
                            id="crop-select"
                            options={cropList.map(c => ({ value: c.name, label: c.name }))}
                            onChange={handleCropSelect}
                            value={formData.cropName ? { value: formData.cropName, label: formData.cropName } : null}
                            placeholder="Search and select a crop..."
                            styles={customSelectStyles}
                            isClearable
                        />
                        {errors.cropName && <p className="text-red-600 text-xs mt-1">{errors.cropName}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label={`Quantity (${formData.unit || 'units'})`}
                        name="quantity"
                        type="number"
                        placeholder="e.g., 100"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        error={errors.quantity}
                        icon={HiOutlineScale}
                        min="0"
                        step="any"
                      />
                      <InputField
                        label={`Price per ${formData.unit || 'unit'} (INR)`}
                        name="price"
                        type="number"
                        placeholder="e.g., 50"
                        value={formData.price}
                        onChange={handleInputChange}
                        error={errors.price}
                        icon={HiOutlineCurrencyRupee}
                        min="0"
                        step="any"
                      />
                    </div>

                    <div className="border-t border-gray-100 pt-6 mt-8"> {/* Thicker border-t and increased mt */}
                        <button
                          type="submit"
                          disabled={isSubmitting || !formData.cropName}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#16a34a] text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-[#15803d] transition-all duration-300 ease-in-out disabled:bg-gray-400 disabled:shadow-md disabled:cursor-not-allowed"
                        > {/* Larger button, more pronounced shadow and hover effects */}
                            {isSubmitting ? ( <><ClipLoader color="#ffffff" size={20} /> Submitting...</> ) : (<><HiOutlineUpload className="h-5 w-5" /> Post Crop to Marketplace</>)}
                        </button>
                    </div>
                </form>
            </main>

            <aside className="lg:col-span-1">
                <CropPreviewCard crop={formData} quantity={formData.quantity} price={formData.price} totalValue={totalValue} />
            </aside>
        </div>
      </div>
    </div>
  );
};

export default CropUpload;