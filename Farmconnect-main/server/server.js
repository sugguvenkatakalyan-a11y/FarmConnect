const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const cropRoutes=require('./routes/crop');

const purchaseRoutes=require('./routes/purchase');
const chatbotRoutes = require('./routes/chatbotRoutes'); 

require('dotenv').config();

const app = express(); 

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: 'https://farm-connect-rouge.vercel.app' }));
app.use(express.json());

// Routes
app.use('/api/admin',adminRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/purchases', purchaseRoutes); 
app.use('/api/farmer', require('./routes/farmer'));
app.use('/api/chatbot', chatbotRoutes);


const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 