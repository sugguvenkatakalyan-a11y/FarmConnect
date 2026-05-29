import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Icon Components ---
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ShieldExclamationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;

// --- Skeleton Loader Component for a better UX ---
const SkeletonLoader = () => (
    <div className="space-y-10 animate-pulse">
        <div>
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-5 bg-slate-300 rounded w-3/4"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-5 bg-slate-300 rounded w-3/4"></div>
                </div>
            </div>
        </div>
        <div>
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2"><div className="h-3 bg-slate-200 rounded w-1/3"></div><div className="h-5 bg-slate-300 rounded w-full"></div></div>
                 <div className="space-y-2"><div className="h-3 bg-slate-200 rounded w-1/3"></div><div className="h-5 bg-slate-300 rounded w-3/4"></div></div>
            </div>
        </div>
    </div>
);

const CustomerProfile = () => {
    // State management remains the same
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '',
    address: { street: '', city: '', state: '', postalCode: '', country: '' },
    role: '', farmerStatus: null,
  });
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [token, navigate]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
            const response = await axios.get('http://localhost:5000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProfile(prev => ({...prev, ...response.data}));
        } catch (err) {
            toast.error('Could not fetch profile.');
        } finally {
            setIsLoading(false);
        }
    };

    // Input change and submit handlers remain largely the same
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setProfile(p => ({ ...p, [parent]: { ...p[parent], [child]: value }}));
        } else {
            setProfile(p => ({ ...p, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation logic here...
        setIsLoading(true);
        try {
            await axios.put('http://localhost:5000/api/auth/profile', profile, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsEditing(false);
            toast.success('Profile updated successfully!');
            fetchProfile();
        } catch (err) {
            toast.error('Error updating profile.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        toast.info('Logged out.');
    };

    // --- Sub-components for a cleaner render method ---
    const InfoField = ({ label, value }) => (
        <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
            <p className="mt-1 text-base text-slate-700">{value || 'N/A'}</p>
        </div>
    );
    
    const FormField = ({ label, name, value, onChange, ...props }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
            <input id={name} name={name} value={value} onChange={onChange} {...props} className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 transition" />
        </div>
    );

    return (
        <>
            <ToastContainer position="top-right" theme="colored" autoClose={3000} />
            <div className="min-h-screen w-full bg-slate-100 font-sans">
                {/* --- Background Gradient --- */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-emerald-400 to-cyan-500"></div>

                <div className="relative container mx-auto p-4 md:p-8">
                    <div className="flex justify-end mb-4">
                        <button onClick={() => navigate('/customer/home')} className="flex items-center text-sm text-white hover:text-cyan-200 font-medium transition-colors">
                            <ArrowLeftIcon /> Back to Dashboard
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* --- Sidebar --- */}
                        <aside className="lg:col-span-3">
                            <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg p-6 sticky top-8">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-28 h-28 rounded-full bg-emerald-100 mb-4 flex items-center justify-center text-5xl font-bold text-emerald-600 ring-4 ring-white/50">
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
                                    <p className="text-sm text-slate-500 capitalize">{profile.role}</p>
                                </div>
                                <nav className="mt-8 space-y-1">
                                    <a href="#profile" onClick={() => setActiveTab('profile')} className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'profile' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}>
                                        <UserCircleIcon /> Profile
                                    </a>
                                    <a href="#address" onClick={() => setActiveTab('address')} className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'address' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}>
                                        <HomeIcon /> Address
                                    </a>
                                    <a href="#danger" onClick={() => setActiveTab('danger')} className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'danger' ? 'bg-red-500 text-white shadow' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}>
                                        <ShieldExclamationIcon /> Danger Zone
                                    </a>
                                </nav>
                            </div>
                        </aside>

                        {/* --- Main Content --- */}
                        <main className="lg:col-span-9">
                            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg">
                                {isEditing ? (
                                    <form onSubmit={handleSubmit}>
                                        <div className="p-6 border-b border-slate-200"><h3 className="text-xl font-semibold text-slate-900">Edit Profile</h3></div>
                                        <div className="p-6 space-y-6">
                                            <FormField label="Full Name" name="name" value={profile.name} onChange={handleInputChange} required />
                                            <FormField label="Email" name="email" type="email" value={profile.email} onChange={handleInputChange} required />
                                            <FormField label="Phone" name="phone" type="tel" value={profile.phone} onChange={handleInputChange} />
                                            <hr/>
                                            <h4 className="text-md font-semibold text-slate-700 -mb-2">Address</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField label="Street" name="address.street" value={profile.address.street} onChange={handleInputChange} />
                                                <FormField label="City" name="address.city" value={profile.address.city} onChange={handleInputChange} />
                                                <FormField label="State" name="address.state" value={profile.address.state} onChange={handleInputChange} />
                                                <FormField label="Postal Code" name="address.postalCode" value={profile.address.postalCode} onChange={handleInputChange} />
                                                <FormField label="Country" name="address.country" value={profile.address.country} onChange={handleInputChange} className="md:col-span-2" />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 rounded-b-xl flex justify-end items-center space-x-3">
                                            <button type="button" onClick={() => { setIsEditing(false); fetchProfile(); }} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors text-sm font-medium">Cancel</button>
                                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-70 transition-all flex items-center text-sm font-medium shadow-md hover:shadow-lg">
                                                {isLoading && <ClipLoader color="#fff" size={18} className="mr-2" />} Save Changes
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        <div className="p-6 flex justify-between items-center border-b border-slate-200">
                                            <div>
                                                <h3 className="text-xl font-semibold text-slate-900">Personal Information</h3>
                                                <p className="mt-1 text-sm text-slate-500">View and edit your account details below.</p>
                                            </div>
                                            <button onClick={() => setIsEditing(true)} className="px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all text-sm font-medium shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Edit Profile</button>
                                        </div>
                                        <div className="p-8">
                                            {isLoading ? <SkeletonLoader /> : (
                                                <div className="space-y-10">
                                                    <div id="profile" className="space-y-4">
                                                        <h4 className="text-md font-semibold text-slate-700">Profile Details</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                            <InfoField label="Full Name" value={profile.name} />
                                                            <InfoField label="Email Address" value={profile.email} />
                                                            <InfoField label="Phone Number" value={profile.phone} />
                                                            <InfoField label="Role" value={profile.role} />
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div id="address" className="space-y-4">
                                                        <h4 className="text-md font-semibold text-slate-700">Address Details</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                            <InfoField label="Street" value={profile.address.street} />
                                                            <InfoField label="City" value={profile.address.city} />
                                                            <InfoField label="State" value={profile.address.state} />
                                                            <InfoField label="Postal Code" value={profile.address.postalCode} />
                                                            <InfoField label="Country" value={profile.address.country} />
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div id="danger" className="bg-red-50 p-6 rounded-lg border border-red-200">
                                                        <h4 className="text-lg font-semibold text-red-800">Danger Zone</h4>
                                                        <p className="mt-1 text-sm text-red-600">These actions are permanent and cannot be undone.</p>
                                                        <div className="mt-4">
                                                            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all text-sm font-medium shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                                                Logout
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomerProfile;