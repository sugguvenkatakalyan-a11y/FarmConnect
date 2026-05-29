// src/components/HomePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Icon Components
const CartIcon = ({ count }) => (
  <div className="relative">
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      ></path>
    </svg>
    {count > 0 && (
      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-lg">
        {count}
      </span>
    )}
  </div>
);

const ProfileIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    ></path>
  </svg>
);

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0); // Dynamic cart count
  const [featuredCrops, setFeaturedCrops] = useState([]);
  const [isLoadingCrops, setIsLoadingCrops] = useState(false);
  const navigate = useNavigate();

  // Get cart count from localStorage and clean up data format
  useEffect(() => {
    const updateCartCount = () => {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");

      // Clean up cart items to ensure prices are numbers
      cart = cart.map((item) => ({
        ...item,
        price:
          typeof item.price === "string" ? parseFloat(item.price) : item.price,
        total:
          typeof item.total === "string"
            ? parseFloat(item.total)
            : typeof item.price === "string"
            ? parseFloat(item.price) * item.quantity
            : item.price * item.quantity,
      }));

      // Save the cleaned cart back
      localStorage.setItem("cart", JSON.stringify(cart));

      setCartCount(cart.length);
    };

    updateCartCount();

    // Listen for storage changes
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  // Fetch featured crops from API (same as CustomerDashboard)
  useEffect(() => {
    fetchFeaturedCrops();
  }, []);

  const fetchFeaturedCrops = async () => {
    setIsLoadingCrops(true);
    try {
      const token = localStorage.getItem("token");

      // Try to get user's location for nearby crops, fallback to default location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await getCropsData(latitude, longitude, token);
        },
        async (error) => {
          // Fallback to default location if geolocation fails
          console.log("Location access denied, using default location");
          await getCropsData(40.7128, -74.006, token); // Default to New York coordinates
        }
      );
    } catch (error) {
      console.error("Error fetching crops:", error);
      setFeaturedCrops([]);
    } finally {
      setIsLoadingCrops(false);
    }
  };

  const getCropsData = async (latitude, longitude, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/crops/nearby-crops`,
        {
          latitude,
          longitude,
          maxDistance: 50, // Search within 50km
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      // Flatten the crops data like in CustomerDashboard
      const flattenedCrops = response.data.crops.reduce((acc, farmer) => {
        if (
          !farmer ||
          !farmer.crops ||
          !farmer.farmerName ||
          !farmer.farmerId ||
          !farmer.farmerDetails
        ) {
          return acc;
        }
        farmer.crops.forEach((crop) => {
          acc.push({
            ...crop,
            farmerInfo: {
              name: farmer.farmerName,
              id: farmer.farmerId,
              village: farmer.farmerDetails.villageMandal,
              district: farmer.farmerDetails.district,
            },
          });
        });
        return acc;
      }, []);

      // Take only first 6 crops for featured section
      setFeaturedCrops(flattenedCrops.slice(0, 6));
    } catch (error) {
      console.error("Error fetching crops from API:", error);
      setFeaturedCrops([]);
    }
  };

  const addToCart = (crop) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      // Transform crop data to match CartPage expectations (same as CustomerDashboard)
      const cartItem = {
        cropId: crop._id,
        farmerId: crop.farmerInfo.id,
        cropName: crop.name,
        unit: crop.unit,
        quantity: 1,
        price: crop.price,
        total: crop.price,
        farmerName: crop.farmerInfo.name,
        village: crop.farmerInfo.village,
        district: crop.farmerInfo.district,
        image: crop.image,
      };

      const existingItem = cart.find((item) => item.cropId === crop._id);

      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.total = existingItem.price * existingItem.quantity;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      setCartCount(cart.length);

      // Trigger storage event for other components
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10"
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
      ),
      title: "Verified Farmers",
      description:
        "All our farmers are thoroughly vetted to ensure authenticity and quality standards.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      title: "Organic & Fresh",
      description:
        "Harvested daily and delivered straight from the farm to your doorstep.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: "Easy Ordering",
      description:
        "Simple and intuitive interface to browse, select, and purchase farm-fresh products.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10"
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
      ),
      title: "Fast Delivery",
      description:
        "Get your fresh produce delivered within 24 hours of ordering.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tighter">
                  Farm<span className="text-emerald-500">Direct</span>
                </h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex space-x-4">
                  <a
                    href="#home"
                    className="text-green-600 font-medium px-3 py-2 rounded-md hover:bg-green-50 transition"
                  >
                    Home
                  </a>
                  <a
                    href="#features"
                    className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-md hover:bg-green-50 transition"
                  >
                    Features
                  </a>
                  <a
                    href="#products"
                    className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-md hover:bg-green-50 transition"
                  >
                    Fresh Products
                  </a>
                  <a
                    href="#farmers"
                    className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-md hover:bg-green-50 transition"
                  >
                    Our Farmers
                  </a>
                  <button
                    onClick={() => navigate("/customer/dashboard")}
                    className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-md hover:bg-green-50 transition"
                  >
                    Shop Now
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => navigate("/cart")}
                className="h-11 w-11 flex items-center justify-center bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-full transition-all hover:shadow-md"
                aria-label="View Cart"
              >
                <CartIcon count={cartCount} />
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="h-11 w-11 flex items-center justify-center bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-full transition-all hover:shadow-md"
                aria-label="View Profile"
              >
                <ProfileIcon />
              </button>
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-green-600 focus:outline-none"
              >
                {isMenuOpen ? (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
              <a
                href="#home"
                className="text-green-600 block px-3 py-2 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#features"
                className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#products"
                className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Fresh Products
              </a>
              <a
                href="#farmers"
                className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Our Farmers
              </a>
              <button
                onClick={() => {
                  navigate("/customer/dashboard");
                  setIsMenuOpen(false);
                }}
                className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md font-medium w-full text-left"
              >
                Shop Now
              </button>
              <div className="pt-2 border-t mt-2 flex justify-center space-x-4">
                <button
                  onClick={() => navigate("/cart")}
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                >
                  <CartIcon count={cartCount} />
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <ProfileIcon />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div
        id="home"
        className="relative flex content-center items-center justify-center"
        style={{
          minHeight: "100vh", // Full viewport height
          paddingTop: "4rem", // Space for fixed navbar
          backgroundImage:
            "url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute top-0 w-full h-full bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>

        {/* Animated background elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-emerald-400 rounded-full animate-pulse opacity-70"></div>
        <div className="absolute bottom-32 right-32 w-6 h-6 bg-white rounded-full animate-bounce opacity-50"></div>
        <div className="absolute top-1/3 right-20 w-3 h-3 bg-emerald-300 rounded-full animate-ping opacity-60"></div>

        <div className="container relative mx-auto px-4 z-10">
          <div className="items-center flex flex-wrap">
            <div className="w-full lg:w-10/12 px-4 ml-auto mr-auto text-center">
              <div className="text-white">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  <span className="block mb-2">Connecting</span>
                  <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                    Farms to Families
                  </span>
                </h1>
                <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-4xl mx-auto leading-relaxed">
                  Buy fresh, eat healthy – directly from your local farmers.
                  Experience the difference of farm-to-table freshness.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                  <button
                    onClick={() => navigate("/customer/dashboard")}
                    className="group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg flex items-center space-x-2"
                  >
                    <span>Explore Products</span>
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                  <button className="group border-2 border-white/30 hover:border-white text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:bg-white/10 backdrop-blur-sm">
                    Watch Our Story
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-center mb-16">
            <div className="w-full lg:w-6/12 px-4">
              <h2 className="text-4xl font-semibold text-gray-800">
                Why Choose Farm Connect
              </h2>
              <p className="text-lg leading-relaxed m-4 text-gray-600">
                We bring the farm directly to your table with the freshest
                produce available
              </p>
            </div>
          </div>
          <div className="flex flex-wrap">
            {features.map((feature, index) => (
              <div key={index} className="w-full md:w-1/2 lg:w-1/4 px-4 mb-8">
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition duration-300 h-full">
                  <div className="text-green-600 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center">
            <div className="w-full md:w-5/12 px-4 mr-auto ml-auto">
              <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-green-600">
                <img
                  alt="Sustainable farming and local agriculture"
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  className="w-full align-middle rounded-t-lg"
                />
              </div>
            </div>
            <div className="w-full md:w-5/12 px-4 mr-auto ml-auto">
              <div className="md:pr-12">
                <div className="text-green-600 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-gray-800">
                  Our Mission
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-gray-600">
                  Farm Connect was founded with a simple mission: to create a
                  direct connection between local farmers and consumers. We
                  eliminate the middlemen, ensuring farmers get fair prices
                  while customers receive the freshest produce at competitive
                  rates.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-gray-600">
                  Our platform supports sustainable farming practices and helps
                  build stronger local food systems. By choosing Farm Connect,
                  you're investing in your community's health and economy.
                </p>
                <a
                  href="#"
                  className="mt-6 inline-block text-green-600 font-semibold hover:underline"
                >
                  Learn more about our story
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products/Crops Section */}
      <section id="products" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-center mb-16">
            <div className="w-full lg:w-6/12 px-4">
              <h2 className="text-4xl font-semibold text-gray-800 mb-4">
                Fresh From Our Farms
              </h2>
              <p className="text-lg leading-relaxed text-gray-600">
                Discover our premium selection of locally grown, organic produce
                harvested daily for maximum freshness
              </p>
            </div>
          </div>

          {/* Dynamic Products Grid */}
          {isLoadingCrops ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="ml-4 text-gray-600 font-semibold">
                Loading fresh crops...
              </p>
            </div>
          ) : featuredCrops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredCrops.map((crop, index) => (
                <div
                  key={crop._id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={crop.image || "https://via.placeholder.com/400"}
                      alt={crop.name}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                    <div className="absolute bottom-3 left-4">
                      <h3 className="text-xl font-bold text-white tracking-tight shadow-sm">
                        {crop.name}
                      </h3>
                      <p className="text-xs text-emerald-200 font-semibold group-hover:text-white transition-colors">
                        by {crop.farmerInfo.name}
                      </p>
                    </div>
                    {crop.distance && (
                      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        {crop.distance} km
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-baseline justify-between mb-4">
                      <p className="text-3xl font-extrabold text-emerald-500">
                        ₹{crop.price}
                        <span className="text-sm font-medium text-gray-500">
                          /{crop.unit}
                        </span>
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          crop.quantity > 0 ? "text-gray-600" : "text-red-500"
                        }`}
                      >
                        {crop.quantity > 0
                          ? `Stock: ${crop.quantity}`
                          : "Out of Stock"}
                      </p>
                    </div>
                    {crop.farmerInfo.village && (
                      <p className="text-sm text-gray-500 mb-4">
                        📍 {crop.farmerInfo.village}, {crop.farmerInfo.district}
                      </p>
                    )}
                    <button
                      onClick={() => addToCart(crop)}
                      disabled={crop.quantity === 0}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                    >
                      {crop.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌾</div>
              <p className="text-gray-500 text-lg mb-4">
                No crops available at the moment
              </p>
              <p className="text-gray-400 mb-6">
                Check back later or browse all available crops
              </p>
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
              >
                Browse All Crops
              </button>
            </div>
          )}

          {/* Show All Crops Button - Only show when we have crops */}
          {featuredCrops.length > 0 && (
            <div className="text-center">
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center mx-auto space-x-2"
              >
                <span>Show All Crops</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="farmers"
        className="py-20"
        style={{
          background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center">
            <div className="w-full md:w-5/12 px-4 mr-auto ml-auto">
              <img
                alt="Happy farmer with fresh vegetables from local farm"
                className="max-w-full rounded-lg shadow-xl"
                src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              />
            </div>
            <div className="w-full md:w-5/12 px-4 mr-auto ml-auto text-white">
              <h3 className="text-3xl font-semibold mb-4">Are you a farmer?</h3>
              <p className="text-lg leading-relaxed opacity-90 mb-6">
                Join our platform today to reach more customers, get fair prices
                for your produce, and become part of a community that values
                sustainable farming.
              </p>
              <div className="mt-8">
                <button
                  onClick={() => navigate("/register-farmer")}
                  className="bg-white text-green-700 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition transform hover:scale-105 shadow-lg"
                >
                  Register as a Farmer
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap">
            <div className="w-full md:w-4/12 px-4">
              <h4 className="text-xl font-semibold mb-4">Farm Connect</h4>
              <p className="text-gray-400 mb-4">
                Connecting local farmers directly with consumers for fresher
                produce and fairer prices.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="w-full md:w-4/12 px-4">
              <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Home
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition"
                  >
                    About Us
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Products
                  </a>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-4/12 px-4">
              <h4 className="text-xl font-semibold mb-4">Contact Us</h4>
              <ul className="list-unstyled">
                <li className="mb-2 flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-gray-400">+91 9876543218</span>
                </li>
                <li className="mb-2 flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-400">viba@farmconnect.com</span>
                </li>
                <li className="mb-2 flex items-start">
                  <svg
                    className="h-5 w-5 mr-2 mt-1 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-gray-400">
                    123 Farm Road
                    <br />
                    Agriculture City, FC 12345
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <hr className="my-6 border-gray-800" />
          <div className="flex flex-wrap items-center justify-center">
            <div className="w-full px-4 text-center">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Farm Connect. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
