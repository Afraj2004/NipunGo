import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

// ── Constants ──────────────────────────────────────────────
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

// ── Searching Screen Component ─────────────────────────────
function SearchingWorkers({ booking, onCancel }) {
  const navigate = useNavigate();
  const [currentBooking, setCurrentBooking] = useState(booking);
  const [dots, setDots] = useState('');
  const pollingRef = useRef(null);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Polling — har 5 second mein check karo
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const response = await axios.get(
          `/booking/single/${booking._id}`
        );
        const updatedBooking = response.data.booking;
        setCurrentBooking(updatedBooking);

        // Worker ne accept kar liya!
        if (updatedBooking.status === 'Confirmed') {
          clearInterval(pollingRef.current);
        }

        // Koi worker nahi mila
        if (updatedBooking.status === 'No Workers') {
          clearInterval(pollingRef.current);
        }

      } catch (error) {
        console.log('Polling error:', error);
      }
    }, 5000); // 5 seconds

    return () => clearInterval(pollingRef.current);
  }, [booking._id]);

  // ── No Workers Found ────────────────────────────────────
  if (currentBooking.status === 'No Workers') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
      >
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Koi Worker Available Nahi
          </h2>
          <p className="text-gray-500 mb-6">
            Abhi is service ke liye koi free worker nahi hai.
            Thodi der baad try karo!
          </p>
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/services')}
              className="bg-primary text-white py-3 rounded-xl font-bold"
            >
              Dobara Try Karo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              className="border border-gray-200 text-gray-600 py-3 rounded-xl font-medium"
            >
              Dashboard Dekho
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Worker Found / Confirmed ────────────────────────────
  if (currentBooking.status === 'Confirmed') {
    const worker = currentBooking.assignedWorker;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
      >
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl">

          {/* Success Header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-center mb-6"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center
              justify-center text-4xl mx-auto mb-4">
              🎉
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Booking Confirmed!
            </h2>
            <p className="text-gray-500">Worker mil gaya! Wo aapke ghar aayega</p>
          </motion.div>

          {/* Worker Card */}
          {worker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 mb-5
                border border-indigo-100"
            >
              <p className="text-xs font-medium text-indigo-400 uppercase
                tracking-wider mb-3">
                Aapka Worker
              </p>

              <div className="flex items-center gap-4 mb-4">
                {/* Worker Avatar */}
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center
                  justify-center text-white font-bold text-xl flex-shrink-0">
                  {worker.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {worker.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-sm">
                      {'⭐'.repeat(Math.round(worker.rating || 0))}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {worker.rating || 'New'} Rating
                    </span>
                  </div>
                </div>
              </div>

              {/* Worker Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Service</p>
                  <p className="font-medium text-gray-700 text-sm">
                    {worker.service}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">City</p>
                  <p className="font-medium text-gray-700 text-sm">
                    📍 {worker.city}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 col-span-2">
                  <p className="text-gray-400 text-xs mb-1">
                    Contact Number
                  </p>
                  <a
                    href={`tel:${worker.phone}`}
                    className="font-bold text-primary text-lg flex items-center gap-2"
                  >
                    📱 {worker.phone}
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-5">
            <p className="text-xs font-medium text-gray-400 uppercase
              tracking-wider mb-3">
              Booking Details
            </p>
            <div className="flex flex-col gap-2">
              {[
                {
                  icon: '📅',
                  label: 'Date',
                  value: currentBooking.date
                },
                {
                  icon: '⏰',
                  label: 'Time',
                  value: currentBooking.time
                },
                {
                  icon: '📍',
                  label: 'Address',
                  value: currentBooking.address
                },
                {
                  icon: '💰',
                  label: 'Amount',
                  value: `₹${currentBooking.price}`
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-1"
                >
                  <span>{item.icon}</span>
                  <span className="text-gray-500 text-sm w-16">
                    {item.label}
                  </span>
                  <span className="font-medium text-gray-800 text-sm">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Go to Dashboard */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary text-white py-4 rounded-xl
              font-bold text-lg shadow-lg shadow-indigo-200"
          >
            Dashboard Dekho →
          </motion.button>

        </div>
      </motion.div>
    );
  }

  // ── Searching State ─────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
    >
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">

        {/* Animated Search Icon */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-4 border-dashed
              border-indigo-200"
          />
          {/* Middle Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="absolute inset-4 rounded-full border-4 border-dashed
              border-indigo-300"
          />
          {/* Center */}
          <div className="absolute inset-8 bg-indigo-100 rounded-full
            flex items-center justify-center text-3xl">
            🔍
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Worker Dhundh Rahe Hain{dots}
        </h2>
        <p className="text-gray-500 mb-2">
          Aapke area ke available workers ko
          request bheji ja rahi hai
        </p>

        {/* Workers Notified Count */}
        {currentBooking.pendingWorkers && (
          <div className="inline-block bg-indigo-50 text-primary px-4 py-2
            rounded-full text-sm font-medium mb-6">
            🔔 {currentBooking.pendingWorkers.length} workers ko notify kiya gaya
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex flex-col gap-3 mb-6 text-left">
          {[
            {
              icon: '✅',
              text: 'Booking create ho gayi',
              done: true
            },
            {
              icon: dots.length > 0 ? '🔔' : '🔔',
              text: 'Workers ko request bheji',
              done: true
            },
            {
              icon: '⏳',
              text: 'Kisi worker ka accept karna baki hai',
              done: false
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                step.done ? 'bg-green-50' : 'bg-yellow-50'
              }`}
            >
              <span className="text-xl">{step.icon}</span>
              <span className={`text-sm font-medium ${
                step.done ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {step.text}
              </span>
            </div>
          ))}
        </div>

        <p className="text-gray-400 text-xs mb-6">
          Yeh page automatic update hoga.
          Manually refresh karne ki zaroorat nahi! 🔄
        </p>

        {/* Cancel Option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="w-full border-2 border-red-200 text-red-400 py-3
            rounded-xl font-medium hover:bg-red-50 transition text-sm"
        >
          Booking Cancel Karo
        </motion.button>

      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN BOOKING COMPONENT
// ══════════════════════════════════════════════════════════
function Booking() {
  const { serviceName } = useParams();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    address: '',
    description: '',
    paymentMethod: 'cash'  // Default: cash (safer for new users)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 👇 Booking submit ke baad searching state
  const [bookingCreated, setBookingCreated] = useState(null);

  const servicePrice = servicePrices[serviceName] || 200;
  const serviceIcon = serviceIcons[serviceName] || '🔧';
  const totalAmount = servicePrice + 50;

  // ── Auth Check ─────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    // Worker ko booking page nahi dikhna chahiye
    const parsedUser = JSON.parse(user);
    if (parsedUser.role === 'worker') {
      navigate('/worker-dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.date || !formData.time) {
        setError('Date aur time select karna zaroori hai!');
        return;
      }
      // Date validation — past date nahi
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setError('Past date select nahi kar sakte!');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.address.trim()) {
        setError('Address likhna zaroori hai!');
        return;
      }
      if (formData.address.trim().length < 10) {
        setError('Thoda detail mein address likho!');
        return;
      }
    }
    setError('');
    setCurrentStep(prev => prev + 1);
  };

  // ── Payment Handler ─────────────────────────────────────
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
              setSuccess('Payment Successful! Worker dhundh rahe hain...');
            }
          } catch {
            setError('Payment verification failed!');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#4F46E5' }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch {
      setError('Payment shuru nahi ho saka!');
      throw new Error('Payment failed');
    }
  };

  // ── Main Submit ─────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      // 👇 customerId bhejo, worker nahi — server dhundega workers
      const response = await axios.post(
        '/booking/create',
        {
          customerId: user.id,   // ✅ Sahi — customer ka ID
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
        // Online payment pehle
        if (formData.paymentMethod === 'online') {
          await handlePayment(response.data.booking._id);
        }
        // 👇 Searching state dikhao
        setBookingCreated(response.data.booking);

      } else {
        // No workers available
        setError(
          response.data.message ||
          'Koi worker available nahi hai. Baad mein try karo!'
        );
      }

    } catch (err) {
      setError(
        err.response?.data?.message || 'Kuch galat hua! Dobara try karo.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel Booking ──────────────────────────────────────
  const handleCancelBooking = async () => {
    if (!window.confirm('Booking cancel karna chahte ho?')) return;
    try {
      await axios.put(`/booking/cancel/${bookingCreated._id}`, {});
      navigate('/services');
    } catch {
      navigate('/services');
    }
  };

  // ── Searching Screen ────────────────────────────────────
  if (bookingCreated) {
    return (
      <SearchingWorkers
        booking={bookingCreated}
        onCancel={handleCancelBooking}
      />
    );
  }

  // Steps config
  const steps = [
    { number: 1, label: "Schedule", icon: "📅" },
    { number: 2, label: "Address", icon: "📍" },
    { number: 3, label: "Confirm", icon: "✅" },
  ];

  // ── Main Form ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* HEADER */}
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
          {/* 👇 New — auto-assign badge */}
          <div className="inline-block mt-3 bg-green-50 text-green-600 px-4 py-1
            rounded-full text-sm font-medium border border-green-100">
            🤖 Best Worker Auto-Assign Hoga
          </div>
        </motion.div>

        {/* PROGRESS BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center justify-between relative">
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
                  className="w-10 h-10 rounded-full flex items-center
                    justify-center text-white font-bold mb-2"
                >
                  {currentStep > step.number ? '✓' : step.icon}
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

        {/* ERROR / SUCCESS */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 p-4
                rounded-xl mb-4 flex items-center gap-2"
            >
              ⚠️ {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-600
                p-4 rounded-xl mb-4 flex items-center gap-2"
            >
              🎉 {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM STEPS */}
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
              <h2 className="text-xl font-bold text-gray-800 mb-6
                flex items-center gap-2">
                📅 Schedule Karo
              </h2>

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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                    outline-none focus:border-primary focus:ring-2
                    focus:ring-indigo-100 transition"
                />
              </div>

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
                          setError('');
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
              <h2 className="text-xl font-bold text-gray-800 mb-6
                flex items-center gap-2">
                📍 Address Details
              </h2>

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
                    placeholder="Flat no, Building, Street, Area, City, Pincode..."
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200
                      rounded-xl outline-none focus:border-primary
                      focus:ring-2 focus:ring-indigo-100 transition resize-none"
                  />
                </div>
              </div>

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
                    placeholder="Kya problem hai? Detail mein likho..."
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200
                      rounded-xl outline-none focus:border-primary
                      focus:ring-2 focus:ring-indigo-100 transition resize-none"
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
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-6
                  flex items-center gap-2">
                  📋 Booking Summary
                </h2>

                {/* Service Info */}
                <div className="flex items-center gap-4 p-4 bg-indigo-50
                  rounded-xl mb-4">
                  <div className="text-4xl">{serviceIcon}</div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {serviceName}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Professional Home Service
                    </p>
                    {/* 👇 Auto-assign info */}
                    <p className="text-indigo-500 text-xs font-medium mt-1">
                      🤖 Best available worker auto-assign hoga
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
                  <div className="flex justify-between font-bold text-gray-800
                    text-lg border-t border-gray-200 pt-3">
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
                      {
                        value: 'cash',
                        label: 'Cash on Service',
                        icon: '💵',
                        desc: 'Worker aane par pay karo'
                      },
                      {
                        value: 'online',
                        label: 'Online Pay',
                        icon: '💳',
                        desc: 'Razorpay se pay karo'
                      },
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          paymentMethod: method.value
                        })}
                        className={`p-4 rounded-xl border-2 text-center
                          transition ${
                          formData.paymentMethod === method.value
                            ? 'border-primary bg-indigo-50 text-primary'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                        }`}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="font-medium text-sm">{method.label}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {method.desc}
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

        {/* NAVIGATION BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          {/* Back / Services Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (currentStep === 1) {
                navigate('/services');
              } else {
                setCurrentStep(prev => prev - 1);
                setError('');
              }
            }}
            className="flex-1 border-2 border-gray-200 text-gray-600 py-4
              rounded-xl font-bold hover:bg-gray-50 transition"
          >
            {currentStep === 1 ? '← Services' : '← Back'}
          </motion.button>

          {/* Next / Submit */}
          {currentStep < 3 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextStep}
              className="flex-1 bg-primary text-white py-4 rounded-xl
                font-bold hover:bg-indigo-700 transition shadow-lg
                shadow-indigo-200"
            >
              Next →
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-bold
                hover:bg-indigo-700 transition shadow-lg shadow-indigo-200
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    ⏳
                  </motion.span>
                  Workers dhundh rahe hain...
                </span>
              ) : formData.paymentMethod === 'online' ? (
                `Pay ₹${totalAmount} & Book 💳`
              ) : (
                '🔍 Worker Dhundo & Book'
              )}
            </motion.button>
          )}
        </motion.div>

      </div>
    </div>
  );
}

export default Booking;