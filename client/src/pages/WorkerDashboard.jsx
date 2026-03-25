import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

function WorkerDashboard() {
  const navigate = useNavigate();

  const [pendingRequests, setPendingRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('requests');
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  // Polling ref
  const pollingRef = useRef(null);
  const userRef = useRef(null);

  // ── Fetch Pending Requests ────────────────────────────
// 👇 useCallback — pehle define karo useEffect se pehle
const fetchPendingRequests = useCallback(
  async (workerId, token) => {
    try {
      const response = await axios.get(
        `/booking/worker-requests/${workerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setPendingRequests(response.data.requests);
      }
    } catch (err) {
      console.log('Requests fetch error:', err);
    }
  },
  [] // ← empty array
);

// ── Fetch My Bookings ─────────────────────────────────
const fetchMyBookings = useCallback(async (workerId, token) => {
  try {
    const response = await axios.get(
      `/booking/worker-bookings/${workerId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.data.success) {
      setMyBookings(response.data.bookings);
    }
  } catch (err) {
    console.log('Bookings fetch error:', err);
  }
}, []); // ← empty array

// ── Fetch All Data ────────────────────────────────────
const fetchAllData = useCallback(async (workerId, token) => {
  setLoading(true);
  await Promise.all([
    fetchPendingRequests(workerId, token),
    fetchMyBookings(workerId, token)
  ]);
  setLoading(false);
  // 👇 fetchPendingRequests aur fetchMyBookings dependency mein
}, [fetchPendingRequests, fetchMyBookings]);

// ── Auth + Init ───────────────────────────────────────
useEffect(() => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!savedUser || !token) {
    navigate('/login');
    return;
  }

  const parsedUser = JSON.parse(savedUser);

  if (parsedUser.role !== 'worker') {
    navigate('/dashboard');
    return;
  }

  setUser(parsedUser);
  userRef.current = parsedUser;

  fetchAllData(parsedUser.id, token);
  fetchWorkerProfile(parsedUser.id);

  pollingRef.current = setInterval(() => {
    const tkn = localStorage.getItem('token');
    if (userRef.current && tkn) {
      fetchPendingRequests(userRef.current.id, tkn);
    }
  }, 8000);

  return () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };
  // 👇 Dependencies mein add karo
}, [navigate, fetchAllData, fetchPendingRequests]);

  // ── Worker Profile (availability) ────────────────────
  const fetchWorkerProfile = async (workerId) => {
    try {
      const response = await axios.get(`/worker/${workerId}`);
      if (response.data.success) {
        setIsAvailable(response.data.worker.isAvailable ?? true);
      }
    } catch (err) {
      console.log('Profile fetch error:', err);
    }
  };

 





  // ── Accept Request ───────────────────────────────────
  const handleAccept = async (bookingId) => {
    setActionLoading(bookingId + '_accept');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/booking/accept/${bookingId}`,
        { workerId: user.id },  // 👈 workerId body mein bhejo
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Request list se hatao
        setPendingRequests(prev =>
          prev.filter(r => r._id !== bookingId)
        );
        // My bookings mein add karo
        setMyBookings(prev => [response.data.booking, ...prev]);
        // Tab switch karo
        setActiveTab('bookings');
        alert('Booking Accept Ho Gayi! Kaam shuru karo! 🎉');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Kuch galat hua!';
      alert(msg);
      // Refresh karo — shayad kisi aur ne already accept kar liya
      fetchPendingRequests(user.id, localStorage.getItem('token'));
    } finally {
      setActionLoading('');
    }
  };

  // ── Reject Request ───────────────────────────────────
  const handleReject = async (bookingId) => {
    if (!window.confirm('Is request ko reject karna chahte ho?')) return;

    setActionLoading(bookingId + '_reject');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/booking/reject/${bookingId}`,
        { workerId: user.id },  // 👈 workerId body mein bhejo
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Request list se hatao
      setPendingRequests(prev =>
        prev.filter(r => r._id !== bookingId)
      );

    } catch (err) {
      alert('Kuch galat hua!');
    } finally {
      setActionLoading('');
    }
  };

  // ── Complete Booking ─────────────────────────────────
  const handleComplete = async (bookingId) => {
    if (!window.confirm('Kaam complete ho gaya?')) return;

    setActionLoading(bookingId + '_complete');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/booking/complete/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMyBookings(prev => prev.map(b =>
          b._id === bookingId ? { ...b, status: 'Completed' } : b
        ));
        alert('Bahut badhiya! Kaam complete ho gaya! 🌟');
      }
    } catch {
      alert('Kuch galat hua!');
    } finally {
      setActionLoading('');
    }
  };

  // ── Availability Toggle ──────────────────────────────
  const handleAvailabilityToggle = async () => {
    setAvailabilityLoading(true);
    try {
      const newStatus = !isAvailable;
      await axios.put(
        `/worker/availability/${user.id}`,
        { isAvailable: newStatus }
      );
      setIsAvailable(newStatus);
    } catch {
      alert('Availability update nahi ho saki!');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // ── Stats ────────────────────────────────────────────
  const stats = {
    newRequests: pendingRequests.length,
    confirmed: myBookings.filter(b => b.status === 'Confirmed').length,
    completed: myBookings.filter(b => b.status === 'Completed').length,
    earnings: myBookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + (b.price || 0), 0)
  };

  const getStatusColor = (status) => {
    const colors = {
      'Searching': 'bg-yellow-100 text-yellow-600 border border-yellow-200',
      'Confirmed': 'bg-blue-100 text-blue-600 border border-blue-200',
      'Completed': 'bg-green-100 text-green-600 border border-green-200',
      'Cancelled': 'bg-red-100 text-red-600 border border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-5xl mb-4"
          >
            ⏳
          </motion.div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HEADER ===== */}
      <section className="bg-gradient-to-br from-gray-800 via-gray-900 to-black
        pt-10 pb-24 px-4 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary
          opacity-10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto relative z-10">

          {/* Worker Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-block bg-primary bg-opacity-20 text-primary
              px-4 py-1 rounded-full text-sm font-medium border border-primary
              border-opacity-30">
              👷 Worker Dashboard
            </div>

            {/* Availability Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAvailabilityToggle}
              disabled={availabilityLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-full
                text-sm font-bold transition ${
                isAvailable
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                isAvailable ? 'bg-white animate-pulse' : 'bg-gray-300'
              }`} />
              {availabilityLoading
                ? '...'
                : isAvailable
                ? 'Available ✅'
                : 'Unavailable ⏸️'
              }
            </motion.button>
          </div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-16 h-16 bg-white bg-opacity-10 rounded-2xl
              flex items-center justify-center text-white font-bold text-2xl
              border border-white border-opacity-20">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {user?.name}
              </h1>
              <p className="text-gray-400 text-sm">
                👷 Professional Worker
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "New Requests",
                value: stats.newRequests,
                icon: "🔔",
                pulse: stats.newRequests > 0
              },
              {
                label: "Confirmed",
                value: stats.confirmed,
                icon: "📋",
                pulse: false
              },
              {
                label: "Completed",
                value: stats.completed,
                icon: "✅",
                pulse: false
              },
              {
                label: "Total Earnings",
                value: `₹${stats.earnings}`,
                icon: "💰",
                pulse: false
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl
                  p-4 border border-white border-opacity-10"
              >
                <div className={`text-2xl mb-2 ${stat.pulse ? 'animate-bounce' : ''}`}>
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {stat.value}
                </h3>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 pb-12">

        {/* New Request Alert */}
        <AnimatePresence>
          {stats.newRequests > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl
                p-4 mb-6 flex items-center gap-3"
            >
              <div className="text-2xl animate-bounce">🔔</div>
              <div>
                <p className="font-bold text-yellow-700">
                  {stats.newRequests} Nai Booking Request{stats.newRequests > 1 ? 'ein' : ''}!
                </p>
                <p className="text-yellow-600 text-sm">
                  Jaldi accept karo — pehle aao pehle pao! ⚡
                </p>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="ml-auto bg-yellow-400 text-white px-4 py-2
                  rounded-xl text-sm font-bold hover:bg-yellow-500 transition"
              >
                Dekho →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unavailable Warning */}
        <AnimatePresence>
          {!isAvailable && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-gray-100 border border-gray-300 rounded-2xl p-4
                mb-6 flex items-center gap-3"
            >
              <span className="text-2xl">⏸️</span>
              <div>
                <p className="font-bold text-gray-700">
                  Aap Unavailable Hain
                </p>
                <p className="text-gray-500 text-sm">
                  Nai requests nahi aayengi. Available karo upar se.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >

          {/* Tabs */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex gap-2">
              {[
                {
                  id: 'requests',
                  label: '🔔 New Requests',
                  count: stats.newRequests
                },
                {
                  id: 'bookings',
                  label: '📋 My Bookings',
                  count: myBookings.length
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5
                    rounded-xl text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                  {/* Red dot for new requests */}
                  {tab.id === 'requests' && stats.newRequests > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3
                      bg-red-500 rounded-full animate-ping" />
                  )}
                </button>
              ))}

              {/* Manual Refresh */}
              <button
                onClick={() => fetchAllData(
                  user.id,
                  localStorage.getItem('token')
                )}
                className="ml-auto p-2.5 bg-gray-100 text-gray-600
                  rounded-xl hover:bg-gray-200 transition text-sm"
                title="Refresh"
              >
                🔄
              </button>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">

              {/* ── PENDING REQUESTS TAB ─────────────────── */}
              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-gray-500 text-lg font-medium">
                        Abhi koi nai request nahi!
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Jab customer book karega, yahan dikhega.
                        Auto-refresh chal raha hai! 🔄
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {pendingRequests.map((request, index) => (
                        <motion.div
                          key={request._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-2 border-yellow-200 bg-yellow-50
                            rounded-2xl p-5"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between
                            flex-wrap gap-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-800 text-lg">
                                  {request.service}
                                </h3>
                                <span className="bg-yellow-100 text-yellow-600
                                  border border-yellow-200 px-3 py-1 rounded-full
                                  text-xs font-medium">
                                  🔔 New Request
                                </span>
                              </div>
                              <p className="text-gray-500 text-sm">
                                ID: #{request._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                            <span className="text-secondary font-bold text-xl">
                              ₹{request.price}
                            </span>
                          </div>

                                                    {/* Customer Info */}
                          <div className="bg-white rounded-xl p-4 mb-4
                            flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full
                              flex items-center justify-center text-primary
                              font-bold text-lg flex-shrink-0">
                              {request.customer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {request.customer?.name}
                              </p>
                              <p className="text-gray-500 text-sm">
                                📱 {request.customer?.phone}
                              </p>
                              <p className="text-gray-500 text-sm">
                                📧 {request.customer?.email}
                              </p>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">
                                Date
                              </p>
                              <p className="font-medium text-gray-800 text-sm">
                                📅 {request.date}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">
                                Time
                              </p>
                              <p className="font-medium text-gray-800 text-sm">
                                ⏰ {request.time}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-3 col-span-2">
                              <p className="text-gray-400 text-xs mb-1">
                                Address
                              </p>
                              <p className="font-medium text-gray-800 text-sm">
                                📍 {request.address}
                              </p>
                            </div>
                            {request.description && (
                              <div className="bg-white rounded-xl p-3 col-span-2">
                                <p className="text-gray-400 text-xs mb-1">
                                  Problem
                                </p>
                                <p className="font-medium text-gray-800 text-sm">
                                  📝 {request.description}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Timer — kitne workers hain abhi bhi */}
                          <div className="bg-yellow-100 rounded-xl p-3 mb-4
                            flex items-center gap-2">
                            <span className="text-yellow-600 text-sm">⚡</span>
                            <p className="text-yellow-700 text-sm font-medium">
                              Jaldi karo! Doosre workers bhi yeh request dekh
                              rahe hain
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleReject(request._id)}
                              disabled={actionLoading === request._id + '_reject'}
                              className="flex-1 bg-red-50 text-red-500 border
                                border-red-200 py-3 rounded-xl font-bold
                                hover:bg-red-100 transition
                                disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {actionLoading === request._id + '_reject'
                                ? '...'
                                : '❌ Reject'
                              }
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAccept(request._id)}
                              disabled={actionLoading === request._id + '_accept'}
                              className="flex-2 flex-grow-[2] bg-green-500
                                text-white py-3 rounded-xl font-bold
                                hover:bg-green-600 transition shadow-lg
                                shadow-green-200
                                disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {actionLoading === request._id + '_accept' ? (
                                <span className="flex items-center
                                  justify-center gap-2">
                                  <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 1
                                    }}
                                  >
                                    ⏳
                                  </motion.span>
                                  Accepting...
                                </span>
                              ) : (
                                '✅ Accept Karo'
                              )}
                            </motion.button>
                          </div>

                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── MY BOOKINGS TAB ──────────────────────── */}
              {activeTab === 'bookings' && (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {myBookings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-gray-500 text-lg font-medium">
                        Abhi koi booking nahi!
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Requests accept karne ke baad yahan dikhegi.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {myBookings.map((booking, index) => (
                        <motion.div
                          key={booking._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border border-gray-100 rounded-2xl p-5
                            hover:shadow-md transition-all"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between
                            flex-wrap gap-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-800 text-lg">
                                  {booking.service}
                                </h3>
                                <span className={`px-3 py-1 rounded-full
                                  text-xs font-medium
                                  ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </div>
                              <p className="text-gray-500 text-sm">
                                ID: #{booking._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                            <span className="text-secondary font-bold text-xl">
                              ₹{booking.price}
                            </span>
                          </div>

                          {/* Customer Info */}
                          <div className="bg-gray-50 rounded-xl p-4 mb-4
                            flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full
                              flex items-center justify-center text-primary
                              font-bold">
                              {booking.customer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {booking.customer?.name}
                              </p>
                              <a
                                href={`tel:${booking.customer?.phone}`}
                                className="text-primary text-sm font-medium
                                  flex items-center gap-1 hover:underline"
                              >
                                📱 {booking.customer?.phone}
                              </a>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">Date</p>
                              <p className="font-medium text-gray-800 text-sm">
                                📅 {booking.date}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">Time</p>
                              <p className="font-medium text-gray-800 text-sm">
                                ⏰ {booking.time}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3
                              col-span-2">
                              <p className="text-gray-400 text-xs mb-1">
                                Address
                              </p>
                              <p className="font-medium text-gray-800 text-sm">
                                📍 {booking.address}
                              </p>
                            </div>
                            {booking.description && (
                              <div className="bg-gray-50 rounded-xl p-3
                                col-span-2">
                                <p className="text-gray-400 text-xs mb-1">
                                  Problem
                                </p>
                                <p className="font-medium text-gray-800 text-sm">
                                  📝 {booking.description}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            {booking.status === 'Confirmed' && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleComplete(booking._id)}
                                disabled={
                                  actionLoading === booking._id + '_complete'
                                }
                                className="flex-1 bg-primary text-white py-3
                                  rounded-xl font-bold hover:bg-indigo-700
                                  transition shadow-lg shadow-indigo-200
                                  disabled:opacity-60"
                              >
                                {actionLoading === booking._id + '_complete'
                                  ? '⏳ Updating...'
                                  : '🎉 Mark as Complete'
                                }
                              </motion.button>
                            )}

                            {booking.status === 'Completed' && (
                              <div className="flex-1 bg-green-50 text-green-600
                                border border-green-200 py-3 rounded-xl
                                font-bold text-center">
                                ✅ Completed
                              </div>
                            )}

                            {booking.status === 'Cancelled' && (
                              <div className="flex-1 bg-red-50 text-red-400
                                border border-red-200 py-3 rounded-xl
                                font-bold text-center">
                                ❌ Cancelled
                              </div>
                            )}
                          </div>

                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </motion.div>
      </section>
    </div>
  );
}

export default WorkerDashboard;