// components/CartPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

// --- Re-usable Icon Components for a Cleaner JSX Structure ---
const BackIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const EmptyCartIcon = () => <svg className="mx-auto h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const LockIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>;

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Please log in to view your cart');
      navigate('/login');
      return;
    }
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(storedCart);
  }, [token, navigate]);

  const handleQuantityChange = (cropId, newQuantity) => {
    const quantity = Math.max(1, parseInt(newQuantity || 1));
    const updatedCart = cartItems.map((item) =>
      item.cropId === cropId ? { ...item, quantity, total: item.price * quantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage'));
  };

  const updateCropQuantity = async (cropId, quantity) => {
    try {
      await axios.patch(`http://localhost:5000/api/crops/${cropId}`, { quantity }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error updating crop quantity.');
    }
  };

  // *** CORRECTED LOGIC: Handler for removing an item ***
  const handleRemoveItem = async (cropId) => {
      if (isLoading) return; // Prevent multiple actions

      const itemToRemove = cartItems.find((item) => item.cropId === cropId);
      if (!itemToRemove) return; // Item not found, do nothing

      // Optimistically update the UI for a faster user experience
      const updatedCart = cartItems.filter((item) => item.cropId !== cropId);
      setCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('storage'));
      toast.info('Item removed from cart', { icon: '🗑️' });

      try {
          // Check if originalQuantity is a valid number before making the API call
          if (typeof itemToRemove.originalQuantity === 'number') {
              await updateCropQuantity(cropId, itemToRemove.originalQuantity);
          } else {
              // This warning is useful for debugging to confirm originalQuantity is missing
              console.warn(`originalQuantity not found for cropId: ${cropId}. Skipping server quantity update.`);
          }
      } catch (err) {
          // Notify the user if the server update fails. The item is already removed from the local cart.
          // You could add logic here to revert the local state if the server update is critical.
          toast.error(`Could not update server stock: ${err.message}`);
      }
  };


  // *** NEW LOGIC: Handler for buying a single item ***
  const handleBuyItem = async (item) => {
    if (!token) { toast.error('Please log in to purchase.'); navigate('/login'); return; }
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/purchases', { cropId: item.cropId, quantity: item.quantity, farmerId: item.farmerId, }, { headers: { Authorization: `Bearer ${token}` } } );
      
      const updatedCart = cartItems.filter((cartItem) => cartItem.cropId !== item.cropId);
      setCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('storage'));

      toast.success(`Successfully purchased ${item.cropName}!`, { icon: '🌾' });
    } catch (err) { 
        toast.error(err.response?.data?.message || 'Error purchasing item.');
    } finally { 
        setIsLoading(false); 
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.total, 0);
  };

  const handleCheckout = async () => {
    if (!token) { toast.error('Please log in to checkout.'); navigate('/login'); return; }
    setIsLoading(true);
    try {
      await Promise.all(cartItems.map(item =>
        axios.post('http://localhost:5000/api/purchases', { cropId: item.cropId, quantity: item.quantity, farmerId: item.farmerId, }, { headers: { Authorization: `Bearer ${token}` } })
      ));
      localStorage.removeItem('cart');
      setCartItems([]);
      window.dispatchEvent(new Event('storage'));
      toast.success('All items purchased successfully!', { icon: '🎉' });
      navigate('/customer/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Error during checkout.');
    } finally { setIsLoading(false); }
  };
  
  const subtotal = calculateTotal();
  const shippingFee = subtotal > 0 ? 50.00 : 0;
  const total = subtotal + shippingFee;

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-to-br from-emerald-50/30 to-sky-50/30 font-sans">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} theme="colored"/>

      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                 <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Shopping Cart</h1>
                 <button onClick={() => navigate('/customer/dashboard')} className="flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                    <BackIcon />
                    Continue Shopping
                </button>
            </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white rounded-2xl shadow-sm border border-gray-200/80">
            <EmptyCartIcon />
            <h2 className="mt-6 text-2xl font-bold text-gray-800">Your cart is currently empty.</h2>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">Looks like you haven't added any fresh produce yet. Explore nearby farms to get started!</p>
            <div className="mt-8">
              <button onClick={() => navigate('/customer/dashboard')} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                Explore Fresh Crops
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
            
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Items ({cartItems.length})</h2>
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.cropId} className="py-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <img src={item.image || 'https://via.placeholder.com/150'} alt={item.cropName} className="w-full sm:w-32 h-32 object-cover rounded-xl shadow-md"/>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{item.cropName}</h3>
                      <p className="text-sm text-gray-500">From: <span className="font-medium">{item.farmerName}</span></p>
                       <p className="text-sm text-gray-500">Price: ₹{item.price.toFixed(2)} / {item.unit}</p>
                       <p className="text-lg font-bold text-gray-900 mt-1">₹{item.total.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-stretch sm:items-end w-full sm:w-auto space-y-3">
                         <div className="flex items-center border border-gray-300 rounded-full p-1 w-full sm:w-auto justify-between">
                             <button onClick={() => handleQuantityChange(item.cropId, item.quantity - 1)} disabled={isLoading} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">-</button>
                             <input type="text" readOnly value={item.quantity} className="w-10 text-center font-semibold border-0 focus:ring-0 bg-transparent"/>
                             <button onClick={() => handleQuantityChange(item.cropId, item.quantity + 1)} disabled={isLoading} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">+</button>
                         </div>
                         <div className="flex items-center space-x-2 w-full">
                            <button onClick={() => handleBuyItem(item)} disabled={isLoading} className="w-full text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-full py-2 px-3 transition-colors disabled:opacity-50">Buy Now</button>
                            <button onClick={() => handleRemoveItem(item.cropId)} disabled={isLoading} className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"><TrashIcon/></button>
                         </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sticky top-28">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold">₹{subtotal.toFixed(2)}</span></div>
                   <div className="flex justify-between text-gray-600"><span>Shipping Fee</span><span className="font-semibold">₹{shippingFee.toFixed(2)}</span></div>
                  <div className="border-t border-dashed border-gray-300 pt-4 mt-4"><div className="flex justify-between text-lg font-bold text-gray-900"><span>Total</span><span>₹{total.toFixed(2)}</span></div></div>
                  <button onClick={handleCheckout} disabled={isLoading || cartItems.length === 0} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold py-3.5 px-6 rounded-full shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center active:scale-95">
                    {isLoading ? <ClipLoader color="#fff" size={24} /> : <><LockIcon/> Checkout All Items</>}
                  </button>
                </div>
                 <div className="mt-6"><p className="text-xs text-center text-gray-400 font-semibold uppercase">We Accept</p><div className="flex justify-center items-center space-x-4 mt-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6"/><img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="Mastercard" className="h-6"/><img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="American Express" className="h-6"/><img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/Rupay-Logo.png" alt="Rupay" className="h-6"/>
                 </div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16 py-8">
        <p className="text-center text-sm text-gray-500">© {new Date().getFullYear()} FarmDirect. Freshness and trust, delivered.</p>
      </footer>
    </div>
  );
};

export default CartPage;