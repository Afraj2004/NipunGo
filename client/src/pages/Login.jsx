import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    emailOrPhone: '',  // 👈 Updated
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Forgot Password States ────────────────────────────
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // ── Auth Check ────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // ── Login Submit ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/login', {
        emailOrPhone: formData.emailOrPhone,  // 👈 Updated
        password: formData.password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem(
          'user',
          JSON.stringify(response.data.user)
        );

        // Role ke hisaab se redirect
        const { role } = response.data.user;
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'worker') {
          navigate('/worker-dashboard');
        } else {
          navigate('/');
        }
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Email/Phone ya password galat hai!'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password Submit ────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await axios.post(
        '/auth/forgot-password',
        { email: forgotEmail }
      );

      if (response.data.success) {
        setForgotSuccess(
          'Reset link aapki email pe bheja gaya! ' +
          'Inbox check karo. 📧'
        );
        setForgotEmail('');
      }

    } catch (err) {
      setForgotError(
        err.response?.data?.message ||
        'Email send nahi ho saka!'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Input Type Detect ─────────────────────────────────
  const isPhoneInput = /^[0-9]+$/.test(formData.emailOrPhone);

  return (
    <div className="min-h-screen flex">

      {/* ===== LEFT SIDE ===== */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-1/2 bg-gradient-to-br
          from-indigo-900 via-primary to-indigo-700
          flex-col items-center justify-center p-12
          relative overflow-hidden"
      >
        <div className="absolute top-20 left-10 w-64 h-64
          bg-white opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96
          bg-secondary opacity-10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center z-10"
        >
          <div className="w-20 h-20 bg-white bg-opacity-20
            rounded-2xl flex items-center justify-center
            text-white font-bold text-4xl mx-auto mb-6
            backdrop-blur-sm border border-white
            border-opacity-30">
            N
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Nipun<span className="text-secondary">Go</span>
          </h1>
          <p className="text-indigo-200 text-xl mb-12">
            Expert Services at Your Doorstep
          </p>

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
              className="text-indigo-200 text-left mb-3"
            >
              {feature}
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 text-indigo-300 text-sm"
        >
          © 2024 NipunGo - Made with ❤️ in India
        </motion.p>
      </motion.div>

      {/* ===== RIGHT SIDE — FORM ===== */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center
          justify-center p-8 bg-gray-50"
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
            <Link
              to="/"
              className="flex items-center gap-2 mb-8 lg:hidden"
            >
              <div className="w-9 h-9 bg-primary rounded-xl
                flex items-center justify-center
                text-white font-bold">
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
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200
                  text-red-600 p-4 rounded-xl mb-6
                  flex items-center gap-2"
              >
                <span>⚠️</span>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
          >

            {/* Email or Phone */}
            <div className="mb-4">
              <label className="block text-gray-700
                font-medium mb-2">
                Email ya Phone Number
              </label>
              <div className="relative">
                {/* 👇 Auto icon — email ya phone */}
                <span className="absolute left-4 top-1/2
                  -translate-y-1/2 text-gray-400">
                  {isPhoneInput ? '📱' : '📧'}
                </span>
                <input
                  type="text"                  // 👈 text type
                  name="emailOrPhone"          // 👈 updated
                  placeholder="Email ya 10-digit Phone"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  className="w-full pl-12 pr-4 py-3.5
                    border border-gray-200 rounded-xl
                    outline-none focus:border-primary
                    focus:ring-2 focus:ring-indigo-100
                    transition bg-white"
                />
              </div>
              {/* Helper text */}
              <p className="text-gray-400 text-xs mt-1.5 ml-1">
                {isPhoneInput
                  ? '📱 Phone number se login ho raha hai'
                  : '📧 Email se login ho raha hai'
                }
              </p>
            </div>

            {/* Password */}
            <div className="mb-6">
              <div className="flex justify-between
                items-center mb-2">
                <label className="text-gray-700 font-medium">
                  Password
                </label>
                {/* 👇 Forgot Password Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="text-primary text-sm
                    hover:underline font-medium"
                >
                  Forgot Password? 🔐
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2
                  -translate-y-1/2 text-gray-400">
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3.5
                    border border-gray-200 rounded-xl
                    outline-none focus:border-primary
                    focus:ring-2 focus:ring-indigo-100
                    transition bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2
                    -translate-y-1/2 text-gray-400
                    hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4
                rounded-xl font-bold text-lg
                hover:bg-indigo-700 transition
                shadow-lg shadow-indigo-200 mb-6
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center
                  justify-center gap-2">
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
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-gray-400 text-sm">ya</span>
              <div className="flex-1 border-t border-gray-200" />
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

      {/* ===== FORGOT PASSWORD MODAL ===== */}
      <AnimatePresence>
        {showForgotModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess('');
                setForgotError('');
              }}
              className="fixed inset-0 bg-black
                bg-opacity-50 z-50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center
                justify-center px-4"
            >
              <div className="bg-white rounded-2xl p-8
                max-w-md w-full shadow-2xl">

                {/* Modal Header */}
                <div className="flex items-center
                  justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold
                      text-gray-800">
                      Password Reset 🔐
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Email pe reset link bheja jayega
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSuccess('');
                      setForgotError('');
                    }}
                    className="text-gray-400 hover:text-gray-600
                      text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Success Message */}
                <AnimatePresence>
                  {forgotSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 border
                        border-green-200 text-green-700
                        p-4 rounded-xl mb-4 text-sm"
                    >
                      ✅ {forgotSuccess}
                    </motion.div>
                  )}
                  {forgotError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200
                        text-red-600 p-4 rounded-xl mb-4 text-sm"
                    >
                      ⚠️ {forgotError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!forgotSuccess ? (
                  <form onSubmit={handleForgotPassword}>
                    <div className="mb-4">
                      <label className="block text-gray-700
                        font-medium mb-2 text-sm">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <span className="absolute left-4
                          top-1/2 -translate-y-1/2
                          text-gray-400">
                          📧
                        </span>
                        <input
                          type="email"
                          placeholder="apna@email.com"
                          value={forgotEmail}
                          onChange={(e) => {
                            setForgotEmail(e.target.value);
                            setForgotError('');
                          }}
                          required
                          className="w-full pl-12 pr-4
                            py-3.5 border border-gray-200
                            rounded-xl outline-none
                            focus:border-primary
                            focus:ring-2 focus:ring-indigo-100
                            transition"
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border
                      border-yellow-100 rounded-xl p-3
                      mb-4 text-xs text-yellow-700">
                      ⏰ Reset link sirf 15 minutes
                      tak valid rahega!
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotModal(false);
                          setForgotSuccess('');
                          setForgotError('');
                        }}
                        className="flex-1 border-2
                          border-gray-200 text-gray-600
                          py-3 rounded-xl font-medium
                          hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-1 bg-primary text-white
                          py-3 rounded-xl font-bold
                          hover:bg-indigo-700 transition
                          disabled:opacity-70"
                      >
                        {forgotLoading
                          ? '⏳ Sending...'
                          : '📧 Link Bhejo'
                        }
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  // Success State
                  <div className="text-center py-4">
                    <div className="text-5xl mb-4">📬</div>
                    <p className="text-gray-600 text-sm mb-4">
                      Inbox check karo — reset link
                      bheja gaya hai!
                    </p>
                    <button
                      onClick={() => {
                        setShowForgotModal(false);
                        setForgotSuccess('');
                      }}
                      className="w-full bg-primary text-white
                        py-3 rounded-xl font-bold
                        hover:bg-indigo-700 transition"
                    >
                      Theek Hai ✅
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Login;