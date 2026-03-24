import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/axios';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Agar user pehle se login hai toh home par bhejo
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/auth/login',
        formData
      );

      if (response.data.success) {
        localStorage.setItem(
          'token',
          response.data.token
        );
        localStorage.setItem(
          'user',
          JSON.stringify(response.data.user)
        );
        navigate('/');
      }

    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Email ya password galat hai!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left Side - Design */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-900 via-primary to-indigo-700 flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary opacity-10 rounded-full blur-3xl"></div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center z-10"
        >
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6 backdrop-blur-sm border border-white border-opacity-30">
            N
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Nipun<span className="text-secondary">Go</span>
          </h1>
          <p className="text-indigo-200 text-xl mb-12">
            Expert Services at Your Doorstep
          </p>

          {/* Features */}
          {[
            "✅ 500+ Verified Experts",
            "✅ Best Price Guaranteed",
            "✅ 24/7 Customer Support",
            "✅ Safe & Secure Payments"
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="text-indigo-200 text-left mb-3 flex items-center gap-2"
            >
              {feature}
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 text-indigo-300 text-sm"
        >
          © 2026 NipunGo - Made with ❤️ in India
        </motion.p>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50"
      >
        <div className="w-full max-w-md">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            {/* Mobile Logo */}
            <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
                N
              </div>
              <span className="text-2xl font-bold">
                <span className="text-primary">Nipun</span>
                <span className="text-secondary">Go</span>
              </span>
            </Link>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back! 👋
            </h2>
            <p className="text-gray-500">
              Apne account mein login karo
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2"
            >
              <span>⚠️</span>
              {error}
            </motion.div>
          )}

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
          >

            {/* Email */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  📧
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="apna@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-700 font-medium">
                  Password
                </label>
                <button
                  type="button"
                  className="text-primary text-sm hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mb-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    ⏳
                  </motion.span>
                  Login Ho Raha Hai...
                </span>
              ) : (
                'Login Karo →'
              )}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="text-gray-400 text-sm">ya</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Register Link */}
            <p className="text-center text-gray-500">
              Account nahi hai?{" "}
              <Link
                to="/register"
                className="text-primary font-bold hover:underline"
              >
                Register Karo ✨
              </Link>
            </p>

          </motion.form>
        </div>
      </motion.div>

    </div>
  );
}

export default Login;