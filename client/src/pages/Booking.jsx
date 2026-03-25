import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

const timeSlots = [
  { time: "09:00 AM", available: true },
  { time: "10:00 AM", available: true },
  { time: "11:00 AM", available: true },
  { time: "12:00 PM", available: false },
  { time: "02:00 PM", available: true },
  { time: "03:00 PM", available: true },
  { time: "04:00 PM", available: true },
  { time: "05:00 PM", available: true },
];

const serviceIcons = {
  'Plumber': '🔧',
  'Electrician': '⚡',
  'Carpenter': '🪚',
  'Painter': '🎨',
  'AC Mechanic': '❄️',
  'Cleaner': '🧹',
  'Locksmith': '🔒',
  'Gardener': '🌿',
  'IT Support': '🖥️',
  'Laundry': '🧺',
  'Pest Control': '🐛',
};

const servicePrices = {
  'Plumber': 200,
  'Electrician': 250,
  'Carpenter': 300,
  'Painter': 350,
  'AC Mechanic': 400,
  'Cleaner': 150,
  'Locksmith': 200,
  'Gardener': 180,
  'IT Support': 300,
  'Laundry': 100,
  'Pest Control': 500,
};

function Booking() {
  const { serviceName } = useParams();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    address: '',
    description: '',
    paymentMethod: 'online'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const servicePrice = servicePrices[serviceName] || 200;
  const serviceIcon = serviceIcons[serviceName] || '🔧';
  const totalAmount = servicePrice + 50; // 50 convenience fee

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.date || !formData.time) {
        setError('Date aur time select karna zaroori hai!');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.address) {
        setError('Address likhna zaroori hai!');
        return;
      }
    }
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const handlePayment = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');

      const orderResponse = await axios.post(
        '/payment/create-order',
        { amount: totalAmount, bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order, key } = orderResponse.data;
      const user = JSON.parse(localStorage.getItem('user'));

      const options = {
        key,
        amount: order.amount,
        currency: 'INR',
        name: 'NipunGo',
        description: `${serviceName} Service Booking`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyResponse = await axios.post(
              '/payment/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              setSuccess('Booking aur Payment Successful! 🎉');
              setTimeout(() => navigate('/dashboard'), 2000);
            }
          } catch (error) {
            setError('Payment verification failed!');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: { color: '#4F46E5' }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (error) {
      setError('Payment shuru nahi ho saka!');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      const response = await axios.post(
        '/booking/create',
        {
          customer: user.id,
          worker: user.id,
          service: serviceName,
          date: formData.date,
          time: formData.time,
          address: formData.address,
          description: formData.description,
          price: totalAmount
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (formData.paymentMethod === 'online') {
          await handlePayment(response.data.booking._id);
        } else {
          setSuccess('Booking Successful! 🎉');
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      }

    } catch (error) {
      setError(
        error.response?.data?.message || 'Kuch galat hua!'
      );
    } finally {
      setLoading(false);
    }
  };

  // Steps Config
  const steps = [
    { number: 1, label: "Schedule", icon: "📅" },
    { number: 2, label: "Address", icon: "📍" },
    { number: 3, label: "Confirm", icon: "✅" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-3">{serviceIcon}</div>
          <h1 className="text-3xl font-bold text-gray-800">
            Book {serviceName}
          </h1>
          <p className="text-gray-500 mt-1">
            Expert worker aapke ghar aayega!
          </p>
        </motion.div>

        {/* ===== PROGRESS BAR ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center justify-between relative">

            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 z-0">
              <motion.div
                initial={{ width: '0%' }}
                animate={{
                  width: currentStep === 1 ? '0%' :
                         currentStep === 2 ? '50%' : '100%'
                }}
                transition={{ duration: 0.5 }}
                className="h-full bg-primary rounded-full"
              />
            </div>

            {steps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col items-center z-10"
              >
                <motion.div
                  animate={{
                    backgroundColor: currentStep >= step.number
                      ? '#4F46E5'
                      : '#E5E7EB',
                    scale: currentStep === step.number ? 1.1 : 1
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2"
                >
                  {currentStep > step.number ? (
                    <span>✓</span>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </motion.div>
                <span className={`text-sm font-medium ${
                  currentStep >= step.number
                    ? 'text-primary'
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ===== ERROR/SUCCESS ===== */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 flex items-center gap-2"
            >
              ⚠️ {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-4 flex items-center gap-2"
            >
              🎉 {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== FORM STEPS ===== */}
        <AnimatePresence mode="wait">

          {/* STEP 1: Schedule */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-2xl p-6 shadow-sm mb-4"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                📅 Schedule Karo
              </h2>

              {/* Date */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Date Select Karo
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  Time Slot Choose Karo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <motion.button
                      key={slot.time}
                      whileHover={slot.available ? { scale: 1.05 } : {}}
                      whileTap={slot.available ? { scale: 0.95 } : {}}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => {
                        if (slot.available) {
                          setFormData({ ...formData, time: slot.time });
                        }
                      }}
                      className={`p-3 rounded-xl text-sm font-medium transition ${
                        formData.time === slot.time
                          ? 'bg-primary text-white shadow-md'
                          : slot.available
                          ? 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-primary'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.time}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Address */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-2xl p-6 shadow-sm mb-4"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                📍 Address Details
              </h2>

              {/* Address */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Ghar Ka Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-400">
                    📍
                  </span>
                  <textarea
                    name="address"
                    placeholder="Flat no, Street, Area, City..."
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition resize-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Problem Describe Karo
                  <span className="text-gray-400 font-normal ml-1">
                    (Optional)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-400">
                    📝
                  </span>
                  <textarea
                    name="description"
                    placeholder="Kya problem hai? Jitna detail mein likho utna better..."
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Confirm */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="mb-4"
            >

              {/* Booking Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  📋 Booking Summary
                </h2>

                {/* Service Info */}
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl mb-4">
                  <div className="text-4xl">{serviceIcon}</div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {serviceName}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Professional Home Service
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-3 mb-4">
                  {[
                    { icon: "📅", label: "Date", value: formData.date },
                    { icon: "⏰", label: "Time", value: formData.time },
                    { icon: "📍", label: "Address", value: formData.address },
                    formData.description && {
                      icon: "📝",
                      label: "Description",
                      value: formData.description
                    },
                  ].filter(Boolean).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 py-2 border-b border-gray-100"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-gray-400 text-xs font-medium">
                          {item.label}
                        </p>
                        <p className="text-gray-700 font-medium">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h3 className="font-bold text-gray-700 mb-3">
                    Price Breakdown
                  </h3>
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>Service Charge</span>
                    <span>₹{servicePrice}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 mb-3">
                    <span>Convenience Fee</span>
                    <span>₹50</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-800 text-lg border-t border-gray-200 pt-3">
                    <span>Total Amount</span>
                    <span className="text-secondary">₹{totalAmount}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-gray-700 font-bold mb-3">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'online', label: 'Online Pay', icon: '💳' },
                      { value: 'cash', label: 'Cash on Service', icon: '💵' },
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          paymentMethod: method.value
                        })}
                        className={`p-4 rounded-xl border-2 text-center transition ${
                          formData.paymentMethod === method.value
                            ? 'border-primary bg-indigo-50 text-primary'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                        }`}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="font-medium text-sm">
                          {method.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { icon: "🔒", text: "Secure Payment" },
                  { icon: "✅", text: "Verified Workers" },
                  { icon: "⭐", text: "Quality Assured" },
                ].map((badge, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-3 text-center shadow-sm"
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className="text-gray-600 text-xs font-medium">
                      {badge.text}
                    </p>
                  </div>
                ))}
              </div>

            </motion.div>
          )}

        </AnimatePresence>

        {/* ===== NAVIGATION BUTTONS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          {/* Back Button */}
          {currentStep > 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCurrentStep(currentStep - 1);
                setError('');
              }}
              className="flex-1 border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-50 transition"
            >
              ← Back
            </motion.button>
          )}

          {/* Cancel Button (Step 1) */}
          {currentStep === 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/services')}
              className="flex-1 border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-50 transition"
            >
              ← Services
            </motion.button>
          )}

          {/* Next/Submit Button */}
          {currentStep < 3 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextStep}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Next →
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  ⏳ Processing...
                </span>
              ) : formData.paymentMethod === 'online' ? (
                `Pay ₹${totalAmount} & Confirm 💳`
              ) : (
                'Booking Confirm Karo ✅'
              )}
            </motion.button>
          )}
        </motion.div>

      </div>
    </div>
  );
}

export default Booking;