import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/axios';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

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

  const handleNextStep = () => {
    if (!formData.name || !formData.email) {
      setError('Naam aur email zaroori hai!');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/auth/register',
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

        setSuccess('Account ban gaya! 🎉');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }

    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Kuch galat hua!'
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center z-10"
        >
          {/* Logo */}
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6 backdrop-blur-sm border border-white border-opacity-30">
            N
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Nipun<span className="text-secondary">Go</span>
          </h1>
          <p className="text-indigo-200 text-xl mb-12">
            Join Thousands of Happy Customers!
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { number: "500+", label: "Expert Workers" },
              { number: "1000+", label: "Happy Customers" },
              { number: "4.8⭐", label: "Average Rating" },
              { number: "50+", label: "Cities" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white bg-opacity-10 rounded-xl p-4 text-center backdrop-blur-sm border border-white border-opacity-10"
              >
                <h3 className="text-2xl font-bold text-white">
                  {stat.number}
                </h3>
                <p className="text-indigo-300 text-sm">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

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
              Join NipunGo! ✨
            </h2>
            <p className="text-gray-500">
              Free account banao aur services book karo
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              step >= 1 ? 'bg-primary' : 'bg-gray-200'
            }`}></div>
            <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              step >= 2 ? 'bg-primary' : 'bg-gray-200'
            }`}></div>
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mb-6">
            <span className={`text-sm font-medium ${
              step >= 1 ? 'text-primary' : 'text-gray-400'
            }`}>
              Basic Info
            </span>
            <span className={`text-sm font-medium ${
              step >= 2 ? 'text-primary' : 'text-gray-400'
            }`}>
              Account Setup
            </span>
          </div>

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

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-6 flex items-center gap-2"
            >
              <span>🎉</span>
              {success}
            </motion.div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Name */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    👤
                  </span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Apna pura naam"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-6">
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

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-3">
                  Aap Kaun Hain?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      role: 'customer'
                    })}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      formData.role === 'customer'
                        ? 'border-primary bg-indigo-50 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">👤</div>
                    <div className="font-medium text-sm">Customer</div>
                    <div className="text-xs text-gray-400">
                      Service Chahiye
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      role: 'worker'
                    })}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      formData.role === 'worker'
                        ? 'border-primary bg-indigo-50 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">👷</div>
                    <div className="font-medium text-sm">Worker</div>
                    <div className="text-xs text-gray-400">
                      Service Dunga
                    </div>
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleNextStep}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                Next →
              </motion.button>
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
            >
              {/* Phone */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    📱
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10 digit number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔒
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Strong password likho"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-50 transition"
                >
                  ← Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                >
                  {loading ? '⏳ Wait...' : 'Register ✨'}
                </motion.button>
              </div>
            </motion.form>
          )}

          {/* Login Link */}
          <p className="text-center text-gray-500 mt-6">
            Pehle se account hai?{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              Login Karo →
            </Link>
          </p>

        </div>
      </motion.div>

    </div>
  );
}

export default Register;