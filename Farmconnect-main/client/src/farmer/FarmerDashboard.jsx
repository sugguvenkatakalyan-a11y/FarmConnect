import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './pages/Navbar';
import CropUpload from './pages/CropUpload';
import CropUpdateDelete from './pages/CropUpdateDelete';
import Dashboard from './pages/Dashboard';
import Purchase from './pages/Purchase';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const FarmerDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== 'farmer') {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="upload" element={<CropUpload />} />
        <Route path="update-delete" element={<CropUpdateDelete />} />
        <Route path="" element={<Dashboard/>} />
        <Route path="purchase" element={<Purchase/>} />
        <Route path="*" element={<Navigate to="upload" />} />
      </Routes>
    </div>
  );
};

export default FarmerDashboard;