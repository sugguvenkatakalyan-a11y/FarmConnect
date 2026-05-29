import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- NEW & ENHANCED ICONS ---
const BackIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>;
const FarmerIcon = () => <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z"></path></svg>;
const LocationIcon = () => <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>;
const LeafIcon = () => <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a1 1 0 011-1h5a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"></path></svg>;
const StarIcon = ({ filled }) => <svg className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>;
const CartIcon = () => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg>;


const CropDetailPage = () => {
    const { cropId } = useParams();
    const navigate = useNavigate();
    const [crop, setCrop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) navigate('/login');
        if (crop) {
            document.title = `${crop.name} | FarmDirect`; // Set page title
        } else {
            document.title = 'Loading... | FarmDirect';
        }
    }, [crop, token, navigate]);

    useEffect(() => {
        const fetchCropDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/api/crops/${cropId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCrop(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch crop details.');
                toast.error('Could not load crop details.');
            } finally {
                setLoading(false);
            }
        };
        fetchCropDetails();
    }, [cropId, token]);

    const handleAddToCart = () => {
        if (!crop) return;
        const numQuantity = Number(quantity);
        if (numQuantity <= 0) {
            toast.warn('Please enter a valid quantity.');
            return;
        }
        if (numQuantity > crop.quantity) {
            toast.error(`Only ${crop.quantity} available in stock.`);
            return;
        }

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItemIndex = cart.findIndex(item => item.cropId === crop._id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += numQuantity;
            cart[existingItemIndex].total = cart[existingItemIndex].price * cart[existingItemIndex].quantity;
        } else {
            const newCartItem = {
                cropId: crop._id, farmerId: crop.farmerInfo.id, cropName: crop.name, unit: crop.unit,
                quantity: numQuantity, price: crop.price, total: crop.price * numQuantity,
                farmerName: crop.farmerInfo.name, village: crop.farmerInfo.village, district: crop.farmerInfo.district,
                image: crop.image,
            };
            cart.push(newCartItem);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage'));
        toast.success(`${crop.name} added to cart!`, { icon: '🛒' });
        navigate('/cart');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-50"><ClipLoader color="#10B981" size={60} /></div>;
    }

    if (error) {
        return <div className="container mx-auto text-center py-20"><h2 className="text-2xl font-bold text-red-600">Error</h2><p className="text-gray-600 mt-2">{error}</p><button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600">Go Back</button></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />
            <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                 <button onClick={() => navigate(-1)} className="flex items-center text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors group">
                    <BackIcon /> <span className="group-hover:underline">Back to Products</span>
                </button>
            </header>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                {crop && (
                    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl grid grid-cols-1 lg:grid-cols-5 gap-12">
                        {/* Left Side: Image Gallery */}
                        <div className="lg:col-span-3">
                            <div className="w-full h-96 md:h-[500px] rounded-xl overflow-hidden shadow-lg group">
                                <img src={crop.image || 'https://via.placeholder.com/800x600'} alt={crop.name} className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" />
                            </div>
                        </div>

                        {/* Right Side: Details & Actions */}
                        <div className="lg:col-span-2 flex flex-col">
                            <div>
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{crop.type}</span>
                                    {crop.quantity > 0 ? (
                                        <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">In Stock</span>
                                    ) : (
                                        <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">Out of Stock</span>
                                    )}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight my-4">{crop.name}</h1>
                                <div className="flex items-center mb-4">
                                    {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < 4} />)}
                                    <span className="text-sm text-gray-500 ml-2">(12 Reviews)</span>
                                </div>
                                <p className="text-5xl font-extrabold text-emerald-500">
                                    ₹{crop.price}<span className="text-xl font-medium text-gray-500">/{crop.unit}</span>
                                </p>
                                <p className={`text-sm font-semibold mt-2 ${crop.quantity > 10 ? 'text-gray-500' : 'text-yellow-600'}`}>
                                    {crop.quantity > 10 ? 'Plenty available' : `Hurry, only ${crop.quantity} left!`}
                                </p>
                            </div>

                            <div className="my-8 border-t border-gray-200 pt-8">
                               <h3 className="font-bold text-lg text-gray-800 mb-3">Description</h3>
                               <p className="text-gray-600 leading-relaxed">
                                   Sourced directly from the fields of <span className="font-semibold">{crop.farmerInfo.name}</span>, these {crop.name} are a testament to nature's finest. Grown with care and harvested at peak ripeness to ensure a burst of flavor and freshness in every bite.
                               </p>
                               <ul className="mt-4 space-y-2">
                                   <li className="flex items-center text-sm text-gray-700"><FarmerIcon /><span>Farmer: <b className="text-gray-900">{crop.farmerInfo.name}</b></span></li>
                                   <li className="flex items-center text-sm text-gray-700"><LocationIcon /><span>Origin: <b className="text-gray-900">{crop.farmerInfo.village}, {crop.farmerInfo.district}</b></span></li>
                                   <li className="flex items-center text-sm text-gray-700"><LeafIcon /><span>Guarantee: <b className="text-gray-900">Fresh & Locally Sourced</b></span></li>
                               </ul>
                            </div>
                            
                            {/* Action Area */}
                            <div className="mt-auto">
                                {crop.quantity > 0 && (
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            min="1"
                                            max={crop.quantity}
                                            className="w-24 p-3 border-2 border-gray-200 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                                        />
                                        <button
                                            onClick={handleAddToCart}
                                            className="w-full flex-1 flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-lg rounded-xl hover:from-emerald-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                                        >
                                           <CartIcon /> Add to Cart
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CropDetailPage;