import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import OtpInput, { useCountdown } from './OtpInput';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

// Forgot password: 1) enter email -> OTP is emailed  2) enter OTP + new password
function ForgotPasswordModal({ open, onClose }) {
  const [step, setStep] = useState('email'); // 'email' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendIn, setResendIn] = useCountdown(0);

  // Start clean every time the dialog opens
  useEffect(() => {
    if (open) {
      setStep('email');
      setEmail('');
      setOtp('');
      setPassword('');
      setShowPassword(false);
      setError('');
      setInfo('');
      setResendIn(0);
    }
  }, [open, setResendIn]);

  const requestOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      setResendIn(res.data.resendAfterSeconds || 30);
      setOtp('');
      if (step === 'email') setStep('reset');
      else setInfo('Naya OTP bhej diya gaya hai (agar email registered hai).');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP nahi bhej paye. Thodi der baad try karo.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) return setError('6 digit ka OTP daalo!');
    if (!PASSWORD_RULE.test(password)) {
      return setError('Password kam se kam 8 characters ka ho, usme ek letter aur ek number zaroor ho!');
    }
    setLoading(true);
    try {
      await axios.post('/auth/reset-password', { email, otp, password });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset nahi ho saka.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Password reset"
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Password Reset 🔐</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {step === 'email' && 'Email pe 6 digit ka OTP bheja jayega'}
                    {step === 'reset' && 'OTP aur naya password daalo'}
                    {step === 'done' && 'Sab ho gaya!'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">
                  ⚠️ {error}
                </div>
              )}
              {info && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-4 text-sm">
                  ✅ {info}
                </div>
              )}

              {step === 'email' && (
                <form onSubmit={requestOtp}>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Registered Email Address
                  </label>
                  <div className="relative mb-4">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                    <input
                      type="email"
                      placeholder="apna@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      required
                      autoFocus
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-70"
                    >
                      {loading ? '⏳ Sending...' : '📧 OTP Bhejo'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'reset' && (
                <form onSubmit={resetPassword}>
                  <p className="text-sm text-gray-600 mb-4">
                    Agar <span className="font-semibold break-all">{email}</span> registered hai,
                    toh OTP bhej diya gaya hai. Spam folder bhi dekho.
                  </p>

                  <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(''); }} length={6} />

                  <label className="block text-gray-700 font-medium mt-5 mb-2 text-sm">
                    Naya Password
                  </label>
                  <div className="relative mb-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8+ characters, letter + number"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      autoComplete="new-password"
                      required
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-5">
                    OTP 10 minute tak valid hai.{' '}
                    {resendIn > 0 ? (
                      <span className="text-gray-400">{resendIn}s mein dobara bhej sakte ho</span>
                    ) : (
                      <button
                        type="button"
                        onClick={requestOtp}
                        disabled={loading}
                        className="text-primary font-semibold hover:underline"
                      >
                        OTP dobara bhejo
                      </button>
                    )}
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setError(''); setInfo(''); }}
                      className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-60"
                    >
                      {loading ? '⏳ Wait...' : 'Password Badlo ✅'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'done' && (
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">🎉</div>
                  <p className="text-gray-600 text-sm mb-5">
                    Password change ho gaya! Ab naye password se login karo.
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
                  >
                    Login Karo →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ForgotPasswordModal;
