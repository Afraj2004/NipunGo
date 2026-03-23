const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check karo user pehle se hai ya nahi
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        message: 'Email pehle se registered hai!' 
      });
    }

    // Password encrypt karo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // User banao
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role
    });

    // Token banao
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! 🎉',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error!', 
      error: error.message 
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // User dhundo
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Email ya password galat hai!' 
      });
    }

    // Password check karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Email ya password galat hai!' 
      });
    }

    // Token banao
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful! 🎉',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error!', 
      error: error.message 
    });
  }
});

module.exports = router;