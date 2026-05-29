import { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FiUploadCloud, 
  FiEdit, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiUser,
  FiChevronDown,
  FiGrid,
  FiShoppingBag,
} from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // UPDATED: Styling function inspired by the Farminsta design
  const getNavLinkClass = ({ isActive }) =>
    `relative flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 group ${
      isActive
        ? 'text-[#16a34a] font-semibold' // Active link is brand green and bold
        : 'text-[#4a5568] hover:text-[#16a34a]' // Inactive is muted gray, hovers to brand green
    }`;
    
  // UPDATED: Mobile styling function
  const getMobileNavLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-300 ${
      isActive
        ? 'text-[#16a34a] bg-[#16a34a]/10 font-semibold' // Active has a subtle green background
        : 'text-[#4a5568] hover:text-[#16a34a] hover:bg-[#16a34a]/10'
    }`;

  const closeAllMenus = () => {
      setIsMenuOpen(false);
      setIsProfileMenuOpen(false);
  }

  return (
    // UPDATED: Main navbar with light background and a subtle bottom border for separation
    <nav className="bg-[#f5fafa] shadow-sm border-b border-gray-200/75 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* === Logo / Brand Name === */}
          <div className="flex-shrink-0">
            {/* UPDATED: Logo text uses the main brand green color */}
            <NavLink to="/farmer/dashboard" className="flex items-center space-x-3 text-[#16a34a]">
              <span className="text-xl font-bold tracking-wider">FarmDirect</span>
            </NavLink>
          </div>
         
          {/* === Desktop Navigation Links === */}
          <div className="hidden md:flex md:items-center md:space-x-6">
              <NavLink to="/farmer/dashboard/" className={getNavLinkClass} end>
                 <FiEdit className="mr-2" />
                 <span>Dashboard</span>
                 {/* UPDATED: Underline color to match active text */}
                 <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#16a34a] rounded-full transition-all duration-300 group-hover:w-full"></span>
              </NavLink>
              <NavLink to="/farmer/dashboard/upload" className={getNavLinkClass}>
                <FiUploadCloud className="mr-2" />
                <span>Upload Crop</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#16a34a] rounded-full transition-all duration-300 group-hover:w-full"></span>
              </NavLink>
              <NavLink to="/farmer/dashboard/update-delete" className={getNavLinkClass}>
                <FiGrid className="mr-2" />
                <span>Manage Crops</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#16a34a] rounded-full transition-all duration-300 group-hover:w-full"></span>
              </NavLink>
              <NavLink to="/farmer/dashboard/purchase" className={getNavLinkClass}>
                <FiShoppingBag className="mr-2" />
                <span>Purchases</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#16a34a] rounded-full transition-all duration-300 group-hover:w-full"></span>
              </NavLink>
          </div>
          
          {/* === Desktop User Profile Dropdown === */}
          {/* UPDATED: Changed profile button to be a solid green button, like the "Login" button in the image */}
          <div className="hidden md:flex items-center">
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-full bg-[#16a34a] hover:bg-opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#f5fafa] focus:ring-[#16a34a]"
              >
                <FiUser className="text-white" size={20} />
                <FiChevronDown className={`text-white/70 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} size={16}/>
              </button>

              {isProfileMenuOpen && (
                 <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1">
                   <div className="px-4 py-3 border-b border-gray-200">
                     <p className="text-sm text-gray-900">Signed in as</p>
                     <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Farmer'}</p>
                   </div>
                   <button
                     onClick={() => {
                        handleLogout();
                        setIsProfileMenuOpen(false);
                     }}
                     className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                   >
                     <FiLogOut className="mr-3 text-gray-500" size={16} />
                     Logout
                   </button>
                 </div>
              )}
            </div>
          </div>

          {/* === Mobile Menu Button === */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              // UPDATED: Mobile menu icon uses muted text color
              className="inline-flex items-center justify-center p-2 rounded-md text-[#4a5568] hover:text-[#16a34a] hover:bg-[#16a34a]/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#16a34a]"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* === Mobile Menu Panel === */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3">
            <NavLink to="/farmer/dashboard/" className={getMobileNavLinkClass} onClick={closeAllMenus} end>
              <FiEdit className="mr-3" /> Dashboard
            </NavLink>
            <NavLink to="/farmer/dashboard/upload" className={getMobileNavLinkClass} onClick={closeAllMenus}>
              <FiUploadCloud className="mr-3" /> Upload Crop
            </NavLink>
            <NavLink to="/farmer/dashboard/update-delete" className={getMobileNavLinkClass} onClick={closeAllMenus}>
              <FiGrid className="mr-3" /> Manage Crops
            </NavLink>
             <NavLink to="/farmer/dashboard/purchase" className={getMobileNavLinkClass} onClick={closeAllMenus}>
                <FiShoppingBag className="mr-3" /> Purchases
            </NavLink>
          </div>
          {/* UPDATED: Mobile User Info colors */}
          <div className="pt-4 pb-3 border-t border-gray-200/75">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0 p-2 rounded-full bg-[#16a34a]">
                <FiUser size={22} className="text-white" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name || 'Valued Farmer'}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={() => {
                  closeAllMenus();
                  handleLogout();
                }}
                className="w-full text-left flex items-center px-3 py-3 rounded-md text-base font-medium text-[#4a5568] hover:text-[#16a34a] hover:bg-[#16a34a]/10"
              >
                <FiLogOut className="mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 