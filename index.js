const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoute = require('./Auth/Authservice');
const eventRoute = require('./Events/Events');
const adminRoute = require('./Routes/AdminRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Route Middleware
app.use('', authRoute);  // Auth routes
app.use('', eventRoute); // Event routes
app.use('', adminRoute);  // Admin routes

// Test Route
app.get('/', (req, res) => {
    res.send('Hello World');
});


// Connect to MongoDB
const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error("Error connecting to MongoDB:", err.message); // Log the error message
    }
};

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    connect();
    console.log(`Server is running on port ${PORT}`);
});
