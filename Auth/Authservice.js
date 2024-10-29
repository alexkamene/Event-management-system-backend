const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../Models/User');

// Registration route
router.post('/register', async (req, res) => {
    const { name, email, password, backgroundInfo } = req.body;


    if (!name || !email || !password || !backgroundInfo) {
        return res.status(400).send('All fields are required');
    }


    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send('User with That Email Already exists');
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user object
        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword, 
            backgroundInfo 
        });

        // Save the user
        await newUser.save();
        res.status(201).send('User created successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error creating user');
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).send('User does not exist');
        }

        // Compare the password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).send('Invalid password');
        }

        // Create a JWT token
        const token = jwt.sign(
            { _id: user._id, role: user.role }, 
            process.env.SECRET_KEY, 
            { expiresIn: '1h' }
        );

        return res.status(200).json({ token, role: user.role , userId: user._id,username:user.name });
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Error logging in');
    }
});

module.exports = router;
