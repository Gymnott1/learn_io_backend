const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8
    },
    profilePicture: {
        type: String, // URL or path to profile picture
        default: ''
    },
    bio: {
        type: String,
        maxlength: 500
    },
    role: {
        type: String
    },
    status: {
        type: String,
        default: ''
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    passwordResetCode: {
        type: String,
        default: "4444",
      },
      passwordResetExpires: {
        type: Date,
        default: Date.now() + 3600000, // 1 hour
      },
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Instance method to check if passwords match
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
