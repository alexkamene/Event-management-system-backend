const mongoose = require('mongoose')
const { Schema } = mongoose

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    profilePicture:{
        type: String,
    },

    role: {
        type: String, enum: ['user', 'organizer', 'admin'],
        default: 'user'
    },
    image: { type: String },  // Field for storing avatar URL
    backgroundInfo: { type: String }, 
    banned: { type: Boolean, default: false }, // Field for banning users




}, { timestamps: true})

const User = mongoose.model('User', userSchema);

module.exports = User;