const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ════════════════════════════════════════════════
// 📌 1. PROTECT MIDDLEWARE
//    → Har protected route pe lagao
//    → Token verify karta hai
// ════════════════════════════════════════════════
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied! Pehle login karo.'
      });
    }

    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User fetch karo — password nahi chahiye
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User nahi mila! Dobara login karo.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    // Token expire ho gaya
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expire ho gaya! Dobara login karo.'
      });
    }
    // Token tamper hua
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token! Dobara login karo.'
      });
    }
    res.status(401).json({
      success: false,
      message: 'Authentication failed!'
    });
  }
};

// ════════════════════════════════════════════════
// 📌 2. ADMIN ONLY MIDDLEWARE
//    → Sirf role: 'admin' wala access kar sakta hai
//    → protect ke BAAD use karo
// ════════════════════════════════════════════════
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access required! Aap authorized nahi hain.'
    });
  }
};

// ════════════════════════════════════════════════
// 📌 3. WORKER ONLY MIDDLEWARE
//    → Sirf role: 'worker' wala access kar sakta hai
// ════════════════════════════════════════════════
const workerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'worker') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Worker access required!'
    });
  }
};

// ════════════════════════════════════════════════
// 📌 4. CUSTOMER ONLY MIDDLEWARE
//    → Sirf role: 'customer' wala access kar sakta hai
// ════════════════════════════════════════════════
const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Customer access required!'
    });
  }
};

module.exports = {
  protect,
  adminOnly,
  workerOnly,
  customerOnly
};