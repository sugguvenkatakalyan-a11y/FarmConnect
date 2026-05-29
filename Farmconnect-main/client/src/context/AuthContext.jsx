import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [farmerStatus, setFarmerStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser({
            _id: response.data._id, // Include _id
            email: response.data.email,
            name: response.data.name, // Include name
            role: response.data.role.toLowerCase(),
          });
          setFarmerStatus(response.data.farmerStatus);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch user on mount:', err.response?.data || err.message);
          localStorage.removeItem('token');
          setUser(null);
          setFarmerStatus(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      const userRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${response.data.token}` },
      });
      setUser({
        _id: userRes.data._id, // Include _id
        email: userRes.data.email,
        name: userRes.data.name, // Include name
        role: userRes.data.role.toLowerCase(),
      });
      setFarmerStatus(userRes.data.farmerStatus);
      toast.success('Login successful!');
      return {
        ...response.data,
        user: {
          _id: userRes.data._id,
          email: userRes.data.email,
          name: userRes.data.name,
          role: userRes.data.role.toLowerCase(),
        },
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role = 'customer', farmerData = {}) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
        role,
        farmerData,
      });
      localStorage.setItem('token', response.data.token);
      const userRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${response.data.token}` },
      });
      setUser({
        _id: userRes.data._id, // Include _id
        email: userRes.data.email,
        name: userRes.data.name, // Include name
        role: userRes.data.role.toLowerCase(),
      });
      setFarmerStatus('pending');
      toast.success('Registration successful!');
      return {
        ...response.data,
        user: {
          _id: userRes.data._id,
          email: userRes.data.email,
          name: userRes.data.name,
          role: userRes.data.role.toLowerCase(),
        },
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      console.error('Registration error:', error.response?.data);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setFarmerStatus(null);
    toast.info('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, farmerStatus, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;