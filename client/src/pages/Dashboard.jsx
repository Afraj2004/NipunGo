import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

// ── Helper Functions ───────────────────────────────────────
const getServiceIcon = (service) => {
  const icons = {
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
  return icons[service] || '🔧';
};

const getStatusColor = (status) => {
  const colors = {
    'Searching': 'bg-orange-100 text-orange-600 border border-orange-200',
    'Confirmed': 'bg-blue-100 text-blue-600 border border-blue-200',
    'Completed': 'bg-green-100 text-green-600 border border-green-200',
    'Cancelled': 'bg-red-100 text-red-600 border border-red-200',
    'No Workers': 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
};

const getStatusIcon = (status) => {
  const icons = {
    'Searching': '🔍',
    'Confirmed': '✅',
    'Completed': '🎉',
    'Cancelled': '❌',
    'No Workers': '😔',
  };
  return icons[status] || '❓';
};

// ── Worker Detail Card (Confirmed booking mein dikhega) ────
function WorkerDetailCard({ worker }) {
  if (!worker) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl
        p-4 mt-3 border border-indigo-100"
    >
      <p className="text-xs font-medium text-indigo-400 uppercase
        tracking-wider mb-3">
        👷 Assigned Worker
      </p>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center
          justify-center text-white font-bold text-lg flex-shrink-0">
          {worker.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-800">{worker.name}</p>
          <p className="text-gray-500 text-sm">{worker.service}</p>
          {worker.rating > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-yellow-400">⭐</span>
              <span className="text-gray-600 font-medium">
                {worker.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`tel:${worker.phone}`}
          className="flex items-center gap-2 bg-white rounded-xl p-3
            hover:bg-indigo-50 transition"
        >
          <span className="text-lg">📱</span>
          <div>
            <p className="text-gray-400 text-xs">Call Karo</p>
            <p className="font-bold text-primary text-sm">
              {worker.phone}
            </p>
          </div>
        </a>
        <div className="flex items-center gap-2 bg-white rounded-xl p-3">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-gray-400 text-xs">City</p>
            <p className="font-medium text-gray-700 text-sm">
              {worker.city || 'N/A'}
            </p>
          </div>
        </div>
        {worker.experience && (
          <div className="flex items-center gap-2 bg-white rounded-xl
            p-3 col-span-2">
            <span className="text-lg">🏆</span>
            <div>
              <p className="text-gray-400 text-xs">Experience</p>
              <p className="font-medium text-gray-700 text-sm">
                {worker.experience}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Searching Status Card ──────────────────────────────────
function SearchingCard({ booking, onCancel }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-orange-50 rounded-xl p-4 mt-3 border border-orange-100">
      <div className="flex items-center gap-3 mb-3">
        {/* Animated search icon */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed
              border-orange-300"
          />
          <div className="absolute inset-1 bg-orange-100 rounded-full
            flex items-center justify-center text-sm">
            🔍
          </div>
        </div>
        <div>
          <p className="font-bold text-orange-700 text-sm">
            Worker Dhundh Rahe Hain{dots}
          </p>
          <p className="text-orange-500 text-xs">
            Yeh page auto-update hoga
          </p>
        </div>
      </div>

      {/* Workers notified count */}
      {booking.pendingWorkers && booking.pendingWorkers.length > 0 && (
        <div className="flex items-center gap-2 bg-white rounded-xl p-3 mb-3">
          <span className="text-lg">🔔</span>
          <p className="text-gray-600 text-sm">
            <span className="font-bold text-primary">
              {booking.pendingWorkers.length}
            </span>{' '}
            workers ko request bheji gayi hai
          </p>
        </div>
      )}

      <button
        onClick={onCancel}
        className="w-full border border-red-200 text-red-400 py-2 rounded-xl
          text-sm font-medium hover:bg-red-50 transition"
      >
        Cancel Request
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════
function Dashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState('');

  // Polling ref
  const pollingRef = useRef(null);

  // ── Fetch All Bookings ────────────────────────────────
// 👇 useCallback mein wrap karo
const fetchMyBookings = useCallback(async (userId, token) => {
  try {
    const response = await axios.get(
      `/booking/my-bookings/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.data.success) {
      setBookings(response.data.bookings);
    }
  } catch (error) {
    console.log('Fetch error:', error);
  } finally {
    setLoading(false);
  }
}, []); // ← empty array — function kabhi change nahi hoga

// ── Poll Only Searching Bookings ──────────────────────
const pollSearchingBookings = useCallback(async (userId, token) => {
  try {
    const response = await axios.get(
      `/booking/my-bookings/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      const freshBookings = response.data.bookings;

      setBookings(prev => {
        const hasChange = prev.some(oldBooking => {
          const freshMatch = freshBookings.find(
            fb => fb._id === oldBooking._id
          );
          return freshMatch && freshMatch.status !== oldBooking.status;
        });

        return hasChange ? freshBookings : prev;
      });
    }
  } catch (err) {
    console.log('Polling error:', err);
  }
}, []); // ← empty array

// ── Auth Check ────────────────────────────────────────
useEffect(() => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!savedUser || !token) {
    navigate('/login');
    return;
  }

  const parsedUser = JSON.parse(savedUser);

  if (parsedUser.role === 'worker') {
    navigate('/worker-dashboard');
    return;
  }

  setUser(parsedUser);
  fetchMyBookings(parsedUser.id, token);

  pollingRef.current = setInterval(() => {
    const tkn = localStorage.getItem('token');
    const usr = localStorage.getItem('user');
    if (usr && tkn) {
      const u = JSON.parse(usr);
      pollSearchingBookings(u.id, tkn);
    }
  }, 8000);

  return () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };
  // 👇 Dependencies mein add karo
}, [navigate, fetchMyBookings, pollSearchingBookings]);

  // ── Cancel Booking ────────────────────────────────────
  const handleCancel = async (bookingId) => {
    if (!window.confirm('Booking cancel karna chahte ho?')) return;

    setCancellingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/booking/cancel/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBookings(prev => prev.map(b =>
          b._id === bookingId ? { ...b, status: 'Cancelled' } : b
        ));
      }
    } catch {
      alert('Booking cancel nahi ho saki!');
    } finally {
      setCancellingId('');
    }
  };

  // ── Stats ─────────────────────────────────────────────
  const stats = {
    total: bookings.length,
    searching: bookings.filter(b => b.status === 'Searching').length,
    confirmed: bookings.filter(b => b.status === 'Confirmed').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    cancelled: bookings.filter(b => b.status === 'Cancelled').length,
    totalSpent: bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + (b.price || 0), 0)
  };

  // ── Filter Bookings ───────────────────────────────────
  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'searching') return booking.status === 'Searching';
    return booking.status.toLowerCase() === activeTab;
  });

  const tabs = [
    { id: 'all', label: 'Sabhi', count: stats.total },
    {
      id: 'searching',
      label: '🔍 Searching',
      count: stats.searching,
      pulse: stats.searching > 0
    },
    { id: 'confirmed', label: 'Confirmed', count: stats.confirmed },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  // ── Loading ───────────────────────────────────────────
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
          <p className="text-gray-500 font-medium">
            Aapki bookings load ho rahi hain...
          </p>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HEADER ===== */}
      <section className="bg-gradient-to-br from-indigo-900 via-primary
        to-indigo-700 pt-10 pb-24 px-4 relative overflow-hidden">

        <div className="absolute top-0 left-0 w-64 h-64 bg-white
          opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary
          opacity-10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto relative z-10">

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl
              flex items-center justify-center text-white font-bold text-2xl
              backdrop-blur-sm border border-white border-opacity-30">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-indigo-300 text-sm">Welcome back! 👋</p>
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <p className="text-indigo-300 text-sm">{user?.email}</p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Bookings",
                value: stats.total,
                icon: "📋"
              },
              {
                label: "Searching",
                value: stats.searching,
                icon: "🔍",
                pulse: stats.searching > 0
              },
              {
                label: "Confirmed",
                value: stats.confirmed,
                icon: "✅"
              },
              {
                label: "Total Spent",
                value: `₹${stats.totalSpent}`,
                icon: "💰"
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -3 }}
                className="bg-white bg-opacity-15 backdrop-blur-sm rounded-2xl
                  p-4 border border-white border-opacity-20"
              >
                <div className={`text-2xl mb-2 ${
                  stat.pulse ? 'animate-pulse' : ''
                }`}>
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {stat.value}
                </h3>
                <p className="text-indigo-300 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 pb-12 relative z-10">

        {/* Searching Alert */}
        <AnimatePresence>
          {stats.searching > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-orange-50 border-2 border-orange-200 rounded-2xl
                p-4 mb-6 flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="text-2xl"
              >
                🔍
              </motion.div>
              <div>
                <p className="font-bold text-orange-700">
                  {stats.searching} booking{stats.searching > 1 ? 'en' : ''}
                  {' '}worker dhundh rahi hai!
                </p>
                <p className="text-orange-500 text-sm">
                  Jaise hi worker accept kare, aapko yahan dikh jayega ✅
                </p>
              </div>
              <button
                onClick={() => setActiveTab('searching')}
                className="ml-auto bg-orange-400 text-white px-4 py-2
                  rounded-xl text-sm font-bold hover:bg-orange-500 transition
                  whitespace-nowrap"
              >
                Dekho →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            {
              label: "New Booking",
              icon: "🔧",
              color: "bg-primary",
              action: () => navigate('/services')
            },
            {
              label: "Services",
              icon: "⚡",
              color: "bg-secondary",
              action: () => navigate('/services')
            },
            {
              label: "Home",
              icon: "🏠",
              color: "bg-green-500",
              action: () => navigate('/')
            },
            {
              label: "Refresh",
              icon: "🔄",
              color: "bg-purple-500",
              action: () => {
                setLoading(true);
                const token = localStorage.getItem('token');
                fetchMyBookings(user.id, token);
              }
            },
          ].map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className={`${action.color} text-white p-4 rounded-2xl
                font-medium shadow-lg flex items-center gap-2
                justify-center text-sm`}
            >
              <span className="text-xl">{action.icon}</span>
              <span>{action.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Bookings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >

          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Meri Bookings
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/services')}
                className="bg-primary text-white px-4 py-2 rounded-xl
                  text-sm font-medium flex items-center gap-2"
              >
                + New Booking
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2
                    rounded-xl text-sm font-medium whitespace-nowrap
                    transition ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-white bg-opacity-30 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                  {/* Pulse dot for searching */}
                  {tab.pulse && (
                    <span className="absolute -top-1 -right-1 w-3 h-3
                      bg-orange-400 rounded-full animate-ping" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {filteredBookings.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-gray-600 text-xl font-medium mb-2">
                    Koi booking nahi hai!
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Abhi pehli booking karo
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/services')}
                    className="bg-primary text-white px-6 py-3
                      rounded-xl font-bold"
                  >
                    Services Dekho 🔧
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  {filteredBookings.map((booking, index) => (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-2xl p-5 transition-all
                        hover:shadow-md ${
                        booking.status === 'Searching'
                          ? 'border-orange-200 bg-orange-50'
                          : booking.status === 'Confirmed'
                          ? 'border-blue-100 bg-blue-50'
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">

                        {/* Service Icon */}
                        <div className="w-14 h-14 bg-white rounded-2xl
                          flex items-center justify-center text-2xl
                          flex-shrink-0 shadow-sm border border-gray-100">
                          {getServiceIcon(booking.service)}
                        </div>

                        {/* Booking Info */}
                        <div className="flex-1 min-w-0">

                          {/* Title + Status */}
                          <div className="flex items-center justify-between
                            flex-wrap gap-2 mb-3">
                            <h3 className="font-bold text-gray-800 text-lg">
                              {booking.service}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs
                              font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)} {booking.status}
                            </span>
                          </div>

                          {/* Booking Details Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center gap-2
                              text-gray-500 text-sm">
                              <span>📅</span>
                              <span>{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2
                              text-gray-500 text-sm">
                              <span>⏰</span>
                              <span>{booking.time}</span>
                            </div>
                            <div className="flex items-center gap-2
                              text-gray-500 text-sm col-span-2">
                              <span>📍</span>
                              <span className="truncate">
                                {booking.address}
                              </span>
                            </div>
                            <div className="flex items-center gap-2
                              text-gray-500 text-sm col-span-2">
                              <span>🆔</span>
                              <span className="text-xs text-gray-400">
                                #{booking._id.slice(-8).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* ── SEARCHING: Worker dhundh raha hai ── */}
                          {booking.status === 'Searching' && (
                            <SearchingCard
                              booking={booking}
                              onCancel={() => handleCancel(booking._id)}
                            />
                          )}

                          {/* ── CONFIRMED: Worker details dikho ── */}
                          {booking.status === 'Confirmed' &&
                            booking.assignedWorker && (
                            <WorkerDetailCard
                              worker={booking.assignedWorker}
                            />
                          )}

                          {/* ── NO WORKERS ── */}
                          {booking.status === 'No Workers' && (
                            <div className="bg-gray-50 rounded-xl p-3 mt-3
                              flex items-center gap-3">
                              <span className="text-2xl">😔</span>
                              <div>
                                <p className="font-medium text-gray-700 text-sm">
                                  Koi worker available nahi tha
                                </p>
                                <button
                                  onClick={() => navigate('/services')}
                                  className="text-primary text-xs
                                    font-medium hover:underline"
                                >
                                  Dobara try karo →
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Price + Actions */}
                          <div className="flex items-center justify-between
                            flex-wrap gap-2 mt-4">
                            <span className="text-secondary font-bold text-lg">
                              ₹{booking.price}
                            </span>

                            <div className="flex gap-2 flex-wrap">
                              {/* Cancel — Searching bookings ke liye */}
                              {booking.status === 'Searching' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCancel(booking._id)}
                                  disabled={cancellingId === booking._id}
                                  className="bg-red-50 text-red-500 border
                                    border-red-200 px-3 py-1.5 rounded-xl
                                    text-sm font-medium hover:bg-red-100
                                    transition disabled:opacity-60"
                                >
                                  {cancellingId === booking._id
                                    ? '⏳'
                                    : '❌ Cancel'
                                  }
                                </motion.button>
                              )}

                              {/* Review — Completed ke liye */}
                              {booking.status === 'Completed' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    navigate(`/review/${booking._id}`)
                                  }
                                  className="bg-yellow-50 text-yellow-600
                                    border border-yellow-200 px-3 py-1.5
                                    rounded-xl text-sm font-medium
                                    hover:bg-yellow-100 transition"
                                >
                                  ⭐ Review Do
                                </motion.button>
                              )}

                              {/* Book Again */}
                              {['Completed', 'Cancelled', 'No Workers']
                                .includes(booking.status) && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => navigate('/services')}
                                  className="bg-indigo-50 text-primary
                                    border border-indigo-200 px-3 py-1.5
                                    rounded-xl text-sm font-medium
                                    hover:bg-indigo-100 transition"
                                >
                                  🔄 Book Again
                                </motion.button>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>

        {/* First Booking CTA */}
        {bookings.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-primary to-indigo-800
              rounded-2xl p-8 text-center text-white"
          >
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold mb-2">
              Pehli Booking Karo!
            </h3>
            <p className="text-indigo-200 mb-6">
              Hazaro verified experts tayar hain aapki help ke liye!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/services')}
              className="bg-white text-primary px-8 py-3 rounded-full
                font-bold hover:bg-gray-100 transition"
            >
              Services Dekho →
            </motion.button>
          </motion.div>
        )}

      </section>
    </div>
  );
}

export default Dashboard;