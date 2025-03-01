const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const envUtils = require('../common/envUtils');


exports.register = async (req, res) => {
    try {
        const { name, email, role, password, passwordConfirm } = req.body;

        // Check if passwords match
        if (password !== passwordConfirm) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user without saving passwordConfirm
        const user = new User({
            name,
            email,
            role,
            password // password will be hashed automatically
            // No need to save passwordConfirm
        });

        // Save user to database
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, envUtils.get('JWT_SECRET'), {
            expiresIn: '1d' // Token expires in 1 day
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find(); // Exclude password field for security
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            profilePicture: req.body.profilePicture,
            bio: req.body.bio,
            role: req.body.role,
            status: req.body.role,
            is_deleted: req.body.is_deleted
            // Add other updatable fields here as necessary
        };

        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true, // Return the updated document
            runValidators: true // Validate the update
        });

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        // Update the user to set is_deleted to true
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { is_deleted: true }, // Update the is_deleted field
            {
                new: true, // Return the updated document
                runValidators: true // Validate the update
            }
        );

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the provided password matches the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            envUtils.get('JWT_SECRET'),
            { expiresIn: '1d' } // Token expires in 1 day
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
      const {
        email,
        oldPassword,
        newPassword,
        newPasswordConfirm,
        verificationCode,
      } = req.body;
  
      // Validate required fields
      if (
        !email ||
        !oldPassword ||
        !newPassword ||
        !newPasswordConfirm ||
        !verificationCode
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      // Check if the new passwords match
      if (newPassword !== newPasswordConfirm) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
  
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User Not Found" });
      }
      if (
        !user.passwordResetCode ||
        user.passwordResetCode !== verificationCode ||
        Date.now() > user.passwordResetCodeExpires
      ) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification code." });
      }
  
      // Compare the provided old password with the stored hashed password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      }
  
      // Hash the new password and update the user document
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpires = undefined;
      await user.save();
  
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
